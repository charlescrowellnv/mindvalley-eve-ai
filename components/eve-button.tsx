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
import { useState } from "react";

export const EveButton = () => {
  const [hasMessages, setHasMessages] = useState(false);

  return (
    <Dialog>
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
        <Chatbot onHasMessagesChange={setHasMessages} />
      </DialogContent>
    </Dialog>
  );
};

export const EveButtonLg = () => {
  const [hasMessages, setHasMessages] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="xl"
          variant="secondary"
          className="hover:cursor-pointer hover:shadow-xl text-white bg-linear-to-bl from-indigo-500 to-purple-700"
        >
          <EvaAiIcon className="size-5 " strokeWidth={1} />
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
        <Chatbot onHasMessagesChange={setHasMessages} />
      </DialogContent>
    </Dialog>
  );
};
