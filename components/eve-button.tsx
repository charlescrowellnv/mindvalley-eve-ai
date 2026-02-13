"use client";

import { Button } from "@/components/ui/button";
import { EvaAiIcon } from "@/components/icons/eva-ai-icon";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Chatbot from "./chatbot";
import { useState, useRef } from "react";

interface EveButtonProps {
  voiceModeEnabled?: boolean;
  onVoiceModeToggle?: (enabled: boolean) => void;
}

export const EveButton = ({
  voiceModeEnabled,
  onVoiceModeToggle,
}: EveButtonProps) => {
  const [hasMessages, setHasMessages] = useState(false);
  const [open, setOpen] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);

    // When dialog closes, cleanup audio and memory
    if (!newOpen && cleanupRef.current) {
      cleanupRef.current();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" variant="secondary" className="hover:cursor-pointer">
          <EvaAiIcon className="size-5" strokeWidth={1} gradient />
          Eve AI
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col h-full">
        <DialogHeader className="flex flex-row justify-between items-center gap-2 ">
          <div className="flex flex-row justify-start items-center gap-2">
            {hasMessages && (
              <div className="flex flex-row justify-start items-center gap-2">
                <EvaAiIcon gradient strokeWidth={1.5} />
                <span>
                  Eve AI by <strong>Mindvalley</strong>
                </span>
              </div>
            )}

            <DialogTitle className="sr-only">Eve AI</DialogTitle>
          </div>
        </DialogHeader>
        <Chatbot
          onHasMessagesChange={setHasMessages}
          voiceModeEnabled={voiceModeEnabled}
          onVoiceModeToggle={onVoiceModeToggle}
          onCleanupReady={(cleanup) => {
            cleanupRef.current = cleanup;
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export const EveButtonLg = ({
  voiceModeEnabled,
  onVoiceModeToggle,
}: EveButtonProps) => {
  const [hasMessages, setHasMessages] = useState(false);
  const [open, setOpen] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);

    // When dialog closes, cleanup audio and memory
    if (!newOpen && cleanupRef.current) {
      cleanupRef.current();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="xl"
          variant="secondary"
          className="hover:cursor-pointer hover:shadow-xl text-white bg-linear-to-bl from-indigo-500 to-purple-700"
        >
          Get Started
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col h-full">
        <DialogHeader className="flex flex-row justify-between items-center gap-2 ">
          <div className="flex flex-row justify-start items-center gap-2">
            {hasMessages && (
              <div className="flex flex-row justify-start items-center gap-2">
                <EvaAiIcon gradient strokeWidth={1.5} />
                <span>
                  Eve AI by <strong>Mindvalley</strong>
                </span>
              </div>
            )}

            <DialogTitle className="sr-only">Eve AI</DialogTitle>
          </div>
        </DialogHeader>
        <Chatbot
          onHasMessagesChange={setHasMessages}
          voiceModeEnabled={voiceModeEnabled}
          onVoiceModeToggle={onVoiceModeToggle}
          onCleanupReady={(cleanup) => {
            cleanupRef.current = cleanup;
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
