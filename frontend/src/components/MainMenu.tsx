import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, DoorOpen, Gamepad2 } from "lucide-react";

interface MainMenuProps {
  nickname: string;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({
  nickname,
  onCreateRoom,
  onJoinRoom,
}) => {
  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-8 px-4">
      {/* 歡迎區域 */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gamepad2 className="h-8 w-8 text-primary" />
          <Badge variant="secondary" className="text-sm px-3 py-1">
            在線遊戲大廳
          </Badge>
        </div>
        <h2 className="text-4xl font-bold tracking-tight">
          歡迎回來，
          <span className="text-primary">{nickname}</span>！
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          選擇你想要做的動作
        </p>
      </div>

      {/* 主要選項卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
              <Home className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">🏠 創建房間</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center leading-relaxed">
              建立一個新的遊戲房間，邀請朋友一起玩
            </p>
            <Button 
              className="w-full h-12 text-lg font-semibold" 
              onClick={onCreateRoom}
              size="lg"
            >
              創建房間
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-3 rounded-full bg-secondary/50 w-fit group-hover:bg-secondary/70 transition-colors">
              <DoorOpen className="h-8 w-8 text-secondary-foreground" />
            </div>
            <CardTitle className="text-2xl">🚪 加入房間</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center leading-relaxed">
              使用房間代碼加入朋友的遊戲房間
            </p>
            <Button 
              variant="outline" 
              className="w-full h-12 text-lg font-semibold hover:bg-secondary/20" 
              onClick={onJoinRoom}
              size="lg"
            >
              加入房間
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 遊戲資訊 */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <div className="h-px bg-border flex-1 max-w-24"></div>
          <span className="text-sm px-4">遊戲小提示</span>
          <div className="h-px bg-border flex-1 max-w-24"></div>
        </div>
        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
          🎯 準備好和朋友一起享受遊戲時光了嗎？
        </p>
      </div>
    </div>
  );
};

export default MainMenu;