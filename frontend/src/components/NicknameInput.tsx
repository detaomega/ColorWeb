import React, { useState } from "react";

interface NicknameInputProps {
  onSubmit: (nickname: string) => void;
}

const NicknameInput: React.FC<NicknameInputProps> = ({ onSubmit }) => {
  const [nickname, setNickname] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      setError("請輸入暱稱");
      return;
    }

    if (nickname.trim().length < 2) {
      setError("暱稱至少需要2個字元");
      return;
    }

    if (nickname.trim().length > 20) {
      setError("暱稱不能超過20個字元");
      return;
    }

    setError("");
    onSubmit(nickname.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
    if (error) setError("");
  };

  return (
    <div className="nickname-input">
      <div className="welcome-section">
        <h1>🎮 歡迎來到遊戲</h1>
        <p>請輸入你的暱稱開始遊戲</p>
      </div>

      <form onSubmit={handleSubmit} className="nickname-form">
        <div className="input-group">
          <label htmlFor="nickname">暱稱</label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={handleInputChange}
            placeholder="輸入你的暱稱"
            maxLength={20}
            autoFocus
          />
          {error && <span className="error-message">{error}</span>}
        </div>

        <button type="submit" className="submit-button">
          開始遊戲
        </button>
      </form>
    </div>
  );
};

export default NicknameInput;
