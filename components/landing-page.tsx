import { EveButtonLg } from "@/components/eve-button";
import { EveButton2Lg } from "@/components/eve-button-2";
import { EvaAiPlanet } from "@/components/eve-ai-planet";
import { HeroSimpleCentered } from "@/components/sections/hero-simple-centered";
import { Eyebrow } from "./elements/eyebrow";

interface LandingPageProps {
  voiceModeEnabled?: boolean;
  onVoiceModeToggle?: (enabled: boolean) => void;
}

export const LandingPage = ({
  voiceModeEnabled,
  onVoiceModeToggle,
}: LandingPageProps) => {
  return (
    <div className="relative w-full flex flex-col h-screen overflow-hidden">
      <EvaAiPlanet className="absolute left-1/2 top-1/2 z-0 flex -translate-x-1/2 -translate-y-1/8 opacity-50" />
      <HeroSimpleCentered
        className="relative z-10 h-full pt-32 bg-linear-to-b from-bg via-bg from-30% to-primary/50"
        headline="Eve AI"
        subheadline=""
        cta={
          <div className="flex flex-col sm:flex-row gap-4">
            <EveButtonLg
              voiceModeEnabled={voiceModeEnabled}
              onVoiceModeToggle={onVoiceModeToggle}
            />
            <EveButton2Lg />
          </div>
        }
      />
    </div>
  );
};
