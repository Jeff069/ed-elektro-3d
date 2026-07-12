import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="wordmark" href="#top">ED ELEKTRO<span>und Klimasysteme</span></a>
        <nav className="site-nav" aria-label="Hauptnavigation">
          <a href="#leistungen">Leistungen</a>
          <a href="#ablauf">Ablauf</a>
          <a href="#region">Über uns</a>
          <a href="#kontakt">Kontakt</a>
        </nav>
        <a className="header-cta" href="tel:067326007358">06732 600 7358</a>
      </div>
    </header>
  );
}

export function LegalHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" to="/">ED ELEKTRO<span>und Klimasysteme</span></Link>
        <a className="header-cta" href="tel:067326007358">06732 600 7358</a>
      </div>
    </header>
  );
}
