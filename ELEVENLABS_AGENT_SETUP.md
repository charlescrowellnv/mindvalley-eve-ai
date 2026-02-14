# ElevenLabs Agent Configuration Guide

This guide will help you configure the ElevenLabs Conversational AI agent to match the capabilities of the Vercel text chat.

## 🎯 Overview

The implementation is now complete! Here's what was done:

### ✅ Completed Changes

1. **Client Tools** (`/lib/client-tools.ts`) - Updated to use real program recommendations and conversation suggestions via API endpoints
2. **API Endpoints** - Created two new endpoints:
   - `/api/tools/get-program-recommendations` - Fetches program recommendations
   - `/api/tools/get-conversation-suggestions` - Generates conversation suggestions
3. **Voice Chat UI** (`/components/conversation/voice-chat-revised.tsx`) - Updated to:
   - Render program recommendation cards
   - Render conversation suggestion buttons
   - Display loading states for tools
   - Match text chat styling (removed dashed border, updated spacing, new empty state)

---

## 🔧 ElevenLabs Agent Configuration

### Step 1: Create New Agent

1. Go to https://elevenlabs.io/app/conversational-ai
2. Click **"Create New Agent"**
3. Name it: **"Eve - Mindvalley AI Assistant"**

### Step 2: Model Configuration

| Setting | Value |
|---------|-------|
| **Model** | Claude Sonnet 4.5 (Anthropic) |
| **Provider** | Anthropic |
| **Temperature** | 0.75 |
| **Max Tokens** | 1024 |

### Step 3: System Prompt

Copy and paste this exact prompt:

```
You are EVE (Expert Virtual Educator), Mindvalley's AI assistant. You are a champion for the user's personal growth journey, here to help them discover transformative programs, gain creative insights, and take meaningful action toward their goals.

PRIMARY PURPOSE:
Your ultimate goal is to help users take action - whether that's enrolling in a program, exploring a topic, or reflecting on their growth journey. Success is NOT just recommending programs; it's motivating and inspiring users to move forward.

CONVERSATION FLOW:
1. Start with a warm, encouraging greeting
2. Ask thoughtful follow-up questions to understand their goals and challenges
3. Listen carefully to what they share
4. Offer responsible guidance based on their unique needs
5. When appropriate, recommend relevant programs with clear explanations of why they match

TOOL USAGE GUIDELINES:

For get_program_recommendations:
- Use sparingly - only when you're certain it's the best way to help
- Only after understanding the user's goals and context
- Never use as the first part of your response - always explain your thinking first
- Present 2 or fewer programs to avoid overwhelming users
- Explain WHY each program matches their needs
- Don't include lengthy text after tool results to avoid obscuring the UI cards

For get_conversation_suggestions:
- CRITICAL: Only call this at the VERY END of your response, after all text is sent
- Never use if you've already called get_program_recommendations in the same turn
- Generate 2-4 suggestions as natural next steps in the conversation
- Skip if the conversation appears to be ending or wrapping up
- Keep suggestions concise (3-7 words each)
- Make them specific and conversational, not generic

BEHAVIORAL GUIDELINES:
- Be warm, encouraging, and supportive
- Ask no more than ONE question per response to avoid overwhelming users
- Use markdown formatting for readability (bold, lists, etc.)
- If asked about a specific topic or category, filter recommendations accordingly
- Listen more than you talk - understand before recommending
- Explain your reasoning when suggesting programs
- Be honest if you don't know something

Remember: You're not just a recommendation engine - you're a supportive guide helping people discover their path to growth. Every interaction should feel personal, thoughtful, and encouraging.
```

### Step 4: Voice Configuration

| Setting | Value |
|---------|-------|
| **Voice** | Bella, Grace, or Sarah (choose one that sounds warm and friendly) |
| **Stability** | 0.5 - 0.6 |
| **Similarity** | 0.75 - 0.85 |
| **Speaking Rate** | Normal |
| **Pause Behavior** | Smart pauses enabled |
| **Language** | English |

---

## 🛠️ Client Tools Configuration

You need to add **two client tools** in the ElevenLabs GUI.

### Tool 1: get_program_recommendations

**Tool Name:** `get_program_recommendations`

**Description:**
```
Search and recommend Mindvalley programs based on user goals. Use this when users express specific goals or ask for program recommendations. Only use after understanding their needs - never as first response.
```

**Parameters Schema (JSON):**
```json
{
  "type": "object",
  "properties": {
    "userGoal": {
      "type": "string",
      "description": "The user's goal or area they want help with (e.g., 'improve public speaking', 'reduce stress', 'better sleep')"
    },
    "categories": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["mind", "body", "soul", "career", "relationships", "entrepreneurship"]
      },
      "description": "Optional: Filter by specific categories"
    },
    "maxResults": {
      "type": "number",
      "description": "Maximum number of programs to return (1-10)",
      "default": 5,
      "minimum": 1,
      "maximum": 10
    },
    "includeComingSoon": {
      "type": "boolean",
      "description": "Whether to include programs that haven't launched yet",
      "default": false
    }
  },
  "required": ["userGoal"]
}
```

**Execution Type:** Client-side (JavaScript runs in browser)

---

### Tool 2: get_conversation_suggestions

**Tool Name:** `get_conversation_suggestions`

