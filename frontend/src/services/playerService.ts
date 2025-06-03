export const addNewPlayers = async (GameId: string, Username: string) => {
  const response = await fetch(`/api/games/${GameId}/players`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: Username }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    return errorData;
  }
  const data = await response.json();
  return data;
};

export const getAllPlayers = async (GameId: string) => {
  const response = await fetch(`/api/games/${GameId}/players`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "讀取失敗");
  }
};
