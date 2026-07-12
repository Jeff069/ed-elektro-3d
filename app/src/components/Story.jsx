// STORY: Scrollytelling-Kamerafahrt durchs Haus.
// Jede .beat-Section entspricht einem Kamera-Zustand in three/choreography.js
// (CAM_PV / CAM_SMART / CAM_KLIMA). data-beat verknüpft Text und 3D-Kameraführung.
export default function Story() {
  return (
    <section className="story" id="story">
      <div className="beat beat-pv" data-beat="pv">
        <div className="beat-card glass">
          <p className="eyebrow"><span className="beat-dot" aria-hidden="true"></span>F4 / Photovoltaik</p>
          <h2>Die Sonne auf dem eigenen Dach</h2>
          <p>PV-Anlagen von der Auslegung bis zur Netzanmeldung. Eigenen Strom erzeugen, speichern und im Gebäude verteilen — die Kamera schwenkt aufs Dach, während die Module unter Last aufleuchten.</p>
        </div>
      </div>

      <div className="beat beat-smart" data-beat="smart">
        <div className="beat-card glass">
          <p className="eyebrow"><span className="beat-dot" aria-hidden="true"></span>F1 / F5 · Elektro &amp; Smart Home</p>
          <h2>Was unter Putz passiert</h2>
          <p>KNX-Bus, Zählerschrank, Datentechnik — die Wände werden durchsichtig und geben den Blick frei auf das Nervensystem des Gebäudes: jede Leitung geplant, jeder Knoten dokumentiert.</p>
        </div>
      </div>

      <div className="beat beat-klima" data-beat="klima">
        <div className="beat-card glass">
          <p className="eyebrow"><span className="beat-dot" aria-hidden="true"></span>F2 / F3 · Klima &amp; Sanitär</p>
          <h2>Konstante Temperatur, das ganze Jahr</h2>
          <p>Split-Klimaanlagen, Wärmepumpe, Warmwasser — feine Luft- und Wärmeströme ziehen ums Gebäude, während sich die Kamera auf die Technik im Außenbereich senkt.</p>
        </div>
      </div>
    </section>
  );
}
