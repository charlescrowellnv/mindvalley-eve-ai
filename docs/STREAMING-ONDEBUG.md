# Streaming & onDebug – Aligned with Working Implementation

**Canonical guidance:** See **[WHY-ONDEBUG-NOT-FIRING.md](./WHY-ONDEBUG-NOT-FIRING.md)** and **[MESSAGE-TO-OTHER-AGENTS.md](./MESSAGE-TO-OTHER-AGENTS.md)** first. The working VoiceChatRevised implementation receives streaming events; if `onDebug` isn’t firing, the cause is usually setup or configuration, not the SDK.

## Event shapes (both can occur)

The SDK can pass two kinds of payloads to `onDebug`:

1. **Raw server events (default branch)**  
   Any WebSocket event type that the SDK doesn’t handle in its switch is passed through to `onDebug` as-is. The **working** implementation receives:
   ```ts
   {
     type: "agent_chat_response_part",
     text_response_part: { type: "start" | "delta" | "stop", text?: string }
   }
   ```
   So the correct, primary shape to handle is **`agent_chat_response_part`** with `text_response_part` (start/delta/stop), as in TECHNICAL-GUIDE.md and WHY-ONDEBUG-NOT-FIRING.md.

2. **Transformed tentative events**  
   When the server sends `internal_tentative_agent_response`, the SDK’s `handleTentativeAgentResponse` calls `onDebug` with:
   ```ts
   { type: "tentative_agent_response", response: string }
   ```
   Our component handles this shape as well so streaming works in either case.

## If onDebug isn’t firing

Do **not** assume the SDK is broken. Follow, in order:

1. **[WHY-ONDEBUG-NOT-FIRING.md](./WHY-ONDEBUG-NOT-FIRING.md)** – Checklist: SDK version, agent config, `connectionType: "websocket"`, handler on `useConversation` (not `startSession`), single instance, env vars, logging.
2. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** – Duplicate messages, duplicate audio, no streaming, message order, mic cleanup, etc.
3. **[MESSAGE-TO-OTHER-AGENTS.md](./MESSAGE-TO-OTHER-AGENTS.md)** – Correct event shape and implementation patterns; avoid implementing only `tentative_agent_response` and ignoring `agent_chat_response_part`.

## Implementation

- Handle **`agent_chat_response_part`** with `text_response_part.type` (start/delta/stop) as the primary path (see WHY-ONDEBUG-NOT-FIRING.md and MESSAGE-TO-OTHER-AGENTS.md).
- Optionally handle **`tentative_agent_response`** with `response` so both server behaviors work.
- Use refs for `streamingMessageIdRef`; pass `onDebug` to `useConversation`; use `connectionType: "websocket"` in `startSession`.
