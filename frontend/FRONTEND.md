# Frontend App (Next.js)

This document explains the frontend folder structure, key modules, environment configuration, and how to set up and run the app.

## Folder Structure

```
frontend/
├─ .env.sample              # Example environment variables
├─ .gitignore
├─ next.config.ts           # Next.js configuration
├─ package.json             # Scripts and dependencies
├─ postcss.config.mjs       # PostCSS config (Tailwind)
├─ public/                  # Static assets
│  ├─ assets/               # (Project images, icons, etc.)
├─ render.yaml              # Render deployment config
├─ src/
│  ├─ components/           # Reusable UI components
│  │  ├─ ChatInput.jsx      # Chat bottom input area
│  │  ├─ ChatWindow.jsx     # Main chat area and file upload
│  │  ├─ GoogleAuth.jsx     # Google Sign-in button
│  │  ├─ Header.jsx         # Top navigation (brand text + emoji)
│  │  ├─ Sidebar.jsx        # Conversation list & new/delete
│  │  └─ signInPromptModal.jsx
│  ├─ context/
│  │  └─ AuthContext.jsx    # Auth state (user, sessions, snackbar)
│  ├─ lib/
│  │  └─ axiosInstance.js   # Axios configured with backend base URL
│  ├─ pages/
│  │  ├─ _app.jsx           # App bootstrap, global providers/styles
│  │  ├─ _document.jsx      # Custom document (HTML shell)
│  │  └─ index.jsx          # Home page (layout + chat/side panel)
│  ├─ services/
│  │  └─ api.js             # Client-side API wrappers
│  ├─ styles/
│  │  └─ globals.css        # Global styles (Tailwind reset/utilities)
│  └─ utils/
│     ├─ auth.js            # Auth helpers
│     └─ storage.js         # Local storage helpers
├─ tailwind.config.ts       # Tailwind configuration
└─ tsconfig.json            # TypeScript configuration
```

## Scripts

Defined in `package.json`:

- `npm run dev` – Start Next.js in development mode
- `npm run build` – Build the production bundle
- `npm start` – Serve the built site (uses `serve out`)
- `npm run lint` – Run Next.js ESLint

Note: If you plan to export a static site, ensure your pages are compatible with `next export`. Otherwise, consider using `next start` with a Node server.

## Environment Variables

Create `.env.local` from the provided sample and set the variables:

```
NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your_google_oauth_client_id>
```

- `NEXT_PUBLIC_BACKEND_BASE_URL` must point to your running backend API base URL.
- This value is consumed by `src/lib/axiosInstance.js`.

When deploying, set `NEXT_PUBLIC_BACKEND_BASE_URL` to your backend’s public URL. Ensure that URL is also present in backend CORS allowlist (`app/main.py`).

## Development

1) Install dependencies

```bash
npm install
```

2) Run the dev server

```bash
npm run dev
```

The app will be available at http://localhost:3000.

## Building and Running Production

```bash
npm run build
npm start
```

If your platform provides a runtime (e.g., Render or Vercel), configure the build and start commands accordingly. For Render, you can use the included `render.yaml` or set:

- Build Command: `npm ci && npm run build`
- Start Command: `npm start`

## Key Components Overview

- `src/components/Header.jsx`
  - Displays the brand text: "📚 DocuMind AI"
  - Shows a button to open the currently active file (if any)

- `src/components/ChatWindow.jsx`
  - Main chat screen
  - Handles file upload, message send, conversation history
  - Bottom input bar positioning fixed for better UX

- `src/components/ChatInput.jsx`
  - Reusable input control (MUI) with keyboard submit and tooltip

- `src/context/AuthContext.jsx`
  - Central store for user state, sessions, notifications

- `src/services/api.js`
  - Simple wrappers for upload, ask question, fetch conversation APIs

## Troubleshooting

- If requests fail with CORS errors, verify that the backend allows your frontend origin in `app/main.py`.
- Ensure `NEXT_PUBLIC_BACKEND_BASE_URL` is correct and accessible from the browser.
- Check the browser console and the backend logs for error messages.

## Deployment Notes

- For production deployment at `https://document-qa-system-1.onrender.com/`, the backend CORS already includes this origin.
- Update the environment variable `NEXT_PUBLIC_BACKEND_BASE_URL` to your backend’s public URL for the deployed site.
