import { createRoot } from "react-dom/client";
import "./style.css";
import App from "./App.jsx";

// No StrictMode: the scene owns imperative Three.js/GSAP side effects
// (WebGL context, ScrollTrigger instances) that must not double-mount.
createRoot(document.getElementById("root")).render(<App />);
