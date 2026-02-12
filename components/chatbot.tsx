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
import EveAiIcon from "./icons/eve-ai";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { PromptInputTools } from "@/components/ai-elements/prompt-input";

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
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden h-full ">
      <Conversation>
        <ConversationContent className="min-h-full flex-1 flex flex-col">
          {messages.length === 0 ? (
            <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4">
              <EveAiIcon className="size-16" strokeWidth={0.5} />
              <span className="text-4xl text-foreground font-mono">Eve AI</span>
              <p className="text-sm text-foreground">
                Hi Vishen, ask me anything or choose a suggestion below
              </p>
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
          <Suggestions className="grid w-full sm:grid-cols-2 gap-2 px-4 text-left">
            {suggestions.map((suggestion) => (
              <SuggestionItem
                key={suggestion}
                onClick={handleSuggestionClick}
                suggestion={suggestion}
              />
            ))}
          </Suggestions>
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
      <p className="mt-4 text-center text-xs text-muted-foreground/50 text-balance">
        EVE AI provides general information only. It is not medical, financial,
        therapeutic, or professional advice, and may not reflect Mindvalley’s
        views or always be accurate.
      </p>
    </div>
  );
};

export default Chatbot;
