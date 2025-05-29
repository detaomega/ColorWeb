import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, GameQuestion, GameSession, ResultType } from '../types';
import { GameAPIService } from '../services';
import { generatePlayerId } from '../utils';

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [hintCount, setHintCount] = useState(0);
  const [currentHintLevel, setCurrentHintLevel] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [resultType, setResultType] = useState<ResultType>('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputShake, setInputShake] = useState(false);
  const [score, setScore] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(async () => {
    try {
      setGameState('loading');
      setIsLoading(true);

      const playerId = generatePlayerId();
      const response = await GameAPIService.startGame({
        playerId,
        difficulty: 'medium',
        questionCount: 5,
      });

      const newSession: GameSession = {
        sessionId: response.sessionId,
        playerId,
        questions: response.questions,
        currentQuestionIndex: 0,
        score: 0,
        timeLeft: response.timeLimit,
        hintCount: 0,
        currentHintLevel: 0,
        startTime: new Date(),
      };

      setGameSession(newSession);
      setCurrentQuestion(response.questions[0]);
      setTimeLeft(response.timeLimit);
      setScore(0);
      setHintCount(0);
      setCurrentHintLevel(0);
      setUserAnswer('');
      setResultMessage('');
      setResultType('');
      setGameState('playing');
      startTimer(response.timeLimit);
    } catch (error) {
      console.error('Failed to start game:', error);
      setGameState('start');
      // Show error message to user
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startTimer = useCallback((initialTime: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;

        // Add hint every 10 seconds
        if (newTime % 10 === 0 && newTime > 0) {
          setHintCount(prevHint => prevHint + 1);
        }

        // Time's up
        if (newTime <= 0) {
          clearInterval(timerRef.current!);
          setResultMessage(`時間到！正確答案是：${currentQuestion?.name}`);
          setResultType('incorrect');

          setTimeout(() => {
            nextQuestion();
          }, 2000);

          return 0;
        }

        return newTime;
      });
    }, 1000);
  }, [currentQuestion]);

  const useHint = useCallback(() => {
    if (hintCount > 0 && currentQuestion) {
      setHintCount(prev => prev - 1);
      setCurrentHintLevel(prev => {
        const newLevel = prev + 1;
        return newLevel >= currentQuestion.images.length 
          ? currentQuestion.images.length - 1 
          : newLevel;
      });
      setIsLoading(true);
    }
  }, [hintCount, currentQuestion]);

  const checkAnswer = useCallback(async () => {
    if (!gameSession || !currentQuestion) return;

    try {
      const response = await GameAPIService.submitAnswer({
        sessionId: gameSession.sessionId,
        questionId: currentQuestion.id,
        answer: userAnswer.trim(),
        timeUsed: 60 - timeLeft,
        hintsUsed: 3 - hintCount, // Assuming max 3 hints
      });

      if (response.correct) {
        clearInterval(timerRef.current!);
        setScore(response.score);
        setResultMessage('答對了！');
        setResultType('correct');

        setTimeout(() => {
          if (response.gameCompleted) {
            endGame();
          } else {
            nextQuestion();
          }
        }, 1000);
      } else {
        setInputShake(true);
        setTimeout(() => setInputShake(false), 500);
        setResultMessage('答錯了，請再試一次！');
        setResultType('incorrect');
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setResultMessage('提交答案時發生錯誤');
      setResultType('incorrect');
    }
  }, [gameSession, currentQuestion, userAnswer, timeLeft, hintCount]);

  const nextQuestion = useCallback(() => {
    if (!gameSession) return;

    const nextIndex = gameSession.currentQuestionIndex + 1;
    
    if (nextIndex < gameSession.questions.length) {
      const nextQ = gameSession.questions[nextIndex];
      setCurrentQuestion(nextQ);
      setGameSession(prev => prev ? { ...prev, currentQuestionIndex: nextIndex } : null);
      setUserAnswer('');
      setResultMessage('');
      setResultType('');
      setTimeLeft(60);
      setHintCount(0);
      setCurrentHintLevel(0);
      startTimer(60);
    } else {
      endGame();
    }
  }, [gameSession, startTimer]);

  const endGame = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (gameSession) {
      try {
        await GameAPIService.endGame(gameSession.sessionId);
      } catch (error) {
        console.error('Failed to end game:', error);
      }
    }

    setGameState('gameOver');
  }, [gameSession]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  }, [checkAnswer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    gameState,
    currentQuestion,
    timeLeft,
    hintCount,
    currentHintLevel,
    userAnswer,
    setUserAnswer,
    resultMessage,
    resultType,
    isLoading,
    inputShake,
    score,
    gameSession,
    startGame,
    useHint,
    checkAnswer,
    handleKeyPress,
  };
};