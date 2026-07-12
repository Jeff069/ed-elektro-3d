import { useEffect, useRef } from "react";
import anime from "animejs";

const ITEMS = [
  {
    plan: "F1", title: "Elektro & Netzwerk",
    front: "Stromkreis-Planung, Zählerschrank-Installation, FI-Schalter-Nachrüstung, Datentechnik und E-Mobilität.",
    specs: ["Zählerschränke & Unterverteilungen", "Netzwerk- & Datentechnik", "Wallboxen & E-Mobilität"],
  },
  {
    plan: "F2", title: "Klima",
    front: "Split- und Multi-Split-Klimaanlagen für Wohn- und Gewerbeflächen — geplant, montiert und regelmäßig gewartet.",
    specs: ["Split- & Multi-Split-Anlagen", "Klimatisierung von Gewerbeflächen", "Wartung & Service"],
  },
  {
    plan: "F3", title: "Sanitär & Heizung",
    front: "Badmodernisierung, Warmwasserbereitung und Heizungstechnik — ein Ansprechpartner für das ganze Gebäude.",
    specs: ["Badmodernisierung", "Warmwasserbereitung", "Heizungstechnik"],
  },
  {
    plan: "F4", title: "Photovoltaik",
    front: "PV-Anlagen von der Auslegung bis zur Netzanmeldung. Eigenen Strom erzeugen, speichern und verteilen.",
    specs: ["Planung & Installation", "Speicherlösungen", "Eigenverbrauchs-Optimierung"],
  },
  {
    plan: "F5", title: "Smart Home & KNX",
    front: "KNX-Verkabelung und Smart-Home-Elektroinstallation: Licht, Klima, Beschattung und Energie.",
    specs: ["KNX-Busplanung & -Verkabelung", "Licht- & Beschattungssteuerung", "Energie-Visualisierung"],
  },
];

function FlipCard({ item }) {
  const flipRef = useRef(null);

  // Touch devices don't have hover — tap toggles the flip state with a spring bounce.
  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none)").matches;
    if (!isTouch) return;
    const el = flipRef.current;
    const onClick = () => {
      el.classList.toggle("flipped");
      anime({
        targets: el.querySelector(".leistung-card"),
        scale: [1, 1.03, 1],
        duration: 500,
        easing: "easeOutElastic(1, 0.6)",
      });
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="leistung-flip" data-plan={item.plan} tabIndex={0} ref={flipRef}>
      <div className="leistung-card">
        <div className="leistung-front glass">
          <div className="leistung-marker" aria-hidden="true"><span>{item.plan}</span></div>
          <h3>{item.title}</h3>
          <p>{item.front}</p>
          <span className="leistung-hint">Details ▸</span>
        </div>
        <div className="leistung-back glass">
          <h4>{item.plan} / Leistungsdetails</h4>
          <ul className="spec-list">
            {item.specs.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Leistungen() {
  return (
    <section className="leistungen" id="leistungen">
      <div className="section-head">
        <p className="eyebrow">Was wir liefern</p>
        <h2 className="display-lg">Leistungen</h2>
      </div>
      <div className="leistungen-list">
        {ITEMS.map((item) => <FlipCard key={item.plan} item={item} />)}
      </div>
    </section>
  );
}
