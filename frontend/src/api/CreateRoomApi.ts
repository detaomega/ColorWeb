// api/room.ts
import axios from "axios";

const BASE_URL = "http://localhost:8000"; // 換成你的 FastAPI 實際網址

export const createRoom = async ({
  hostPlayer,
  maxPlayers,
  minPlayers,
}: {
  hostPlayer: any;
  maxPlayers: number;
  minPlayers: number;
}) => {
  try {
    const response = await axios.post(`${BASE_URL}/rooms`, {
      hostPlayer,
      maxPlayers,
      minPlayers,
    });
    return response.data; // 預期回傳 room 資訊
  } catch (error) {
    console.error("創建房間失敗", error);
    throw error;
  }
};
