import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Users, Send, Loader2 } from 'lucide-react';

// 模擬題目數據結構
interface Question {
  id: string;
  images: string[]; // 5張提示圖片的URL
  answer: string; // 正確答案（用於驗證，實際可能不需要）
}

// 遊戲狀態
type GameState = 'waiting' | 'playing' | 'loading' | 'finished';

const QuizGameComponent = () => {
  // 遊戲狀態
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(35);
  const [userAnswer, setUserAnswer] = useState('');
  const [completedPlayers, setCompletedPlayers] = useState(0);
  const [totalPlayers] = useState(4); // 假設總共4個玩家
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [totalQuestions] = useState(5); // 假設總共5題

  // 模擬從後端API獲取題目
  const fetchQuestion = useCallback(async () => {
    // 這裡你需要替換成真實的API調用
    // const response = await fetch('/api/get-question');
    // const question = await response.json();
    
    // 模擬數據
    const mockQuestion: Question = {
      id: `question-${currentQuestionNumber}`,
      images: [
        'https://picsum.photos/400/300?random=1',
        'https://picsum.photos/400/300?random=2',
        'https://picsum.photos/400/300?random=3',
        'https://picsum.photos/400/300?random=4',
        'https://picsum.photos/400/300?random=5'
      ],
      answer: '範例答案'
    };
    
    setCurrentQuestion(mockQuestion);
    setCurrentImageIndex(0);
    setTimeLeft(35);
    setUserAnswer('');
    setCompletedPlayers(0);
    setGameState('playing');
  }, [currentQuestionNumber]);

  // 倒數計時效果
  useEffect(() => {
    if (gameState !== 'playing' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // 時間到，自動提交
          handleSubmitAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // 圖片切換效果（每7秒換一張）
  useEffect(() => {
    if (gameState !== 'playing' || !currentQuestion) return;

    const imageTimer = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % currentQuestion.images.length);
    }, 7000);

    return () => clearInterval(imageTimer);
  }, [gameState, currentQuestion]);

  // 提交答案
  const handleSubmitAnswer = useCallback(() => {
    if (gameState !== 'playing') return;
    
    // 這裡發送答案到後端
    console.log('提交答案:', userAnswer);
    
    // 模擬玩家完成答題
    setCompletedPlayers(prev => prev + 1);
    setGameState('loading');
    
    // 模擬等待其他玩家（這裡你需要通過WebSocket監聽所有玩家完成狀態）
    setTimeout(() => {
      if (currentQuestionNumber < totalQuestions) {
        setCurrentQuestionNumber(prev => prev + 1);
        fetchQuestion();
      } else {
        setGameState('finished');
      }
    }, 3000);
  }, [gameState, userAnswer, currentQuestionNumber, totalQuestions, fetchQuestion]);

  // 開始新遊戲
  const startGame = () => {
    setCurrentQuestionNumber(1);
    fetchQuestion();
  };

  // 格式化時間顯示
  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  // 等待畫面
  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">準備開始遊戲</h1>
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

  // 載入等待畫面
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

  // 遊戲結束畫面
  if (gameState === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-12 text-center shadow-2xl">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">🎉 遊戲結束！</h1>
          <p className="text-xl text-gray-600 mb-8">感謝參與這次的答題遊戲</p>
          <button
            onClick={() => {
              setGameState('waiting');
              setCurrentQuestionNumber(1);
            }}
            className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-teal-600 transition-all duration-200 transform hover:scale-105"
          >
            再玩一次
          </button>
        </div>
      </div>
    );
  }

  // 主要答題畫面
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-pink-600 p-4">
      <div className="max-w-4xl mx-auto">
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
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  你的答案：
                </label>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                  placeholder="請輸入你的答案..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmitAnswer();
                    }
                  }}
                />
              </div>
              
              <button
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>提交答案</span>
              </button>
              
              <div className="text-center text-sm text-gray-500">
                按 Enter 或點擊按鈕提交答案
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizGameComponent;