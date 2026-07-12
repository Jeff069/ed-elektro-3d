export default function Region() {
  return (
    <section className="region" id="region">
      <div className="section-head">
        <p className="eyebrow">Über uns</p>
        <h2 className="display-lg">Ihr Betrieb vor Ort</h2>
      </div>
      <div className="region-body glass">
        <p className="lead-small">Seit 2012 als Installationsbetrieb in der Region tätig. Wir betreuen Privatkunden, Gewerbe und Industrie — von der Einzelinstallation bis zum kompletten Gebäudekonzept.</p>
        <ul className="region-chips">
          <li>Nieder-Olm</li>
          <li>Mainz</li>
          <li>Alzey</li>
        </ul>
        <ul className="region-chips region-chips-secondary">
          <li>Privat</li>
          <li>Gewerbe</li>
          <li>Industrie</li>
        </ul>
      </div>
    </section>
  );
}
