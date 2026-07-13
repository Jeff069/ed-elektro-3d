// Fixed full-viewport background: crossfades between 4 cinematic stills as the
// reader scrolls through #story (hero -> pv -> smart -> klima), matching the
// same asymmetric breakpoints the old Three.js camera choreography used (each
// beat's text card centers near the middle of its own third of scroll range).
// Replaces the R3F <Scene /> — same wrapper class/exit-fade contract in CSS.
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const base = import.meta.env.BASE_URL;
const BEATS = [
  { key: "hero", src: `${base}images/hero.jpg` },
  { key: "pv", src: `${base}images/pv.jpg` },
  { key: "smart", src: `${base}images/smart.jpg` },
  { key: "klima", src: `${base}images/klima.jpg` },
];

export default function ImageBackdrop() {
  const wrapperRef = useRef(null);
  const imgRefs = useRef({});

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const triggers = [];

    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => wrapper.classList.add("ready"));
    });

    const set = (key, v) => {
      const el = imgRefs.current[key];
      if (el) el.style.opacity = v;
    };

    if (!reducedMotion) {
      triggers.push(
        ScrollTrigger.create({
          trigger: "#story",
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate(self) {
            const p = self.progress;
            if (p < 0.12) {
              const t = p / 0.12;
              set("hero", 1 - t); set("pv", t); set("smart", 0); set("klima", 0);
            } else if (p < 0.5) {
              const t = (p - 0.12) / 0.38;
              set("hero", 0); set("pv", 1 - t); set("smart", t); set("klima", 0);
            } else {
              const t = (p - 0.5) / 0.5;
              set("hero", 0); set("pv", 0); set("smart", 1 - t); set("klima", t);
            }
          },
          onLeaveBack() {
            set("hero", 1); set("pv", 0); set("smart", 0); set("klima", 0);
          },
        })
      );

      const exitEl = document.querySelector("#leistungen");
      if (exitEl) {
        triggers.push(
          ScrollTrigger.create({
            trigger: exitEl,
            start: "top 75%",
            onEnter: () => wrapper.classList.add("scene-exit"),
            onLeaveBack: () => wrapper.classList.remove("scene-exit"),
          })
        );
      }
    }

    return () => {
      cancelAnimationFrame(raf1);
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={wrapperRef} className="scene-layer" aria-hidden="true">
      {BEATS.map((b) => (
        <img
          key={b.key}
          ref={(el) => (imgRefs.current[b.key] = el)}
          src={b.src}
          alt=""
          className="bg-image"
          style={{ opacity: b.key === "hero" ? 1 : 0 }}
        />
      ))}
      <div className="scene-scrim" />
    </div>
  );
}
