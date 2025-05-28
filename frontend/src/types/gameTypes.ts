export type GameState =
  | "nickname"
  | "menu"
  | "createRoom"
  | "joinRoom"
  | "lobby"
  | "game";

export interface Player {
  id: string;
  nickname: string;
  isReady: boolean;
  isHost: boolean;
}

export interface Room {
  id: string;
  code: string;
  host: Player;
  players: Player[];
  maxPlayers: number;
  minPlayers: number;
  isGameStarted: boolean;
  createdAt: Date;
}

export interface GameConfig {
  minPlayers: number;
  maxPlayers: number;
  roomCodeLength: number;
}
