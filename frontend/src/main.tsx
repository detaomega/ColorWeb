import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import GameSystem from "./GameSystem.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GameSystem />
  </StrictMode>,
);
