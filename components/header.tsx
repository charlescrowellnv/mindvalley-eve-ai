import { EveButton } from "./eve-button";
import Image from "next/image";

export function Header() {
  return (
    <div className="h-16 border-b w-full flex items-center justify-center">
      <div className="flex items-center justify-between px-4 w-full">
        <Image
          src="/mv-logo-purple.svg"
          alt="Mindvalley Logo"
          width={56}
          height={24}
          className="h-6 w-auto"
        />
        <EveButton />
      </div>
    </div>
  );
}
