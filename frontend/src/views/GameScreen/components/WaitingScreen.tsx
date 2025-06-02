import React, { useState } from 'react';
import { Loader2, Users, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const WaitingScreenUI = () => {
  // 模擬數據
  const [completedPlayers, setCompletedPlayers] = useState(5);
  const [totalPlayers, setTotalPlayers] = useState(8);

  const completionPercentage = (completedPlayers / totalPlayers) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl shadow-xl border border-slate-300 bg-white">
        <CardContent className="p-16 text-center space-y-12">
          {/* 載入動畫圖標 */}
          <div className="mx-auto w-32 h-32 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center shadow-lg">
            <Loader2 className="w-16 h-16 text-white animate-spin" />
          </div>

          {/* 主標題和描述 */}
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-slate-800">等待其他玩家</h1>
            <p className="text-2xl text-slate-600">
              請稍候，等待所有玩家完成答題
            </p>
          </div>

          {/* 進度資訊 */}
          <div className="space-y-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-slate-100 rounded-full">
                  <Users className="w-8 h-8 text-slate-600" />
                </div>
                <span className="text-3xl font-bold text-slate-700">
                  {completedPlayers}/{totalPlayers}
                </span>
              </div>
              <Badge variant="outline" className="text-xl px-6 py-3 border-slate-300">
                {Math.round(completionPercentage)}% 完成
              </Badge>
            </div>

            {/* 進度條 */}
            <div className="space-y-4">
              <Progress 
                value={completionPercentage} 
                className="h-6 bg-slate-200" 
              />
              <p className="text-lg text-slate-500">
                還有 {totalPlayers - completedPlayers} 位玩家尚未完成
              </p>
            </div>
          </div>

          {/* 玩家狀態指示器 */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-700">玩家完成狀態</h3>
            <div className="flex justify-center space-x-4 flex-wrap gap-y-4">
              {[...Array(totalPlayers)].map((_, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full transition-all duration-700 flex items-center justify-center ${
                    index < completedPlayers
                      ? "bg-green-500 animate-pulse scale-125 shadow-lg"
                      : "bg-slate-300"
                  }`}
                >
                  {index < completedPlayers && (
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 額外資訊 */}
          <div className="pt-8 border-t border-slate-200">
            <div className="flex items-center justify-center space-x-3 text-slate-500">
              <Clock className="w-5 h-5" />
              <span className="text-lg">預計等待時間：1-2 分鐘</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaitingScreenUI;