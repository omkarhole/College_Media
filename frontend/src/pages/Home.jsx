import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import SocialFeed from "../components/Social/SocialFeed";
import Features from "../components/Features";
import About from "../components/About";
import Team from "../components/Team";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <SocialFeed />
      <Features />
      <About />
      <Team />
      <CTA />
      <Footer />
    </>
  );
}
