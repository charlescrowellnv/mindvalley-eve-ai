"use client";

import * as React from "react";
import { useConversation } from "@elevenlabs/react";
import {
  Mic,
  MicOff,
  Pencil,
  Play,
  Pointer,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Oscilloscope } from "@/components/ui/oscilloscope";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import type { ToolUIPart } from "ai";
import { useToolExecution } from "@/export/hooks/useToolExecution";
import { createClientTools } from "@/lib/client-tools";
import type {
  ToolContext,
  ToolExecutionState,
  ToolExecution,
} from "@/lib/types";

const DEFAULT_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!;

// ============================================================================
// Types
// ============================================================================

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  id?: string; // Optional ID to track streaming messages
}

type ConversationItem =
  | { type: "message"; data: ChatMessage }
  | { type: "tool"; data: ToolExecution };

type AgentState = "disconnected" | "connecting" | "connected" | "disconnecting";
type InputMode = "text" | "push-to-talk" | "voice";

const INPUT_MODE_LABELS: Record<InputMode, string> = {
  text: "Text Mode",
  "push-to-talk": "PTT Mode",
  voice: "Voice Mode",
};

const INPUT_MODES: InputMode[] = ["text", "push-to-talk", "voice"];

function nextInputMode(current: InputMode): InputMode {
  const index = INPUT_MODES.indexOf(current);
  return INPUT_MODES[(index + 1) % INPUT_MODES.length];
}

// ============================================================================
// Agent Area Components
// ============================================================================

function AgentVoiceModeButton({
  voiceOn,
  onToggle,
}: {
  voiceOn: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full"
      onClick={onToggle}
      title={voiceOn ? "Voice response on" : "Voice response off"}
    >
      <Volume2 className={voiceOn ? "block" : "hidden"} />
      <VolumeX className={voiceOn ? "hidden" : "block"} />
      <span className="sr-only">
        {voiceOn ? "Voice response on" : "Voice response off"}
      </span>
    </Button>
  );
}

