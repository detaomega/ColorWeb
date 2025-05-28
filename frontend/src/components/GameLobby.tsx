import React, { useState, useEffect } from "react";
import type { Player, Room } from "../types/gameTypes";

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
    <div className="game-lobby">
      <div className="header">
        <button className="back-button" onClick={onBack}>
          ← 離開房間
        </button>
        <h2>🏠 遊戲大廳</h2>
      </div>

      <div className="room-info">
        <div className="room-code-section">
          <h3>房間代碼</h3>
          <div className="room-code-display">
            <span className="room-code">{localRoom.code}</span>
            <button
              className="copy-button"
              onClick={copyRoomCode}
              title="複製房間代碼"
            >
              {copySuccess ? "✓ 已複製" : "📋 複製"}
            </button>
          </div>
          <p className="room-code-hint">分享此代碼給朋友讓他們加入</p>
        </div>

        <div className="room-stats">
          <p>
            <strong>房主：</strong> {localRoom.host.nickname}
          </p>
          <p>
            <strong>玩家數量：</strong> {localRoom.players.length}/
            {localRoom.maxPlayers}
          </p>
          <p>
            <strong>最少開始人數：</strong> {localRoom.minPlayers}
          </p>
        </div>
      </div>

      <div className="players-section">
        <h3>玩家列表</h3>
        <div className="players-list">
          {localRoom.players.map((player) => (
            <div
              key={player.id}
              className={`player-card ${player.isReady ? "ready" : "not-ready"} ${player.isHost ? "host" : ""}`}
            >
              <div className="player-info">
                <span className="player-name">{player.nickname}</span>
                {player.isHost && <span className="host-badge">房主</span>}
              </div>
              <div className="player-status">
                {player.isHost ? (
                  <span className="status-host">主持人</span>
                ) : (
                  <span
                    className={`status ${player.isReady ? "ready" : "waiting"}`}
                  >
                    {player.isReady ? "✓ 準備完成" : "⏳ 等待中"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="action-section">
        {!currentPlayer.isHost && (
          <button
            className={`ready-button ${currentPlayerInRoom?.isReady ? "ready" : "not-ready"}`}
            onClick={toggleReady}
          >
            {currentPlayerInRoom?.isReady ? "取消準備" : "準備完成"}
          </button>
        )}

        {currentPlayer.isHost && (
          <div className="host-actions">
            <button
              className="start-game-button"
              onClick={handleStartGame}
              disabled={!canStartGame()}
            >
              開始遊戲
            </button>

            {!canStartGame() && (
              <div className="start-requirements">
                {localRoom.players.length < localRoom.minPlayers && (
                  <p>需要至少 {localRoom.minPlayers} 名玩家才能開始</p>
                )}
                {localRoom.players.length >= localRoom.minPlayers && (
                  <p>等待所有玩家準備完成</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameLobby;
