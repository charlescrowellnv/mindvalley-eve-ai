"use client";

import { Button } from "@/components/ui/button";
import { EvaAiIcon } from "@/components/icons/eva-ai-icon";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VoiceChatRevised } from "@/components/conversation/voice-chat-revised";
import { useState } from "react";

interface EveButton2Props {
  agentId?: string; // Optional override of env variable
}

export const EveButton2 = ({ agentId }: EveButton2Props) => {
  const [hasMessages, setHasMessages] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          variant="secondary"
          className="hover:cursor-pointer hover:shadow-xl"
        >
          <EvaAiIcon className="size-5" strokeWidth={1} />
          Voice Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col h-full">
        <DialogHeader className="flex flex-row justify-between items-center gap-2">
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
        <DialogDescription className="sr-only">
          Voice chat with Eve AI assistant. Start or continue a conversation.
        </DialogDescription>
        <VoiceChatRevised
          agentId={agentId}
          className="flex-1"
          onHasMessagesChange={setHasMessages}
        />
      </DialogContent>
    </Dialog>
  );
};

// Large variant for landing page CTA
export const EveButton2Lg = ({ agentId }: EveButton2Props) => {
  const [hasMessages, setHasMessages] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="xl"
          className="bg-linear-to-r from-primary via-purple-500 to-pink-500 hover:cursor-pointer hover:shadow-xl border-none"
        >
          <EvaAiIcon className="size-6" strokeWidth={1} />
          Voice with Eve
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col h-full">
        <DialogHeader>
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
        <DialogDescription className="sr-only">
          Voice chat with Eve AI assistant. Start or continue a conversation.
        </DialogDescription>
        <VoiceChatRevised
          agentId={agentId}
          className="flex-1"
          onHasMessagesChange={setHasMessages}
        />
      </DialogContent>
    </Dialog>
  );
};