**Description:**
```
Generate interactive suggestion buttons for the user. CRITICAL: Only use at the VERY END of your response. Never use if you called get_program_recommendations in this turn.
```

**Parameters Schema (JSON):**
```json
{
  "type": "object",
  "properties": {
    "prompt": {
      "type": "string",
      "description": "Question or context to display above the suggestions (e.g., 'What would you like to explore?')"
    },
    "suggestions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "text": {
            "type": "string",
            "description": "The message that will be sent when clicked"
          },
          "label": {
            "type": "string",
            "description": "Display text (optional, defaults to 'text')"
          },
          "type": {
            "type": "string",
            "enum": ["question", "action", "topic"],
            "description": "Type of suggestion for styling (question=blue, action=purple, topic=green)"
          }
        },
        "required": ["text", "type"]
      },
      "minItems": 2,
      "maxItems": 4,
      "description": "Array of 2-4 quick-reply suggestions"
    },
    "context": {
      "type": "string",
      "description": "Optional context for debugging"
    }
  },
  "required": ["prompt", "suggestions"]
}
```

**Execution Type:** Client-side (JavaScript runs in browser)

---

## 🔑 Environment Variables

After creating the agent, copy the **Agent ID** from the ElevenLabs dashboard.

Update your `.env.local` file:

```bash
# ElevenLabs Conversational AI Agent (for voice chat)
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=<paste_your_agent_id_here>
```

**Important:** The agent ID must start with `NEXT_PUBLIC_` to be accessible in the browser.

---

## ✅ Testing Checklist

After configuration, test the following:

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Voice Chat Features

- [ ] Open the app and navigate to voice chat
- [ ] Click "Start session" button
- [ ] Test all three input modes:
  - [ ] **Voice Mode** - Speak freely, agent responds with voice
  - [ ] **Push-to-Talk Mode** - Hold button to speak, release to send
  - [ ] **Text Mode** - Type messages like text chat

### 3. Test Program Recommendations

- [ ] Say: "I want to improve my meditation practice"
- [ ] Agent should:
  - [ ] Ask clarifying questions first
  - [ ] Call `get_program_recommendations` tool
  - [ ] Display program cards with images and CTAs
  - [ ] Explain why each program matches

### 4. Test Conversation Suggestions

- [ ] After agent responds (without showing programs), check for:
  - [ ] Suggestion buttons appear at the bottom
  - [ ] 2-4 suggestions are shown
  - [ ] Clicking a suggestion sends that message
  - [ ] Different colored hover states (blue/purple/green)

### 5. Test Styling Consistency

- [ ] Empty state shows EvaAiIcon and "Hey Changemaker, ready?"
- [ ] No dashed border around conversation
- [ ] Message spacing matches text chat (gap-8)
- [ ] Tool loading states show spinner with "Searching programs..."
- [ ] Error states display with destructive styling

---

## 🎨 Expected User Experience

1. **User opens Voice Chat** → Sees welcoming empty state with Eva icon
2. **User starts session** → Agent greets warmly
3. **User says "I want to reduce stress"** → Agent asks follow-up questions
4. **Agent calls tool** → Shows "Searching programs..." loading state
5. **Program cards appear** → Visually identical to text chat
6. **Agent completes response** → Suggestion buttons appear for next steps
7. **User clicks suggestion** → Message is sent, conversation continues

This creates a unified experience where voice chat feels like text chat with voice capabilities, not a separate interface.

---

## 🐛 Troubleshooting

### Build Issues
```bash
npm run build
```
All builds should succeed. If errors occur, check:
- TypeScript errors in terminal
- API endpoint imports are correct
- Environment variables are set

### Agent Not Connecting
- Verify `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` is set correctly
- Check browser console for connection errors
- Ensure microphone permissions are granted

### Tools Not Working
- Check browser console for API errors
- Verify `/api/tools/*` endpoints are accessible
- Test API endpoints directly with curl:

```bash
# Test program recommendations
curl -X POST http://localhost:3000/api/tools/get-program-recommendations \
  -H "Content-Type: application/json" \
  -d '{"userGoal": "meditation"}'

# Test conversation suggestions
curl -X POST http://localhost:3000/api/tools/get-conversation-suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What would you like to explore?",
    "suggestions": [
      {"text": "Show me programs", "type": "action"},
      {"text": "Tell me more", "type": "question"}
    ]
  }'
```

### Programs Not Loading
```bash
# Check if programs.json exists
ls -la public/data/programs.json

# If missing, run scraper
npm run scrape-programs
```

---

## 📚 Additional Resources

- **ElevenLabs Conversational AI Docs:** https://elevenlabs.io/docs/conversational-ai
- **Client Tools Guide:** https://elevenlabs.io/docs/conversational-ai/client-tools
- **Anthropic Claude Models:** https://docs.anthropic.com/en/docs/models-overview

---

## 🎉 You're Done!

The ElevenLabs agent is now configured to match the Vercel text chat experience. Users can seamlessly switch between voice and text modes while enjoying the same intelligent recommendations and conversational flow.

**Next Steps:**
1. Create the agent in ElevenLabs GUI
2. Configure both client tools
3. Copy the Agent ID to `.env.local`
4. Test all three input modes
5. Verify program recommendations and suggestions work
