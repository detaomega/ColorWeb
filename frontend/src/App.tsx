import { Routes, Route } from "react-router-dom";
import GamePage from "@/views/GameScreen";
const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<GamePage />} />
      {/* More route... */}
    </Routes>
  );
};

export default App;
