import { useEffect } from "react";
import Scene from "../components/Scene";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Story from "../components/Story";
import Leistungen from "../components/Leistungen";
import Zahlen from "../components/Zahlen";
import Ablauf from "../components/Ablauf";
import Region from "../components/Region";
import Kontakt from "../components/Kontakt";
import Footer from "../components/Footer";
import useTactileButtons from "../hooks/useTactileButtons";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Home() {
  useTactileButtons();

  // ScrollTrigger caches DOM measurements; a refresh after mount keeps beat
  // positions correct if fonts/images shift layout after first paint.
  useEffect(() => {
    ScrollTrigger.refresh();
  }, []);

  return (
    <>
      <Scene />
      <Header />
      <main>
        <Hero />
        <Story />
        <Leistungen />
        <Zahlen />
        <Ablauf />
        <Region />
        <Kontakt />
      </main>
      <Footer />
    </>
  );
}
