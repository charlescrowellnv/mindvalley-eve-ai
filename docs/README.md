# VoiceChatRevised & ElevenLabs – Docs Index

Canonical docs for debugging and implementing the voice chat component.

## Primary guides (read first)

| Doc | Purpose |
|-----|--------|
| **[WHY-ONDEBUG-NOT-FIRING.md](./WHY-ONDEBUG-NOT-FIRING.md)** | Why `onDebug` might not fire and how to fix it. Confirmed working setup, event shape (`agent_chat_response_part` + `text_response_part`), and verification steps. |
| **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** | Checklist for duplicate messages, duplicate audio, no streaming, message order, mic cleanup, volume, tools, connection errors, performance. |
| **[MESSAGE-TO-OTHER-AGENTS.md](./MESSAGE-TO-OTHER-AGENTS.md)** | Message for other agents: correct event shape and implementation; avoid wrong conclusions about the SDK. |

## Supporting

| Doc | Purpose |
|-----|--------|
| **[STREAMING-ONDEBUG.md](./STREAMING-ONDEBUG.md)** | Short note on streaming and onDebug; defers to WHY-ONDEBUG-NOT-FIRING and documents that both `agent_chat_response_part` and `tentative_agent_response` can be handled. |

## Root technical reference

- **[../TECHNICAL-GUIDE.md](../TECHNICAL-GUIDE.md)** – Architecture, message handling, streaming, audio, and best practices for VoiceChatRevised.
