import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
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
  type RoomJoinPayload,
  type RoomReconnectPayload,
} from "@entre-extremos/shared";
import { roomManager } from "./rooms";

const PORT = Number(process.env.PORT) || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL },
});

function broadcastRoomState(roomCode: string): void {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  for (const player of room.players) {
    if (!player.connected) continue;
    const state = roomManager.toClientState(room, player.id);
    io.to(player.id).emit(SERVER_EVENTS.GAME_STATE, state);

    if (room.status === "finished") {
      const payload: GameOverPayload = {
        winners: roomManager.getWinnersForRoom(room),
        state,
      };
      io.to(player.id).emit(SERVER_EVENTS.GAME_OVER, payload);
    }
  }
}

function emitError(socketId: string, message: string): void {
  io.to(socketId).emit(SERVER_EVENTS.ROOM_ERROR, { message });
}

io.on("connection", (socket) => {
  socket.on(CLIENT_EVENTS.ROOM_CREATE, (payload: RoomCreatePayload, ack?: (data: ClientRoomState | null) => void) => {
    const mode: GameMode = payload.mode ?? "couple";
    const { room, player } = roomManager.createRoom(payload.name, mode);
    roomManager.bindSocket(socket.id, player.id);
    socket.join(room.code);
    socket.join(player.id);

    const state = roomManager.toClientState(room, player.id);
    ack?.(state);
    broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.ROOM_JOIN, (payload: RoomJoinPayload, ack?: (data: ClientRoomState | null) => void) => {
    const result = roomManager.joinRoom(payload.code, payload.name, payload.playerId);
    if ("error" in result) {
      emitError(socket.id, result.error);
      ack?.(null);
      return;
    }

    const { room, player } = result;
    roomManager.bindSocket(socket.id, player.id);
    socket.join(room.code);
    socket.join(player.id);

    const state = roomManager.toClientState(room, player.id);
    ack?.(state);
    broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.ROOM_RECONNECT, (payload: RoomReconnectPayload, ack?: (data: ClientRoomState | null) => void) => {
    const result = roomManager.joinRoom(payload.code, "", payload.playerId);
    if ("error" in result) {
      emitError(socket.id, result.error);
      ack?.(null);
      return;
    }

    const { room, player } = result;
    roomManager.bindSocket(socket.id, player.id);
    socket.join(room.code);
    socket.join(player.id);

    const state = roomManager.toClientState(room, player.id);
    ack?.(state);
    broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.ROOM_LEAVE, () => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const room = roomManager.leaveRoom(playerId);
    roomManager.unbindSocket(socket.id);
    if (room) {
      socket.leave(room.code);
      socket.leave(playerId);
    }

    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.PLAYER_JOIN_TEAM, (payload: PlayerJoinTeamPayload) => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const result = roomManager.setPlayerTeam(playerId, payload.team);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }

    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.GAME_START, () => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const result = roomManager.startGame(playerId);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }

    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.PSYCHIC_SUBMIT_CLUE, (payload: PsychicSubmitCluePayload) => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const result = roomManager.submitClue(playerId, payload.clue);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }

    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.PLAYER_SUBMIT_GUESS, (payload: PlayerSubmitGuessPayload) => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const result = roomManager.submitGuess(playerId, payload.position);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }

    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.OPPONENT_SUBMIT_DIRECTION, (payload: OpponentSubmitDirectionPayload) => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const result = roomManager.submitDirection(playerId, payload.direction);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }

    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.ROUND_NEXT, () => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const result = roomManager.nextRound(playerId);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }

    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.GAME_RESTART, () => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const result = roomManager.restartGame(playerId);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }

    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on("disconnect", () => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const room = roomManager.getRoomByPlayer(playerId);
    if (room) {
      const player = room.players.find((p) => p.id === playerId);
      if (player) player.connected = false;
      roomManager.unbindSocket(socket.id);
      broadcastRoomState(room.code);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
