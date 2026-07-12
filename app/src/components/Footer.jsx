import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <span>© {new Date().getFullYear()} ED Elektro und Klimasysteme</span>
      <nav aria-label="Rechtliches">
        <Link to="/impressum">Impressum</Link>
        <Link to="/datenschutz">Datenschutz</Link>
      </nav>
    </footer>
  );
}
