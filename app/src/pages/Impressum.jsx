import { LegalHeader } from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

export default function Impressum() {
  return (
    <>
      <LegalHeader />
      <main>
        <section className="legal">
          <Link className="legal-back" to="/">← Zurück zur Startseite</Link>
          <p className="eyebrow">Rechtliches</p>
          <h2 className="display-lg">Impressum</h2>

          <h3>Angaben gemäß § 5 TMG</h3>
          <address>
            ED-Elektro GmbH &amp; Co. KG<br />
            Ober-Saulheimer Straße 5<br />
            55286 Wörrstadt
          </address>
          <p>Nebenstelle: Weberstraße 2–4, 55133 Mainz</p>

          <h3>Vertreten durch</h3>
          <p>
            Herr Jemmy Liebl<br />
            ED-Elektro Verwaltungs GmbH<br />
            Keppentaler Weg 15a, 55286 Wörrstadt
          </p>

          <h3>Kontakt</h3>
          <p>
            Telefon: 06732&nbsp;600&nbsp;7358<br />
            E-Mail: <a href="mailto:info@ed-elektro.de">info@ed-elektro.de</a>
          </p>

          <h3>Registereintrag</h3>
          <p>Amtsgericht Mainz, HRA 43273, HRB 47980</p>

          <h3>Umsatzsteuer-ID</h3>
          <p>USt-IdNr. gemäß §27a UStG: DE316455720</p>

          <h3>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h3>
          <p>
            ED-Elektro GmbH &amp; Co. KG, vertreten durch ED-Elektro Verwaltungs GmbH,<br />
            Keppentaler Weg 15a, 55286 Wörrstadt
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
