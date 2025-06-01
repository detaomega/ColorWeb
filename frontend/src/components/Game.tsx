import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Users, Send, Loader2, Trophy } from 'lucide-react';
import type { Question, PlayerRanking, AnswerResult } from "../types/gameTypes";

// 遊戲狀態
type PlayerState = 'waiting' | 'playing' | 'loading' | 'finished' | 'rankings';

// ##############     應實作概念     ##############
// ############## 遊戲前準備 ##############
// . TODO(set up) - 承用進入房間時取得的(載房主按下開始遊戲後後端必須將遊戲資料一次性傳給所有前端)遊戲資訊設置房間狀態：
// 房間id、人數、問題數、問題id陣列、答題時間數、圖片更新速率
// . TODO(wait before game) - 在玩家進入房間時，設置玩家的狀態為waiting，在玩家按下準備鍵時，回傳資料給後端，並將玩家狀態改為loading
// ############## 進入遊戲 ##############
// . TODO(load into game) - 當房主按下開始遊戲，所有loading玩家進入遊戲畫面，在所有人載入完畫面後開始遊戲
// . TODO(wait in game) - loading時，每秒取得loading人數(或是能否進入下一題的狀態變數)，若loading玩家到達房間人數，
// 則準備進入下一題，並將玩家狀態改為playing
// . TODO(game process) - playing時，有倒數計時、完成作答人數(故每秒要向後端更新一次)和題目圖片跟作答欄，作答欄為可
// 輸入欄位，圖片每隔更新時間更新一次，倒數計時持續更新、完成作答人數每秒更新一次
// . TODO(failed) - 若玩家答題失敗，紀錄玩家答錯次數及答錯標示，並渲染答錯區塊
// . TODO(successed) - 當玩家成功答題，將狀態切為loading，並在loading頁面顯示玩家分數和目前作答人數
// ############## 遊戲結算 ##############
// . TODO(finish) - 若所有題目及所有成員皆作答完畢，和後端要求排行榜並渲染為排行榜頁面

