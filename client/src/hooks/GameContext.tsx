import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

interface GameContextValue {
  socket: Socket | null;
  connected: boolean;
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
    socket.emit(event, payload, (response: TResponse) => {
      resolve(response);
    });
    setTimeout(() => reject(new Error("Timeout")), 10000);
  });
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<ClientRoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [winners, setWinners] = useState<string[]>([]);

  const socket = useMemo(
    () =>
      io(window.location.origin, {
        transports: ["websocket", "polling"],
        autoConnect: true,
      }),
    []
  );

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
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
    socket.on(SERVER_EVENTS.GAME_STATE, onState);
    socket.on(SERVER_EVENTS.ROOM_ERROR, onError);
    socket.on(SERVER_EVENTS.GAME_OVER, onGameOver);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(SERVER_EVENTS.GAME_STATE, onState);
      socket.off(SERVER_EVENTS.ROOM_ERROR, onError);
      socket.off(SERVER_EVENTS.GAME_OVER, onGameOver);
      socket.disconnect();
    };
  }, [socket]);

  const clearError = useCallback(() => setError(null), []);

  const createRoom = useCallback(
    async (name: string, mode: GameMode = "couple") => {
      const response = await emitWithAck<RoomCreatePayload, ClientRoomState | null>(
        socket,
        CLIENT_EVENTS.ROOM_CREATE,
        { name, mode }
      );
      if (!response) throw new Error("Não foi possível criar a sala.");
      setState(response);
      return response;
    },
    [socket]
  );

  const joinRoom = useCallback(
    async (code: string, name: string, playerId?: string) => {
      const response = await emitWithAck<RoomJoinPayload, ClientRoomState | null>(
        socket,
        CLIENT_EVENTS.ROOM_JOIN,
        { code, name, playerId }
      );
      if (!response) throw new Error("Não foi possível entrar na sala.");
      setState(response);
      return response;
    },
    [socket]
  );

  const leaveRoom = useCallback(() => {
    socket.emit(CLIENT_EVENTS.ROOM_LEAVE);
    setState(null);
    setWinners([]);
  }, [socket]);

  const joinTeam = useCallback(
    (team: "A" | "B") => {
      socket.emit(CLIENT_EVENTS.PLAYER_JOIN_TEAM, { team } satisfies PlayerJoinTeamPayload);
    },
    [socket]
  );

  const startGame = useCallback(() => {
    socket.emit(CLIENT_EVENTS.GAME_START);
  }, [socket]);

  const submitClue = useCallback(
    (clue: string) => {
      socket.emit(CLIENT_EVENTS.PSYCHIC_SUBMIT_CLUE, { clue } satisfies PsychicSubmitCluePayload);
    },
    [socket]
  );

  const submitGuess = useCallback(
    (position: number) => {
      socket.emit(CLIENT_EVENTS.PLAYER_SUBMIT_GUESS, {
        position,
      } satisfies PlayerSubmitGuessPayload);
    },
    [socket]
  );

  const submitDirection = useCallback(
    (direction: "left" | "right") => {
      socket.emit(CLIENT_EVENTS.OPPONENT_SUBMIT_DIRECTION, {
        direction,
      } satisfies OpponentSubmitDirectionPayload);
    },
    [socket]
  );

  const nextRound = useCallback(() => {
    socket.emit(CLIENT_EVENTS.ROUND_NEXT);
  }, [socket]);

  const restartGame = useCallback(() => {
    socket.emit(CLIENT_EVENTS.GAME_RESTART);
    setWinners([]);
  }, [socket]);

  const value: GameContextValue = {
    socket,
    connected,
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
