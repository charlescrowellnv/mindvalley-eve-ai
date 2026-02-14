# VoiceChatRevised Technical Guide

## Preventing Duplicate onMessage Events and Audio Playback

This document explains how the VoiceChatRevised component manages onMessage events, audio playback, and streaming to prevent common issues like duplicates and playback conflicts.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Message Event Handling](#message-event-handling)
3. [Streaming Management](#streaming-management)
4. [Audio Playback Control](#audio-playback-control)
5. [Common Issues & Solutions](#common-issues--solutions)
6. [Best Practices Checklist](#best-practices-checklist)

---

## Architecture Overview

### Single Source of Truth

The component uses **ONE `useConversation` hook** instance:

```typescript
const conversation = useConversation({
  onConnect: () => { /* ... */ },
  onDisconnect: () => { /* ... */ },
  onDebug: (event) => { /* handles streaming chunks */ },
  onMessage: (message) => { /* handles final messages */ },
  onError: (error) => { /* ... */ },
  clientTools: createClientTools(toolContext),
});
```

**CRITICAL:** Never create multiple `useConversation` instances. Each instance:
- Creates separate WebSocket connections
- Triggers duplicate events
- Causes duplicate audio playback
- Leads to state synchronization issues

### Component Wrapping

The component is wrapped in `PromptInputProvider`:

```typescript
export const VoiceChatRevised = (props: VoiceChatRevisedProps) => {
  return (
    <PromptInputProvider>
      <VoiceChatRevisedInner {...props} />
    </PromptInputProvider>
  );
};
```

**Why?** The `PromptInputProvider` ensures:
- Controlled text input state
- Single controller instance
- Proper cleanup on unmount

---

## Message Event Handling

### Dual Event System

The ElevenLabs SDK fires TWO types of events:

1. **`onDebug`** - Streaming chunks (real-time)
2. **`onMessage`** - Final messages (complete)

### Event Flow

```
User speaks/types
    ↓
[onMessage: user] ← User message arrives
    ↓
[onDebug: start] ← Agent starts responding (streaming begins)
    ↓
[onDebug: delta] ← Text chunk arrives (may fire multiple times)
[onDebug: delta] ← Another chunk
[onDebug: delta] ← Another chunk
    ↓
[onDebug: stop] ← Streaming complete
    ↓
[onMessage: assistant] ← Final complete message
```

### Preventing Duplicates with Message IDs

#### Step 1: Create Streaming Message with Unique ID

```typescript
// In onDebug handler - when streaming starts
if (chunk?.type === "start") {
  const now = Date.now();
  const messageId = `streaming-${now}`; // Unique ID

  streamingMessageIdRef.current = messageId; // Track in ref
  streamingStartTimestampRef.current = now;

  setMessages((prev) => [
    ...prev,
    {
      role: "assistant",
      content: "",           // Empty initially
      timestamp: now,
      id: messageId,         // ← Key for tracking
    },
  ]);
}
```

#### Step 2: Append to Existing Message by ID

```typescript
// In onDebug handler - when streaming chunks arrive
else if (chunk?.type === "delta" && chunk.text) {
  const textChunk = chunk.text;

  setMessages((prev) => {
    const streamingId = streamingMessageIdRef.current;
    if (!streamingId) return prev;

    // Find message by ID
    const messageIndex = prev.findIndex(
      (msg) => msg.id === streamingId
    );
    if (messageIndex === -1) return prev;

    // Update existing message (not adding new)
    const updatedMessages = [...prev];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: updatedMessages[messageIndex].content + textChunk, // Append
    };
    return updatedMessages;
  });
}
```

#### Step 3: Update Final Message Content

```typescript
// In onMessage handler - when final message arrives
else {
  setMessages((prev) => {
    const streamingId = streamingMessageIdRef.current;

    if (streamingId) {
      // Find and update the streaming message
      const messageIndex = prev.findIndex(
        (msg) => msg.id === streamingId
      );

      if (messageIndex !== -1) {
        const updatedMessages = [...prev];
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          content: message.message, // Replace with final content
        };

        streamingMessageIdRef.current = null; // Clear tracking
        streamingStartTimestampRef.current = null;
        return updatedMessages; // ← Return updated, not adding new
      }
    }

    // Fallback: only if no streaming message found
    return [...prev, { /* new message */ }];
  });
}
```

### Why Use Refs Instead of State?

```typescript
const streamingMessageIdRef = React.useRef<string | null>(null);
const streamingStartTimestampRef = React.useRef<number | null>(null);
const pendingUserMessageIdRef = React.useRef<string | null>(null);
```

**Reasons:**
1. **Avoid Stale Closures:** Event handlers capture state at creation time. Refs provide current values.
2. **No Re-renders:** Updating refs doesn't trigger re-renders (unlike setState).
3. **Synchronous Access:** Refs update immediately, state updates are batched.
4. **Shared Across Callbacks:** Multiple event handlers can access the same ref value.

**Example of the Problem with State:**

```typescript
// ❌ BAD - Using state
const [streamingId, setStreamingId] = useState<string | null>(null);

const conversation = useConversation({
  onDebug: (event) => {
    // This closure captures streamingId from when hook was created
    // It will be stale if streamingId changes!
    console.log(streamingId); // ← May be outdated
  },
  onMessage: (message) => {
    // This also has stale streamingId
    const currentId = streamingId; // ← Wrong value!
  }
});

// ✅ GOOD - Using refs
const streamingIdRef = useRef<string | null>(null);

const conversation = useConversation({
  onDebug: (event) => {
    console.log(streamingIdRef.current); // ← Always current
  },
  onMessage: (message) => {
    const currentId = streamingIdRef.current; // ← Correct value!
  }
});
```

---

## Streaming Management

### Streaming Timeline with IDs

```
Time: 0ms
  onDebug: { type: "start" }
    → Create message: { id: "streaming-1234", content: "", ... }
    → streamingMessageIdRef.current = "streaming-1234"

Time: 50ms
  onDebug: { type: "delta", text: "Hello" }
    → Find message with id="streaming-1234"
    → Update content: "" + "Hello" = "Hello"

Time: 100ms
  onDebug: { type: "delta", text: " there" }
    → Find message with id="streaming-1234"
    → Update content: "Hello" + " there" = "Hello there"

Time: 150ms
  onDebug: { type: "delta", text: "!" }
    → Find message with id="streaming-1234"
    → Update content: "Hello there" + "!" = "Hello there!"

Time: 200ms
  onDebug: { type: "stop" }
    → Keep streamingMessageIdRef for onMessage to use

Time: 250ms
  onMessage: { message: "Hello there!" }
    → Find message with id="streaming-1234"
    → Update content: "Hello there!" (final)
    → streamingMessageIdRef.current = null (clear)
```

### Chronological Ordering

Messages and tool executions are sorted by timestamp:

```typescript
const timeline: ConversationItem[] = React.useMemo(() => {
  const items: ConversationItem[] = [
    ...messages.map((msg) => ({ type: "message", data: msg })),
    ...executions.map((exec) => ({ type: "tool", data: exec })),
  ];
  return items.sort((a, b) => a.data.timestamp - b.data.timestamp);
}, [messages, executions]);
```

**Ensures:**
- User messages appear before agent responses
- Tool executions appear in correct order
- No visual flipping of messages

### User Message Timestamp Adjustment

To ensure user messages appear before streaming agent responses:

```typescript
if (message.source === "user") {
  let timestamp = Date.now();

  // If agent is already streaming, place user message BEFORE it
  if (streamingStartTimestampRef.current) {
    timestamp = streamingStartTimestampRef.current - 1; // 1ms before
  }

  return [...prev, {
    role: "user",
    content: message.message,
    timestamp, // ← Adjusted timestamp
  }];
}
```

---

## Audio Playback Control

### Voice Response Muting

The component controls agent voice volume:

```typescript
const [useVoiceResponse, setUseVoiceResponse] = React.useState(true);

// Update volume when useVoiceResponse changes
React.useEffect(() => {
  if (agentState === "connected") {
    conversation.setVolume({
      volume: useVoiceResponse ? 1.0 : 0.0
    });
  }
}, [useVoiceResponse, agentState, conversation]);
```

**How it Works:**
- `useVoiceResponse=true` → volume=1.0 (agent speaks)
- `useVoiceResponse=false` → volume=0.0 (agent muted, text only)

**Toggle Button:**

```typescript
<Button onClick={() => setUseVoiceResponse((prev) => !prev)}>
  {useVoiceResponse ? <Volume2 /> : <VolumeX />}
</Button>
```

### Microphone Control

Microphone muting is controlled separately:

```typescript
const [isMuted, setIsMuted] = React.useState(false);

const conversation = useConversation({
  micMuted: inputMode === "voice" ? isMuted : true,
  // ↑ Mute mic if not in voice mode OR if user muted it
});
```

**Rules:**
1. Voice mode + not muted → `micMuted=false` (mic active)
2. Voice mode + muted → `micMuted=true` (mic off)
3. Text/PTT mode → `micMuted=true` (always off)

### MediaStream Cleanup

Prevent memory leaks and "camera in use" indicators:

```typescript
const mediaStreamRef = React.useRef<MediaStream | null>(null);

// Cleanup on disconnect
const handleDisconnect = React.useCallback(() => {
  conversation.endSession();

  // Stop all tracks
  if (mediaStreamRef.current) {
    mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  }

  setIsMuted(false);
}, [conversation]);

// Cleanup on unmount
React.useEffect(() => {
  return () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
  };
}, []);
```

**Why Both?**
- `handleDisconnect`: User clicks "Stop session"
- `useEffect cleanup`: User navigates away / component unmounts

---

## Common Issues & Solutions

### Issue 1: Duplicate Messages

**Symptom:**
- Each message appears twice in the conversation
- Agent responses duplicate

**Causes:**
1. Multiple `useConversation` instances
2. Not checking for existing streaming message
3. Component re-mounting without cleanup

**Solution:**

```typescript
// ✅ GOOD - Single instance
const conversation = useConversation({ /* ... */ });

// ❌ BAD - Multiple instances
const conversation1 = useConversation({ /* ... */ });
const conversation2 = useConversation({ /* ... */ }); // ← Causes duplicates!
```

```typescript
// ✅ GOOD - Update existing message
onMessage: (message) => {
  setMessages((prev) => {
    const streamingId = streamingMessageIdRef.current;
    if (streamingId) {
      const index = prev.findIndex((msg) => msg.id === streamingId);
      if (index !== -1) {
        // Update existing
        const updated = [...prev];
        updated[index] = { ...updated[index], content: message.message };
        return updated;
      }
    }
    // Only add new if no streaming message
    return [...prev, newMessage];
  });
}

// ❌ BAD - Always add new message
onMessage: (message) => {
  setMessages((prev) => [...prev, message]); // ← Creates duplicates!
}
```

### Issue 2: Duplicate Audio Playback

**Symptom:**
- Agent voice plays twice (overlapping/echo)
- Double volume

**Causes:**
1. Multiple `useConversation` hooks
2. Multiple WebSocket connections
3. Component rendered multiple times

**Solution:**

```typescript
// ✅ GOOD - Single hook, single connection
export const VoiceChatRevised = (props) => {
  return (
    <PromptInputProvider>
      <VoiceChatRevisedInner {...props} />
    </PromptInputProvider>
  );
};

const VoiceChatRevisedInner = () => {
  const conversation = useConversation({ /* ... */ }); // ← One instance
  // ...
};

// ❌ BAD - Multiple components with hooks
export const VoiceChatRevised = () => {
  const conversation = useConversation({ /* ... */ }); // ← Instance 1
  return <OtherComponent />;
};

const OtherComponent = () => {
  const conversation = useConversation({ /* ... */ }); // ← Instance 2 (duplicate!)
};
```

### Issue 3: Streaming Doesn't Work

**Symptom:**
- No streaming text (only final message)
- Blank message then sudden full text

**Causes:**
1. Not handling `onDebug` events
2. Not tracking streaming message ID
3. Using state instead of refs

**Solution:**

```typescript
// ✅ GOOD - Handle onDebug for streaming
const streamingMessageIdRef = useRef<string | null>(null);

const conversation = useConversation({
  onDebug: (event) => {
    if (event.type === "agent_chat_response_part") {
      const chunk = event.text_response_part;

      if (chunk?.type === "start") {
        // Create streaming message
        const messageId = `streaming-${Date.now()}`;
        streamingMessageIdRef.current = messageId;
        setMessages((prev) => [...prev, {
          id: messageId,
          content: "",
          role: "assistant"
        }]);
      } else if (chunk?.type === "delta") {
        // Append to streaming message
        setMessages((prev) => {
          const index = prev.findIndex(
            (msg) => msg.id === streamingMessageIdRef.current
          );
          if (index === -1) return prev;
          const updated = [...prev];
          updated[index].content += chunk.text;
          return updated;
        });
      }
    }
  },
  onMessage: (message) => {
    // Update final message
  }
});

// ❌ BAD - Only using onMessage
const conversation = useConversation({
  onMessage: (message) => {
    // Final message only, no streaming!
    setMessages((prev) => [...prev, message]);
  }
  // Missing onDebug!
});
```

### Issue 4: Stale Message References

**Symptom:**
- Streaming text doesn't appear
- Wrong message gets updated
- Console shows "message not found"

**Cause:**
- Using state instead of refs for tracking IDs

**Solution:**

```typescript
// ✅ GOOD - Use refs for tracking
const streamingMessageIdRef = useRef<string | null>(null);

onDebug: (event) => {
  if (chunk?.type === "start") {
    const id = `streaming-${Date.now()}`;
    streamingMessageIdRef.current = id; // ← Ref updated immediately
  }
}

onMessage: (message) => {
  const currentId = streamingMessageIdRef.current; // ← Always current
}

// ❌ BAD - Use state (stale closures)
const [streamingId, setStreamingId] = useState<string | null>(null);

onDebug: (event) => {
  if (chunk?.type === "start") {
    setStreamingId(`streaming-${Date.now()}`); // ← Updates later
  }
}

onMessage: (message) => {
  // streamingId here is from when callback was created!
  const currentId = streamingId; // ← Stale value!
}
```

### Issue 5: Messages Out of Order

**Symptom:**
- Agent response appears before user message
- Messages jump around

**Cause:**
- Not using timestamps
- Not adjusting user message timestamps

**Solution:**

```typescript
// ✅ GOOD - Timestamp-based ordering
const timeline = useMemo(() => {
  const items = [
    ...messages.map((msg) => ({ type: "message", data: msg })),
    ...executions.map((exec) => ({ type: "tool", data: exec })),
  ];
  return items.sort((a, b) => a.data.timestamp - b.data.timestamp);
}, [messages, executions]);

// Adjust user message timestamp if streaming started
if (message.source === "user") {
  let timestamp = Date.now();
  if (streamingStartTimestampRef.current) {
    timestamp = streamingStartTimestampRef.current - 1; // Before agent
  }
  return [...prev, { ...message, timestamp }];
}

// ❌ BAD - No ordering
{messages.map((msg) => <Message>{msg.content}</Message>)}
```

### Issue 6: Memory Leaks with MediaStream

**Symptom:**
- Microphone stays active after disconnect
- "Camera in use" indicator persists
- Memory usage increases

**Cause:**
- Not cleaning up MediaStream

**Solution:**

```typescript
// ✅ GOOD - Clean up streams
const mediaStreamRef = useRef<MediaStream | null>(null);

const handleDisconnect = () => {
  conversation.endSession();

  if (mediaStreamRef.current) {
    mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }
};

useEffect(() => {
  return () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  };
}, []);

// ❌ BAD - No cleanup
const handleDisconnect = () => {
  conversation.endSession();
  // MediaStream still active!
};
```

---

## Best Practices Checklist

### ✅ Component Structure

- [ ] Single `useConversation` hook instance per app
- [ ] Wrap component in `PromptInputProvider`
- [ ] Use separate inner component for hook logic
- [ ] Proper cleanup in `useEffect` return

### ✅ Message Handling

- [ ] Handle both `onDebug` (streaming) and `onMessage` (final)
- [ ] Use refs for tracking streaming message IDs
- [ ] Assign unique IDs to streaming messages
- [ ] Update existing messages instead of adding duplicates
- [ ] Sort messages by timestamp for chronological order
- [ ] Adjust user message timestamps when streaming is active

### ✅ Audio Control

- [ ] Single volume control via `conversation.setVolume()`
- [ ] Separate microphone mute state
- [ ] Conditionally mute mic based on input mode
- [ ] Clean up MediaStream on disconnect and unmount
- [ ] Stop all tracks when ending session

### ✅ State Management

- [ ] Use refs for values accessed in callbacks
- [ ] Use state for values that trigger re-renders
- [ ] Clear refs after use (prevent memory leaks)
- [ ] Use `useMemo` for expensive computations
- [ ] Memoize message components to prevent re-renders

### ✅ Error Handling

- [ ] Handle connection errors gracefully
- [ ] Display error messages to user
- [ ] Don't auto-disconnect on errors
- [ ] Provide dismiss button for errors
- [ ] Log errors for debugging

### ✅ Performance

- [ ] Memo `MessageResponse` component
- [ ] Use `useMemo` for timeline sorting
- [ ] Batch state updates with functional setState
- [ ] Clean up subscriptions and listeners
- [ ] Avoid unnecessary re-renders

---

## Quick Debugging Guide

### Duplicate Messages?

1. Check: Do you have multiple `useConversation` hooks?
2. Check: Are you updating existing messages or always adding new?
3. Check: Is your component rendering multiple times?
4. Solution: Use single hook, update by ID, use React.StrictMode in dev

### Duplicate Audio?

1. Check: Multiple `useConversation` hooks?
2. Check: Multiple WebSocket connections in network tab?
3. Check: Component mounted multiple times in DOM?
4. Solution: Single hook, single connection, proper provider wrapping

### No Streaming?

1. Check: Is `onDebug` handler implemented?
2. Check: Are streaming chunks being logged?
3. Check: Using refs or state for message ID tracking?
4. Check: Is message ID being found when updating?
5. Solution: Implement onDebug, use refs, verify message updates

### Messages Out of Order?

1. Check: Are messages sorted by timestamp?
2. Check: Are user message timestamps adjusted?
3. Check: Are tool executions included in timeline?
4. Solution: Sort by timestamp, adjust user timestamps, include all items

### Microphone Won't Stop?

1. Check: Is MediaStream cleanup implemented?
2. Check: Are all tracks being stopped?
3. Check: Is cleanup in both disconnect and unmount?
4. Solution: Stop all tracks, clean up refs, verify in useEffect cleanup

---

## Code Template

Use this template as a starting point:

```typescript
"use client";

import * as React from "react";
import { useConversation } from "@elevenlabs/react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  id?: string;
}

const VoiceChatInner = () => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const streamingMessageIdRef = React.useRef<string | null>(null);
  const streamingStartTimestampRef = React.useRef<number | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected");
    },
    onDisconnect: () => {
      console.log("Disconnected");
    },
    onDebug: (event: unknown) => {
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

        if (chunk?.type === "start") {
          const now = Date.now();
          const messageId = `streaming-${now}`;
          streamingMessageIdRef.current = messageId;
          streamingStartTimestampRef.current = now;

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "",
              timestamp: now,
              id: messageId,
            },
          ]);
        } else if (chunk?.type === "delta" && chunk.text) {
          setMessages((prev) => {
            const streamingId = streamingMessageIdRef.current;
            if (!streamingId) return prev;

            const messageIndex = prev.findIndex(
              (msg) => msg.id === streamingId
            );
            if (messageIndex === -1) return prev;

            const updatedMessages = [...prev];
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              content: updatedMessages[messageIndex].content + chunk.text,
            };
            return updatedMessages;
          });
        }
      }
    },
    onMessage: (message) => {
      if (message.source === "user") {
        let timestamp = Date.now();
        if (streamingStartTimestampRef.current) {
          timestamp = streamingStartTimestampRef.current - 1;
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "user",
            content: message.message,
            timestamp,
          },
        ]);
      } else {
        setMessages((prev) => {
          const streamingId = streamingMessageIdRef.current;
          if (streamingId) {
            const messageIndex = prev.findIndex(
              (msg) => msg.id === streamingId
            );
            if (messageIndex !== -1) {
              const updatedMessages = [...prev];
              updatedMessages[messageIndex] = {
                ...updatedMessages[messageIndex],
                content: message.message,
              };
              streamingMessageIdRef.current = null;
              streamingStartTimestampRef.current = null;
              return updatedMessages;
            }
          }

          streamingMessageIdRef.current = null;
          streamingStartTimestampRef.current = null;
          return [
            ...prev,
            {
              role: "assistant",
              content: message.message,
              timestamp: Date.now(),
            },
          ];
        });
      }
    },
    onError: (error) => {
      console.error("Error:", error);
    },
  });

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div>
      {messages.map((msg, idx) => (
        <div key={`${msg.id || idx}-${msg.timestamp}`}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}
    </div>
  );
};

export const VoiceChat = () => {
  return (
    <PromptInputProvider>
      <VoiceChatInner />
    </PromptInputProvider>
  );
};
```

---

## Summary

**Key Principles:**
1. **One Hook** - Single `useConversation` instance
2. **Use Refs** - For values accessed in callbacks
3. **Track IDs** - Unique IDs for streaming messages
4. **Update, Don't Add** - Find and update existing messages
5. **Clean Up** - Stop streams and clear refs
6. **Sort by Time** - Chronological message ordering

Following these principles prevents duplicate messages, duplicate audio, and streaming issues.
