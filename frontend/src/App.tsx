import { Routes, Route } from "react-router-dom";
import GamePage from "@/views/GameScreen";
// import GameLobby from "@/views/GamePage/components/GameLobby";
const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<GamePage />} />
      {/* <Route path="/lobby" element={<GameLobby />} /> */}
      {/* More route... */}
    </Routes>
  );
};

export default App;
