import React, { useState } from "react";
import type { Player, Room } from "../types/gameTypes";
import { mockRooms } from "../utils/mockData";

interface JoinRoomProps {
  player: Player;
  onRoomJoined: (room: Room) => void;
  onBack: () => void;
}

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
    <div className="join-room">
      <div className="header">
        <button className="back-button" onClick={onBack}>
          ← 返回
        </button>
        <h2>🚪 加入房間</h2>
      </div>

      <div className="join-instructions">
        <p>輸入房主提供的房間代碼來加入遊戲</p>
      </div>

      <form onSubmit={handleJoinRoom} className="join-form">
        <div className="input-group">
          <label htmlFor="roomCode">房間代碼</label>
          <input
            id="roomCode"
            type="text"
            value={roomCode}
            onChange={handleInputChange}
            placeholder="輸入房間代碼"
            maxLength={6}
            autoFocus
            style={{ textTransform: "uppercase" }}
          />
          {error && <span className="error-message">{error}</span>}
        </div>

        <button
          type="submit"
          className="join-button"
          disabled={isJoining || !roomCode.trim()}
        >
          {isJoining ? "加入中..." : "加入房間"}
        </button>
      </form>

      <div className="demo-codes">
        <h3>測試房間代碼</h3>
        <p>你可以使用以下代碼進行測試：</p>
        <div className="demo-code-list">
          {mockRooms.map((room) => (
            <button
              key={room.id}
              className="demo-code-button"
              onClick={() => setRoomCode(room.code)}
            >
              {room.code} ({room.players.length}/{room.maxPlayers})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
