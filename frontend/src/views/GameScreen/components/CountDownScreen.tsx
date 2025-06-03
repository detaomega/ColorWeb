import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

interface CountDownProps {
  startGame: () => void;
}

export default function CountDownScreen(props: CountDownProps) {
  const [countdown, setCountdown] = useState(5);
  const [isActive, setIsActive] = useState(true); // 直接開始倒數

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined;
    if (isActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((countdown) => countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      // 倒數結束後的動作
      props.startGame();
    }
    return () => clearInterval(interval);
  }, [isActive, countdown]);

  const resetCountdown = () => {
    setCountdown(5);
    // 重置後也自動開始倒數
  };

  const progressValue = ((5 - countdown) / 5) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-12 text-center space-y-8">
          {/* 時鐘圖標 */}
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-400 to-gray-500 rounded-full flex items-center justify-center animate-pulse">
            <Clock className="w-12 h-12 text-white" />
          </div>

          {/* 標題 */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent">
              準備開始
            </h1>
            <p className="text-xl text-muted-foreground">
              遊戲即將開始，請做好準備
            </p>
          </div>

          {/* 倒數數字 */}
          <div className="relative">
            <div
              className={`text-8xl font-bold transition-all duration-300 ${
                countdown > 0
                  ? "bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent scale-110"
                  : "text-green-500 scale-125"
              } ${isActive ? "animate-bounce" : ""}`}
            >
              {countdown > 0 ? countdown : "開始！"}
            </div>
          </div>

          {/* 進度條 */}
          <div className="space-y-2">
            <Progress
              value={progressValue}
              className="w-full h-3 bg-gray-200"
            />
            <p className="text-sm text-muted-foreground">
              {isActive ? `${countdown} 秒後開始` : "點擊開始按鈕"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
