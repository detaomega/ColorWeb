import React, { useState } from "react";
import { ArrowLeft, LogIn, Users } from "lucide-react";

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

interface JoinRoomProps {
  player: Player;
  onRoomJoined: (room: Room) => void;
  onBack: () => void;
}

// Mock data for testing
const mockRooms: Room[] = [
  {
    id: "1",
    code: "ABC123",
    host: { id: "host1", nickname: "Alice" },
    players: [
      { id: "host1", nickname: "Alice", isHost: true },
      { id: "2", nickname: "Bob" },
    ],
    maxPlayers: 8,
    minPlayers: 3,
    isGameStarted: false,
    createdAt: new Date(),
  },
  {
    id: "2",
    code: "XYZ789",
    host: { id: "host2", nickname: "Charlie" },
    players: [{ id: "host2", nickname: "Charlie", isHost: true }],
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
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 查找房間（在實際應用中，這會是 API 調用）
    const targetRoom = mockRooms.find(
      (room) => room.code.toLowerCase() === roomCode.toLowerCase().trim(),
    );

    if (!targetRoom) {
      setError("找不到該房間代碼，請檢查代碼是否正確");
      setIsJoining(false);
      return;
    }

    if (targetRoom.players.length >= targetRoom.maxPlayers) {
      setError("房間已滿，無法加入");
      setIsJoining(false);
      return;
    }

    if (targetRoom.isGameStarted) {
      setError("遊戲已開始，無法加入");
      setIsJoining(false);
      return;
    }

    // 檢查玩家是否已在房間中
    const isPlayerInRoom = targetRoom.players.some((p) => p.id === player.id);

    if (isPlayerInRoom) {
      setError("你已經在這個房間中了");
      setIsJoining(false);
      return;
    }

    // 加入房間
    const updatedRoom: Room = {
      ...targetRoom,
      players: [...targetRoom.players, { ...player, isReady: false }],
    };

    setIsJoining(false);
    onRoomJoined(updatedRoom);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomCode(e.target.value.toUpperCase());
    if (error) setError("");
  };

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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <LogIn className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  加入房間
                </h1>
                <p className="text-sm text-gray-500">輸入房間代碼來加入遊戲</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="roomCode"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  房間代碼
                </label>
                <input
                  id="roomCode"
                  type="text"
                  value={roomCode}
                  onChange={handleInputChange}
                  placeholder="輸入 6 位房間代碼"
                  maxLength={6}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleJoinRoom(
                        e as unknown as React.FormEvent<HTMLFormElement>,
                      );
                    }
                  }}
                  className="w-full px-4 py-3 text-lg font-mono text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase tracking-wider"
                />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={isJoining || !roomCode.trim()}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  isJoining || !roomCode.trim()
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isJoining ? "加入中..." : "加入房間"}
              </button>
            </div>
          </div>
        </div>

        {/* Demo Codes */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            測試房間代碼
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            你可以使用以下代碼進行測試
          </p>

          <div className="space-y-2">
            {mockRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setRoomCode(room.code)}
                className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div>
                  <span className="font-mono font-medium text-gray-900">
                    {room.code}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    房主: {room.host.nickname}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {room.players.length}/{room.maxPlayers}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            房間代碼由房主提供，通常為 6 位字母和數字組合
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
