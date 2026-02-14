# VoiceChatRevised Troubleshooting Checklist

Quick reference guide for diagnosing and fixing common issues with the VoiceChatRevised component.

---

## 🔍 Duplicate Messages

### Symptoms
- Each message appears twice in the UI
- Agent responses duplicated
- Message count grows faster than expected

### Diagnosis Checklist

```typescript
// 1. Check: Single useConversation instance?
// ✅ GOOD
const conversation = useConversation({ /* ... */ });

// ❌ BAD - Multiple instances
const conv1 = useConversation({ /* ... */ });
const conv2 = useConversation({ /* ... */ });
```

```typescript
// 2. Check: Are you updating existing messages?
// ✅ GOOD
onMessage: (message) => {
  setMessages((prev) => {
    const index = prev.findIndex((msg) => msg.id === streamingId);
    if (index !== -1) {
      // Update existing
      const updated = [...prev];
      updated[index] = { ...updated[index], content: message.message };
      return updated;
    }
    return [...prev, newMessage]; // Only add if not found
  });
}

// ❌ BAD - Always adding
onMessage: (message) => {
  setMessages((prev) => [...prev, message]); // Duplicates!
}
```

```typescript
// 3. Check: Using refs for streaming ID?
// ✅ GOOD
const streamingMessageIdRef = useRef<string | null>(null);

// ❌ BAD - Using state (stale closures)
const [streamingId, setStreamingId] = useState<string | null>(null);
```

### Quick Fix

1. Search codebase for `useConversation` - should appear **once**
2. Verify `onMessage` checks for existing message before adding
3. Use refs (`useRef`) for `streamingMessageIdRef`
4. Verify component wrapped in single `PromptInputProvider`

---

## 🔊 Duplicate Audio Playback

### Symptoms
- Agent voice plays twice (echo/overlay)
- Volume twice as loud as expected
- Audio continues after disconnect

### Diagnosis Checklist

```typescript
// 1. Check: Single conversation hook?
// Search your app for:
const conversation = useConversation
// Should appear ONCE in entire app
```

```typescript
// 2. Check: Wrapped in provider?
// ✅ GOOD
export const VoiceChat = () => (
  <PromptInputProvider>
    <VoiceChatInner /> {/* Hook inside here */}
  </PromptInputProvider>
);

// ❌ BAD - Multiple providers
<PromptInputProvider>
  <ComponentA /> {/* Has useConversation */}
  <ComponentB /> {/* Also has useConversation - DUPLICATE! */}
</PromptInputProvider>
```

```typescript
// 3. Check: Component mounting multiple times?
// Open React DevTools → Components
// Search for your component name
// Should see it ONCE in the tree
```

### Network Check

1. Open browser DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Start a session
4. **Expected:** 1 WebSocket connection
5. **Problem:** 2+ WebSocket connections = duplicate audio

### Quick Fix

1. Remove all but one `useConversation` hook
2. Ensure component renders once (check React DevTools)
3. Verify single WebSocket in Network tab
4. Clear React.StrictMode if in development (it double-renders)

---

## 📝 No Streaming Text

### Symptoms
- Blank message, then full text appears suddenly
- No incremental text updates
- Only final message shows

### Diagnosis Checklist

```typescript
// 1. Check: onDebug handler implemented?
// ✅ GOOD
const conversation = useConversation({
  onDebug: (event) => {
    if (event.type === "agent_chat_response_part") {
      // Handle streaming chunks
    }
  },
  onMessage: (message) => {
    // Handle final message
  }
});

// ❌ BAD - Missing onDebug
const conversation = useConversation({
  onMessage: (message) => {
    // Only final message, no streaming!
  }
  // Missing onDebug!
});
```

```typescript
// 2. Check: Creating streaming message on "start"?
// ✅ GOOD
if (chunk?.type === "start") {
  const messageId = `streaming-${Date.now()}`;
  streamingMessageIdRef.current = messageId;
  setMessages((prev) => [...prev, {
    id: messageId,
    content: "", // Empty initially
    role: "assistant"
  }]);
}

// ❌ BAD - Not creating message
if (chunk?.type === "start") {
  // Nothing happens - no message created!
}
```

