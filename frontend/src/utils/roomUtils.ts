/**
 * 生成隨機房間代碼
 * @param length 代碼長度，默認為6
 * @returns 房間代碼
 */
export const generateRoomCode = (length: number = 6): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
};

/**
 * 驗證房間代碼格式
 * @param code 房間代碼
 * @returns 是否有效
 */
export const validateRoomCode = (code: string): boolean => {
  const codeRegex = /^[A-Z0-9]{6}$/;
  return codeRegex.test(code);
};

/**
 * 格式化房間代碼顯示
 * @param code 房間代碼
 * @returns 格式化後的代碼
 */
export const formatRoomCode = (code: string): string => {
  return code
    .toUpperCase()
    .replace(/(.{3})/g, "$1 ")
    .trim();
};

/**
 * 檢查玩家是否可以加入房間
 * @param room 房間信息
 * @param playerId 玩家ID
 * @returns 是否可以加入及原因
 */
export const canPlayerJoinRoom = (
  room: any,
  playerId: string,
): { canJoin: boolean; reason?: string } => {
  if (room.isGameStarted) {
    return { canJoin: false, reason: "遊戲已開始" };
  }

  if (room.players.length >= room.maxPlayers) {
    return { canJoin: false, reason: "房間已滿" };
  }

  if (room.players.some((p: any) => p.id === playerId)) {
    return { canJoin: false, reason: "已在房間中" };
  }

  return { canJoin: true };
};
