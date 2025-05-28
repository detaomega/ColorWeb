import React, { useState, useEffect } from "react";
import { ArrowLeft, Copy, Check, Users, Crown, Clock } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            離開房間
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Room Code Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">遊戲大廳</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">房間代碼</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-50 rounded-md px-4 py-3 font-mono text-lg font-semibold text-gray-900 border">
                    {localRoom.code}
                  </div>
                  <button
                    onClick={copyRoomCode}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        已複製
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        複製
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">分享此代碼給朋友讓他們加入</p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-sm text-gray-500">房主</p>
                  <p className="font-medium text-gray-900">{localRoom.host.nickname}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">玩家數量</p>
                  <p className="font-medium text-gray-900">
                    {localRoom.players.length}/{localRoom.maxPlayers}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">最少開始人數</p>
                  <p className="font-medium text-gray-900">{localRoom.minPlayers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Players Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                玩家列表 ({localRoom.players.length})
              </h3>
            </div>

            <div className="space-y-3">
              {localRoom.players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-md border-2 transition-colors ${
                    player.isReady || player.isHost
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                      {player.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{player.nickname}</span>
                        {player.isHost && (
                          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                            <Crown className="w-3 h-3" />
                            房主
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {player.isHost ? (
                      <span className="text-sm font-medium text-yellow-700">主持人</span>
                    ) : (
                      <span
                        className={`flex items-center gap-1 text-sm font-medium ${
                          player.isReady ? 'text-green-700' : 'text-gray-500'
                        }`}
                      >
                        {player.isReady ? (
                          <>
                            <Check className="w-4 h-4" />
                            準備完成
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4" />
                            等待中
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {!currentPlayer.isHost && (
              <button
                onClick={toggleReady}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  currentPlayerInRoom?.isReady
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {currentPlayerInRoom?.isReady ? '取消準備' : '準備完成'}
              </button>
            )}

            {currentPlayer.isHost && (
              <div className="space-y-4">
                <button
                  onClick={handleStartGame}
                  disabled={!canStartGame()}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    canStartGame()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  開始遊戲
                </button>

                {!canStartGame() && (
                  <div className="text-center">
                    {localRoom.players.length < localRoom.minPlayers ? (
                      <p className="text-sm text-red-600">
                        需要至少 {localRoom.minPlayers} 名玩家才能開始
                      </p>
                    ) : (
                      <p className="text-sm text-amber-600">
                        等待所有玩家準備完成
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;