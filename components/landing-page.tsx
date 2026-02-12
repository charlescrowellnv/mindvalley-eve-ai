import { EveButtonLg } from "@/components/eve-button";
import { HeroCenteredWithPhoto } from "@/components/sections/hero-centered-with-photo";

export const LandingPage = () => {
  return (
    <div className="w-full flex flex-col h-screen">
      <HeroCenteredWithPhoto
        className="h-screen pt-32 bg-linear-to-b from-bg via-bg from-30% to-primary/50"
        headline="Meet Eve"
        subheadline="by Mindvalley"
        cta={<EveButtonLg />}
      />
    </div>
  );
};
