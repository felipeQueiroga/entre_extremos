import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  type CardColor,
  type CardSource,
  type CardTheme,
  type ChatMessage,
  type ChatSendPayload,
  type ClientRoomState,
  type GameMode,
  type GameOverPayload,
  type OpponentSubmitDirectionPayload,
  type PlayerJoinTeamPayload,
  type PlayerSubmitGuessPayload,
  type PokerBetPayload,
  type PokerOptions,
  type PokerRaisePayload,
  type PsychicSubmitCluePayload,
  type PsychicSubmitThemePayload,
  type FourColorsChallengeOnePayload,
  type FourColorsChooseColorPayload,
  type FourColorsChooseHandSwapTargetPayload,
  type FourColorsOptions,
  type FourColorsPlayCardPayload,
  type RoomCreatePayload,
  type RoomErrorPayload,
  type RoomJoinPayload,
  type RoomReconnectPayload,
  type SelectedGame,
  type StopOptions,
  type StopSubmitAnswersPayload,
  type StopVotePayload,
} from "@entre-extremos/shared";
import { clearSession, getStoredPlayerId, getStoredPlayerName, getStoredRoomCode, saveSession } from "../utils/session";
import { getSocketUrl, isNgrokHost } from "../utils/socketUrl";

const SOCKET_WAIT_MS = 10000;

function waitForSocket(socket: Socket | null, timeoutMs = SOCKET_WAIT_MS): Promise<Socket> {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error("Sem conexão com o servidor."));
      return;
    }
    if (socket.connected) {
      resolve(socket);
      return;
    }
    const timer = window.setTimeout(() => {
      socket.off("connect", onConnect);
      reject(new Error("Sem conexão com o servidor."));
    }, timeoutMs);
    const onConnect = () => {
      window.clearTimeout(timer);
      socket.off("connect", onConnect);
      resolve(socket);
    };
    socket.on("connect", onConnect);
  });
}

interface GameContextValue {
  socket: Socket | null;
  connected: boolean;
  connectionError: string | null;
  state: ClientRoomState | null;
  messages: ChatMessage[];
  error: string | null;
  winners: string[];
  clearError: () => void;
  createRoom: (
    name: string,
    selectedGame?: SelectedGame,
    mode?: GameMode,
    cardSource?: CardSource,
    cardThemes?: CardTheme[],
    fourColorsOptions?: FourColorsOptions,
    pokerOptions?: PokerOptions,
    stopOptions?: StopOptions
  ) => Promise<ClientRoomState>;
  joinRoom: (code: string, name: string, playerId?: string) => Promise<ClientRoomState>;
  reconnectRoom: (code: string, playerId: string) => Promise<ClientRoomState>;
  restoreSession: (roomCode: string) => Promise<ClientRoomState | null>;
  restoringSession: boolean;
  leaveRoom: () => void;
  joinTeam: (team: "A" | "B") => void;
  startGame: () => void;
  submitTheme: (left: string, right: string) => void;
  submitClue: (clue: string) => void;
  sendChat: (text: string) => void;
  submitGuess: (position: number) => void;
  submitDirection: (direction: "left" | "right") => void;
  nextRound: () => void;
  restartGame: () => void;
  fourColorsStart: () => void;
  fourColorsPlayCard: (cardId: string) => void;
  fourColorsDrawCard: () => void;
  fourColorsChooseColor: (color: CardColor) => void;
  fourColorsCallOne: () => void;
  fourColorsChallengeOne: (targetPlayerId: string) => void;
  fourColorsPassTurn: () => void;
  fourColorsChooseHandSwapTarget: (targetPlayerId?: string) => void;
  fourColorsRestart: () => void;
  pokerStart: () => void;
  pokerFold: () => void;
  pokerCheck: () => void;
  pokerCall: () => void;
  pokerBet: (amount: number) => void;
  pokerRaise: (amount: number) => void;
  pokerAllIn: () => void;
  pokerNextHand: () => void;
  pokerRestart: () => void;
  stopSubmitAnswers: (answers: Record<string, string>) => void;
  stopCallStop: () => void;
  stopVote: (categoryId: CardTheme, answerOwnerId: string, valid: boolean) => void;
  stopNextRound: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function emitWithAck<TPayload, TResponse>(
  socket: Socket,
  event: string,
  payload: TPayload
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    if (!socket.connected) {
      reject(new Error("Sem conexão com o servidor."));
      return;
    }
    socket.emit(event, payload, (response: TResponse) => {
      resolve(response);
    });
    setTimeout(() => reject(new Error("Timeout")), 10000);
  });
}