```typescript
// 3. Check: Appending to existing message?
// ✅ GOOD
else if (chunk?.type === "delta" && chunk.text) {
  setMessages((prev) => {
    const index = prev.findIndex(
      (msg) => msg.id === streamingMessageIdRef.current
    );
    if (index !== -1) {
      const updated = [...prev];
      updated[index].content += chunk.text; // Append
      return updated;
    }
    return prev;
  });
}

// ❌ BAD - Not updating
else if (chunk?.type === "delta") {
  // Nothing happens - text not appended!
}
```

### Debugging Steps

1. Add console.log in `onDebug`:
   ```typescript
   onDebug: (event) => {
     console.log("[onDebug]", event);
     // Check if you see streaming events
   }
   ```

2. Check browser console for:
   - `type: "agent_chat_response_part"`
   - `text_response_part: { type: "start" }`
   - `text_response_part: { type: "delta", text: "..." }`
   - `text_response_part: { type: "stop" }`

3. If no events → Check ElevenLabs agent configuration
4. If events present → Check message update logic

### Quick Fix

1. Implement `onDebug` handler
2. Handle `type: "start"` → Create message with ID
3. Handle `type: "delta"` → Append to message by ID
4. Use refs for `streamingMessageIdRef`
5. Verify message updates in React DevTools

---

## ⏱️ Messages Out of Order

### Symptoms
- Agent response appears before user message
- Messages jump/reorder
- Timeline not chronological

### Diagnosis Checklist

```typescript
// 1. Check: Sorting by timestamp?
// ✅ GOOD
const timeline = useMemo(() => {
  const items = [
    ...messages.map((msg) => ({ type: "message", data: msg })),
    ...executions.map((exec) => ({ type: "tool", data: exec })),
  ];
  return items.sort((a, b) => a.data.timestamp - b.data.timestamp);
}, [messages, executions]);

// ❌ BAD - No sorting
const timeline = [...messages, ...executions]; // Order undefined!
```

```typescript
// 2. Check: Adjusting user message timestamps?
// ✅ GOOD
if (message.source === "user") {
  let timestamp = Date.now();
  if (streamingStartTimestampRef.current) {
    timestamp = streamingStartTimestampRef.current - 1; // Before agent
  }
  return [...prev, { ...message, timestamp }];
}

// ❌ BAD - Same timestamp
if (message.source === "user") {
  return [...prev, { ...message, timestamp: Date.now() }]; // Might be after!
}
```

```typescript
// 3. Check: Timestamp on all items?
// ✅ GOOD
interface ChatMessage {
  timestamp: number; // ← Required
  // ...
}

interface ToolExecution {
  timestamp: number; // ← Required
  // ...
}

// ❌ BAD - Missing timestamps
interface ChatMessage {
  // No timestamp!
}
```

### Quick Fix

1. Ensure all messages have `timestamp: number` field
2. Sort timeline by timestamp before rendering
3. Adjust user message timestamps when streaming is active
4. Use `useMemo` to avoid re-sorting on every render

---

## 🎤 Microphone Won't Stop

### Symptoms
- Microphone indicator stays on after disconnect
- "Camera in use" persists
- Permission prompt on every connect

### Diagnosis Checklist

```typescript
// 1. Check: Cleaning up MediaStream?
// ✅ GOOD
const mediaStreamRef = useRef<MediaStream | null>(null);

const handleDisconnect = () => {
  conversation.endSession();

  if (mediaStreamRef.current) {
    mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }
};

// ❌ BAD - No cleanup
const handleDisconnect = () => {
  conversation.endSession();
  // MediaStream still active!
};
```

```typescript
// 2. Check: Cleanup on unmount?
// ✅ GOOD
useEffect(() => {
  return () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  };
}, []);

// ❌ BAD - No unmount cleanup
useEffect(() => {
  // No cleanup function!
}, []);
```

```typescript
// 3. Check: Stopping all tracks?
// ✅ GOOD
mediaStreamRef.current.getTracks().forEach((track) => {
  track.stop(); // Stop each track
});

// ❌ BAD - Not stopping tracks
mediaStreamRef.current = null; // Just clearing ref, tracks still active!
```

### Browser Check

1. Click microphone icon in browser address bar
2. Check permissions for your site
3. If showing "In use" after disconnect → tracks not stopped

### Quick Fix

1. Store MediaStream in ref
2. Stop all tracks on disconnect:
   ```typescript
   stream.getTracks().forEach(track => track.stop());
   ```
3. Add cleanup in `useEffect` return
4. Clear ref after stopping tracks

---

