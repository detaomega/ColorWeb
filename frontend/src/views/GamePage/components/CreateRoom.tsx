import React, { useState } from "react";
import { ArrowLeft, Users, Crown } from "lucide-react";
import type { Player, Room } from "../../../types/gameTypes";
import { generateRoomCode } from "../../../utils/roomUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createGame } from "@/services/gameService";

// import { createRoom } from "../api/CreateRoomApi";

interface CreateRoomProps {
  player: Player;
  onRoomCreated: (room: Room) => void;
  onBack: () => void;
}

const CreateRoom: React.FC<CreateRoomProps> = ({
  player,
  onRoomCreated,
  onBack,
}) => {
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [minPlayers, setMinPlayers] = useState<number>(3);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const handleCreateRoom = async () => {
    setIsCreating(true);
    const result = await createGame({
      gameTitle: "Anime Guessing Game",
      settings: {
        revealInterval: 5,
        answerTime: 20,
        maxPointsPerQuestion: 100,
        rounds: 7
      },
      hostId: player.nickname
    });
    
    
    const roomCode = result.game.gameId;
    const _id = result.game._id;
    const hostPlayer = { ...player, isHost: true };

    const newRoom: Room = {
      id: _id,
      code: roomCode,
      host: hostPlayer,
      players: [hostPlayer],
      maxPlayers,
      minPlayers,
      isGameStarted: false,
      createdAt: new Date(),
    };

    setIsCreating(false);
    onRoomCreated(newRoom);
  };

  const isValidConfiguration = minPlayers <= maxPlayers && minPlayers >= 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors h-12 px-4 text-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            返回
          </Button>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          {/* Title */}
          <CardHeader className="text-center pb-6 pt-8 space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                房間設定
              </Badge>
            </div>
            <CardTitle className="text-4xl font-bold">🏠 創建房間</CardTitle>
            <div className="flex items-center justify-center gap-2 text-xl text-muted-foreground">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span>
                房主：
                <span className="font-semibold text-primary">
                  {player.nickname}
                </span>
              </span>
            </div>
          </CardHeader>

          {/* Settings */}
          <CardContent className="px-8 pb-8 space-y-8">
            {/* Max Players */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <label className="text-xl font-semibold text-foreground">
                  最大玩家數量
                </label>
              </div>
              <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
                {[4, 6, 8, 12, 16, 20, 30, 50].map((num) => (
                  <Button
                    key={num}
                    variant={maxPlayers === num ? "default" : "outline"}
                    onClick={() => setMaxPlayers(num)}
                    className={`h-12 text-lg font-semibold transition-all duration-200 ${
                      maxPlayers === num
                        ? "bg-primary hover:bg-primary/90 scale-105 shadow-lg"
                        : "hover:scale-105 hover:shadow-md"
                    }`}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>

            {/* Min Players */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-secondary-foreground" />
                <label className="text-xl font-semibold text-foreground">
                  最少開始人數
                </label>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {[2, 3, 4, 5, 6].map((num) => (
                  <Button
                    key={num}
                    variant={minPlayers === num ? "default" : "outline"}
                    onClick={() => setMinPlayers(num)}
                    disabled={num > maxPlayers}
                    className={`h-12 text-lg font-semibold transition-all duration-200 ${
                      minPlayers === num
                        ? "bg-primary hover:bg-primary/90 scale-105 shadow-lg"
                        : num > maxPlayers
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:scale-105 hover:shadow-md"
                    }`}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <Card className="bg-gradient-to-r from-gray-200 to-gray-50 border-2 border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-center">
                  房間預覽
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {maxPlayers}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      最大人數
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-secondary-foreground">
                      {minPlayers}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      開始人數
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Message */}
            {!isValidConfiguration && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-center font-medium">
                  ⚠️ 最少開始人數不能大於最大玩家數量
                </p>
              </div>
            )}

            {/* Create Button */}
            <Button
              onClick={handleCreateRoom}
              disabled={isCreating || !isValidConfiguration}
              className={`w-full h-16 text-xl font-bold rounded-xl transition-all duration-300 ${
                isCreating || !isValidConfiguration
                  ? "cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-gray-600 to-gray-600 hover:from-gray-700 hover:to-gray-700 transform hover:scale-105 shadow-lg hover:shadow-xl"
              }`}
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  創建中...
                </div>
              ) : (
                "創建房間"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateRoom;
