import { useState, useEffect, useCallback } from "react";
import { Send, Loader2, Timer, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AnswerRevealScreen from "@/views/GameScreen/components/WaitingScreen";
import CountdownScreen from "@/views/GameScreen/components/CountDownScreen";
import { useLocation } from "react-router-dom";
import GameResultScreen from "@/views/GameScreen/components/GameResultScreen";
import { updateScore } from "@/services/gameService"


type Question = {
  id: string;
  images: string[];
  answer: string;
  original: string;
};

type PlayerRanking = {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
};

type AnswerResult = {
  correct: boolean;
  score: number;
  totalScore: number;
  message?: string;
};

type PlayerState = "waiting" | "playing" | "loading" | "finished" | "rankings";

const QuizGameComponent = () => {
  // ##############全域遊戲基本資料##############
  const location = useLocation();
  const gameId = location.state?.gameId;
  const username = location.state?.username;
  console.log(gameId);
  const [totalQuestions] = useState(3);
  const [setCompletedPlayers] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // ##############玩家個人遊戲基本資料##############
  const [gameState, setGameState] = useState<PlayerState>("waiting");
  const [timeLeft, setTimeLeft] = useState(6 * 7);
  const [userAnswer, setUserAnswer] = useState("");
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [currentScore, setCurrentScore] = useState(0);
  const [setRankings] = useState<PlayerRanking[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setAnswerFeedback] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [setApiError] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  // ##############後端API基礎##############
  const apiCall = async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API調用失敗:", error);
      throw error;
    }
  };

  // ##############遊戲過程區塊##############
  const fetchQuestion = (idx: number) => {
    console.log("currentQuestion", idx)
    if (idx == 1) {
      const mockQuestion: Question = {
        id: `question-${currentQuestionNumber}`,
        images: [
          "/api/data/dataset_resized/Chainsaw%20Man/Chainsaw%20Man_1/1.jpg",
          "/api/data/dataset_resized/Chainsaw%20Man/Chainsaw%20Man_1/2.jpg",
          "/api/data/dataset_resized/Chainsaw%20Man/Chainsaw%20Man_1/3.jpg",
          "/api/data/dataset_resized/Chainsaw%20Man/Chainsaw%20Man_1/4.jpg",
          "/api/data/dataset_resized/Chainsaw%20Man/Chainsaw%20Man_1/5.jpg",
          "/api/data/dataset_resized/Chainsaw%20Man/Chainsaw%20Man_1/6.jpg",
          "/api/data/dataset_resized/Chainsaw%20Man/Chainsaw%20Man_1/7.jpg"
        ],
        original: "/api/data/dataset_resized/Chainsaw%20Man/Chainsaw%20Man_1/original.jpg",
        answer: "鍊鋸人",
      };
      setCurrentQuestion(mockQuestion);
    }
    else if (idx == 2) {
      const mockQuestion: Question = {
        id: `question-${currentQuestionNumber}`,
        images: [
          "/api/data/dataset_resized/ship/1.jpg",
          "/api/data/dataset_resized/ship/2.jpg",
          "/api/data/dataset_resized/ship/3.jpg",
          "/api/data/dataset_resized/ship/4.jpg",
          "/api/data/dataset_resized/ship/5.jpg",
          "/api/data/dataset_resized/ship/6.jpg",
          "/api/data/dataset_resized/ship/7.jpg"
        ],
        original: "/api/data/dataset_resized/ship/original.jpg",
        answer: "海賊王",
      };
      setCurrentQuestion(mockQuestion);
    } 
    else{
      const mockQuestion: Question = {
        id: `question-${currentQuestionNumber}`,
        images: [
          "/api/data/dataset_resized/Charlotte/Charlotte_1/1.jpg",
          "/api/data/dataset_resized/Charlotte/Charlotte_1/2.jpg",
          "/api/data/dataset_resized/Charlotte/Charlotte_1/3.jpg",
          "/api/data/dataset_resized/Charlotte/Charlotte_1/4.jpg",
          "/api/data/dataset_resized/Charlotte/Charlotte_1/5.jpg",
          "/api/data/dataset_resized/Charlotte/Charlotte_1/6.jpg",
          "/api/data/dataset_resized/Charlotte/Charlotte_1/7.jpg",
        ],
        original: "/api/data/dataset_resized/Charlotte/Charlotte_1/original.jpg",
        answer: "夏洛特",
      };
      setCurrentQuestion(mockQuestion);
    }

    setCurrentImageIndex(0);
    setTimeLeft(42);
    setUserAnswer("");
    setWrongAttempts(0);
    setIsAnswerCorrect(false);
    setGameState("playing");
  
  };

  const startNextQuestion = async () => {
    if (currentQuestionNumber < totalQuestions) {
      console.log("add", currentQuestionNumber)
      setCurrentQuestionNumber((prev) => prev + 1);
      fetchQuestion(currentQuestionNumber + 1);
    } else {
      await fetchRankings();
      setGameState("rankings");
    }
  };

  // 圖片切換（每7秒換一張）
  useEffect(() => {
    if (gameState !== "playing" || !currentQuestion) return;
    
    const imageTimer = setInterval(() => {
      setCurrentImageIndex(
        (prev) => (prev + 1) % currentQuestion.images.length,
      );
    }, 7000);

    return () => clearInterval(imageTimer);
  }, [gameState, currentQuestion]);

  // 倒數計時
  useEffect(() => {
    if (gameState !== "playing" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      console.log("test", timeLeft)
      if (timeLeft == 1) {
        handleTimeUp();
      }
      clearInterval(timer);
    }
  }, [gameState, timeLeft, isAnswerCorrect]);

  const handleTimeUp = useCallback(() => {
    if (gameState !== "playing") return;

    console.log("時間到！");
    setGameState("loading");

    setTimeout(async () => {
      if (currentQuestionNumber < totalQuestions) {
        console.log("Hi")
        startNextQuestion();
      } else {
        await fetchRankings();
        setGameState("rankings");
      }
    }, 2500);
  }, [gameState, currentQuestionNumber, totalQuestions]);

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  const handleSubmitAnswer = useCallback(async () => {
    if (
      gameState !== "playing" ||
      isSubmitting ||
      isAnswerCorrect ||
      !userAnswer.trim()
    )
      return;

    setIsSubmitting(true);
    console.log("提交答案:", userAnswer);

    try {
      const result = submitAnswerAndGetScore(userAnswer);
      console.log("答題結果:", result);

      setCurrentScore(result.totalScore);

      if (result.correct) {
        setIsAnswerCorrect(true);
        await updateScore(gameId, username, result.score);
        // setGameState("loading");

        // setTimeout(async () => {
        //   if (currentQuestionNumber < totalQuestions) {
        //     await startNextQuestion();
        //   } else {
        //     await fetchRankings();
        //     setGameState("rankings");
        //   }
        // }, 3000);
      } else {
        setWrongAttempts((prev) => prev + 1);
        setUserAnswer("");
      }
    } catch (error) {
      console.error("提交答案過程出錯:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    gameState,
    userAnswer,
    currentQuestionNumber,
    totalQuestions,
    isSubmitting,
    isAnswerCorrect,
    wrongAttempts,
  ]);

  const submitAnswerAndGetScore = (answer: string) => {
    const isCorrect = (answer == currentQuestion?.answer);
    const score = isCorrect ? Math.ceil(200 * timeLeft / 42) : 0;
    return {
      correct: isCorrect,
      score: score,
      totalScore: currentScore + score,
      message: isCorrect ? "答對了！" : "答案錯誤，請再試一次",
    } as AnswerResult;
  };

  const startGame = () => {
    setCurrentQuestionNumber(1);
    setCurrentScore(0);
    setWrongAttempts(0);
    setIsAnswerCorrect(false);
    fetchQuestion(1);
  };

  const fetchRankings = async () => {
    try {
      setApiError(null);
      const rankingsData = await apiCall(`/games/${gameId}/rankings`);
      setRankings(rankingsData);
    } catch (error) {
      console.error("獲取排名失敗:", error);
    }
  };

  // 等待畫面
  if (gameState === "waiting") {
    return <CountdownScreen startGame={startGame} />;
  }

  // 載入等待畫面
  if (gameState === "loading") {
    return <AnswerRevealScreen url={currentQuestion?.original ?? null} answer={currentQuestion?.answer ?? null} />;
  }

  // 排名畫面
  if (gameState === "rankings") {
    return <GameResultScreen gameId={gameId} score={currentScore}/>;
  }

  // 遊戲結束 畫面
  if (gameState === "finished") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-12 text-center space-y-8">
            <h1 className="text-5xl font-bold text-gray-800">🎉 遊戲結束！</h1>
            <p className="text-xl text-muted-foreground">
              感謝參與這次的答題遊戲
            </p>
            <Button
              onClick={async () => {
                await fetchRankings();
                setGameState("rankings");
              }}
              className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 shadow-lg"
            >
              查看排名
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 主要答題畫面 - 重新設計佈局
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-6xl mx-auto space-y-8">
        {/* API錯誤提示 */}
        {/* {apiError && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{apiError}</AlertDescription>
          </Alert>
        )} */}

        {/* 頂部狀態欄 */}
        <Card className="shadow-lg border border-slate-200 bg-white">
          <CardContent className="p-8">
            <div className="flex flex-wrap justify-between items-center gap-6 mb-6">
              <div className="flex flex-wrap items-center gap-8">
                <div className="flex items-center space-x-3 text-slate-700">
                  <div className="p-3 bg-slate-100 rounded-full">
                    <Timer className="w-6 h-6 text-slate-600" />
                  </div>
                  <span className="font-bold text-2xl">
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-slate-700">
                  <div className="p-3 bg-slate-100 rounded-full">
                    <Star className="w-6 h-6 text-slate-600" />
                  </div>
                  <span className="font-semibold text-lg">
                    分數：{currentScore}
                  </span>
                </div>
                {wrongAttempts > 0 && (
                  <Badge variant="destructive" className="px-4 py-2 text-sm">
                    錯誤次數：{wrongAttempts}
                  </Badge>
                )}
              </div>
              <Badge
                variant="outline"
                className="text-xl px-6 py-3 font-semibold border-slate-300"
              >
                第 {currentQuestionNumber} 題 / {totalQuestions} 題
              </Badge>
            </div>

            {/* 進度條 */}
            <Progress
              value={((42 - timeLeft) / 42) * 100}
              className="h-4 bg-slate-200"
            />
          </CardContent>
        </Card>

        {/* 主要遊戲區域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 提示圖片區 */}
          <Card className="shadow-lg border border-slate-200 bg-white">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl font-bold text-slate-800">
                提示圖片
              </CardTitle>
              <p className="text-slate-500 text-lg">
                圖片 {currentImageIndex + 1}/7
              </p>
            </CardHeader>
            <CardContent className="p-8">
              {currentQuestion && (
                <div className="space-y-6">
                  <div className="relative">
                    <img
                      src={currentQuestion.images[currentImageIndex]}
                      alt={`提示圖片 ${currentImageIndex + 1}`}
                      className="w-full h-80 object-cover rounded-xl shadow-md transition-all duration-500"
                    />
                    <Badge
                      variant="secondary"
                      className="absolute top-4 right-4 bg-black/70 text-white border-0 text-sm px-3 py-1"
                    >
                      {currentImageIndex + 1}/7
                    </Badge>
                  </div>

                  {/* 圖片指示器 */}
                  <div className="flex justify-center space-x-4">
                    {currentQuestion?.images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentImageIndex
                            ? "bg-slate-600 scale-150"
                            : "bg-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 答題區 */}
          <Card className="shadow-lg border border-slate-200 bg-white">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl font-bold text-slate-800">
                請輸入答案
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* 答題反饋訊息 */}
             、 <Alert
                  className={
                    isAnswerCorrect
                      ? "border-green-200 bg-green-50"
                      : "border-amber-200 bg-amber-50"
                  }
                >
                  <AlertDescription
                    className={`font-semibold text-base ${
                      isAnswerCorrect ? "text-green-700" : "text-amber-700"
                    }`}
                  >
                    {isAnswerCorrect ? (
                      <>
                        🎉 恭喜答對！本題得分：{currentScore} 分
                      </>
                    ) : (
                      <>
                        💡 提示：一部動漫，{currentQuestion && `共 ${currentQuestion.answer.length} 字`}
                      </>
                    )}
                  </AlertDescription>
                </Alert>
          、
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-xl font-medium text-slate-700 block">
                    你的答案：
                  </label>
                  <Input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={isSubmitting || isAnswerCorrect}
                    className="h-16 text-xl border-2 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg"
                    placeholder={
                      isAnswerCorrect
                        ? "已答對，等待下一題..."
                        : "請輸入你的答案..."
                    }
                    onKeyPress={(e) => {
                      if (
                        e.key === "Enter" &&
                        !isSubmitting &&
                        !isAnswerCorrect
                      ) {
                        handleSubmitAnswer();
                      }
                    }}
                  />
                </div>

                <Button
                  onClick={handleSubmitAnswer}
                  disabled={
                    !userAnswer.trim() || isSubmitting || isAnswerCorrect
                  }
                  className="w-full h-16 text-xl font-semibold bg-slate-800 hover:bg-slate-700 text-white shadow-lg rounded-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin mr-3" />
                      提交中...
                    </>
                  ) : isAnswerCorrect ? (
                    "已答對！"
                  ) : (
                    <>
                      <Send className="w-6 h-6 mr-3" />
                      提交答案
                      {wrongAttempts > 0
                        ? ` (第${wrongAttempts + 1}次嘗試)`
                        : ""}
                    </>
                  )}
                </Button>

                <div className="text-center text-slate-500 text-lg">
                  {isAnswerCorrect
                    ? "恭喜答對！等待其他玩家完成..."
                    : "按 Enter 或點擊按鈕提交答案"}
                </div>

                {wrongAttempts > 0 && !isAnswerCorrect && (
                  <div className="text-center">
                    <Badge
                      variant="destructive"
                      className="px-4 py-2 text-base"
                    >
                      已嘗試 {wrongAttempts} 次，繼續努力！
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuizGameComponent;

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
