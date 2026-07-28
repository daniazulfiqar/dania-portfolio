import { AboutFold } from "@/components/about-fold";
import { EnvelopeHero } from "@/components/envelope-hero";
import { ProjectsFold } from "@/components/projects-fold";
import { SnakeFold } from "@/components/snake-fold";

export default function Home() {
  return (
    <>
      <EnvelopeHero />
      <AboutFold />
      <ProjectsFold />
      <SnakeFold />
    </>
  );
}
