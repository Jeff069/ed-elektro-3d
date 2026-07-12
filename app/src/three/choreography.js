// Scroll-driven camera choreography — ported 1:1 from the vanilla build.
// Pure state (not React state) so useFrame can read it every frame without
// triggering re-renders; GSAP ScrollTrigger mutates it, Scene.jsx's useFrame
// lerps the real camera/house toward it.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const baseY = 1.1;

// ============================================================================
// CAMERA STATES — tweak these coordinates to adjust the scroll choreography.
// pos = camera position [x, y, z], look = look-at target [x, y, z].
// houseX is passed in so framing stays correct at every screen width.
// ============================================================================

export function CAM_HERO() {
  // Hero: calm establishing shot, house rotates gently, camera never moves.
  // Position is fixed (not houseX-relative) so the house — offset further
  // right on wide screens — sits clear of the text column on the left.
  return { pos: [6.4, 3.2, 11.5], look: [1.6, baseY, 0] };
}

export function CAM_PV(houseX) {
  // Beat 1 — Photovoltaik: swoop up and in toward the roof, looking down at the panels.
  return { pos: [houseX + 3.0, 5.4, 4.6], look: [houseX + 0.4, 2.6, -0.8] };
}

export function CAM_SMART(houseX) {
  // Beat 2 — Smart Home/Elektro: pull back onto the opposite side, house yaws ~45°
  // (see ROTATION STATES below), walls go x-ray to reveal the KNX bus.
  return { pos: [houseX - 3.6, 2.1, 5.6], look: [houseX - 0.3, 1.2, 0.2] };
}

export function CAM_KLIMA(houseX) {
  // Beat 3 — Klima/Sanitär: low angle, focused on the outdoor unit at (2.5, 0.35, 0.9).
  return { pos: [houseX + 6.8, 1.7, 5.2], look: [houseX + 1.8, 0.5, 0.9] };
}

// ---------- ROTATION STATES ----------
// Extra house rotation/tilt per beat, layered on top of the idle spin.

export const ROT_HERO = { y: 0, z: 0 };
export const ROT_PV = { y: 0.3, z: 0 };
export const ROT_SMART = { y: Math.PI / 4, z: 0 }; // "dreht das Haus um 45 Grad"
export const ROT_KLIMA = { y: Math.PI / 4, z: 0.06 }; // "Das Haus neigt sich leicht"

export function lerp3(target, a, b, t) {
  target[0] = a[0] + (b[0] - a[0]) * t;
  target[1] = a[1] + (b[1] - a[1]) * t;
  target[2] = a[2] + (b[2] - a[2]) * t;
}

export function triangle(p) {
  return Math.max(0, 1 - Math.abs(p * 2 - 1));
}

// Creates the mutable scene state object read every frame by Scene.jsx's useFrame.
export function createSceneState() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = CAM_HERO();
  return {
    reducedMotion,
    houseX: 0,
    idleAngle: reducedMotion ? 0 : -0.35,
    camTarget: { pos: [...hero.pos], look: [...hero.look] },
    rotTarget: { ...ROT_HERO },
    fx: { pv: 0, smart: 0, klima: 0 },
    beatTriggers: {},
  };
}

// Sets up all ScrollTriggers. Call once on mount (after DOM is present);
// call the returned cleanup on unmount.
export function setupChoreography(state, canvasWrapperEl) {
  const triggers = [];

  if (!state.reducedMotion) {
    triggers.push(
      ScrollTrigger.create({
        trigger: "#story",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate(self) {
          const p = self.progress; // 0 → 1 across all three beats
          const seg = 1 / 3;
          const houseX = state.houseX;
          let a, b, t, ra, rb;

          if (p < seg) {
            a = CAM_HERO(); b = CAM_PV(houseX); t = p / seg;
            ra = ROT_HERO; rb = ROT_PV;
          } else if (p < seg * 2) {
            a = CAM_PV(houseX); b = CAM_SMART(houseX); t = (p - seg) / seg;
            ra = ROT_PV; rb = ROT_SMART;
          } else {
            a = CAM_SMART(houseX); b = CAM_KLIMA(houseX); t = (p - seg * 2) / seg;
            ra = ROT_SMART; rb = ROT_KLIMA;
          }

          lerp3(state.camTarget.pos, a.pos, b.pos, t);
          lerp3(state.camTarget.look, a.look, b.look, t);
          state.rotTarget.y = ra.y + (rb.y - ra.y) * t;
          state.rotTarget.z = ra.z + (rb.z - ra.z) * t;
        },
        onLeaveBack() {
          const hero = CAM_HERO();
          state.camTarget.pos = [...hero.pos];
          state.camTarget.look = [...hero.look];
          state.rotTarget.y = ROT_HERO.y;
          state.rotTarget.z = ROT_HERO.z;
        },
      })
    );
  }

  // Exit: house fades out once the story ends and #leistungen begins — keeps
  // the 3D model from lingering behind the UI grid below.
  const exitTrigger = document.querySelector("#leistungen");
  if (exitTrigger && !state.reducedMotion) {
    triggers.push(
      ScrollTrigger.create({
        trigger: exitTrigger,
        start: "top 75%",
        onEnter: () => {
          canvasWrapperEl?.classList.add("scene-exit");
          gsap.to(state.camTarget.pos, {
            0: state.houseX + 14, 1: 9, 2: 20, duration: 1.2, ease: "power2.inOut",
          });
        },
        onLeaveBack: () => {
          canvasWrapperEl?.classList.remove("scene-exit");
          const k = CAM_KLIMA(state.houseX);
          gsap.to(state.camTarget.pos, {
            0: k.pos[0], 1: k.pos[1], 2: k.pos[2], duration: 1, ease: "power2.inOut",
          });
        },
      })
    );
  }

  // FX STATES per beat: each beat's local "focus" is a 0→1→0 triangle as it
  // passes through the viewport, so the effect peaks while its text card is
  // centered and fades on either side.
  ["pv", "smart", "klima"].forEach((name) => {
    const el = document.querySelector(`[data-beat="${name}"]`);
    if (!el) return;
    state.beatTriggers[name] = ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top" });
  });

  // Content reveals for glass cards below the story
  if (!state.reducedMotion) {
    gsap.utils.toArray(".leistung-flip, .zahl, .ablauf-steps li, .region-body, .beat-card").forEach((el) => {
      triggers.push(
        gsap.from(el, {
          opacity: 0,
          y: 28,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        }).scrollTrigger
      );
    });
  }

  return function cleanup() {
    triggers.forEach((t) => t && t.kill());
    Object.values(state.beatTriggers).forEach((t) => t && t.kill());
  };
}