export function GameProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const stateRef = useRef<ClientRoomState | null>(null);
  const restoringRef = useRef(false);
  const restoreSessionRef = useRef<(roomCode: string) => Promise<ClientRoomState | null>>(async () => null);
  const [socketReady, setSocketReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<ClientRoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [winners, setWinners] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [restoringSession, setRestoringSession] = useState(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      transports: ["polling", "websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 500,
      ...(isNgrokHost() && {
        extraHeaders: { "ngrok-skip-browser-warning": "true" },
      }),
    });
    socketRef.current = socket;
    setSocketReady(true);

    const onConnect = () => {
      setConnected(true);
      setConnectionError(null);
      const roomCode = getStoredRoomCode();
      const playerId = getStoredPlayerId();
      if (!roomCode || !playerId || restoringRef.current) return;
      const current = stateRef.current;
      if (current?.code === roomCode && current.playerId === playerId) return;
      void restoreSessionRef.current(roomCode);
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (err: Error) => {
      setConnected(false);
      setConnectionError(
        "Não foi possível conectar ao servidor. Verifique se o servidor está rodando na porta 3001."
      );
      console.error("Socket connect error:", err.message);
    };
    const onState = (next: ClientRoomState) => {
      setState(next);
      setMessages(next.messages ?? []);
      if (next.status !== "finished") setWinners([]);
    };
    const onChatMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg].slice(-50));
    };
    const onChatHistory = (history: ChatMessage[]) => {
      setMessages(history);
    };
    const onError = (payload: RoomErrorPayload) => setError(payload.message);
    const onGameOver = (payload: GameOverPayload) => {
      setState(payload.state);
      setWinners(payload.winners);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on(SERVER_EVENTS.GAME_STATE, onState);
    socket.on(SERVER_EVENTS.ROOM_ERROR, onError);
    socket.on(SERVER_EVENTS.GAME_OVER, onGameOver);
    socket.on(SERVER_EVENTS.CHAT_MESSAGE, onChatMessage);
    socket.on(SERVER_EVENTS.CHAT_HISTORY, onChatHistory);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off(SERVER_EVENTS.GAME_STATE, onState);
      socket.off(SERVER_EVENTS.ROOM_ERROR, onError);
      socket.off(SERVER_EVENTS.GAME_OVER, onGameOver);
      socket.off(SERVER_EVENTS.CHAT_MESSAGE, onChatMessage);
      socket.off(SERVER_EVENTS.CHAT_HISTORY, onChatHistory);
      socket.disconnect();
      socketRef.current = null;
      setSocketReady(false);
    };
  }, []);

  const getSocket = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      throw new Error("Sem conexão com o servidor.");
    }
    return socket;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const createRoom = useCallback(
    async (
      name: string,
      selectedGame: SelectedGame = "entre-extremos",
      mode: GameMode = "couple",
      cardSource: CardSource = "deck",
      cardThemes?: CardTheme[],
      fourColorsOptions?: FourColorsOptions,
      pokerOptions?: PokerOptions,
      stopOptions?: StopOptions
    ) => {
      const response = await emitWithAck<RoomCreatePayload, ClientRoomState | null>(
        getSocket(),
        CLIENT_EVENTS.ROOM_CREATE,
        { name, selectedGame, mode, cardSource, cardThemes, fourColorsOptions, pokerOptions, stopOptions }
      );
      if (!response) throw new Error("Não foi possível criar a sala.");
      setState(response);
      saveSession(response.playerId, name.trim(), response.code);
      return response;
    },
    [getSocket]
  );

  const joinRoom = useCallback(
    async (code: string, name: string, playerId?: string) => {
      const response = await emitWithAck<RoomJoinPayload, ClientRoomState | null>(
        getSocket(),
        CLIENT_EVENTS.ROOM_JOIN,
        { code, name, playerId }
      );
      if (!response) throw new Error("Não foi possível entrar na sala.");
      setState(response);
      saveSession(response.playerId, name.trim(), response.code);
      return response;
    },
    [getSocket]
  );

  const reconnectRoom = useCallback(async (code: string, playerId: string) => {
    const socket = await waitForSocket(socketRef.current);
    const response = await emitWithAck<RoomReconnectPayload, ClientRoomState | null>(
      socket,
      CLIENT_EVENTS.ROOM_RECONNECT,
      { code: code.toUpperCase(), playerId }
    );
    if (!response) throw new Error("Não foi possível reconectar à sala.");
    setState(response);
    setMessages(response.messages ?? []);
    if (response.status !== "finished") setWinners([]);
    saveSession(response.playerId, getStoredPlayerName() ?? "", response.code);
    return response;
  }, []);

  const restoreSession = useCallback(async (roomCode: string): Promise<ClientRoomState | null> => {
    const normalizedCode = roomCode.toUpperCase();
    const playerId = getStoredPlayerId();
    if (!playerId) return null;

    const current = stateRef.current;
    if (current?.code === normalizedCode && current.playerId === playerId) {
      return current;
    }

    if (restoringRef.current) {
      return stateRef.current?.code === normalizedCode ? stateRef.current : null;
    }

    restoringRef.current = true;
    setRestoringSession(true);
    setError(null);

    try {
      const response = await reconnectRoom(normalizedCode, playerId);
      return response;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível reconectar à sala.";
      setError(message);
      return null;
    } finally {
      restoringRef.current = false;
      setRestoringSession(false);
    }
  }, [reconnectRoom]);

  useEffect(() => {
    restoreSessionRef.current = restoreSession;
  }, [restoreSession]);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit(CLIENT_EVENTS.ROOM_LEAVE);
    clearSession();
    setState(null);
    setWinners([]);
    setMessages([]);
  }, []);

  const joinTeam = useCallback((team: "A" | "B") => {
    getSocket().emit(CLIENT_EVENTS.PLAYER_JOIN_TEAM, { team } satisfies PlayerJoinTeamPayload);
  }, [getSocket]);

  const startGame = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.GAME_START);
  }, [getSocket]);

  const submitTheme = useCallback(
    (left: string, right: string) => {
      getSocket().emit(CLIENT_EVENTS.PSYCHIC_SUBMIT_THEME, {
        left,
        right,
      } satisfies PsychicSubmitThemePayload);
    },
    [getSocket]
  );

  const submitClue = useCallback(
    (clue: string) => {
      getSocket().emit(CLIENT_EVENTS.PSYCHIC_SUBMIT_CLUE, { clue } satisfies PsychicSubmitCluePayload);
    },
    [getSocket]
  );

  const sendChat = useCallback(
    (text: string) => {
      getSocket().emit(CLIENT_EVENTS.CHAT_SEND, { text } satisfies ChatSendPayload);
    },
    [getSocket]
  );

  const submitGuess = useCallback(
    (position: number) => {
      getSocket().emit(CLIENT_EVENTS.PLAYER_SUBMIT_GUESS, {
        position,
      } satisfies PlayerSubmitGuessPayload);
    },
    [getSocket]
  );

  const submitDirection = useCallback(
    (direction: "left" | "right") => {
      getSocket().emit(CLIENT_EVENTS.OPPONENT_SUBMIT_DIRECTION, {
        direction,
      } satisfies OpponentSubmitDirectionPayload);
    },
    [getSocket]
  );

  const nextRound = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.ROUND_NEXT);
  }, [getSocket]);

  const restartGame = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.GAME_RESTART);
    setWinners([]);
  }, [getSocket]);

  const fourColorsStart = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.FOUR_COLORS_START);
  }, [getSocket]);

  const fourColorsPlayCard = useCallback(
    (cardId: string) => {
      getSocket().emit(CLIENT_EVENTS.FOUR_COLORS_PLAY_CARD, {
        cardId,
      } satisfies FourColorsPlayCardPayload);
    },
    [getSocket]
  );

  const fourColorsDrawCard = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.FOUR_COLORS_DRAW_CARD);
  }, [getSocket]);

  const fourColorsChooseColor = useCallback(
    (color: CardColor) => {
      getSocket().emit(CLIENT_EVENTS.FOUR_COLORS_CHOOSE_COLOR, {
        color,
      } satisfies FourColorsChooseColorPayload);
    },
    [getSocket]
  );

  const fourColorsCallOne = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.FOUR_COLORS_CALL_ONE);
  }, [getSocket]);

  const fourColorsChallengeOne = useCallback(
    (targetPlayerId: string) => {
      getSocket().emit(CLIENT_EVENTS.FOUR_COLORS_CHALLENGE_ONE, {
        targetPlayerId,
      } satisfies FourColorsChallengeOnePayload);
    },
    [getSocket]
  );

  const fourColorsPassTurn = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.FOUR_COLORS_PASS_TURN);
  }, [getSocket]);

  const fourColorsChooseHandSwapTarget = useCallback(
    (targetPlayerId?: string) => {
      getSocket().emit(CLIENT_EVENTS.FOUR_COLORS_CHOOSE_HAND_SWAP_TARGET, {
        targetPlayerId,
      } satisfies FourColorsChooseHandSwapTargetPayload);
    },
    [getSocket]
  );

  const fourColorsRestart = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.FOUR_COLORS_RESTART);
    setWinners([]);
  }, [getSocket]);

  const pokerStart = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.POKER_START);
  }, [getSocket]);

  const pokerFold = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.POKER_FOLD);
  }, [getSocket]);

  const pokerCheck = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.POKER_CHECK);
  }, [getSocket]);

  const pokerCall = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.POKER_CALL);
  }, [getSocket]);

  const pokerBet = useCallback(
    (amount: number) => {
      getSocket().emit(CLIENT_EVENTS.POKER_BET, { amount } satisfies PokerBetPayload);
    },
    [getSocket]
  );

  const pokerRaise = useCallback(
    (amount: number) => {
      getSocket().emit(CLIENT_EVENTS.POKER_RAISE, { amount } satisfies PokerRaisePayload);
    },
    [getSocket]
  );

  const pokerAllIn = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.POKER_ALL_IN);
  }, [getSocket]);

  const pokerNextHand = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.POKER_NEXT_HAND);
  }, [getSocket]);

  const pokerRestart = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.POKER_RESTART);
    setWinners([]);
  }, [getSocket]);

  const stopSubmitAnswers = useCallback(
    (answers: Record<string, string>) => {
      getSocket().emit(CLIENT_EVENTS.STOP_SUBMIT_ANSWERS, {
        answers,
      } satisfies StopSubmitAnswersPayload);
    },
    [getSocket]
  );

  const stopCallStop = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.STOP_CALL_STOP);
  }, [getSocket]);

  const stopVote = useCallback(
    (categoryId: CardTheme, answerOwnerId: string, valid: boolean) => {
      getSocket().emit(CLIENT_EVENTS.STOP_VOTE, {
        categoryId,
        answerOwnerId,
        valid,
      } satisfies StopVotePayload);
    },
    [getSocket]
  );

  const stopNextRound = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.STOP_NEXT_ROUND);
  }, [getSocket]);

  const value: GameContextValue = {
    socket: socketReady ? socketRef.current : null,
    connected,
    connectionError,
    state,
    messages,
    error,
    winners,
    clearError,
    createRoom,
    joinRoom,
    reconnectRoom,
    restoreSession,
    restoringSession,
    leaveRoom,
    joinTeam,
    startGame,
    submitTheme,
    submitClue,
    sendChat,
    submitGuess,
    submitDirection,
    nextRound,
    restartGame,
    fourColorsStart,
    fourColorsPlayCard,
    fourColorsDrawCard,
    fourColorsChooseColor,
    fourColorsCallOne,
    fourColorsChallengeOne,
    fourColorsPassTurn,
    fourColorsChooseHandSwapTarget,
    fourColorsRestart,
    pokerStart,
    pokerFold,
    pokerCheck,
    pokerCall,
    pokerBet,
    pokerRaise,
    pokerAllIn,
    pokerNextHand,
    pokerRestart,
    stopSubmitAnswers,
    stopCallStop,
    stopVote,
    stopNextRound,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
