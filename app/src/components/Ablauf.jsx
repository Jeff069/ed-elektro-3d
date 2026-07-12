export default function Ablauf() {
  return (
    <section className="ablauf" id="ablauf">
      <div className="section-head">
        <p className="eyebrow">So arbeiten wir</p>
        <h2 className="display-lg">Ablauf</h2>
      </div>
      <ol className="ablauf-steps">
        <li className="glass">
          <span className="ablauf-num">01</span>
          <h3>Beratung</h3>
          <p>Vor Ort-Termin, Bestandsaufnahme, Klärung von Bedarf und Budget.</p>
        </li>
        <li className="glass">
          <span className="ablauf-num">02</span>
          <h3>Planung</h3>
          <p>Technische Auslegung, Angebot, Abstimmung der Ausführungsdetails.</p>
        </li>
        <li className="glass">
          <span className="ablauf-num">03</span>
          <h3>Ausführung</h3>
          <p>Fachgerechte Installation, Inbetriebnahme, Dokumentation und Übergabe.</p>
        </li>
      </ol>
    </section>
  );
}
