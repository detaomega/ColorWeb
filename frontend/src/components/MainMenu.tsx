import React from "react";

interface MainMenuProps {
  nickname: string;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({
  nickname,
  onCreateRoom,
  onJoinRoom,
}) => {
  return (
    <div className="main-menu">
      <div className="welcome-back">
        <h2>歡迎回來，{nickname}！</h2>
        <p>選擇你想要做的動作</p>
      </div>

      <div className="menu-options">
        <div className="option-card">
          <div className="option-content">
            <h3>🏠 創建房間</h3>
            <p>建立一個新的遊戲房間，邀請朋友一起玩</p>
            <button
              className="option-button create-button"
              onClick={onCreateRoom}
            >
              創建房間
            </button>
          </div>
        </div>

        <div className="option-card">
          <div className="option-content">
            <h3>🚪 加入房間</h3>
            <p>使用房間代碼加入朋友的遊戲房間</p>
            <button className="option-button join-button" onClick={onJoinRoom}>
              加入房間
            </button>
          </div>
        </div>
      </div>

      <div className="game-info">
        <p>🎯 準備好和朋友一起享受遊戲時光了嗎？</p>
      </div>
    </div>
  );
};

export default MainMenu;
