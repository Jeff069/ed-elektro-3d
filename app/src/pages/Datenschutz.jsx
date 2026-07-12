import { LegalHeader } from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

export default function Datenschutz() {
  return (
    <>
      <LegalHeader />
      <main>
        <section className="legal">
          <Link className="legal-back" to="/">← Zurück zur Startseite</Link>
          <p className="eyebrow">Rechtliches</p>
          <h2 className="display-lg">Datenschutz</h2>

          <p>Diese Website erhebt derzeit keine personenbezogenen Daten über Formulare, Analyse- oder Tracking-Tools. Es werden keine Cookies gesetzt.</p>

          <h3>Verantwortlicher</h3>
          <p>
            ED-Elektro GmbH &amp; Co. KG<br />
            Ober-Saulheimer Straße 5, 55286 Wörrstadt<br />
            E-Mail: <a href="mailto:info@ed-elektro.de">info@ed-elektro.de</a>
          </p>

          <h3>Kontaktaufnahme</h3>
          <p>Bei Kontaktaufnahme per Telefon oder E-Mail werden die dabei mitgeteilten Daten (z. B. Name, Kontaktdaten, Anliegen) ausschließlich zur Bearbeitung der Anfrage verarbeitet und nicht ohne Einwilligung an Dritte weitergegeben.</p>

          <div className="todo-box">
            TODO: Der vollständige Datenschutztext von ed-elektro.de/datenschutz konnte automatisiert nicht abgerufen werden. Dieser Platzhalter deckt keine rechtliche Prüfung ab — vor Veröffentlichung mit dem Original-Text bzw. anwaltlich abstimmen.
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
