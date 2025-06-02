
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, Check, Users, Crown, Clock } from 'lucide-react';
// Mock types (replace with your actual types)
interface Player {
  id: string;
  nickname: string;
  isHost?: boolean;
  isReady?: boolean;
}

interface Room {
  id: string;
  code: string;
  host: Player;
  players: Player[];
  maxPlayers: number;
  minPlayers: number;
  isGameStarted: boolean;
  createdAt: Date;
}

interface GameLobbyProps {
  room: Room;
  currentPlayer: Player;
  onStartGame: () => void;
  onBack: () => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({
  room,
  currentPlayer,
  onStartGame,
  onBack,
}) => {
  const [localRoom, setLocalRoom] = useState<Room>(room);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // 更新本地玩家的準備狀態
  const toggleReady = () => {
    const updatedPlayers = localRoom.players.map((player) =>
      player.id === currentPlayer.id
        ? { ...player, isReady: !player.isReady }
        : player,
    );

    setLocalRoom({ ...localRoom, players: updatedPlayers });
  };

  // 複製房間代碼
  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(localRoom.code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("複製失敗:", err);
    }
  };

  // 檢查是否可以開始遊戲
  const canStartGame = () => {
    if (!currentPlayer.isHost) return false;
    if (localRoom.players.length < localRoom.minPlayers) return false;

    const readyPlayers = localRoom.players.filter(
      (player) => player.isReady || player.isHost,
    );
    return readyPlayers.length === localRoom.players.length;
  };

  const handleStartGame = () => {
    if (canStartGame()) {
      onStartGame();
    }
  };

  const getCurrentPlayerInRoom = () => {
    return localRoom.players.find((p) => p.id === currentPlayer.id);
  };

  const currentPlayerInRoom = getCurrentPlayerInRoom();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-lg px-4 py-3"
          >
            <ArrowLeft className="w-5 h-5" />
            離開房間
          </Button>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Room Code Section */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl text-slate-900">遊戲大廳</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-700 mb-4">
                  房間代碼
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-slate-50 rounded-xl px-6 py-4 font-mono text-2xl font-bold text-slate-900 border-2 border-slate-200">
                    {localRoom.code}
                  </div>
                  <Button
                    onClick={copyRoomCode}
                    className="px-6 py-4 h-auto text-lg"
                    variant={copySuccess ? "secondary" : "default"}
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        已複製
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 mr-2" />
                        複製
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-slate-500 mt-3 text-base">
                  分享此代碼給朋友讓他們加入
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200">
                <div className="text-center">
                  <p className="text-slate-500 text-base mb-2">房主</p>
                  <p className="font-semibold text-slate-900 text-lg">
                    {localRoom.host.nickname}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-base mb-2">玩家數量</p>
                  <p className="font-semibold text-slate-900 text-lg">
                    {localRoom.players.length}/{localRoom.maxPlayers}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-base mb-2">最少開始人數</p>
                  <p className="font-semibold text-slate-900 text-lg">
                    {localRoom.minPlayers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players Section */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
                <Users className="w-6 h-6" />
                玩家列表 ({localRoom.players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {localRoom.players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-6 rounded-xl border-2 transition-all duration-200 ${
                      player.isReady || player.isHost
                        ? "border-slate-300 bg-slate-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-lg font-semibold text-slate-700">
                        {player.nickname.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-900 text-lg">
                            {player.nickname}
                          </span>
                          {player.isHost && (
                            <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                              <Crown className="w-4 h-4" />
                              房主
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {player.isHost ? (
                        <span className="text-base font-medium text-slate-600">
                          主持人
                        </span>
                      ) : (
                        <span
                          className={`flex items-center gap-2 text-base font-medium ${
                            player.isReady ? "text-slate-700" : "text-slate-500"
                          }`}
                        >
                          {player.isReady ? (
                            <>
                              <Check className="w-5 h-5" />
                              準備完成
                            </>
                          ) : (
                            <>
                              <Clock className="w-5 h-5" />
                              等待中
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Section */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
              {!currentPlayer.isHost && (
                <Button
                  onClick={toggleReady}
                  className={`w-full py-4 text-lg font-semibold h-auto ${
                    currentPlayerInRoom?.isReady
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      : ""
                  }`}
                  variant={currentPlayerInRoom?.isReady ? "secondary" : "default"}
                >
                  {currentPlayerInRoom?.isReady ? "取消準備" : "準備完成"}
                </Button>
              )}

              {currentPlayer.isHost && (
                <div className="space-y-6">
                  <Button
                    onClick={handleStartGame}
                    disabled={!canStartGame()}
                    className="w-full py-4 text-lg font-semibold h-auto"
                  >
                    開始遊戲
                  </Button>

                  {!canStartGame() && (
                    <div className="text-center">
                      {localRoom.players.length < localRoom.minPlayers ? (
                        <p className="text-base text-slate-600">
                          需要至少 {localRoom.minPlayers} 名玩家才能開始
                        </p>
                      ) : (
                        <p className="text-base text-slate-600">
                          等待所有玩家準備完成
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;
