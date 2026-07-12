import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";

// HashRouter: GitHub Pages serves static files with no server-side rewrite,
// so /#/impressum avoids needing a 404.html SPA-fallback trick.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
      </Routes>
    </HashRouter>
  );
}
