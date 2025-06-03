export type GameState =
  | "username"
  | "menu"
  | "createRoom"
  | "joinRoom"
  | "lobby"
  | "game";

export interface Player {
  id: string;
  username: string;
  isReady?: boolean;
  isHost?: boolean;
  score?: number;
  joinedAt?: string;
  rank?: number;
}

export interface Room {
  id?: string;
  code: string;
  host?: Player;
  players: Player[];
  maxPlayers: number | 50;
  minPlayers: number | 2;
  isGameStarted?: boolean;
  createdAt?: Date;
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

export interface GameCreate {
  gameTitle: string;
  settings: {
    revealInterval: number;
    answerTime: number;
    maxPointsPerQuestion: number;
    rounds: number;
  };
  hostId: string;
}

export interface CreateGameResponse {
  success: boolean;
  message: string;
  game: {
    gameId: string;
    gameTitle: string;
    status: string;
    currentQuestionNumber: number;
    settings: {
      revealInterval: number;
      answerTime: number;
      maxPointsPerQuestion: number;
      rounds: number;
    };
    players: Player[];
    _id: string;
    createdAt: string;
    __v: number;
  };
}

export interface GameInfo {
  gameId: string;
  gameTitle: string;
  status: string;
  settings: {
    revealInterval: number;
    answerTime: number;
    maxPointsPerQuestion: number;
    rounds: number;
  };
  players: Player[];
  currentQuestionNumber: number;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
  hostId: string;
  questionCount?: number;
}
