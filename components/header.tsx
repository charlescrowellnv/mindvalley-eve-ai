import { EveButton } from "./eve-button";
import Image from "next/image";
import { ThemeButton } from "@/components/theme-button";

export function Header() {
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
          <EveButton />
          <ThemeButton />
        </div>
      </div>
    </div>
  );
}