const QuizGameComponent = () => {
  // ##############全域遊戲基本資料##############
  // game data
  const [gameId] = useState('game-123');
  const [totalPlayers] = useState(4);
  const [totalQuestions] = useState(5);
  const [completedPlayers, setCompletedPlayers] = useState(0);
  // question control
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);//包含該題答案
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // ##############玩家個人遊戲基本資料##############
  const [gameState, setGameState] = useState<PlayerState>('waiting');
  // initialize question data
  const [timeLeft, setTimeLeft] = useState(35);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  // initialize player data
  const [currentScore, setCurrentScore] = useState(0);
  const [rankings, setRankings] = useState<PlayerRanking[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // player answering state
  const [answerFeedback, setAnswerFeedback] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  // system data
  const [apiError, setApiError] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  // ##############後端API基礎##############
  // TODO - 後端函式呼叫
  const apiCall = async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API調用失敗:', error);
      setApiError(error instanceof Error ? error.message : '未知錯誤');
      throw error;
    }
  };

  // ##############遊戲過程區塊##############
  // TODO - 獲取下一題的圖片與答案
  const fetchQuestion = useCallback(async () => {
    try {
      setApiError(null);
      const questionData = await apiCall(`/games/${gameId}/question`);
      
      setCurrentQuestion(questionData);
      setCurrentImageIndex(0);
      setTimeLeft(35);
      setUserAnswer('');
      setCompletedPlayers(0);
      setWrongAttempts(0);
      setAnswerFeedback(null);
      setIsAnswerCorrect(false);
      setGameState('playing');
    } catch (error) {
      console.warn('使用模擬數據，因為API調用失敗:', error);
      const mockQuestion: Question = {
        id: `question-${currentQuestionNumber}`,
        images: [
          'https://picsum.photos/400/300?random=1',
          'https://picsum.photos/400/300?random=2',
          'https://picsum.photos/400/300?random=3',
          'https://picsum.photos/400/300?random=4',
          'https://picsum.photos/400/300?random=5'
        ],
        answer: 'Example'
      };
      
      setCurrentQuestion(mockQuestion);
      setCurrentImageIndex(0);
      setTimeLeft(35);
      setUserAnswer('');
      setCompletedPlayers(0);
      setWrongAttempts(0);
      setAnswerFeedback(null);
      setIsAnswerCorrect(false);
      setGameState('playing');
    }
  }, [gameId, currentQuestionNumber]);
  // TODO - 進入下一題
  const startNextQuestion = async () => {
    try {
      setApiError(null);
      await apiCall(`/games/${gameId}/question/next`, {
        method: 'POST'
      });
      
      setCurrentQuestionNumber(prev => prev + 1);
      await fetchQuestion();
    } catch (error) {
      console.error('開始下一題失敗:', error);
      // 如果API失敗，仍然繼續到下一題
      if (currentQuestionNumber < totalQuestions) {
        setCurrentQuestionNumber(prev => prev + 1);
        await fetchQuestion();
      } else {
        await fetchRankings();
        setGameState('rankings');
      }
    }
  };

  // TODO - 圖片切換（每7秒換一張）
  useEffect(() => {
    if (gameState !== 'playing' || !currentQuestion) return;

    const imageTimer = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % currentQuestion.images.length);
    }, 7000);

    return () => clearInterval(imageTimer);
  }, [gameState, currentQuestion]);

  // TODO - 倒數計時
  useEffect(() => {
    if (gameState !== 'playing' || timeLeft <= 0 || isAnswerCorrect) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // 時間到，自動進入下一題或結束遊戲
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft, isAnswerCorrect]);

  // TODO - 時間到處理
  const handleTimeUp = useCallback(async () => {
    if (gameState !== 'playing') return;
    
    console.log('時間到！');
    setAnswerFeedback('時間到！進入下一題');
    setGameState('loading');
    
    // 等待一下讓玩家看到訊息
    setTimeout(async () => {
      if (currentQuestionNumber < totalQuestions) {
        await startNextQuestion();
      } else {
        await fetchRankings();
        setGameState('rankings');
      }
    }, 2000);
  }, [gameState, currentQuestionNumber, totalQuestions]);

  // TODO - 格式化時間顯示
  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  // TODO - 提交答案
  const handleSubmitAnswer = useCallback(async () => {
    if (gameState !== 'playing' || isSubmitting || isAnswerCorrect || !userAnswer.trim()) return;
    
    setIsSubmitting(true);
    console.log('提交答案:', userAnswer);
    
    try {
      // 提交答案並獲取結果
      const result = await submitAnswerAndGetScore(userAnswer);
      console.log('答題結果:', result);
      
      setCurrentScore(result.totalScore);
      
      if (result.correct) {
        // 答對了！
        setIsAnswerCorrect(true);
        setAnswerFeedback(result.message || '恭喜答對！');
        
        // 模擬玩家完成答題
        setCompletedPlayers(prev => prev + 1);
        setGameState('loading');
        
        // 等待其他玩家完成（實際應該通過WebSocket監聽）
        setTimeout(async () => {
          if (currentQuestionNumber < totalQuestions) {
            await startNextQuestion();
          } else {
            await fetchRankings();
            setGameState('rankings');
          }
        }, 3000);
        
      } else {
        // 答錯了，增加錯誤次數並讓玩家繼續作答
        setWrongAttempts(prev => prev + 1);
        setAnswerFeedback(result.message || `答案錯誤！這是第 ${wrongAttempts + 1} 次錯誤嘗試`);
        setUserAnswer(''); // 清空輸入框讓玩家重新輸入
      }
      
    } catch (error) {
      console.error('提交答案過程出錯:', error);
      setAnswerFeedback('提交答案時發生錯誤，請重試');
    } finally {
      setIsSubmitting(false);
    }
  }, [gameState, userAnswer, currentQuestionNumber, totalQuestions, isSubmitting, isAnswerCorrect, wrongAttempts]);

  // TODO - 提交答案並獲取分數
  const submitAnswerAndGetScore = async (answer: string) => {
    try {
      setApiError(null);
      const result = await apiCall(`/games/${gameId}/question/answer`, {
        method: 'POST',
        body: JSON.stringify({ answer })
      });
      
      // 假設API返回 { correct: boolean, score: number, totalScore: number, message?: string }
      return {
        correct: result.correct || false,
        score: result.score || 0,
        totalScore: result.totalScore || result.score || 0,
        message: result.message
      } as AnswerResult;
    } catch (error) {
      console.error('提交答案失敗:', error);
      // 如果API失敗，返回模擬結果
      const isCorrect = answer.toLowerCase().includes('範例') || Math.random() > 0.7; // 模擬正確率
      const score = isCorrect ? Math.floor(Math.random() * 100) + 50 : 0;
      return {
        correct: isCorrect,
        score: score,
        totalScore: currentScore + score,
        message: isCorrect ? '答對了！' : '答案錯誤，請再試一次'
      } as AnswerResult;
    }
  };

  // TODO - 錯誤顯示組件
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <strong>錯誤：</strong> {message}
    </div>
  );

  // ##############遊戲畫面##############
  // TODO - 開始新遊戲
  const startGame = () => {
    setCurrentQuestionNumber(1);
    setCurrentScore(0);
    setWrongAttempts(0);
    setAnswerFeedback(null);
    setIsAnswerCorrect(false);
    setApiError(null);
    fetchQuestion();
  };
  // TODO - 載入排名頁面
  const fetchRankings = async () => {
    try {
      setApiError(null);
      const rankingsData = await apiCall(`/games/${gameId}/rankings`);
      setRankings(rankingsData);
    } catch (error) {
      console.error('獲取排名失敗:', error);
      // 如果API失敗，使用模擬排名數據
      const mockRankings: PlayerRanking[] = [
        { playerId: '1', playerName: '玩家1', score: currentScore, rank: 1 },
        { playerId: '2', playerName: '玩家2', score: 450, rank: 2 },
        { playerId: '3', playerName: '玩家3', score: 380, rank: 3 },
        { playerId: '4', playerName: '玩家4', score: 320, rank: 4 }
      ];
      setRankings(mockRankings);
    }
  };
  // TODO - 等待畫面
  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">準備開始遊戲</h1>
          {apiError && <ErrorMessage message={apiError} />}
          <div className="mb-4 text-gray-600">
            <p>遊戲ID: {gameId}</p>
            <p>當前分數: {currentScore}</p>
          </div>
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
          >
            開始遊戲
          </button>
        </div>
      </div>
    );
  }
  // TODO - 載入等待畫面
  if (gameState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-12 text-center shadow-2xl">
          <div className="animate-spin mb-6">
            <Loader2 className="w-16 h-16 text-indigo-600 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">等待其他玩家</h2>
          <p className="text-gray-600 mb-6">已完成：{completedPlayers}/{totalPlayers} 位玩家</p>
          <div className="flex justify-center space-x-2">
            {[...Array(totalPlayers)].map((_, index) => (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-500 ${
                  index < completedPlayers 
                    ? 'bg-green-500 animate-pulse' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
  // TODO - 排名畫面
  if (gameState === 'rankings') { 
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-2xl w-full">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🏆 遊戲結果</h1>
            <p className="text-gray-600">你的總分數: {currentScore} 分</p>
          </div>
          
          {apiError && <ErrorMessage message={apiError} />}
          
          <div className="space-y-4 mb-8">
            <h2 className="text-xl font-bold text-gray-800 text-center">排行榜</h2>
            {rankings.map((player, index) => (
              <div key={player.playerId} className={`flex items-center justify-between p-4 rounded-lg ${
                index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' :
                index === 1 ? 'bg-gray-100 border-2 border-gray-400' :
                index === 2 ? 'bg-orange-100 border-2 border-orange-400' :
                'bg-gray-50'
              }`}>
                <div className="flex items-center space-x-3">
                  <span className={`text-2xl font-bold ${
                    index === 0 ? 'text-yellow-500' :
                    index === 1 ? 'text-gray-500' :
                    index === 2 ? 'text-orange-500' :
                    'text-gray-400'
                  }`}>
                    #{player.rank}
                  </span>
                  <span className="font-semibold">{player.playerName}</span>
                </div>
                <span className="text-lg font-bold text-gray-700">{player.score} 分</span>
              </div>
            ))}
          </div>
          
            <div className="text-center">
            <button
              onClick={() => {
                setGameState('waiting');
                setCurrentQuestionNumber(1);
                setCurrentScore(0);
                setWrongAttempts(0);
                setAnswerFeedback(null);
                setIsAnswerCorrect(false);
                setRankings([]);
              }}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105"
            >
              再玩一次
            </button>
          </div>
        </div>
      </div>
    );
  }
  // TODO - 遊戲結束畫面（保留原有的，但現在會跳轉到排名）
  if (gameState === 'finished') {// if (AllPlayerFinished)
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-12 text-center shadow-2xl">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">🎉 遊戲結束！</h1>
          <p className="text-xl text-gray-600 mb-8">感謝參與這次的答題遊戲</p>
          <button
            onClick={async () => {
              await fetchRankings();
              setGameState('rankings');
            }}
            className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-teal-600 transition-all duration-200 transform hover:scale-105"
          >
            查看排名
          </button>
        </div>
      </div>
    );
  }
  // TODO - 主要答題畫面
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-pink-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* API錯誤提示 */}
        {apiError && (
          <div className="mb-4">
            <ErrorMessage message={apiError} />
          </div>
        )}

        {/* 頂部狀態欄 */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-orange-600">
                <Clock className="w-5 h-5" />
                <span className="font-bold text-lg">{formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-600">
                <Users className="w-5 h-5" />
                <span className="font-semibold">完成：{completedPlayers}/{totalPlayers}</span>
              </div>
              <div className="flex items-center space-x-2 text-purple-600">
                <Trophy className="w-5 h-5" />
                <span className="font-semibold">分數：{currentScore}</span>
              </div>
              {wrongAttempts > 0 && (
                <div className="flex items-center space-x-2 text-red-600">
                  <span className="font-semibold">錯誤次數：{wrongAttempts}</span>
                </div>
              )}
            </div>
            <div className="text-gray-600 font-semibold">
              第 {currentQuestionNumber} 題 / {totalQuestions} 題
            </div>
          </div>
          
          {/* 進度條 */}
          <div className="mt-3">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((35 - timeLeft) / 35) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 主要遊戲區域 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 圖片顯示區 */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">提示圖片</h2>
              <p className="text-sm text-gray-600">圖片 {currentImageIndex + 1}/5</p>
            </div>
            
            {currentQuestion && (
              <div className="relative">
                <img
                  src={currentQuestion.images[currentImageIndex]}
                  alt={`提示圖片 ${currentImageIndex + 1}`}
                  className="w-full h-64 object-cover rounded-lg shadow-md transition-all duration-500"
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-sm">
                  {currentImageIndex + 1}/5
                </div>
              </div>
            )}
            
            {/* 圖片指示器 */}
            <div className="flex justify-center mt-4 space-x-2">
              {currentQuestion?.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentImageIndex 
                      ? 'bg-orange-500 scale-125' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 答題區 */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">請輸入答案</h2>
            
            {/* 答題反饋訊息 */}
            {answerFeedback && (
              <div className={`mb-4 p-3 rounded-lg ${
                isAnswerCorrect 
                  ? 'bg-green-100 border border-green-400 text-green-700'
                  : 'bg-red-100 border border-red-400 text-red-700'
              }`}>
                <strong>
                  {isAnswerCorrect ? '✅ ' : '❌ '}
                  {answerFeedback}
                </strong>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  你的答案：
                </label>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={isSubmitting || isAnswerCorrect}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg disabled:bg-gray-100"
                  placeholder={isAnswerCorrect ? "已答對，等待下一題..." : "請輸入你的答案..."}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isSubmitting && !isAnswerCorrect) {
                      handleSubmitAnswer();
                    }
                  }}
                />
              </div>
              
              <button
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim() || isSubmitting || isAnswerCorrect}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>提交中...</span>
                  </>
                ) : isAnswerCorrect ? (
                  <>
                    <span>✅ 已答對！</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>提交答案{wrongAttempts > 0 ? ` (第${wrongAttempts + 1}次嘗試)` : ''}</span>
                  </>
                )}
              </button>
              
              <div className="text-center text-sm text-gray-500">
                {isAnswerCorrect 
                  ? "恭喜答對！等待其他玩家完成..."
                  : "按 Enter 或點擊按鈕提交答案"
                }
              </div>
              
              {wrongAttempts > 0 && !isAnswerCorrect && (
                <div className="text-center text-sm text-red-600">
                  已嘗試 {wrongAttempts} 次，繼續努力！
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizGameComponent;