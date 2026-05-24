import { v4 as uuidv4 } from "uuid";
import type {
  ClientRoomState,
  ClientRoundState,
  GameMode,
  Player,
  RoomState,
  RoundState,
  Team,
} from "@entre-extremos/shared";
import { pickRandomCard, randomTargetPosition } from "./cards";
import {
  calculateRoundResult,
  getTeamWinners,
  getWinners,
} from "./game";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_COUPLE_PLAYERS = 2;
const MAX_TEAM_PLAYERS = 8;

export class RoomManager {
  private rooms = new Map<string, RoomState>();
  private playerToRoom = new Map<string, string>();
  private socketToPlayer = new Map<string, string>();

  generateCode(): string {
    let code: string;
    do {
      code = Array.from({ length: 6 }, () =>
        CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
      ).join("");
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(name: string, mode: GameMode = "couple"): { room: RoomState; player: Player } {
    const code = this.generateCode();
    const player: Player = {
      id: uuidv4(),
      name: name.trim(),
      isHost: true,
      connected: true,
    };

    const room: RoomState = {
      code,
      players: [player],
      score: { [player.id]: 0 },
      teamScore: mode === "teams" ? { A: 0, B: 1 } : undefined,
      status: "lobby",
      mode,
      winningScore: 10,
      usedCardIds: [],
    };

    this.rooms.set(code, room);
    this.playerToRoom.set(player.id, code);
    return { room, player };
  }

  joinRoom(
    code: string,
    name: string,
    playerId?: string
  ): { room: RoomState; player: Player } | { error: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) {
      return { error: "Sala não encontrada." };
    }

    if (room.status !== "lobby" && !playerId) {
      return { error: "A partida já começou." };
    }

    const maxPlayers = room.mode === "couple" ? MAX_COUPLE_PLAYERS : MAX_TEAM_PLAYERS;
    const connectedCount = room.players.filter((p) => p.connected).length;

    if (playerId) {
      const existing = room.players.find((p) => p.id === playerId);
      if (existing) {
        existing.connected = true;
        existing.name = name.trim() || existing.name;
        this.playerToRoom.set(existing.id, room.code);
        return { room, player: existing };
      }
    }

    if (connectedCount >= maxPlayers) {
      return { error: "Sala cheia." };
    }

    const player: Player = {
      id: uuidv4(),
      name: name.trim(),
      isHost: false,
      connected: true,
    };

    room.players.push(player);
    room.score[player.id] = room.score[player.id] ?? 0;
    this.playerToRoom.set(player.id, room.code);
    return { room, player };
  }

  leaveRoom(playerId: string): RoomState | null {
    const code = this.playerToRoom.get(playerId);
    if (!code) return null;

    const room = this.rooms.get(code);
    if (!room) return null;

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.connected = false;
    }

    this.playerToRoom.delete(playerId);

    const connected = room.players.filter((p) => p.connected);
    if (connected.length === 0) {
      this.rooms.delete(code);
      return null;
    }

    if (player?.isHost) {
      const newHost = connected[0];
      newHost.isHost = true;
      room.players.forEach((p) => {
        p.isHost = p.id === newHost.id;
      });
    }

    return room;
  }

  bindSocket(socketId: string, playerId: string): void {
    this.socketToPlayer.set(socketId, playerId);
  }

  unbindSocket(socketId: string): void {
    this.socketToPlayer.delete(socketId);
  }

  getPlayerIdBySocket(socketId: string): string | undefined {
    return this.socketToPlayer.get(socketId);
  }

  getRoomByPlayer(playerId: string): RoomState | undefined {
    const code = this.playerToRoom.get(playerId);
    return code ? this.rooms.get(code) : undefined;
  }

