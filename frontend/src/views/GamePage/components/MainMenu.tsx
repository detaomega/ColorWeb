import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, DoorOpen, Gamepad2 } from "lucide-react";

interface MainMenuProps {
  username: string;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({
  username,
  onCreateRoom,
  onJoinRoom,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="w-full max-w-6xl mx-auto space-y-12">
        {/* 歡迎區域 */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gamepad2 className="h-12 w-12 text-primary" />
            <Badge
              variant="secondary"
              className="text-lg px-6 py-2 font-medium"
            >
              在線遊戲大廳
            </Badge>
          </div>
          <h2 className="text-5xl font-bold tracking-tight">
            歡迎回來，
            <span className="text-primary">{username}</span>！
          </h2>
          <p className="text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            選擇你想要做的動作
          </p>
        </div>

        {/* 主要選項卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/30 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="mx-auto mb-6 p-4 rounded-full bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                <Home className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold">🏠 創建房間</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-8 pb-8">
              <p className="text-muted-foreground text-center leading-relaxed text-lg">
                建立一個新的遊戲房間，邀請朋友一起玩
              </p>
              <Button
                className="w-full h-14 text-xl font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                onClick={onCreateRoom}
                size="lg"
              >
                創建房間
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-secondary/30 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="mx-auto mb-6 p-4 rounded-full bg-secondary/20 w-fit group-hover:bg-secondary/30 transition-colors">
                <DoorOpen className="h-12 w-12 text-secondary-foreground" />
              </div>
              <CardTitle className="text-3xl font-bold">🚪 加入房間</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-8 pb-8">
              <p className="text-muted-foreground text-center leading-relaxed text-lg">
                使用房間代碼加入朋友的遊戲房間
              </p>
              <Button
                variant="outline"
                className="w-full h-14 text-xl font-semibold rounded-xl border-2 hover:bg-secondary/10 transition-all duration-200 hover:scale-105"
                onClick={onJoinRoom}
                size="lg"
              >
                加入房間
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 遊戲資訊 */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <div className="h-px bg-border flex-1 max-w-32"></div>
            <span className="text-lg px-6 font-medium">遊戲小提示</span>
            <div className="h-px bg-border flex-1 max-w-32"></div>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg">
            🎯 準備好和朋友一起享受遊戲時光了嗎？
          </p>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
