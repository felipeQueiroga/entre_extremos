import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
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
  type PsychicSubmitCluePayload,
  type PsychicSubmitThemePayload,
  type FourColorsChallengeOnePayload,
  type FourColorsChooseColorPayload,
  type FourColorsChooseHandSwapTargetPayload,
  type FourColorsPlayCardPayload,
  type PokerBetPayload,
  type PokerRaisePayload,
  type RoomCreatePayload,
  type RoomJoinPayload,
  type RoomReconnectPayload,
  type SelectedGame,
} from "@entre-extremos/shared";
import { roomManager } from "./rooms";

const PORT = Number(process.env.PORT) || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (origin === CLIENT_URL) return true;
  if (/^http:\/\/localhost:\d+$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/i.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.ngrok-free\.dev$/i.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.ngrok\.io$/i.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.ngrok\.app$/i.test(origin)) return true;
  return false;
}

const app = express();
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin not allowed: ${origin}`));
      }
    },
  })
);
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/", (_req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Entre Extremos - API</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:2rem auto;padding:0 1rem">
  <h1>Entre Extremos — Servidor</h1>
  <p>Servidor online. O jogo roda no cliente:</p>
  <p><a href="http://localhost:5173">http://localhost:5173</a></p>
  <p><small>API: <a href="/health">/health</a></small></p>
</body>
</html>`);
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin not allowed: ${origin}`));
      }
    },
  },
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

function sendChatHistory(socketId: string, roomCode: string): void {
  const history = roomManager.getChatHistory(roomCode);
  io.to(socketId).emit(SERVER_EVENTS.CHAT_HISTORY, history);
}

roomManager.setBroadcast(broadcastRoomState);

io.on("connection", (socket) => {
  socket.on(CLIENT_EVENTS.ROOM_CREATE, (payload: RoomCreatePayload, ack?: (data: ClientRoomState | null) => void) => {
    const selectedGame: SelectedGame = payload.selectedGame ?? "entre-extremos";
    const mode: GameMode = payload.mode ?? "couple";
    const cardSource: CardSource = payload.cardSource ?? "deck";
    const cardThemes: CardTheme[] | undefined = payload.cardThemes;
    const { room, player } = roomManager.createRoom(
      payload.name,
      selectedGame,
      mode,
      cardSource,
      cardThemes,
      payload.fourColorsOptions,
      payload.pokerOptions,
      payload.stopOptions
    );
    roomManager.bindSocket(socket.id, player.id);
    socket.join(room.code);
    socket.join(player.id);

    const state = roomManager.toClientState(room, player.id);
    ack?.(state);
    sendChatHistory(socket.id, room.code);
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
    sendChatHistory(socket.id, room.code);
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
    sendChatHistory(socket.id, room.code);
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

  socket.on(CLIENT_EVENTS.FOUR_COLORS_START, () => {
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

  socket.on(CLIENT_EVENTS.PSYCHIC_SUBMIT_THEME, (payload: PsychicSubmitThemePayload) => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const result = roomManager.submitTheme(playerId, payload.left, payload.right);
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

  socket.on(CLIENT_EVENTS.CHAT_SEND, (payload: ChatSendPayload) => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const result = roomManager.sendChat(playerId, payload.text);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }

    const room = roomManager.getRoomByPlayer(playerId);
    if (room && result.message) {
      io.to(room.code).emit(SERVER_EVENTS.CHAT_MESSAGE, result.message);
    }
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

  socket.on(CLIENT_EVENTS.FOUR_COLORS_PLAY_CARD, (payload: FourColorsPlayCardPayload) => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const result = roomManager.playFourColorsCard(playerId, payload.cardId);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }

    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.FOUR_COLORS_DRAW_CARD, () => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const result = roomManager.drawFourColorsCard(playerId);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }

    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.FOUR_COLORS_CHOOSE_COLOR, (payload: FourColorsChooseColorPayload) => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const color: CardColor = payload.color;
    const result = roomManager.chooseFourColorsColor(playerId, color);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }

    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.FOUR_COLORS_CALL_ONE, () => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const result = roomManager.callFourColorsOne(playerId);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }

    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.FOUR_COLORS_CHALLENGE_ONE, (payload: FourColorsChallengeOnePayload) => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const result = roomManager.challengeFourColorsOne(playerId, payload.targetPlayerId);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }

    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.FOUR_COLORS_PASS_TURN, () => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    const result = roomManager.passFourColorsTurn(playerId);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }

    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(
    CLIENT_EVENTS.FOUR_COLORS_CHOOSE_HAND_SWAP_TARGET,
    (payload: FourColorsChooseHandSwapTargetPayload) => {
      const playerId = roomManager.getPlayerIdBySocket(socket.id);
      if (!playerId) return;

      const result = roomManager.chooseFourColorsHandSwapTarget(playerId, payload.targetPlayerId);
      if (result.error) {
        emitError(socket.id, result.error);
        return;
      }

      const room = roomManager.getRoomByPlayer(playerId);
      if (room) broadcastRoomState(room.code);
    }
  );

  socket.on(CLIENT_EVENTS.FOUR_COLORS_RESTART, () => {
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

  socket.on(CLIENT_EVENTS.POKER_START, () => {
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

  socket.on(CLIENT_EVENTS.POKER_FOLD, () => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;
    const result = roomManager.foldPoker(playerId);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }
    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.POKER_CHECK, () => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;
    const result = roomManager.checkPoker(playerId);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }
    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.POKER_CALL, () => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;
    const result = roomManager.callPoker(playerId);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }
    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.POKER_BET, (payload: PokerBetPayload) => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;
    const result = roomManager.betPoker(playerId, payload.amount);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }
    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.POKER_RAISE, (payload: PokerRaisePayload) => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;
    const result = roomManager.raisePoker(playerId, payload.amount);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }
    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.POKER_ALL_IN, () => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;
    const result = roomManager.allInPoker(playerId);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }
    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.POKER_NEXT_HAND, () => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;
    const result = roomManager.nextPokerHand(playerId);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }
    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.POKER_RESTART, () => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;
    const result = roomManager.restartPokerGame(playerId);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }
    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.STOP_START, () => {
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

  socket.on(CLIENT_EVENTS.STOP_SUBMIT_ANSWERS, (payload) => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;
    const result = roomManager.submitStopAnswers(playerId, payload.answers);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }
    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.STOP_CALL_STOP, () => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;
    const result = roomManager.callStop(playerId);
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }
    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.STOP_VOTE, (payload) => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;
    const result = roomManager.voteStopAnswer(
      playerId,
      payload.categoryId,
      payload.answerOwnerId,
      payload.valid
    );
    if (result.error) {
      emitError(socket.id, result.error);
      return;
    }
    const room = roomManager.getRoomByPlayer(playerId);
    if (room) broadcastRoomState(room.code);
  });

  socket.on(CLIENT_EVENTS.STOP_NEXT_ROUND, () => {
    const playerId = roomManager.getPlayerIdBySocket(socket.id);
    if (!playerId) return;
    const result = roomManager.nextStopRound(playerId);
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
