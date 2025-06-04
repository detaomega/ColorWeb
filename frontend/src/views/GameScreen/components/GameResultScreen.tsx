import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trophy } from 'lucide-react';
import { getRankings } from "@/services/playerService";

interface AnswerRevealScreenProps {
  gameId: string | null;
  score: number;
}


const GameResultScreen : React.FC<AnswerRevealScreenProps> = ({ gameId, score }) => {
  // 模擬數據
  const currentScore = score;
  const [rankings, setRankings] = useState<{ rank: number; username: string; score: number }[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        if (gameId) {
          const data = await getRankings(gameId);
          setRankings(data);
        }
      } catch (error) {
        console.error("獲取排名失敗:", error);
        setApiError("無法獲取排名，請稍後再試");
      }
    };

    fetchRankings();
  }, []);
  const handleBackToHome = () => {
    console.log('回到主頁');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-8">
      <Card className="w-full max-w-5xl shadow-2xl border-0 bg-white">
        <CardHeader className="text-center space-y-6 py-12">
          <div className="mx-auto w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center shadow-lg">
            <Trophy className="w-16 h-16 text-white" />
          </div>
          <CardTitle className="text-5xl font-bold text-slate-800">
            🏆 遊戲結果
          </CardTitle>
          <p className="text-2xl text-slate-600">
            你的總分數:{" "}
            <Badge variant="secondary" className="text-xl px-4 py-2 bg-slate-100 text-slate-800">
              {currentScore} 分
            </Badge>
          </p>
        </CardHeader>
        
        <CardContent className="space-y-10 px-12 pb-12">
          {apiError && (
            <Alert variant="destructive">
              <AlertDescription className="text-lg">{apiError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-center text-slate-800">排行榜</h3>
            <div className="space-y-4">
              {rankings.map((player, index) => (
                <Card
                  key={player.username}
                  className={`${
                    index === 0
                      ? "bg-slate-800 text-white border-slate-700 shadow-lg"
                      : index === 1
                        ? "bg-slate-200 border-slate-300 shadow-md"
                        : index === 2
                          ? "bg-slate-100 border-slate-200 shadow-md"
                          : "bg-white border-slate-200 shadow-sm"
                  } transition-all duration-200 hover:shadow-lg`}
                >
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <Badge
                          variant="outline"
                          className={`text-2xl font-bold px-6 py-3 ${
                            index === 0
                              ? "bg-white text-slate-800 border-white"
                              : index === 1
                                ? "bg-slate-800 text-white border-slate-800"
                                : index === 2
                                  ? "bg-slate-600 text-white border-slate-600"
                                  : "bg-slate-400 text-white border-slate-400"
                          }`}
                        >
                          #{player.rank}
                        </Badge>
                        <span className={`text-2xl font-semibold ${
                          index === 0 ? "text-white" : "text-slate-800"
                        }`}>
                          {player.username}
                        </span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xl px-6 py-3 ${
                          index === 0 
                            ? "bg-white/20 text-white border-white/30" 
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {player.score} 分
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="text-center pt-8">
            <Button
              onClick={handleBackToHome}
              className="h-16 px-12 text-xl font-semibold bg-slate-800 hover:bg-slate-700 shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              回到主頁
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GameResultScreen;