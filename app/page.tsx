import { AboutFold } from "@/components/about-fold";
import { ContactFold } from "@/components/contact-fold";
import { EnvelopeHero } from "@/components/envelope-hero";
import { ProjectsFold, type StudyContent } from "@/components/projects-fold";
import { SiteFooter } from "@/components/site-footer";
import { SnakeFold } from "@/components/snake-fold";
import { goodOnes } from "@/lib/good-ones";
import { getCaseStudyMarkdown } from "@/lib/case-study-content";

export default function Home() {
  // load each case study's markdown at build/request time so a card can open
  // its study as an in-page pop-up without a client fetch. a null entry means
  // the study is still a draft.
  const studies: StudyContent = Object.fromEntries(
    goodOnes.map((project) => [project.id, getCaseStudyMarkdown(project.id)]),
  );

  return (
    <>
      <EnvelopeHero />
      <AboutFold />
      <ProjectsFold studies={studies} />
      <ContactFold />
      <SnakeFold />
      <SiteFooter />
    </>
  );
}
