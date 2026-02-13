"use client";

import { clsx } from "clsx/lite";
import { CheckIcon, CopyIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useCallback, useRef, useState } from "react";

export function InstallCommand({
  snippet,
  variant = "normal",
  className,
  ...props
}: {
  snippet: ReactNode;
  variant?: "normal" | "overlay";
} & ComponentProps<"div">) {
  const [copied, setCopied] = useState(false);
  const snippetRef = useRef<HTMLSpanElement>(null);

  const handleCopy = useCallback(async () => {
    const text = snippetRef.current?.textContent?.trim() ?? "";
    if (text && typeof navigator?.clipboard !== "undefined") {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-6 rounded-full p-1 font-mono text-sm/7 inset-ring-1 dark:bg-white/10 dark:inset-ring-white/10",
        variant === "normal" &&
          "bg-white text-mist-600 inset-ring-black/10 dark:text-white",
        variant === "overlay" &&
          "bg-white/15 text-white inset-ring-white/10",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 pl-3">
        <div className="text-current/60 select-none">$</div>
        <span id="snippet" ref={snippetRef}>{snippet}</span>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="group relative flex size-9 items-center justify-center rounded-full after:absolute after:-inset-1 hover:bg-mist-950/10 dark:hover:bg-white/10 after:pointer-fine:hidden"
      >
        {copied ? (
          <CheckIcon className="size-4" />
        ) : (
          <CopyIcon className="size-4" />
        )}
      </button>
    </div>
  );
}