function ActiveSessionButton({
  agentState,
  onConnect,
  onDisconnect,
}: {
  agentState: AgentState;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const isTransitioning =
    agentState === "connecting" || agentState === "disconnecting";
  const isConnected = agentState === "connected";

  const handleClick = () => {
    if (agentState === "disconnected") onConnect();
    else if (agentState === "connected") onDisconnect();
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full"
      disabled={isTransitioning}
      onClick={handleClick}
    >
      <Spinner
        className={isTransitioning ? "block" : "hidden"}
        aria-hidden={!isTransitioning}
      />
      <Play
        className={
          (!isTransitioning && !isConnected ? "block" : "hidden") +
          " text-green-500"
        }
      />
      <Square
        className={
          (!isTransitioning && isConnected ? "block" : "hidden") +
          " text-red-500"
        }
      />
      <span className="sr-only">
        {isTransitioning
          ? "Connecting..."
          : isConnected
          ? "Stop session"
          : "Start session"}
      </span>
    </Button>
  );
}

// ============================================================================
// Tool Execution Display
// ============================================================================

// Map our ToolExecutionState to ai ToolUIPart state
function mapToolState(state: ToolExecutionState): ToolUIPart["state"] {
  switch (state) {
    case "pending":
      return "input-streaming";
    case "executing":
      return "input-available";
    case "completed":
      return "output-available";
    case "error":
      return "output-error";
  }
}

function ToolExecutionDisplay({
  toolName,
  state,
  parameters,
  result,
  error,
}: {
  toolName: string;
  state: ToolExecutionState;
  parameters: Record<string, unknown>;
  result?: unknown;
  error?: string;
}) {
  const toolState = mapToolState(state);

  return (
    <Tool defaultOpen={false}>
      <ToolHeader type="dynamic-tool" state={toolState} toolName={toolName} />
      <ToolContent>
        {Object.keys(parameters).length > 0 && <ToolInput input={parameters} />}
        {(result !== undefined || error) && (
          <ToolOutput output={result} errorText={error} />
        )}
      </ToolContent>
    </Tool>
  );
}

// ============================================================================
// User Input Area Components
// ============================================================================

function InputModeButton({
  mode,
  onCycle,
}: {
  mode: InputMode;
  onCycle: () => void;
}) {
  return (
    <Button
      variant="outline"
      className="rounded-full whitespace-nowrap"
      onClick={onCycle}
    >
      {INPUT_MODE_LABELS[mode]}
    </Button>
  );
}

function VoiceInputArea({
  isConnected,
  isMuted,
  onToggleMute,
  onSwitchToText,
  agentState,
  getInputFrequencyData,
}: {
  isConnected: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onSwitchToText: () => void;
  agentState: AgentState;
  getInputFrequencyData?: () => Uint8Array | undefined;
}) {
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        onClick={onToggleMute}
        disabled={!isConnected}
        title={isMuted ? "Unmute microphone" : "Mute microphone"}
      >
        {isMuted ? (
          <MicOff className="h-5 w-5 text-destructive" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>

      {/* User's mic waveform */}
      <div className="h-full min-w-0 flex-1">
        <Oscilloscope
          active={isConnected && !isMuted}
          processing={agentState === "connecting"}
          audioSource="external-data"
          getFrequencyData={getInputFrequencyData}
          lineWidth={2}
          height={8}
          sensitivity={1}
          smoothingTimeConstant={1}
          fftSize={2048}
          curveDetail={32}
        />
      </div>

      <Button
        variant="outline"
        size="icon"
        className="rounded-full text-muted-foreground"
        onClick={onSwitchToText}
        aria-label="Switch to text mode"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </>
  );
}

function TextInputControls({ onSwitchToPTT }: { onSwitchToPTT: () => void }) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full text-muted-foreground"
      onClick={onSwitchToPTT}
      aria-label="Switch to push-to-talk mode"
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
}

function TextPromptInput({
  isConnected,
  onSubmit,
}: {
  isConnected: boolean;
  onSubmit: (message: { text: string; files: unknown[] }) => void;
}) {
  return (
    <PromptInput onSubmit={onSubmit}>
      <PromptInputBody>
        <PromptInputTextarea
          placeholder="Type your message..."
          className="min-h-[60px]"
          disabled={!isConnected}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools />
        <PromptInputSubmit disabled={!isConnected} />
      </PromptInputFooter>
    </PromptInput>
  );
}

function PushToTalkControls({
  isConnected,
  onTranscription,
}: {
  isConnected: boolean;
  onTranscription: (text: string) => void;
}) {
  const [isRecording, setIsRecording] = React.useState(false);

  return (
    <>
      {/* Recording indicator (animated when recording) */}
      <div className="h-2 min-w-0 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-all duration-300",
            isRecording ? "w-full animate-pulse" : "w-0"
          )}
        />
      </div>

      <SpeechInput
        onTranscriptionChange={onTranscription}
        variant="outline"
        className="flex-1 rounded-full"
        disabled={!isConnected}
        onPointerDown={() => setIsRecording(true)}
        onPointerUp={() => setIsRecording(false)}
        onPointerLeave={() => setIsRecording(false)}
      >
        <Pointer className="mr-2 h-4 w-4" />
        Push To Talk
      </SpeechInput>
    </>
  );
}

