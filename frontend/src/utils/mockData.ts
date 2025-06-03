import type { Room, Player } from "../types/gameTypes";

// 模擬玩家數據
const mockPlayers: Player[] = [
  {
    id: "player1",
    username: "小明",
    isReady: true,
    isHost: true,
  },
  {
    id: "player2",
    username: "小美",
    isReady: false,
    isHost: false,
  },
  {
    id: "player3",
    username: "小華",
    isReady: true,
    isHost: false,
  },
];

// 模擬房間數據
export const mockRooms: Room[] = [
  {
    id: "room1",
    code: "ABC123",
    host: mockPlayers[0],
    players: [mockPlayers[0], mockPlayers[1]],
    maxPlayers: 4,
    minPlayers: 2,
    isGameStarted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5分鐘前創建
  },
  {
    id: "room2",
    code: "XYZ789",
    host: mockPlayers[2],
    players: [mockPlayers[2]],
    maxPlayers: 6,
    minPlayers: 3,
    isGameStarted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10分鐘前創建
  },
  {
    id: "room3",
    code: "DEMO01",
    host: mockPlayers[0],
    players: mockPlayers,
    maxPlayers: 4,
    minPlayers: 1,
    isGameStarted: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15分鐘前創建
  },
];

/**
 * 根據房間代碼查找房間
 * @param code 房間代碼
 * @returns 房間信息或null
 */
export const findRoomByCode = (code: string): Room | null => {
  return (
    mockRooms.find((room) => room.code.toLowerCase() === code.toLowerCase()) ||
    null
  );
};

/**
 * 獲取所有可用房間
 * @returns 可用房間列表
 */
export const getAvailableRooms = (): Room[] => {
  return mockRooms.filter(
    (room) => !room.isGameStarted && room.players.length < room.maxPlayers,
  );
};

/**
 * 生成隨機玩家
 * @param username 暱稱
 * @returns 玩家對象
 */
export const createMockPlayer = (username: string): Player => {
  return {
    id: Math.random().toString(36).substr(2, 9),
    username,
    isReady: false,
    isHost: false,
  };
};
