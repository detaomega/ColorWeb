export const generatePlayerId = (): string => {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const calculateScore = (
  correctAnswers: number,
  totalQuestions: number,
  timeBonus: number = 0,
  hintPenalty: number = 0
): number => {
  const baseScore = (correctAnswers / totalQuestions) * 100;
  return Math.max(0, Math.round(baseScore + timeBonus - hintPenalty));
};

export const getScoreMessage = (score: number, total: number): string => {
  const percentage = (score / total) * 100;
  
  if (percentage === 100) return '🎉 完美得分！';
  if (percentage >= 80) return '😊 表現優秀！';
  if (percentage >= 60) return '👍 表現不錯！';
  if (percentage >= 40) return '💪 繼續加油！';
  return '📚 多多練習！';
};