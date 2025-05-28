import React, { useState } from "react";
import { ArrowLeft, Users, Settings } from "lucide-react";

// Mock types (replace with your actual types)
interface Player {
  id: string;
  nickname: string;
  isHost?: boolean;
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

interface CreateRoomProps {
  player: Player;
  onRoomCreated: (room: Room) => void;
  onBack: () => void;
}

// Mock utility function
const generateRoomCode = () => {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
};

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
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const roomCode = generateRoomCode();
    const hostPlayer = { ...player, isHost: true };

    const newRoom: Room = {
      id: Math.random().toString(36).substr(2, 9),
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Title */}
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-xl font-semibold text-gray-900">創建房間</h1>
            <p className="text-sm text-gray-500 mt-1">房主：{player.nickname}</p>
          </div>

          {/* Settings */}
          <div className="p-6 space-y-6">
            {/* Max Players */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                最大玩家數量
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[4, 6, 8, 12, 16, 20, 30, 50].map((num) => (
                  <button
                    key={num}
                    onClick={() => setMaxPlayers(num)}
                    className={`py-2 px-3 text-sm rounded-md border transition-colors ${
                      maxPlayers === num
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Min Players */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                最少開始人數
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setMinPlayers(num)}
                    disabled={num > maxPlayers}
                    className={`py-2 px-3 text-sm rounded-md border transition-colors ${
                      minPlayers === num
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : num > maxPlayers
                        ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-md p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">最大人數</span>
                <span className="font-medium">{maxPlayers} 人</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">開始人數</span>
                <span className="font-medium">{minPlayers} 人</span>
              </div>
            </div>

            {/* Error Message */}
            {!isValidConfiguration && (
              <p className="text-sm text-red-600">
                最少開始人數不能大於最大玩家數量
              </p>
            )}

            {/* Create Button */}
            <button
              onClick={handleCreateRoom}
              disabled={isCreating || !isValidConfiguration}
              className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                isCreating || !isValidConfiguration
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isCreating ? '創建中...' : '創建房間'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;