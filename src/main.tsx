import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAutoSync } from "./lib/sync";

document.documentElement.classList.add("dark");
initAutoSync();

createRoot(document.getElementById("root")!).render(<App />);
