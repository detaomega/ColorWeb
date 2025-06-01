import { Routes, Route } from "react-router-dom";
import GamePage from "@/views/GamePage/GameSystem";
const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<GamePage />} />
      {/* More route... */}
    </Routes>
  );
};

export default App;
