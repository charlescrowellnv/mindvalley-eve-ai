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

export const EveButton = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="font-mono hover:cursor-pointer">
          <EveAiIcon className="size-5" />
          Eve AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw]! h-[85vh] w-full">
        <DialogHeader className="flex flex-row justify-between">
          <DialogTitle className="sr-only">Eve AI</DialogTitle>
        </DialogHeader>
        <Chatbot />
      </DialogContent>
    </Dialog>
  );
};
