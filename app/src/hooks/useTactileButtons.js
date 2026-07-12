import { useEffect } from "react";
import anime from "animejs";

// Anime.js: tactile press feedback for Pearl/Ring buttons + tel links —
// ported 1:1 from the vanilla build's global querySelectorAll pass.
export default function useTactileButtons() {
  useEffect(() => {
    const buttons = document.querySelectorAll(".btn, .cta-tel, .header-cta");
    const handlers = [];

    buttons.forEach((btn) => {
      const down = () => anime({ targets: btn, scale: 0.96, duration: 120, easing: "easeOutQuad" });
      const up = () => anime({ targets: btn, scale: 1, duration: 260, easing: "easeOutElastic(1, 0.5)" });
      btn.addEventListener("pointerdown", down);
      btn.addEventListener("pointerup", up);
      btn.addEventListener("pointerleave", up);
      handlers.push({ btn, down, up });
    });

    return () => {
      handlers.forEach(({ btn, down, up }) => {
        btn.removeEventListener("pointerdown", down);
        btn.removeEventListener("pointerup", up);
        btn.removeEventListener("pointerleave", up);
      });
    };
  }, []);
}
