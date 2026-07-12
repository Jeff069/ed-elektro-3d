import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function CountUp({ target, suffix = "", isYear = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const format = (v) => (isYear ? String(v) : v.toLocaleString("de-DE")) + suffix;

    if (reducedMotion) {
      el.textContent = format(target);
      return;
    }

    const counter = { v: isYear ? target : 0 };
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          v: target,
          duration: 1.4,
          ease: "power1.out",
          onUpdate: () => { el.textContent = format(Math.round(counter.v)); },
        });
      },
    });
    return () => trigger.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <span className="zahl-value" ref={ref}>0</span>;
}

export default function Zahlen() {
  return (
    <section className="zahlen" id="zahlen">
      <div className="zahl glass">
        <CountUp target={2012} isYear />
        <span className="zahl-label">Gegründet</span>
      </div>
      <div className="zahl glass">
        <CountUp target={3000} suffix="+" />
        <span className="zahl-label">Abgeschlossene Projekte</span>
      </div>
      <div className="zahl glass">
        <CountUp target={6} />
        <span className="zahl-label">Tage die Woche erreichbar</span>
      </div>
    </section>
  );
}
