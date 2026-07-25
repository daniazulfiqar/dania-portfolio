import { EnvelopeHero } from "@/components/envelope-hero";
import { IntroStatement } from "@/components/intro-statement";
import { ProjectsFold } from "@/components/projects-fold";
import { SnakeFold } from "@/components/snake-fold";

export default function Home() {
  return (
    <>
      <EnvelopeHero />
      <IntroStatement />
      <ProjectsFold />
      <SnakeFold />
    </>
  );
}
