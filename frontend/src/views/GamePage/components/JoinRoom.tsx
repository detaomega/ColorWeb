import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Gamepad2 } from "lucide-react";
import { type Room, type Player } from "@/types/gameTypes";
import { addNewPlayers } from "@/services/playerService";
// Mock types (replace with your actual types)

interface JoinRoomProps {
  player: Player;
  onRoomJoined: (room: Room) => void;
  onBack: () => void;
}

// Mock data for testing
const mockRooms: Room[] = [
  {
    id: "1",
    code: "ABC12345",
    host: { id: "host1", username: "Alice", isHost: true, isReady: false },
    players: [
      { id: "host1", username: "Alice", isHost: true },
      { id: "2", username: "Bob" },
    ],
    maxPlayers: 8,
    minPlayers: 3,
    isGameStarted: false,
    createdAt: new Date(),
  },
  {
    id: "2",
    code: "XYZ78912",
    host: { id: "host2", username: "Charlie", isHost: true, isReady: false },
    players: [{ id: "host2", username: "Charlie", isHost: true }],
    maxPlayers: 6,
    minPlayers: 2,
    isGameStarted: false,
    createdAt: new Date(),
  },
];

const JoinRoom: React.FC<JoinRoomProps> = ({
  player,
  onRoomJoined,
  onBack,
}) => {
  const [roomCode, setRoomCode] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomCode.trim()) {
      setError("請輸入房間代碼");
      return;
    }

    setIsJoining(true);
    setError("");

    // 模擬加入房間的延遲

    // 查找房間（在實際應用中，這會是 API 調用）
    const response = await addNewPlayers(roomCode, player.username);
    if (response.success == "false" && response.message == "找不到遊戲") {
      setError("找不到該房間代碼，請檢查代碼是否正確");
      setIsJoining(false);
      return;
    }

    if (
      response.success == "false" &&
      response.message == "遊戲已經開始或已結束，無法加入新玩家"
    ) {
      setError("遊戲已開始，無法加入");
      setIsJoining(false);
      return;
    }

    if (response.success == "false" && response.message == "該用戶名已被使用") {
      setError("遊戲名稱已經重複");
      setIsJoining(false);
      return;
    }

    // 加入房間
    const updatedRoom = {
      code: roomCode,
      players: [],
      hostname: "test",
      maxPlayers: 50,
      minPlayers: 2,
    };

    setIsJoining(false);
    onRoomJoined(updatedRoom);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomCode(e.target.value.toUpperCase());
    if (error) setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50  flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors h-12 px-4 text-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            返回
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Card */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            {/* Title */}
            <CardHeader className="text-center pb-6 pt-8 space-y-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  房間加入
                </Badge>
              </div>
              <CardTitle className="text-4xl font-bold">🚪 加入房間</CardTitle>
              <p className="text-xl text-muted-foreground">
                輸入房間代碼來加入遊戲
              </p>
            </CardHeader>

            {/* Form */}
            <CardContent className="px-8 pb-8 space-y-6">
              <div className="space-y-4">
                <Label
                  htmlFor="roomCode"
                  className="text-xl font-semibold flex items-center gap-2"
                >
                  <Gamepad2 className="w-5 h-5 text-primary" />
                  房間代碼
                </Label>
                <Input
                  id="roomCode"
                  type="text"
                  value={roomCode}
                  onChange={handleInputChange}
                  placeholder="輸入 8 位房間代碼"
                  maxLength={8}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleJoinRoom(e);
                    }
                  }}
                  className="h-16 text-2xl font-mono text-center border-2 focus:border-green-500 uppercase tracking-wider rounded-xl"
                />
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-center font-medium">
                      {error}
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleJoinRoom}
                disabled={isJoining || !roomCode.trim()}
                className={`w-full h-16 text-xl font-bold rounded-xl transition-all duration-300 ${
                  isJoining || !roomCode.trim()
                    ? "cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transform hover:scale-105 shadow-lg hover:shadow-xl"
                }`}
              >
                {isJoining ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    加入中...
                  </div>
                ) : (
                  "🎮 加入房間"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Demo Codes */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                測試房間代碼
              </CardTitle>
              <p className="text-muted-foreground text-lg">
                你可以使用以下代碼進行測試
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {mockRooms.map((room) => (
                <Card
                  key={room.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-primary/30"
                  onClick={() => setRoomCode(room.code)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="font-mono text-lg px-3 py-1"
                          >
                            {room.code}
                          </Badge>
                          <Badge variant="secondary" className="text-sm">
                            {room.players.length}/{room.maxPlayers} 人
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          房主:{" "}
                          <span className="font-semibold">
                            {room.host?.username ?? ""}
                          </span>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoomCode(room.code);
                        }}
                      >
                        選擇
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-blue-50/50 border-blue-200/50">
            <CardContent className="p-6">
              <p className="text-muted-foreground text-lg">
                💡 房間代碼由房主提供，通常為 8 位大寫字母和數字組合
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