## 🔇 Voice Volume Not Working

### Symptoms
- Agent still speaks when "muted"
- Volume toggle doesn't work
- Can't control agent voice

### Diagnosis Checklist

```typescript
// 1. Check: Setting volume in useEffect?
// ✅ GOOD
const [useVoiceResponse, setUseVoiceResponse] = useState(true);

useEffect(() => {
  if (agentState === "connected") {
    conversation.setVolume({
      volume: useVoiceResponse ? 1.0 : 0.0
    });
  }
}, [useVoiceResponse, agentState, conversation]);

// ❌ BAD - No volume control
// Missing useEffect or setVolume call
```

```typescript
// 2. Check: Volume range correct?
// ✅ GOOD
conversation.setVolume({ volume: 1.0 }); // 0.0 to 1.0

// ❌ BAD - Wrong range
conversation.setVolume({ volume: 100 }); // Should be 0.0-1.0!
```

```typescript
// 3. Check: Mic mute vs agent volume?
// ✅ GOOD - Separate controls
const [isMuted, setIsMuted] = useState(false); // User mic
const [useVoiceResponse, setUseVoiceResponse] = useState(true); // Agent voice

conversation.micMuted = isMuted; // Controls user mic
conversation.setVolume({ volume: useVoiceResponse ? 1.0 : 0.0 }); // Controls agent

// ❌ BAD - Mixing controls
const [isMuted, setIsMuted] = useState(false);
conversation.micMuted = isMuted; // This is for USER mic, not agent!
```

### Quick Fix

1. Use `conversation.setVolume({ volume: 0.0 })` for agent muting
2. Use `micMuted` prop for user microphone
3. Keep controls separate (mic ≠ agent volume)
4. Call `setVolume` in useEffect when state changes

---

## 🛠️ Tool Executions Not Showing

### Symptoms
- Tool calls not visible in UI
- Tools execute but no visual feedback
- Tool results missing

### Diagnosis Checklist

```typescript
// 1. Check: useToolExecution hook?
// ✅ GOOD
const { executions, addExecution, updateExecution } = useToolExecution();

// ❌ BAD - Missing hook
// No tool execution tracking
```

```typescript
// 2. Check: Tool context passed to client tools?
// ✅ GOOD
const toolContext = useMemo(() => ({
  onToolStart: (toolName, parameters) => {
    return addExecution(toolName, parameters);
  },
  onToolComplete: (id, result) => {
    updateExecution(id, { state: "completed", result });
  },
  onToolError: (id, error) => {
    updateExecution(id, { state: "error", error });
  },
}), [addExecution, updateExecution]);

const conversation = useConversation({
  clientTools: createClientTools(toolContext),
});

// ❌ BAD - No context
const conversation = useConversation({
  clientTools: createClientTools(), // Missing context!
});
```

```typescript
// 3. Check: Rendering tool executions?
// ✅ GOOD
const timeline = useMemo(() => {
  return [
    ...messages.map((msg) => ({ type: "message", data: msg })),
    ...executions.map((exec) => ({ type: "tool", data: exec })), // ← Include
  ].sort((a, b) => a.data.timestamp - b.data.timestamp);
}, [messages, executions]);

{timeline.map((item) =>
  item.type === "tool" ? (
    <ToolExecutionDisplay {...item.data} />
  ) : (
    <Message {...item.data} />
  )
)}

// ❌ BAD - Only rendering messages
{messages.map((msg) => <Message {...msg} />)}
// Missing tool executions!
```

### Quick Fix

1. Import and use `useToolExecution` hook
2. Create tool context with callbacks
3. Pass context to `createClientTools()`
4. Include executions in timeline
5. Render tool components alongside messages

---

## 🔴 Connection Errors

### Symptoms
- "Connection failed" errors
- "Agent not found"
- WebSocket errors in console

### Diagnosis Checklist

```bash
# 1. Check: Environment variable set?
# ✅ GOOD
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_3101khcq0cdkengstvz5qadxegf6

# ❌ BAD - Missing or wrong
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=
ELEVENLABS_AGENT_ID=agent_... # Wrong prefix (missing NEXT_PUBLIC_)
```

```typescript
// 2. Check: Using correct agent ID?
// ✅ GOOD
const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
console.log("Agent ID:", agentId); // Should print actual ID

// ❌ BAD - Hardcoded or undefined
const agentId = "your_agent_id_here"; // Not replaced!
const agentId = undefined; // Not loaded!
```

