# Why onDebug Isn't Firing (Debugging Guide)

## Confirmed Working Implementation

The original VoiceChatRevised code **DOES work** and **DOES receive streaming events**. Console logs from working implementation show:

```
[Debug Event] Object
[Streaming chunk] Object  ← Proves onDebug is firing!
[Debug Event] Object
[Streaming chunk] Object
```

The event shape in TECHNICAL-GUIDE.md is **CORRECT**:
```typescript
{
  type: "agent_chat_response_part",
  text_response_part: {
    type: "start" | "delta" | "stop",
    text?: string
  }
}
```

## If onDebug Isn't Firing for You

If your implementation isn't receiving `onDebug` events, here's what to check:

### 1. Check SDK Version

```bash
npm list @elevenlabs/react
```

**Working version:** `@elevenlabs/react@^0.7.1`

The other agents may have a different version that behaves differently. Ensure you're using the same version as the working implementation.

### 2. Check Agent Configuration

The ElevenLabs agent must be properly configured to send streaming responses:

1. Go to https://elevenlabs.io/app/conversational-ai
2. Select your agent
3. Check settings:
   - ✅ Streaming should be enabled
   - ✅ Agent should be published/active
   - ✅ Check any advanced settings related to responses

### 3. Verify Connection Type

```typescript
await conversation.startSession({
  agentId,
  connectionType: "websocket",  // ← Must be websocket, not REST
  onStatusChange: (status) => setAgentState(status.status),
});
```

**Important:**
- `connectionType: "websocket"` is required for streaming
- REST connections won't stream

### 4. Check Event Handler Registration

The `onDebug` handler must be passed to `useConversation`, NOT to `startSession`:

```typescript
// ✅ CORRECT - Pass to useConversation
const conversation = useConversation({
  onDebug: (event) => {
    console.log("[Debug Event]", event);
  },
  onMessage: (message) => {
    console.log("[onMessage]", message);
  }
});

// Later...
await conversation.startSession({ agentId });

// ❌ WRONG - Don't pass to startSession
await conversation.startSession({
  agentId,
  onDebug: (event) => { /* ... */ }  // ← Won't work here!
});
```

### 5. Add Detailed Logging

Replace your onDebug handler temporarily with this to see ALL events:

```typescript
onDebug: (event: unknown) => {
  console.log("============ onDebug FIRED ============");
  console.log("Event type:", typeof event);
  console.log("Event keys:", event && typeof event === "object" ? Object.keys(event) : "N/A");
  console.log("Full event:", JSON.stringify(event, null, 2));
  console.log("======================================");
},
```

**If you see NOTHING in console:**
- onDebug handler isn't being called at all
- Check handler is passed to `useConversation` (not `startSession`)
- Check WebSocket connection is established

**If you see events but different shape:**
- Log the exact event structure
- Compare with working implementation
- May be SDK version difference

### 6. Check WebSocket Messages

1. Open DevTools → Network → WS (WebSocket)
2. Click on the WebSocket connection
3. Go to Messages tab
4. Look for messages from server

**What to look for:**
- Messages with `type: "agent_chat_response_part"` or similar
- Streaming text data
- Any error messages

**If no messages:**
- WebSocket isn't connected properly
- Check `connectionType: "websocket"`
- Check network/firewall

**If messages present but onDebug not firing:**
- SDK isn't forwarding messages to onDebug
- Check SDK version
- Check handler registration

### 7. Compare Package Versions

Get exact versions from working implementation:

```bash
# In working project
npm list @elevenlabs/react @elevenlabs/client
```

Then match those exact versions in your project:

```bash
npm install @elevenlabs/react@0.7.1 --save-exact
```

### 8. Check for Multiple useConversation Instances

```typescript
// Search your codebase for:
const conversation = useConversation

// Should appear EXACTLY ONCE
// If multiple instances exist, events may go to wrong handler
```

### 9. Environment Variables

Ensure you're using the same agent ID:

```bash
# .env.local
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_3101khcq0cdkengstvz5qadxegf6
```

Different agents may have different streaming configurations.

### 10. Check React StrictMode

