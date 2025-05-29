export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface StartGameRequest {
  playerId: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionCount?: number;
}

export interface StartGameResponse {
  sessionId: string;
  questions: GameQuestion[];
  timeLimit: number;
}

export interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  answer: string;
  timeUsed: number;
  hintsUsed: number;
}

export interface SubmitAnswerResponse {
  correct: boolean;
  correctAnswer: string;
  score: number;
  nextQuestion?: GameQuestion;
  gameCompleted: boolean;
}