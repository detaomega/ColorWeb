import React, { useState, useEffect } from "react";
import type { Player, Room } from "../../../types/gameTypes";

interface GameScreenProps {
  room: Room;
  currentPlayer: Player;
  onBack: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({
  room,
  currentPlayer,
  onBack,
}) => {
  const [gameTime, setGameTime] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<string>("進行中");

  useEffect(() => {
    const timer = setInterval(() => {
      setGameTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndGame = () => {
    setGameStatus("結束");
    // 這裡可以添加結束遊戲的邏輯
  };

  return (
    <div className="game-screen">
      <div className="game-header">
        <div className="game-info">
          <h2>🎮 遊戲進行中</h2>
          <div className="game-stats">
            <span className="room-code">房間: {room.code}</span>
            <span className="game-time">時間: {formatTime(gameTime)}</span>
            <span className="game-status">狀態: {gameStatus}</span>
          </div>
        </div>

        {currentPlayer.isHost && (
          <button className="end-game-button" onClick={handleEndGame}>
            結束遊戲
          </button>
        )}
      </div>

      <div className="players-in-game">
        <h3>參與玩家</h3>
        <div className="players-grid">
          {room.players.map((player) => (
            <div
              key={player.id}
              className={`game-player-card ${player.id === currentPlayer.id ? "current-player" : ""}`}
            >
              <div className="player-avatar">
                {player.nickname.charAt(0).toUpperCase()}
              </div>
              <div className="player-details">
                <span className="player-name">{player.nickname}</span>
                {player.isHost && <span className="host-indicator">👑</span>}
                {player.id === currentPlayer.id && (
                  <span className="you-indicator">(你)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="game-content">
        <div className="game-area">
          <h3>遊戲區域</h3>
          <div className="game-placeholder">
            <p>🎯 這裡是你的遊戲內容區域</p>
            <p>你可以在這裡實現你的遊戲邏輯</p>
            <div className="demo-actions">
              <button className="game-action-button">動作 1</button>
              <button className="game-action-button">動作 2</button>
              <button className="game-action-button">動作 3</button>
            </div>
          </div>
        </div>

        <div className="game-sidebar">
          <div className="score-board">
            <h4>計分板</h4>
            <div className="scores">
              {room.players.map((player, index) => (
                <div key={player.id} className="score-item">
                  <span>{player.nickname}</span>
                  <span>{Math.floor(Math.random() * 1000)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="game-log">
            <h4>遊戲紀錄</h4>
            <div className="log-entries">
              <div className="log-entry">遊戲開始！</div>
              <div className="log-entry">
                {currentPlayer.nickname} 加入了遊戲
              </div>
              <div className="log-entry">所有玩家準備完成</div>
            </div>
          </div>
        </div>
      </div>

      <div className="game-controls">
        <button className="back-to-lobby-button" onClick={onBack}>
          返回大廳
        </button>
      </div>
    </div>
  );
};

export default GameScreen;
