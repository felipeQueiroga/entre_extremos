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
  type ClientRoomState,
  type GameMode,
  type GameOverPayload,
  type OpponentSubmitDirectionPayload,
  type PlayerJoinTeamPayload,
  type PlayerSubmitGuessPayload,
  type PsychicSubmitCluePayload,
  type RoomCreatePayload,
  type RoomErrorPayload,
  type RoomJoinPayload,
} from "@entre-extremos/shared";
import { getSocketUrl, isNgrokHost } from "../utils/socketUrl";

interface GameContextValue {
  socket: Socket | null;
  connected: boolean;
  connectionError: string | null;
  state: ClientRoomState | null;
  error: string | null;
  winners: string[];
  clearError: () => void;
  createRoom: (name: string, mode?: GameMode) => Promise<ClientRoomState>;
  joinRoom: (code: string, name: string, playerId?: string) => Promise<ClientRoomState>;
  leaveRoom: () => void;
  joinTeam: (team: "A" | "B") => void;
  startGame: () => void;
  submitClue: (clue: string) => void;
  submitGuess: (position: number) => void;
  submitDirection: (direction: "left" | "right") => void;
  nextRound: () => void;
  restartGame: () => void;
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
  const [socketReady, setSocketReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<ClientRoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [winners, setWinners] = useState<string[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

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
      if (next.status !== "finished") setWinners([]);
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

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off(SERVER_EVENTS.GAME_STATE, onState);
      socket.off(SERVER_EVENTS.ROOM_ERROR, onError);
      socket.off(SERVER_EVENTS.GAME_OVER, onGameOver);
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
    async (name: string, mode: GameMode = "couple") => {
      const response = await emitWithAck<RoomCreatePayload, ClientRoomState | null>(
        getSocket(),
        CLIENT_EVENTS.ROOM_CREATE,
        { name, mode }
      );
      if (!response) throw new Error("Não foi possível criar a sala.");
      setState(response);
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
      return response;
    },
    [getSocket]
  );

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit(CLIENT_EVENTS.ROOM_LEAVE);
    setState(null);
    setWinners([]);
  }, []);

  const joinTeam = useCallback((team: "A" | "B") => {
    getSocket().emit(CLIENT_EVENTS.PLAYER_JOIN_TEAM, { team } satisfies PlayerJoinTeamPayload);
  }, [getSocket]);

  const startGame = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.GAME_START);
  }, [getSocket]);

  const submitClue = useCallback(
    (clue: string) => {
      getSocket().emit(CLIENT_EVENTS.PSYCHIC_SUBMIT_CLUE, { clue } satisfies PsychicSubmitCluePayload);
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

  const value: GameContextValue = {
    socket: socketReady ? socketRef.current : null,
    connected,
    connectionError,
    state,
    error,
    winners,
    clearError,
    createRoom,
    joinRoom,
    leaveRoom,
    joinTeam,
    startGame,
    submitClue,
    submitGuess,
    submitDirection,
    nextRound,
    restartGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
