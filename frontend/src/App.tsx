import { Routes, Route } from "react-router-dom";
import GamePage from "@/views/GamePage/GameSystem";
import GameScreen from "@/views/GameScreen/GameScreen";
const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<GamePage />} />
      <Route path="/game" element={<GameScreen />} />
      {/* More route... */}
    </Routes>
  );
};

export default App;