```typescript
// 3. Check: Error handling?
// ✅ GOOD
const conversation = useConversation({
  onError: (error) => {
    console.error("Connection error:", error);
    setErrorMessage(error.message);
  }
});

// ❌ BAD - No error handling
const conversation = useConversation({
  // Missing onError!
});
```

### Network Check

1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Start session
4. Check WebSocket status:
   - ✅ 101 Switching Protocols (success)
   - ❌ 400/401/404 (check agent ID)
   - ❌ Connection refused (check network/firewall)

### Quick Fix

1. Verify `.env.local` has correct `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`
2. Restart dev server after changing env vars
3. Check agent exists in ElevenLabs dashboard
4. Implement `onError` handler to see error details
5. Check browser console for detailed errors

---

## 📊 Performance Issues

### Symptoms
- Lag when typing or speaking
- UI freezes during streaming
- High memory usage
- Slow rendering

### Diagnosis Checklist

```typescript
// 1. Check: Memoizing expensive computations?
// ✅ GOOD
const timeline = useMemo(() => {
  return items.sort((a, b) => a.timestamp - b.timestamp);
}, [messages, executions]); // Only recompute when these change

// ❌ BAD - Sorting on every render
const timeline = messages.concat(executions).sort(...); // Slow!
```

```typescript
// 2. Check: Memoizing message components?
// ✅ GOOD
export const MessageResponse = memo(
  ({ children, ...props }) => <Streamdown {...props}>{children}</Streamdown>,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

// ❌ BAD - Re-rendering every message
export const MessageResponse = ({ children }) => (
  <Streamdown>{children}</Streamdown>
);
```

```typescript
// 3. Check: Unique keys for list items?
// ✅ GOOD
{timeline.map((item) => (
  <div key={`${item.type}-${item.data.id}-${item.data.timestamp}`}>
    {/* ... */}
  </div>
))}

// ❌ BAD - Index as key
{timeline.map((item, index) => (
  <div key={index}> {/* React can't optimize! */}
    {/* ... */}
  </div>
))}
```

### React DevTools Check

1. Install React DevTools extension
2. Open DevTools → Profiler tab
3. Click record
4. Interact with app (send message)
5. Stop recording
6. Look for:
   - Long render times (>16ms)
   - Many re-renders
   - Large component trees re-rendering

### Quick Fix

1. Use `useMemo` for timeline sorting
2. Use `memo` for message components
3. Use stable keys (IDs + timestamps, not indexes)
4. Avoid inline function/object creation in render
5. Batch state updates with functional setState

---

## 🧪 Testing Your Fixes

### After Each Fix, Test:

1. **Duplicate Messages:**
   ```
   1. Start session
   2. Send 3 messages
   3. Count messages in UI
   4. Should see exactly 3 user + 3 agent messages
   ```

2. **Duplicate Audio:**
   ```
   1. Start session
   2. Speak to agent
   3. Listen to response
   4. Should hear single voice (not echo)
   ```

3. **Streaming:**
   ```
   1. Start session
   2. Ask a long question
   3. Watch agent response
   4. Should see text appear gradually (not all at once)
   ```

4. **Message Order:**
   ```
   1. Start session
   2. Send message
   3. Watch timeline
   4. User message should appear BEFORE agent response
   ```

5. **Microphone Cleanup:**
   ```
   1. Start session (mic active)
   2. Stop session
   3. Check browser mic indicator
   4. Should turn off immediately
   ```

---

## 📞 Still Having Issues?

### Collect Debug Information

```typescript
// Add comprehensive logging
const conversation = useConversation({
  onConnect: () => console.log("[CONNECT]"),
  onDisconnect: () => console.log("[DISCONNECT]"),
  onDebug: (event) => console.log("[DEBUG]", event),
  onMessage: (message) => console.log("[MESSAGE]", message),
  onError: (error) => console.error("[ERROR]", error),
});
```

### Information to Gather

1. Browser console logs
2. Network tab (WebSocket messages)
3. React DevTools component tree
4. Environment variables (sanitized)
5. Code diff from working version

### Common Root Causes

- ✅ Single `useConversation` hook
- ✅ Proper provider wrapping
- ✅ Using refs for callback values
- ✅ Cleaning up resources
- ✅ Correct environment setup

Most issues come from violating one of these principles.
