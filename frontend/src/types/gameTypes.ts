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

// 題目數據結構
export interface Question {
  id: string;
  images: string[]; // 5張提示圖片的URL
  answer: string; // 正確答案（用於驗證，實際可能不需要）
}

// 玩家排名結構
export interface PlayerRanking {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
}

// 答題結果結構
export interface AnswerResult {
  correct: boolean;
  score: number;
  totalScore: number;
  message?: string;
}
