import type { GameCreate } from "@/types/gameTypes";
import type { GameInfo } from "@/types/gameTypes";
export const createGame = async (newGame: GameCreate) => {
  const response = await fetch(`/api/games`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newGame),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "房間註冊失敗");
  }

  const data = await response.json();
  return data;
};

export const getGameInfo = async (gameID: string): Promise<GameInfo> => {
  const response = await fetch(`/api/games/${gameID}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "無法取得遊戲資訊");
  }

  const data: GameInfo = await response.json();
  return data;
};
