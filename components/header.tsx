import { EveButton } from "./eve-button";
import Image from "next/image";
import { ThemeButton } from "@/components/theme-button";
import { VoiceModeButton } from "@/components/voice-mode-button";

interface HeaderProps {
  voiceModeEnabled?: boolean;
  onVoiceModeToggle?: (enabled: boolean) => void;
}

export function Header({
  voiceModeEnabled = false,
  onVoiceModeToggle,
}: HeaderProps) {
  return (
    <div className="h-16 w-full flex items-center justify-center">
      <div className="flex items-center justify-between px-4 w-full">
        <Image
          src="/mv-logo-purple.svg"
          alt="Mindvalley Logo"
          width={56}
          height={24}
          className="h-6 w-auto"
        />
        <div className="flex items-center gap-2">
          <EveButton
            voiceModeEnabled={voiceModeEnabled}
            onVoiceModeToggle={onVoiceModeToggle}
          />
          <ThemeButton />
        </div>
      </div>
    </div>
  );
}