  getRoom(code: string): RoomState | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  setPlayerTeam(playerId: string, team: Team): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room || room.mode !== "teams") {
      return { error: "Modo de times não ativo." };
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { error: "Jogador não encontrado." };

    player.team = team;
    return {};
  }

  startGame(playerId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room) return { error: "Sala não encontrada." };

    const host = room.players.find((p) => p.id === playerId);
    if (!host?.isHost) return { error: "Apenas o host pode iniciar." };

    const connected = room.players.filter((p) => p.connected);
    if (room.mode === "couple" && connected.length < 2) {
      return { error: "São necessários 2 jogadores." };
    }

    if (room.mode === "teams") {
      const teamA = connected.filter((p) => p.team === "A");
      const teamB = connected.filter((p) => p.team === "B");
      if (teamA.length === 0 || teamB.length === 0) {
        return { error: "Cada time precisa de pelo menos 1 jogador." };
      }
    }

    room.status = "playing";
    room.usedCardIds = [];
    connected.forEach((p) => {
      room.score[p.id] = 0;
    });
    if (room.teamScore) {
      room.teamScore = { A: 0, B: 1 };
    }

    this.startRound(room);
    return {};
  }

  private startRound(room: RoomState): void {
    const connected = room.players.filter((p) => p.connected);
    const roundNumber = (room.currentRound?.roundNumber ?? 0) + 1;

    let psychicPlayerId: string;
    let activeTeam: Team | undefined;

    if (room.mode === "couple") {
      const psychicIndex = (roundNumber - 1) % connected.length;
      psychicPlayerId = connected[psychicIndex].id;
    } else {
      activeTeam = roundNumber % 2 === 1 ? "A" : "B";
      const teamPlayers = connected.filter((p) => p.team === activeTeam);
      const psychicIndex = Math.floor((roundNumber - 1) / 2) % teamPlayers.length;
      psychicPlayerId = teamPlayers[psychicIndex]?.id ?? connected[0].id;
    }

    const card = pickRandomCard(room.usedCardIds);
    room.usedCardIds.push(card.id);

    const round: RoundState = {
      roundNumber,
      activeTeam,
      psychicPlayerId,
      card,
      targetPosition: randomTargetPosition(),
      revealed: false,
      phase: "psychic_clue",
    };

    room.currentRound = round;
  }

  submitClue(playerId: string, clue: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room?.currentRound) return { error: "Rodada não encontrada." };

    const round = room.currentRound;
    if (round.phase !== "psychic_clue") return { error: "Não é hora de enviar dica." };
    if (round.psychicPlayerId !== playerId) return { error: "Apenas o psíquico pode enviar dica." };

    const trimmed = clue.trim();
    if (!trimmed || trimmed.length > 100) {
      return { error: "Dica inválida (1-100 caracteres)." };
    }

    round.clue = trimmed;
    round.phase = "guess";
    return {};
  }

  submitGuess(playerId: string, position: number): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room?.currentRound) return { error: "Rodada não encontrada." };

    const round = room.currentRound;
    if (round.phase !== "guess") return { error: "Não é hora de palpitar." };
    if (round.psychicPlayerId === playerId) return { error: "O psíquico não pode palpitar." };

    if (room.mode === "teams") {
      const player = room.players.find((p) => p.id === playerId);
      if (player?.team !== round.activeTeam) {
        return { error: "Apenas o time ativo pode palpitar." };
      }
    } else {
      const guesserId = room.players.find((p) => p.id !== round.psychicPlayerId && p.connected)?.id;
      if (guesserId !== playerId) return { error: "Apenas o palpiteiro pode enviar palpite." };
    }

    if (position < 0 || position > 100 || !Number.isFinite(position)) {
      return { error: "Posição inválida (0-100)." };
    }

    round.guessPosition = Math.round(position);
    round.phase = room.mode === "teams" ? "opponent_direction" : "reveal";
    round.revealed = room.mode === "couple";

    if (room.mode === "couple") {
      this.applyRoundScoring(room);
    }

    return {};
  }

  submitDirection(playerId: string, direction: "left" | "right"): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room?.currentRound || room.mode !== "teams") {
      return { error: "Aposta adversária indisponível." };
    }

    const round = room.currentRound;
    if (round.phase !== "opponent_direction") {
      return { error: "Não é hora de apostar direção." };
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player?.team || player.team === round.activeTeam) {
      return { error: "Apenas o time adversário pode apostar." };
    }

    round.opponentDirectionGuess = direction;
    round.phase = "reveal";
    round.revealed = true;
    this.applyRoundScoring(room);
    return {};
  }

  private applyRoundScoring(room: RoomState): void {
    const round = room.currentRound!;
    if (round.guessPosition === undefined) return;

    const guesserId =
      room.mode === "couple"
        ? room.players.find((p) => p.id !== round.psychicPlayerId && p.connected)?.id
        : room.players.find((p) => p.team === round.activeTeam && p.id !== round.psychicPlayerId)?.id ??
          room.players.find((p) => p.team === round.activeTeam)?.id;

    if (!guesserId) return;

    const result = calculateRoundResult(
      round.targetPosition,
      round.guessPosition,
      guesserId,
      round.opponentDirectionGuess
    );

    round.lastRoundPoints = result.guesserPoints;
    round.lastRoundGuesserId = guesserId;
    room.score[guesserId] = (room.score[guesserId] ?? 0) + result.guesserPoints;

    if (room.mode === "teams" && room.teamScore && round.activeTeam) {
      room.teamScore[round.activeTeam] += result.guesserPoints;
      const opponentTeam = round.activeTeam === "A" ? "B" : "A";
      room.teamScore[opponentTeam] += result.opponentPoints;
    }

    if (this.checkGameOver(room)) {
      room.status = "finished";
      room.currentRound!.phase = "ended";
    }
  }

  nextRound(playerId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room) return { error: "Sala não encontrada." };

    const host = room.players.find((p) => p.id === playerId);
    if (!host?.isHost) return { error: "Apenas o host pode avançar." };

    if (room.status === "finished") return { error: "Partida encerrada." };
    if (room.currentRound?.phase !== "reveal" && room.currentRound?.phase !== "ended") {
      return { error: "Aguarde a revelação da rodada." };
    }

    if (this.checkGameOver(room)) {
      room.status = "finished";
      return {};
    }

    this.startRound(room);
    return {};
  }

  restartGame(playerId: string): { error?: string } {
    const room = this.getRoomByPlayer(playerId);
    if (!room) return { error: "Sala não encontrada." };

    const host = room.players.find((p) => p.id === playerId);
    if (!host?.isHost) return { error: "Apenas o host pode reiniciar." };

    room.status = "lobby";
    room.currentRound = undefined;
    room.usedCardIds = [];
    room.players.filter((p) => p.connected).forEach((p) => {
      room.score[p.id] = 0;
    });
    if (room.teamScore) {
      room.teamScore = { A: 0, B: 1 };
    }
    return {};
  }

  private checkGameOver(room: RoomState): boolean {
    if (room.mode === "teams" && room.teamScore) {
      return getTeamWinners(room.teamScore, room.winningScore).length > 0;
    }
    return getWinners(room.score, room.winningScore).length > 0;
  }

  getWinnersForRoom(room: RoomState): string[] {
    return getWinners(room.score, room.winningScore);
  }

  getTeamWinnersForRoom(room: RoomState): Team[] {
    if (!room.teamScore) return [];
    return getTeamWinners(room.teamScore, room.winningScore);
  }

  toClientState(room: RoomState, playerId: string): ClientRoomState {
    const round = room.currentRound;
    let clientRound: ClientRoundState | undefined;

    if (round) {
      const isPsychic = round.psychicPlayerId === playerId;
      const canSeeTarget =
        (isPsychic && round.phase === "psychic_clue") ||
        round.revealed ||
        round.phase === "reveal" ||
        round.phase === "ended";

      clientRound = {
        roundNumber: round.roundNumber,
        activeTeam: round.activeTeam,
        psychicPlayerId: round.psychicPlayerId,
        card: round.card,
        clue: round.clue,
        guessPosition: round.guessPosition,
        opponentDirectionGuess: round.opponentDirectionGuess,
        lastRoundPoints: round.lastRoundPoints,
        lastRoundGuesserId: round.lastRoundGuesserId,
        revealed: round.revealed,
        phase: round.phase,
      };

      if (canSeeTarget) {
        clientRound.targetPosition = round.targetPosition;
      }
    }

    return {
      code: room.code,
      players: room.players,
      score: room.score,
      teamScore: room.teamScore,
      status: room.status,
      mode: room.mode,
      currentRound: clientRound,
      winningScore: room.winningScore,
      playerId,
    };
  }
}

export const roomManager = new RoomManager();
