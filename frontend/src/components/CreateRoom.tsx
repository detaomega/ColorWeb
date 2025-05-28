import React, { useState } from "react";
import type { Player, Room } from "../types/gameTypes";
import { generateRoomCode } from "../utils/roomUtils";
import { createRoom } from "../api/CreateRoomApi";

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
  const [maxPlayers, setMaxPlayers] = useState<number>(50);
  const [minPlayers, setMinPlayers] = useState<number>(2);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const handleCreateRoom = async () => {
    setIsCreating(true);

    // 模擬創建房間的延遲
    await new Promise((resolve) => setTimeout(resolve, 1000));

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

  return (
    <div className="create-room">
      <div className="header">
        <button className="back-button" onClick={onBack}>
          ← 返回
        </button>
        <h2>🏠 創建房間</h2>
      </div>

      <div className="room-settings">
        <div className="setting-group">
          <label htmlFor="maxPlayers">最大玩家數量</label>
          <select
            id="maxPlayers"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
          >
            {Array.from({ length: 49 }, (_, i) => i + 2).map((num) => (
              <option key={num} value={num}>
                {num} 人
              </option>
            ))}
          </select>
        </div>

        <div className="setting-group">
          <label htmlFor="minPlayers">最少開始人數</label>
          <select
            id="minPlayers"
            value={minPlayers}
            onChange={(e) => setMinPlayers(Number(e.target.value))}
          >
            {Array.from({ length: 49 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num} 人
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="room-preview">
        <h3>房間設定預覽</h3>
        <div className="preview-info">
          <p>
            <strong>房主：</strong> {player.nickname}
          </p>
          <p>
            <strong>最大人數：</strong> {maxPlayers} 人
          </p>
          <p>
            <strong>最少開始人數：</strong> {minPlayers} 人
          </p>
        </div>
      </div>

      <button
        className="create-room-button"
        onClick={handleCreateRoom}
        disabled={isCreating || minPlayers > maxPlayers}
      >
        {isCreating ? "創建中..." : "創建房間"}
      </button>

      {minPlayers > maxPlayers && (
        <p className="error-message">最少開始人數不能大於最大玩家數量</p>
      )}
    </div>
  );
};

export default CreateRoom;
