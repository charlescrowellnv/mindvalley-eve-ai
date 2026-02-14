# VoiceChatRevised Component Export

A sophisticated voice chat interface that integrates with ElevenLabs AI agents, featuring multiple input modes, real-time audio visualization, and client-side tool execution.

## Features

- **Three Input Modes:**
  - **Voice Mode:** Real-time voice conversation with AI agent
  - **Text Mode:** Traditional text-based chat interface
  - **Push-to-Talk:** Press and hold to speak, release to send

- **Real-Time Audio Visualization:**
  - User and agent oscilloscopes with frequency analysis
  - 2048 FFT logarithmic frequency display
  - Visual feedback for voice activity

- **Client-Side Tool Execution:**
  - Visual feedback for tool calls
  - Collapsible tool displays with parameters and results
  - Support for custom tool implementations

- **Enhanced UX:**
  - Streaming message responses
  - Chronological message ordering
  - Voice response muting control
  - Dark/light theme support

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- A Next.js 16+ application
- ElevenLabs account with an AI agent configured

### Step 1: Install Dependencies

Run the following commands in your Next.js project:

```bash
npm install @elevenlabs/react ai lucide-react class-variance-authority clsx tailwind-merge nanoid use-stick-to-bottom streamdown @streamdown/cjk @streamdown/code @streamdown/math @streamdown/mermaid next-themes @radix-ui/react-slot

npm install -D tailwindcss @tailwindcss/postcss tw-animate-css
```

Or use the consolidated install commands from `package-dependencies.json`.

### Step 2: Copy Files

Copy all files from this export folder to your Next.js project, maintaining the directory structure:

```bash
# From the export folder root:
cp -r components/ <your-project>/components/
cp -r hooks/ <your-project>/hooks/
cp -r lib/ <your-project>/lib/
cp app/globals.css <your-project>/app/
cp postcss.config.mjs <your-project>/
cp .env.example <your-project>/.env.local
```

### Step 3: Configure TypeScript

Update your `tsconfig.json` to include path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Step 4: Configure PostCSS

If you don't have a `postcss.config.mjs`, the one in this export should work. Otherwise, ensure it includes:

```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  }
}
```

### Step 5: Update Root Layout

Update your `app/layout.tsx`:

```typescript
import "./globals.css";
import { ThemeProvider } from "@/components/aaa/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Step 6: Configure Environment Variables

1. Copy `.env.example` to `.env.local`
2. Get your ElevenLabs Agent ID from: https://elevenlabs.io/app/conversational-ai
3. Update `.env.local`:

```env
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_actual_agent_id
```

### Step 7: Use the Component

Create or update a page to use the component:

```typescript
// app/page.tsx or any other page
import VoiceChatRevised from "@/components/conversation/VoiceChatRevised";

export default function Page() {
  return (
    <div className="h-screen w-full max-w-4xl mx-auto overflow-hidden">
      <VoiceChatRevised />
    </div>
  );
}
```

## File Structure

```
export/
├── components/
│   ├── conversation/
│   │   └── VoiceChatRevised.tsx          # Main component
│   ├── ui/                                # 13 UI components
│   │   ├── button.tsx
│   │   ├── spinner.tsx
│   │   ├── oscilloscope.tsx
│   │   ├── button-group.tsx
│   │   ├── badge.tsx
│   │   ├── collapsible.tsx
│   │   ├── command.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── hover-card.tsx
│   │   ├── input-group.tsx
│   │   ├── select.tsx
│   │   ├── tooltip.tsx
│   │   └── sonner.tsx
│   ├── ai-elements/                       # 6 AI-elements components
│   │   ├── prompt-input.tsx
│   │   ├── speech-input.tsx
│   │   ├── message.tsx
│   │   ├── conversation.tsx
│   │   ├── tool.tsx
│   │   └── code-block.tsx
│   └── aaa/
│       └── theme-provider.tsx             # Theme support
├── hooks/
│   ├── useToolExecution.ts                # Tool execution logic
│   ├── useOscilloscopeData.ts            # Audio visualization
│   └── use-mobile.ts                      # Mobile detection
├── lib/
│   ├── utils.ts                           # Utility functions (cn)
│   ├── types.ts                           # TypeScript types
│   ├── client-tools.ts                    # Client-side tools
│   └── database-mock.ts                   # Mock data
├── app/
│   └── globals.css                        # Global styles & CSS variables
├── postcss.config.mjs                     # PostCSS configuration
├── package-dependencies.json              # NPM dependencies list
├── .env.example                           # Environment template
└── README.md                              # This file
```

## Verification

After installation, verify everything works:

### 1. Build Check
```bash
npm run build
```
Should complete without TypeScript errors.

### 2. Development Server
```bash
npm run dev
```

### 3. Test Features

**Voice Mode (Default):**
1. Click "Start session" button
2. Allow microphone permissions when prompted
3. Speak into your microphone
4. Verify user oscilloscope shows waveform
5. Verify agent responds and agent oscilloscope shows waveform
6. Toggle voice response button (volume icon) to mute/unmute agent voice

**Push-to-Talk Mode:**
1. Click mode button to switch to PTT
2. Hold "Push To Talk" button
3. Speak while holding
4. Release button
5. Verify transcription appears in text input
6. Verify agent responds

**Text Mode:**
1. Click mode button to switch to text
2. Type a message and press Enter or click Send
3. Verify message appears in conversation
4. Verify agent responds

**Tool Execution:**
1. Ask the agent something that triggers a tool (e.g., "show me user orders")
2. Verify tool execution appears in conversation
3. Verify tool is collapsed by default
4. Click to expand and see parameters/results

**Oscilloscopes:**
1. In voice mode, make loud sounds
2. Verify user oscilloscope shows peaks
3. Verify agent oscilloscope shows peaks when agent speaks
4. Verify no clipping at high volumes
5. Verify peaks point upward (not inverted)

## Browser Compatibility

- **Voice Mode:** Requires WebRTC and WebSocket support (Chrome, Edge, Safari, Firefox)
- **Push-to-Talk:**
  - Chrome/Edge: Uses SpeechRecognition API
  - Firefox/Safari: Uses MediaRecorder API
- **Oscilloscope:** Requires Web Audio API
- **Recommended:** Latest Chrome, Edge, or Safari for best experience

## Customization

### Client-Side Tools

Edit `lib/client-tools.ts` to add or modify client-side tool implementations:

```typescript
export const clientTools = {
  your_custom_tool: {
    description: "Description of your tool",
    parameters: z.object({
      // Define parameters
    }),
    execute: async (params) => {
      // Implement tool logic
      return result;
    },
  },
};
```

### Styling

The component uses Tailwind CSS with CSS variables defined in `app/globals.css`. Modify variables for light/dark themes:

```css
:root {
  --background: /* ... */;
  --foreground: /* ... */;
  /* etc. */
}