function PTTPromptInput({
  isConnected,
  onSubmit,
}: {
  isConnected: boolean;
  onSubmit: (message: { text: string; files: unknown[] }) => void;
}) {
  return (
    <PromptInput onSubmit={onSubmit}>
      <PromptInputBody>
        <PromptInputTextarea
          placeholder="Or type..."
          className="min-h-[60px]"
          disabled={!isConnected}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools />
        <PromptInputSubmit disabled={!isConnected} />
      </PromptInputFooter>
    </PromptInput>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export interface VoiceChatRevisedProps {
  agentId?: string;
  className?: string;
}

const VoiceChatRevisedInner = ({
  agentId = DEFAULT_AGENT_ID,
  className,
}: VoiceChatRevisedProps) => {
  const controller = usePromptInputController();

  // State management
  const [inputMode, setInputMode] = React.useState<InputMode>("voice");
  const [isMuted, setIsMuted] = React.useState(false);
  const [agentState, setAgentState] =
    React.useState<AgentState>("disconnected");
  const [useVoiceResponse, setUseVoiceResponse] = React.useState(true);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const streamingMessageIdRef = React.useRef<string | null>(null);
  const streamingStartTimestampRef = React.useRef<number | null>(null);
  const pendingUserMessageIdRef = React.useRef<string | null>(null);

  // Tool execution tracking
  const { executions, addExecution, updateExecution, clearExecutions } =
    useToolExecution();

  // Create tool context for client tools
  const toolContext: ToolContext = React.useMemo(
    () => ({
      onToolStart: (toolName, parameters) => {
        console.log(`[Tool] Starting: ${toolName}`, parameters);
        return addExecution(toolName, parameters);
      },
      onToolComplete: (id, result) => {
        console.log(`[Tool] Completed: ${id}`, result);
        updateExecution(id, { state: "completed", result });
      },
      onToolError: (id, error) => {
        console.error(`[Tool] Error: ${id}`, error);
        updateExecution(id, { state: "error", error });
      },
    }),
    [addExecution, updateExecution]
  );

  // ElevenLabs conversation hook with client tools
  const conversation = useConversation({
    onConnect: () => {
      setAgentState("connected");
    },
    onDisconnect: () => {
      setAgentState("disconnected");
    },
    onDebug: (event: unknown) => {
      console.log("[Debug Event]", event);

      // Handle agent_chat_response_part - streaming text chunks
      // Type guard for the event structure
      if (
        event &&
        typeof event === "object" &&
        "type" in event &&
        event.type === "agent_chat_response_part" &&
        "text_response_part" in event
      ) {
        const chunk = event.text_response_part as {
          type?: string;
          text?: string;
        };
        console.log("[Streaming chunk]", chunk);

        if (chunk?.type === "start") {
          // Start of a new response - create a new assistant message with unique ID
          const now = Date.now();
          const messageId = `streaming-${now}`;
          streamingMessageIdRef.current = messageId;
          streamingStartTimestampRef.current = now;
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant" as const,
              content: "",
              timestamp: now,
              id: messageId,
            },
          ]);
        } else if (chunk?.type === "delta" && chunk.text) {
          // Streaming chunk - append to the streaming assistant message
          const textChunk = chunk.text;
          setMessages((prev) => {
            // Find the streaming message by ID
            const streamingId = streamingMessageIdRef.current;
            if (!streamingId) return prev;

            const messageIndex = prev.findIndex(
              (msg) => msg.id === streamingId
            );
            if (messageIndex === -1) return prev;

            const updatedMessages = [...prev];
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              content: updatedMessages[messageIndex].content + textChunk,
            };
            return updatedMessages;
          });
        } else if (chunk?.type === "stop") {
          // Streaming complete - keep the ID so onMessage can find and update it
          // Don't clear streamingMessageIdRef yet
        }
      }
    },
    onMessage: (message) => {
      console.log("[onMessage]", message);

      if (message.source === "user") {
        // Add user message
        // If we have a pending placeholder, replace it; otherwise add new message
        const placeholderId = pendingUserMessageIdRef.current;

        setMessages((prev) => {
          // Check if we need to replace a placeholder
          if (placeholderId) {
            const placeholderIndex = prev.findIndex(
              (msg) => msg.id === placeholderId
            );
            if (placeholderIndex !== -1) {
              // Replace placeholder with actual message
              const updatedMessages = [...prev];
              updatedMessages[placeholderIndex] = {
                ...updatedMessages[placeholderIndex],
                content: message.message,
              };
              pendingUserMessageIdRef.current = null;
              return updatedMessages;
            }
          }

          // No placeholder, add new message
          let timestamp = Date.now();
          if (streamingStartTimestampRef.current) {
            // Place this user message 1ms before the streaming assistant message
            timestamp = streamingStartTimestampRef.current - 1;
          }

          return [
            ...prev,
            {
              role: "user",
              content: message.message,
              timestamp,
            },
          ];
        });
      } else {
        // Final agent response
        setMessages((prev) => {
          // If we have a streaming message ID, find and update that specific message
          const streamingId = streamingMessageIdRef.current;
          if (streamingId) {
            const messageIndex = prev.findIndex(
              (msg) => msg.id === streamingId
            );
            if (messageIndex !== -1) {
              // Update the streaming message with final content
              const updatedMessages = [...prev];
              updatedMessages[messageIndex] = {
                ...updatedMessages[messageIndex],
                content: message.message,
              };
              streamingMessageIdRef.current = null; // Clear the streaming ID
              streamingStartTimestampRef.current = null; // Clear the timestamp
              return updatedMessages;
            }
          }

          // Fallback: add as new message if no streaming message found
          streamingMessageIdRef.current = null; // Clear the streaming ID
          streamingStartTimestampRef.current = null; // Clear the timestamp
          return [
            ...prev,
            {
              role: "assistant" as const,
              content: message.message,
              timestamp: Date.now(),
            },
          ];
        });
      }
    },
    micMuted: inputMode === "voice" ? isMuted : true,
    onError: (error: unknown) => {
      console.error("Conversation error:", error);

      // Show error message to user without disconnecting
      const errorMsg =
        typeof error === "string"
          ? error
          : error instanceof Error
          ? error.message
          : "An error occurred";
      setErrorMessage(errorMsg);

      // Don't automatically disconnect - let the user decide
      // setAgentState("disconnected"); // REMOVED
    },
    clientTools: createClientTools(toolContext),
  });

  // Get microphone stream (only for voice mode)
  const getMicStream = React.useCallback(async () => {
    if (mediaStreamRef.current) return mediaStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    return stream;
  }, []);

  // Start conversation
  const handleConnect = React.useCallback(async () => {
    try {
      setAgentState("connecting");
      setErrorMessage(null); // Clear any previous errors

      // Only get mic stream if in voice mode
      if (inputMode === "voice") {
        await getMicStream();
      }

      await conversation.startSession({
        agentId,
        connectionType: "websocket",
        onStatusChange: (status) => setAgentState(status.status),
      });

      // Clear messages and tool executions when starting a new session
      setMessages([]);
      clearExecutions();
    } catch (error) {
      console.error("Error starting conversation:", error);
      setAgentState("disconnected");
    }
  }, [conversation, getMicStream, agentId, inputMode, clearExecutions]);

  // End session
  const handleDisconnect = React.useCallback(() => {
    conversation.endSession();
    setAgentState("disconnected");

    // Stop all media streams
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    // Reset mute state to ensure LiveWaveform stops
    setIsMuted(false);

    // If in voice mode, switch to text mode to ensure all mic usage stops
    if (inputMode === "voice") {
      setInputMode("text");
    }
  }, [conversation, inputMode]);

  // Handle text submission
  const handleTextSubmit = React.useCallback(
    (message: { text: string; files: unknown[] }) => {
      if (!message.text.trim() || agentState !== "connected") return;

      const userMessage: ChatMessage = {
        role: "user",
        content: message.text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      conversation.sendUserMessage(message.text);
    },
    [conversation, agentState]
  );

  // Handle speech-to-text transcription (for PTT mode)
  const handleSpeechTranscription = React.useCallback(
    (text: string) => {
      if (agentState !== "connected") return;

      // In PTT mode, put transcription into text input for user to review/edit before sending
      controller.textInput.setInput(
        controller.textInput.value +
          (controller.textInput.value ? " " : "") +
          text
      );
    },
    [controller, agentState]
  );

  // Mode cycling and switching
  const cycleInputMode = React.useCallback(() => {
    setInputMode((current) => nextInputMode(current));
    setIsMuted(false); // Reset mute when changing modes
  }, []);

  const switchToText = React.useCallback(() => {
    setInputMode("text");
    setIsMuted(false);
  }, []);

  const switchToPTT = React.useCallback(() => {
    setInputMode("push-to-talk");
    setIsMuted(false);
  }, []);

  // Control agent voice volume based on useVoiceResponse
  React.useEffect(() => {
    if (agentState === "connected") {
      conversation.setVolume({ volume: useVoiceResponse ? 1.0 : 0.0 });
    }
  }, [useVoiceResponse, agentState, conversation]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const isConnected = agentState === "connected";

  // Create a chronological timeline of messages and tool executions
  const timeline: ConversationItem[] = React.useMemo(() => {
    const items: ConversationItem[] = [
      ...messages.map((msg) => ({ type: "message" as const, data: msg })),
      ...executions.map((exec) => ({ type: "tool" as const, data: exec })),
    ];
    return items.sort((a, b) => a.data.timestamp - b.data.timestamp);
  }, [messages, executions]);

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4 p-4 overflow-hidden",
        className
      )}
    >
      {/* Message History */}
      <Conversation className="min-h-0 flex-1 rounded-xl border border-dashed">
        <ConversationContent className="gap-4">
          {timeline.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <div className="space-y-2">
                <p className="text-lg font-medium">Ready to chat</p>
                <p className="text-sm">
                  Select your input mode and start a session
                </p>
              </div>
            </div>
          ) : (
            timeline.map((item, index) => {
              if (item.type === "message") {
                return (
                  <Message
                    key={`msg-${index}-${item.data.timestamp}`}
                    from={item.data.role}
                  >
                    <MessageContent>
                      <MessageResponse>{item.data.content}</MessageResponse>
                    </MessageContent>
                  </Message>
                );
              } else {
                return (
                  <ToolExecutionDisplay
                    key={`tool-${item.data.id}`}
                    toolName={item.data.toolName}
                    state={item.data.state}
                    parameters={item.data.parameters}
                    result={item.data.result}
                    error={item.data.error}
                  />
                );
              }
            })
          )}
          {errorMessage && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="font-medium text-destructive text-sm">Error</p>
                  <p className="text-muted-foreground text-sm">
                    {errorMessage}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setErrorMessage(null)}
                  className="text-muted-foreground"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Agent Area - Rounded Pill */}
      <div className="rounded-full border p-2">
        <div className="flex items-center justify-between gap-4">
          <AgentVoiceModeButton
            voiceOn={useVoiceResponse}
            onToggle={() => setUseVoiceResponse((prev) => !prev)}
          />

          {/* Agent waveform (shows when speaking) */}
          <div className="h-full min-w-0 flex-1">
            <Oscilloscope
              active={isConnected && conversation.isSpeaking}
              processing={agentState === "connecting"}
              audioSource="external-data"
              getFrequencyData={conversation.getOutputByteFrequencyData}
              lineWidth={2}
              height={12}
              sensitivity={1}
              smoothingTimeConstant={1}
              fftSize={2048}
              curveDetail={32}
            />
          </div>

          <ActiveSessionButton
            agentState={agentState}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        </div>
      </div>

      {/* User Input Area - Rounded Card */}
      <div>
        {!isConnected ? (
          /* Idle State - Session Not Started */
          <div></div>
        ) : (
          /* Active State - Session Connected */
          <div className="flex flex-col gap-2 rounded-xl border p-2 dark:bg-input/30">
            {/* Row 1: Mode controls and quick actions */}
            <div className="flex items-center gap-2">
              <InputModeButton mode={inputMode} onCycle={cycleInputMode} />

              {inputMode === "voice" && (
                <VoiceInputArea
                  isConnected={isConnected}
                  isMuted={isMuted}
                  onToggleMute={() => setIsMuted((prev) => !prev)}
                  onSwitchToText={switchToText}
                  agentState={agentState}
                  getInputFrequencyData={conversation.getInputByteFrequencyData}
                />
              )}

              {inputMode === "text" && (
                <TextInputControls onSwitchToPTT={switchToPTT} />
              )}

              {inputMode === "push-to-talk" && (
                <PushToTalkControls
                  isConnected={isConnected}
                  onTranscription={handleSpeechTranscription}
                />
              )}
            </div>

            {/* Row 2: Text input (for text and PTT modes) */}
            {inputMode === "text" && (
              <TextPromptInput
                isConnected={isConnected}
                onSubmit={handleTextSubmit}
              />
            )}

            {inputMode === "push-to-talk" && (
              <PTTPromptInput
                isConnected={isConnected}
                onSubmit={handleTextSubmit}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Wrapper component with PromptInputProvider
export const VoiceChatRevised = (props: VoiceChatRevisedProps) => {
  return (
    <PromptInputProvider>
      <VoiceChatRevisedInner {...props} />
    </PromptInputProvider>
  );
};

export default VoiceChatRevised;
