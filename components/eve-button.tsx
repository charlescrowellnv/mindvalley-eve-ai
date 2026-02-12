"use client";

import { Button } from "@/components/ui/button";
import { EveAiIcon } from "@/components/icons/eve-ai";
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
        <Button variant="secondary" className="font-mono hover:cursor-pointer">
          <EveAiIcon className="size-5" />
          Eve AI
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col h-full">
        <DialogHeader className="flex flex-row justify-between ">
          {hasMessages && <EveAiIcon className="size-5" />}
          <DialogTitle className="sr-only">Eve AI</DialogTitle>
        </DialogHeader>
        <Chatbot onHasMessagesChange={setHasMessages} />
      </DialogContent>
    </Dialog>
  );
};
