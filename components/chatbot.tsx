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
import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { PromptInputTools } from "@/components/ai-elements/prompt-input";
import { EvaAiIcon } from "./icons/eva-ai-icon";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { ProgramRecommendations } from "@/components/program-recommendations";
import type { ProgramRecommendationsResult } from "@/lib/types/program";
import { ConversationSuggestions } from "@/components/conversation-suggestions";
import type { ConversationSuggestionsResult } from "@/lib/types/suggestion";
import { Loader2 } from "lucide-react";
import { Subheading } from "./elements/subheading";

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
    <Button
      variant="outline"
      className="h-auto w-full justify-start px-4 py-3 text-left whitespace-normal"
      onClick={handleClick}
    >
      <span className="text-sm">{suggestion}</span>
    </Button>
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
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden h-full max-w-4xl mx-auto">
      <Conversation>
        <ConversationContent className="min-h-full flex-1 flex flex-col w-full">
          {messages.length === 0 ? (
            <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 w-full">
              <div className="flex flex-col items-start justify-center gap-4">
                <div className="flex items-center justify-center gap-2">
                  <EvaAiIcon className="size-6" strokeWidth={1} gradient />
                  <span className="text-lg text-foreground">Eve</span>
                </div>
                <Subheading className="text-3xl text-foreground font-semibold">
                  Hey Changemaker, ready?
                </Subheading>
                <ul className="flex flex-col items-start gap-6 w-full text-muted-foreground text-sm list-none py-4">
                  <li>
                    <div className="flex flex-col items-start justify-center gap-1">
                      <span className="font-medium text-foreground text-lg">
                        Explore Mindvalley
                      </span>
                      Easily find what you&apos;re looking for across
                      Mindvalley.
                    </div>
                  </li>
                  <li>
                    <div className="flex flex-col items-start justify-center gap-1">
                      <span className="font-medium text-foreground text-lg">
                        Get personalized guidance
                      </span>
                      Share your goals or situation to get tailored
                      recommendations.
                    </div>
                  </li>
                  <li>
                    <div className="flex flex-col items-start justify-center gap-1">
                      <span className="font-medium text-foreground text-lg">
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
            <>
              {messages.map((message, index) => {
                const isLastMessage = index === messages.length - 1;
                const isStreamingLast =
                  status === "streaming" &&
                  isLastMessage &&
                  message.role === "assistant";

                return (
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      {message.parts.map((part, partIndex) => {
                        // Handle text parts
                        if (part.type === "text") {
                          return (
                            <MessageResponse
                              key={partIndex}
                              mode={isStreamingLast ? "streaming" : "static"}
                              parseIncompleteMarkdown={isStreamingLast}
                            >
                              {part.text}
                            </MessageResponse>
                          );
                        }

                        // Handle tool invocation parts (SDK sends typed part names e.g. tool-get_program_recommendations)
                        const isToolPart =
                          part.type === "tool-invocation" ||
                          part.type === "tool-get_program_recommendations" ||
                          part.type === "tool-get_conversation_suggestions";
                        if (isToolPart) {
                          // Get dynamic messages based on tool type
                          const getLoadingMessage = () => {
                            if (
                              part.type === "tool-get_program_recommendations"
                            ) {
                              return "Searching...";
                            }
                            if (
                              part.type === "tool-get_conversation_suggestions"
                            ) {
                              return "Thinking...";
                            }
                            return "Thinking...";
                          };

                          const getErrorMessage = () => {
                            if (
                              part.type === "tool-get_program_recommendations"
                            ) {
                              return "Unable to fetch program recommendations";
                            }
                            if (
                              part.type === "tool-get_conversation_suggestions"
                            ) {
                              return "Unable to generate suggestions";
                            }
                            return "Unable to complete action";
                          };

                          // Loading state - tool is being called
                          if (
                            part.state === "input-available" ||
                            part.state === "input-streaming"
                          ) {
                            return (
                              <div
                                key={partIndex}
                                className="flex items-center gap-3"
                              >
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {getLoadingMessage()}
                                </span>
                              </div>
                            );
                          }

                          // Error state - tool execution failed
                          if (part.state === "output-error") {
                            return (
                              <div key={partIndex} className="space-y-2">
                                <p className="text-sm font-medium text-destructive">
                                  {getErrorMessage()}
                                </p>
                                {part.errorText && (
                                  <p className="text-xs text-destructive/80">
                                    {part.errorText}
                                  </p>
                                )}
                              </div>
                            );
                          }

                          // Success state - render custom UI based on tool type
                          if (part.state === "output-available") {
                            // Render program recommendations
                            if (
                              part.type === "tool-get_program_recommendations"
                            ) {
                              return (
                                <ProgramRecommendations
                                  key={partIndex}
                                  result={
                                    part.output as ProgramRecommendationsResult
                                  }
                                />
                              );
                            }

                            // Render conversation suggestions
                            if (
                              part.type === "tool-get_conversation_suggestions"
                            ) {
                              return (
                                <ConversationSuggestions
                                  key={partIndex}
                                  result={
                                    part.output as ConversationSuggestionsResult
                                  }
                                  onSuggestionClick={handleSuggestionClick}
                                />
                              );
                            }
                          }
                        }

                        return null;
                      })}
                    </MessageContent>
                  </Message>
                );
              })}
              {/* Show loading spinner when waiting for assistant response */}
              {status === "streaming" &&
                messages.length > 0 &&
                messages[messages.length - 1].role === "user" && (
                  <Message from="assistant" key="loading">
                    <MessageContent>
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Thinking...
                        </span>
                      </div>
                    </MessageContent>
                  </Message>
                )}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="grid shrink-0 gap-4 pt-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2 px-4">
            <Label className="text-sm font-medium text-muted-foreground">
              Try one of these:
            </Label>
            <div className="grid w-full sm:grid-cols-2 gap-2">
              {suggestions.map((suggestion) => (
                <SuggestionItem
                  key={suggestion}
                  onClick={handleSuggestionClick}
                  suggestion={suggestion}
                />
              ))}
            </div>
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
