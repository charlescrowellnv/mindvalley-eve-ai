"use client";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { PromptInputTools } from "@/components/ai-elements/prompt-input";
import { EvaAiIcon } from "./icons/eva-ai-icon";
import { Label } from "./ui/label";

const suggestions = [
  "I'm feeling stressed, tired, or seeking better sleep",
  "I'm looking to lose weight and improve my fitness",
  "I want to develop a growth mindset and increase my self-confidence",
  "I want to enhance my leadership skills, build a strong team, or inspire others",
];

const SuggestionItem = ({
  suggestion,
  onClick,
}: {
  suggestion: string;
  onClick: (suggestion: string) => void;
}) => {
  const handleClick = useCallback(() => {
    onClick(suggestion);
  }, [onClick, suggestion]);

  return (
    <Suggestion
      className="h-auto w-full rounded-lg border border-border bg-background py-3 text-left text-foreground whitespace-normal hover:bg-muted/50"
      onClick={handleClick}
      suggestion={suggestion}
    />
  );
};

interface ChatbotProps {
  onHasMessagesChange?: (hasMessages: boolean) => void;
}

const Chatbot = ({ onHasMessagesChange }: ChatbotProps) => {
  const [text, setText] = useState<string>("");

  const { messages, sendMessage, status, error } = useChat();

  useEffect(() => {
    onHasMessagesChange?.(messages.length > 0);
  }, [messages.length, onHasMessagesChange]);

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text?.trim()) {
        return;
      }

      sendMessage({ text: message.text });
      setText("");
    },
    [sendMessage]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      sendMessage({ text: suggestion });
    },
    [sendMessage]
  );

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.target.value);
    },
    []
  );

  const handleTranscriptionChange = useCallback((transcript: string) => {
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
  }, []);

  const isSubmitDisabled = useMemo(
    () => !text.trim() || status === "streaming",
    [text, status]
  );

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden h-full max-w-5xl mx-auto ">
      <Conversation>
        <ConversationContent className="min-h-full flex-1 flex flex-col">
          {messages.length === 0 ? (
            <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4">
              <div className="flex flex-col items-start justify-center gap-4">
                <div className="flex items-center justify-center gap-2">
                  <EvaAiIcon className="size-6" strokeWidth={1} gradient />
                  <span className="text-lg text-foreground">Eve</span>
                </div>
                <p className="text-3xl text-foreground font-semibold">
                  Hey Changemaker, ready?
                </p>
                <ul className="flex flex-col items-start gap-6 w-full text-muted-foreground text-sm list-none py-4">
                  <li>
                    <div className="flex flex-col items-start justify-center gap-1">
                      <span className="font-medium text-foreground text-base">
                        Explore Mindvalley
                      </span>
                      Easily find what you&apos;re looking for across
                      Mindvalley.
                    </div>
                  </li>
                  <li>
                    <div className="flex flex-col items-start justify-center gap-1">
                      <span className="font-medium text-foreground text-base">
                        Get personalized guidance
                      </span>
                      Share your goals or situation to get tailored
                      recommendations.
                    </div>
                  </li>
                  <li>
                    <div className="flex flex-col items-start justify-center gap-1">
                      <span className="font-medium text-foreground text-base">
                        Need help?
                      </span>
                      Get support for the app, membership, certifications, and
                      more.
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              const isStreamingLast =
                status === "streaming" &&
                isLastMessage &&
                message.role === "assistant";
              const content = message.parts
                .map((part) => (part.type === "text" ? part.text : ""))
                .join("");
              return (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    <MessageResponse
                      mode={isStreamingLast ? "streaming" : "static"}
                      parseIncompleteMarkdown={isStreamingLast}
                    >
                      {content}
                    </MessageResponse>
                  </MessageContent>
                </Message>
              );
            })
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="grid shrink-0 gap-4 pt-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2 px-4">
            <Label className="text-sm text-muted-foreground font-normal">
              Try one of these:
            </Label>
            <Suggestions className="grid w-full sm:grid-cols-2 gap-2 text-left">
              {suggestions.map((suggestion) => (
                <SuggestionItem
                  key={suggestion}
                  onClick={handleSuggestionClick}
                  suggestion={suggestion}
                />
              ))}
            </Suggestions>
          </div>
        )}
        <div className="w-full px-4 pb-4">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea onChange={handleTextChange} value={text} />
            </PromptInputBody>
            <PromptInputFooter className="justify-between">
              <PromptInputTools>
                <SpeechInput
                  className="shrink-0"
                  onTranscriptionChange={handleTranscriptionChange}
                  size="icon-sm"
                  variant="ghost"
                />
              </PromptInputTools>
              <PromptInputSubmit disabled={isSubmitDisabled} status={status} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
      {error && (
        <div className="p-4 text-sm text-red-500">Error: {error.message}</div>
      )}
      <p className=" text-center text-xs text-muted-foreground/50 text-balance">
        EVE AI provides general information only. It is not medical, financial,
        therapeutic, or professional advice, and may not reflect Mindvalley’s
        views or always be accurate.
      </p>
    </div>
  );
};

export default Chatbot;
