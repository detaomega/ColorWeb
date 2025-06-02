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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-2xl mx-auto p-12 border rounded-3xl shadow-2xl bg-white space-y-10">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">🎮 歡迎來到遊戲</h1>
          <p className="text-lg text-muted-foreground">
            請輸入你的暱稱開始遊戲
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid w-full items-center gap-3">
            <Label htmlFor="nickname" className="text-lg font-medium">
              暱稱
            </Label>
            <Input
              id="nickname"
              type="text"
              value={nickname}
              onChange={handleInputChange}
              placeholder="輸入你的暱稱"
              maxLength={20}
              autoFocus
              className="h-12 text-lg px-4 rounded-xl border-2 transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(e);
                }
              }}
            />
            {error && (
              <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">
                {error}
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full h-12 text-lg font-semibold rounded-x transition-all duration-200 transform hover:scale-105"
          >
            開始遊戲
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NicknameInput;