In development, React StrictMode can cause double-mounting:

```typescript
// layout.tsx or _app.tsx
<React.StrictMode>  {/* ← May cause issues */}
  <App />
</React.StrictMode>
```

Try temporarily removing StrictMode to see if it helps.

## Common Mistakes Leading to "onDebug Not Firing"

### Mistake 1: Wrong Hook
```typescript
// ❌ WRONG
import { useConversation } from '@elevenlabs/client';  // Wrong package!

// ✅ CORRECT
import { useConversation } from '@elevenlabs/react';
```

### Mistake 2: Handler in Wrong Place
```typescript
// ❌ WRONG
await conversation.startSession({
  agentId,
  onDebug: (e) => console.log(e),  // ← Won't work
});

// ✅ CORRECT
const conversation = useConversation({
  onDebug: (e) => console.log(e),  // ← Correct
});
```

### Mistake 3: Not Using WebSocket
```typescript
// ❌ WRONG (or missing)
await conversation.startSession({ agentId });  // Defaults to REST?

// ✅ CORRECT
await conversation.startSession({
  agentId,
  connectionType: "websocket",
});
```

### Mistake 4: Different SDK Package
```typescript
// ❌ WRONG - Using vanilla client
import { Conversation } from '@elevenlabs/client';

// ✅ CORRECT - Using React SDK
import { useConversation } from '@elevenlabs/react';
```

## Verification Steps

### Step 1: Add Debug Logging
```typescript
const conversation = useConversation({
  onConnect: () => {
    console.log("✅ CONNECTED");
  },
  onDisconnect: () => {
    console.log("❌ DISCONNECTED");
  },
  onDebug: (event) => {
    console.log("🔍 onDebug FIRED:", event);
  },
  onMessage: (message) => {
    console.log("💬 onMessage FIRED:", message);
  },
  onError: (error) => {
    console.error("⚠️ ERROR:", error);
  },
});
```

### Step 2: Start Session
```typescript
const handleConnect = async () => {
  console.log("🚀 Starting session...");
  await conversation.startSession({
    agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
    connectionType: "websocket",
  });
  console.log("✅ Session started");
};
```

### Step 3: Expected Console Output
```
🚀 Starting session...
✅ CONNECTED
✅ Session started
[User speaks]
🔍 onDebug FIRED: { type: "agent_chat_response_part", ... }
🔍 onDebug FIRED: { type: "agent_chat_response_part", ... }
💬 onMessage FIRED: { source: "assistant", message: "..." }
```

**If you see:**
- ✅ CONNECTED but no 🔍 onDebug → Check agent config or SDK version
- Nothing at all → Check handler registration
- Only 💬 onMessage → Streaming not enabled or SDK not forwarding

## Working Configuration Summary

From the verified working implementation:

```typescript
// Package versions
"@elevenlabs/react": "^0.7.1"

// Component setup
const conversation = useConversation({
  onDebug: (event: unknown) => {
    console.log("[Debug Event]", event);

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

      // Handle start/delta/stop...
    }
  },
  onMessage: (message) => {
    console.log("[onMessage]", message);
    // Handle final message...
  },
});

// Session start
await conversation.startSession({
  agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
  connectionType: "websocket",
  onStatusChange: (status) => setAgentState(status.status),
});
```

**This configuration WORKS and produces the streaming chunk logs.**

## If Still Not Working

1. **Copy the exact working code** from VoiceChatRevised.tsx
2. **Match package versions exactly** (check package.json)
3. **Use the same agent ID** (check .env.local)
4. **Test in the same browser** (Chrome/Edge recommended)
5. **Check ElevenLabs dashboard** for agent settings

The issue is likely:
- SDK version mismatch
- Different agent configuration
- Handler registered incorrectly
- Different package (@elevenlabs/client vs @elevenlabs/react)

## Conclusion

The original implementation **IS CORRECT** and **DOES WORK**. The event shape documented in TECHNICAL-GUIDE.md is accurate. If your implementation isn't receiving events, it's a configuration or version issue, not an SDK limitation.

**The SDK DOES send `agent_chat_response_part` events with the documented structure when properly configured.**
