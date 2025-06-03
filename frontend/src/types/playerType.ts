export interface GamePlayerList {
  success: boolean;
  players: Array<{
    rank: number;
    username: string;
    score: number;
  }>;
}

export interface GameRankingList {
  success: boolean;
  rankings: Array<{
    rank: number;
    username: string;
    score: number;
  }>;
}
