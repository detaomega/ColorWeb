import { useState, useEffect, useCallback } from "react";
import { Users, Send, Loader2, Trophy, Timer, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import WaitingScreenUI from "@/views/GameScreen/components/WaitingScreen"
type Question = {
  id: string;
  images: string[];
  answer: string;
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
  const [gameId] = useState("game-123");
  const [totalPlayers] = useState(4);
  const [totalQuestions] = useState(5);
  const [completedPlayers, setCompletedPlayers] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // ##############玩家個人遊戲基本資料##############
  const [gameState, setGameState] = useState<PlayerState>("waiting");
  const [timeLeft, setTimeLeft] = useState(35);
  const [userAnswer, setUserAnswer] = useState("");
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [currentScore, setCurrentScore] = useState(0);
  const [rankings, setRankings] = useState<PlayerRanking[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
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
      setApiError(error instanceof Error ? error.message : "未知錯誤");
      throw error;
    }
  };

  // ##############遊戲過程區塊##############
  const fetchQuestion = useCallback(async () => {
    try {
      setApiError(null);
      const questionData = await apiCall(`/games/${gameId}/question`);

      setCurrentQuestion(questionData);
      setCurrentImageIndex(0);
      setTimeLeft(35);
      setUserAnswer("");
      setCompletedPlayers(0);
      setWrongAttempts(0);
      setAnswerFeedback(null);
      setIsAnswerCorrect(false);
      setGameState("playing");
    } catch (error) {
      console.warn("使用模擬數據，因為API調用失敗:", error);
      const mockQuestion: Question = {
        id: `question-${currentQuestionNumber}`,
        images: [
          "https://picsum.photos/600/400?random=1",
          "https://picsum.photos/600/400?random=2", 
          "https://picsum.photos/600/400?random=3",
          "https://picsum.photos/600/400?random=4",
          "https://picsum.photos/600/400?random=5",
        ],
        answer: "Example",
      };

      setCurrentQuestion(mockQuestion);
      setCurrentImageIndex(0);
      setTimeLeft(35);
      setUserAnswer("");
      setCompletedPlayers(0);
      setWrongAttempts(0);
      setAnswerFeedback(null);
      setIsAnswerCorrect(false);
      setGameState("playing");
    }
  }, [gameId, currentQuestionNumber]);

  const startNextQuestion = async () => {
    try {
      setApiError(null);
      await apiCall(`/games/${gameId}/question/next`, {
        method: "POST",
      });

      setCurrentQuestionNumber((prev) => prev + 1);
      await fetchQuestion();
    } catch (error) {
      console.error("Api failed:", error);
      if (currentQuestionNumber < totalQuestions) {
        setCurrentQuestionNumber((prev) => prev + 1);
        await fetchQuestion();
      } else {
        await fetchRankings();
        setGameState("rankings");
      }
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
    if (gameState !== "playing" || timeLeft <= 0 || isAnswerCorrect) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft, isAnswerCorrect]);

  const handleTimeUp = useCallback(async () => {
    if (gameState !== "playing") return;

    console.log("時間到！");
    setAnswerFeedback("時間到！進入下一題");
    setGameState("loading");

    setTimeout(async () => {
      if (currentQuestionNumber < totalQuestions) {
        await startNextQuestion();
      } else {
        await fetchRankings();
        setGameState("rankings");
      }
    }, 2000);
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
      const result = await submitAnswerAndGetScore(userAnswer);
      console.log("答題結果:", result);

      setCurrentScore(result.totalScore);

      if (result.correct) {
        setIsAnswerCorrect(true);
        setAnswerFeedback(result.message || "恭喜答對！");
        setCompletedPlayers((prev) => prev + 1);
        setGameState("loading");

        setTimeout(async () => {
          if (currentQuestionNumber < totalQuestions) {
            await startNextQuestion();
          } else {
            await fetchRankings();
            setGameState("rankings");
          }
        }, 3000);
      } else {
        setWrongAttempts((prev) => prev + 1);
        setAnswerFeedback(
          result.message || `答案錯誤！這是第 ${wrongAttempts + 1} 次錯誤嘗試`,
        );
        setUserAnswer("");
      }
    } catch (error) {
      console.error("提交答案過程出錯:", error);
      setAnswerFeedback("提交答案時發生錯誤，請重試");
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

  const submitAnswerAndGetScore = async (answer: string) => {
    try {
      setApiError(null);
      const result = await apiCall(`/games/${gameId}/question/answer`, {
        method: "POST",
        body: JSON.stringify({ answer }),
      });

      return {
        correct: result.correct || false,
        score: result.score || 0,
        totalScore: result.totalScore || result.score || 0,
        message: result.message,
      } as AnswerResult;
    } catch (error) {
      console.error("提交答案失敗:", error);
      const isCorrect = answer.toLowerCase().includes("範例");
      const score = isCorrect ? Math.floor(Math.random() * 100) + 50 : 0;
      return {
        correct: isCorrect,
        score: score,
        totalScore: currentScore + score,
        message: isCorrect ? "答對了！" : "答案錯誤，請再試一次",
      } as AnswerResult;
    }
  };

  const startGame = () => {
    setCurrentQuestionNumber(1);
    setCurrentScore(0);
    setWrongAttempts(0);
    setAnswerFeedback(null);
    setIsAnswerCorrect(false);
    setApiError(null);
    fetchQuestion();
  };

  const fetchRankings = async () => {
    try {
      setApiError(null);
      const rankingsData = await apiCall(`/games/${gameId}/rankings`);
      setRankings(rankingsData);
    } catch (error) {
      console.error("獲取排名失敗:", error);
      const mockRankings: PlayerRanking[] = [
        { playerId: "1", playerName: "玩家1", score: currentScore, rank: 1 },
        { playerId: "2", playerName: "玩家2", score: 0, rank: 2 },
        { playerId: "3", playerName: "玩家3", score: 0, rank: 3 },
        { playerId: "4", playerName: "玩家4", score: 0, rank: 4 },
      ];
      setRankings(mockRankings);
    }
  };

  // 等待畫面
  if (gameState === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              準備開始遊戲
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {apiError && (
              <Alert variant="destructive" className="border-red-200">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}
            <div className="text-center space-y-2 text-muted-foreground">
              <p>遊戲ID: <Badge variant="secondary">{gameId}</Badge></p>
              <p>當前分數: <Badge variant="outline">{currentScore}</Badge></p>
            </div>
            <Button 
              onClick={startGame} 
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg"
            >
              開始遊戲
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 載入等待畫面
  if (gameState === "loading") {
    return (
      <WaitingScreenUI />
      );
  }

  // 排名畫面
  if (gameState === "rankings") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 flex items-center justify-center p-6">
        <Card className="w-full max-w-4xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              🏆 遊戲結果
            </CardTitle>
            <p className="text-xl text-muted-foreground">
              你的總分數: <Badge variant="secondary" className="text-lg px-3 py-1">{currentScore} 分</Badge>
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {apiError && (
              <Alert variant="destructive">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-center">排行榜</h3>
              {rankings.map((player, index) => (
                <Card 
                  key={player.playerId}
                  className={`${
                    index === 0
                      ? "bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-400 border-2"
                      : index === 1
                      ? "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-400 border-2"
                      : index === 2
                      ? "bg-gradient-to-r from-orange-100 to-orange-200 border-orange-400 border-2"
                      : "bg-gray-50"
                  } shadow-md`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Badge 
                          variant="outline" 
                          className={`text-2xl font-bold px-4 py-2 ${
                            index === 0
                              ? "bg-yellow-500 text-white border-yellow-600"
                              : index === 1
                              ? "bg-gray-500 text-white border-gray-600"
                              : index === 2
                              ? "bg-orange-500 text-white border-orange-600"
                              : "bg-gray-400 text-white border-gray-500"
                          }`}
                        >
                          #{player.rank}
                        </Badge>
                        <span className="text-xl font-semibold">{player.playerName}</span>
                      </div>
                      <Badge variant="secondary" className="text-lg px-4 py-2">
                        {player.score} 分
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={() => {
                  setGameState("waiting");
                  setCurrentQuestionNumber(1);
                  setCurrentScore(0);
                  setWrongAttempts(0);
                  setAnswerFeedback(null);
                  setIsAnswerCorrect(false);
                  setRankings([]);
                }}
                className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg"
              >
                再玩一次
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 遊戲結束 畫面
  if (gameState === "finished") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-12 text-center space-y-8">
            <h1 className="text-5xl font-bold text-gray-800">🎉 遊戲結束！</h1>
            <p className="text-xl text-muted-foreground">感謝參與這次的答題遊戲</p>
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
                  <span className="font-bold text-2xl">{formatTime(timeLeft)}</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-700">
                  <div className="p-3 bg-slate-100 rounded-full">
                    <Users className="w-6 h-6 text-slate-600" />
                  </div>
                  <span className="font-semibold text-lg">完成：{completedPlayers}/{totalPlayers}</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-700">
                  <div className="p-3 bg-slate-100 rounded-full">
                    <Star className="w-6 h-6 text-slate-600" />
                  </div>
                  <span className="font-semibold text-lg">分數：{currentScore}</span>
                </div>
                {wrongAttempts > 0 && (
                  <Badge variant="destructive" className="px-4 py-2 text-sm">
                    錯誤次數：{wrongAttempts}
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className="text-xl px-6 py-3 font-semibold border-slate-300">
                第 {currentQuestionNumber} 題 / {totalQuestions} 題
              </Badge>
            </div>

            {/* 進度條 */}
            <Progress value={((35 - timeLeft) / 35) * 100} className="h-4 bg-slate-200" />
          </CardContent>
        </Card>

        {/* 主要遊戲區域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 提示圖片區 */}
          <Card className="shadow-lg border border-slate-200 bg-white">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl font-bold text-slate-800">提示圖片</CardTitle>
              <p className="text-slate-500 text-lg">圖片 {currentImageIndex + 1}/5</p>
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
                      {currentImageIndex + 1}/5
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
              <CardTitle className="text-3xl font-bold text-slate-800">請輸入答案</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* 答題反饋訊息 */}
              {answerFeedback && (
                <Alert className={isAnswerCorrect ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
                  <AlertDescription className={`font-semibold text-base ${isAnswerCorrect ? "text-green-700" : "text-amber-700"}`}>
                    {isAnswerCorrect ? "✅ 正確！" : "💡 提示："} {answerFeedback}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-xl font-medium text-slate-700 block">你的答案：</label>
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
                      if (e.key === "Enter" && !isSubmitting && !isAnswerCorrect) {
                        handleSubmitAnswer();
                      }
                    }}
                  />
                </div>

                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswer.trim() || isSubmitting || isAnswerCorrect}
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
                      提交答案{wrongAttempts > 0 ? ` (第${wrongAttempts + 1}次嘗試)` : ""}
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
                    <Badge variant="destructive" className="px-4 py-2 text-base">已嘗試 {wrongAttempts} 次，繼續努力！</Badge>
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