.dark {
  --background: /* ... */;
  --foreground: /* ... */;
  /* etc. */
}
```

### Mock Data

Edit `lib/database-mock.ts` to customize mock database data for demo tools.

## Troubleshooting

### "Cannot find module '@/components/ui/button'"
**Solution:** Check that `tsconfig.json` has path aliases configured:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Oscilloscope Not Showing
**Solution:**
- Verify microphone permissions are granted
- Check browser console for Web Audio API errors
- Ensure browser supports Web Audio API

### Tool Executions Not Appearing
**Solution:**
- Verify `lib/client-tools.ts` and `lib/database-mock.ts` are copied
- Check that tools are properly registered in the component
- Verify agent is configured with matching tool definitions

### Dark Mode Not Working
**Solution:**
- Ensure `ThemeProvider` wraps your app in `layout.tsx`
- Verify `app/globals.css` is imported
- Check that CSS variables are defined for both `:root` and `.dark`

### Build Errors with Tailwind
**Solution:**
- Verify `tailwindcss@^4.0.0` and `@tailwindcss/postcss@^4.0.0` are installed
- Check `postcss.config.mjs` is properly configured
- Ensure `tw-animate-css` is installed

### Voice Mode Not Connecting
**Solution:**
- Verify `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` is set in `.env.local`
- Check ElevenLabs agent is active and configured
- Verify network connection and firewall settings
- Check browser console for WebSocket errors

### Microphone Permission Denied
**Solution:**
- Click lock icon in browser address bar
- Allow microphone permissions
- Refresh the page
- Note: HTTPS required for microphone access (localhost is exempt)

## Technical Details

### Dependencies

- **@elevenlabs/react:** ElevenLabs React SDK for voice agent integration
- **ai:** Vercel AI SDK for streaming responses
- **lucide-react:** Icon library
- **class-variance-authority:** Type-safe component variants
- **tailwind-merge:** Merge Tailwind classes
- **nanoid:** Unique ID generation
- **use-stick-to-bottom:** Auto-scroll to bottom behavior
- **streamdown:** Markdown streaming parser
- **next-themes:** Theme management
- **@radix-ui/react-slot:** Component composition utilities

### TypeScript

Fully typed with TypeScript 5.7+. All components include proper type definitions.

### Tailwind CSS v4

This project uses Tailwind CSS v4 with the new PostCSS plugin architecture. Ensure you're using the correct version and configuration.

## License

This component export is provided as-is for integration into your projects.

## Support

For issues related to:
- **ElevenLabs Integration:** Check [ElevenLabs Documentation](https://elevenlabs.io/docs)
- **Next.js:** Check [Next.js Documentation](https://nextjs.org/docs)
- **Component Issues:** Review the verification steps and troubleshooting guide above

## Version

Export created: 2026-02-14
Component version: 2.0 (Revised)
