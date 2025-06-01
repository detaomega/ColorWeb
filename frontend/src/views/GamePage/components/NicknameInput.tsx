import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <div className="max-w-md mx-auto mt-12 p-6 border rounded-xl shadow-md bg-white space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">🎮 歡迎來到遊戲</h1>
        <p className="text-muted-foreground">請輸入你的暱稱開始遊戲</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid w-full items-center gap-2">
          <Label htmlFor="nickname">暱稱</Label>
          <Input
            id="nickname"
            type="text"
            value={nickname}
            onChange={handleInputChange}
            placeholder="輸入你的暱稱"
            maxLength={20}
            autoFocus
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <Button type="submit" className="w-full">
          開始遊戲
        </Button>
      </form>
    </div>
  );
};

export default NicknameInput;
