import React, { useState } from "react";
import UsernameInput from "./components/UsernameInput";
import MainMenu from "./components/MainMenu";
import CreateRoom from "./components/CreateRoom";
import JoinRoom from "./components/JoinRoom";
import GameLobby from "./components/GameLobby";
import type { GameState, Player, Room } from "../../types/gameTypes";

const GamePage: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>("username");
  const [username, setusername] = useState<string>("");
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  const handleusernameSubmit = (inputusername: string) => {
    setusername(inputusername);
    setCurrentPlayer({
      id: Math.random().toString(36).substr(2, 9),
      username: inputusername,
      isReady: false,
      isHost: false,
    });
    setGameState("menu");
  };

  const handleCreateRoom = () => {
    setGameState("createRoom");
  };

  const handleJoinRoom = () => {
    setGameState("joinRoom");
  };

  const handleRoomCreated = (room: Room) => {
    setCurrentRoom(room);
    if (currentPlayer) {
      const updatedPlayer = { ...currentPlayer, isHost: true };
      setCurrentPlayer(updatedPlayer);
    }
    setGameState("lobby");
  };

  const handleRoomJoined = (room: Room) => {
    setCurrentRoom(room);
    setGameState("lobby");
  };

  const handleStartGame = () => {
    setGameState("game");
  };

  const handleBackToMenu = () => {
    setCurrentRoom(null);
    if (currentPlayer) {
      setCurrentPlayer({ ...currentPlayer, isHost: false, isReady: false });
    }
    setGameState("menu");
  };

  const renderCurrentScreen = () => {
    switch (gameState) {
      case "username":
        return <UsernameInput onSubmit={handleusernameSubmit} />;

      case "menu":
        return (
          <MainMenu
            username={username}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        );

      case "createRoom":
        return (
          <CreateRoom
            player={currentPlayer!}
            onRoomCreated={handleRoomCreated}
            onBack={handleBackToMenu}
          />
        );

      case "joinRoom":
        return (
          <JoinRoom
            player={currentPlayer!}
            onRoomJoined={handleRoomJoined}
            onBack={handleBackToMenu}
          />
        );

      case "lobby":
        return (
          <GameLobby
            room={currentRoom!}
            currentPlayer={currentPlayer!}
            onStartGame={handleStartGame}
            onBack={handleBackToMenu}
          />
        );

      default:
        return <div>載入中...</div>;
    }
  };

  return <div>{renderCurrentScreen()}</div>;
};

export default GamePage;
