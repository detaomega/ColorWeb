export type GameState = 'start' | 'playing' | 'gameOver' | 'loading';

export type ResultType = 'correct' | 'incorrect' | '';

export interface GameQuestion {
  id: string;
  name: string;
  images: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
}

export interface GameSession {
  sessionId: string;
  playerId: string;
  questions: GameQuestion[];
  currentQuestionIndex: number;
  score: number;
  timeLeft: number;
  hintCount: number;
  currentHintLevel: number;
  startTime: Date;
  endTime?: Date;
}

export interface GameStats {
  totalQuestions: number;
  correctAnswers: number;
  totalTime: number;
  hintsUsed: number;
}