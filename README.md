# ChatApp

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Convex](https://img.shields.io/badge/Convex-EE342F?style=for-the-badge&logo=convex&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)

A full-stack real-time chat application built with Next.js, Convex, and Clerk. Features instant messaging, live online presence, typing indicators, and unread message tracking.

---

## Features

-  Authentication — Email and social login via Clerk, user profiles synced to Convex
-  User List & Search — Real-time search filtering across all registered users
-  One-on-One Direct Messages — Private conversations with real-time updates via Convex subscriptions
-  Message Timestamps — Smart formatting (time only today, date+time older, year if different year)
-  Empty States — Helpful messages for all empty screens, no blank pages
-  Responsive Layout — Desktop sidebar+chat side by side, mobile full-screen chat with back button
-  Online/Offline Status — Real-time green dot indicator with 20s heartbeat, clears on logout
-  Typing Indicator — Shows "typing..." under user name, auto-expires after inactivity or on blur
-  Unread Message Count — Badge count per conversation in sidebar, clears when conversation is opened
-  Smart Auto-Scroll — Auto-scrolls to latest message, shows "↓ New messages" button when scrolled up

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Convex (database, queries, mutations, real-time) |
| Auth | Clerk (email + social login) |
| Deployment | Vercel (ready) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Convex](https://convex.dev) account (free)
- A [Clerk](https://clerk.com) account (free)

### Installation

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/tars-chat-app.git
cd tars-chat-app
```

2. Install dependencies
```bash
npm install
```

3. Set up Convex
```bash
npx convex dev
```

4. Set up Clerk
   - Create an application at [clerk.com](https://clerk.com)
   - Enable Email and Google sign-in
   - Go to JWT Templates → New Template → Convex → copy the Issuer URL

5. Configure environment variables

Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_CONVEX_URL=your_convex_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev
```

Add `CLERK_JWT_ISSUER_DOMAIN` to your Convex dashboard environment variables as well.

6. Run the development servers

In two separate terminals:
```bash
# Terminal 1
npx convex dev

# Terminal 2
npm run dev
```

Visit `http://localhost:3000`

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in route (`/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up route (`/sign-up`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Redirect after sign-in (`/`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Redirect after sign-up (`/`) |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer URL for Convex auth |

---

## Project Structure
```
src/
├── app/
│   ├── layout.tsx          — Root layout with providers
│   ├── page.tsx            — Main chat UI
│   ├── globals.css         — Global styles
│   ├── sign-in/            — Clerk sign-in page
│   └── sign-up/            — Clerk sign-up page
├── hooks/
│   ├── useSyncUser.ts      — Syncs Clerk user to Convex on login
│   └── usePresence.ts      — Manages online/offline status
├── lib/
│   └── formatTime.ts       — Smart message timestamp formatter
├── providers/
│   └── ConvexClientProvider.tsx — Wraps app with Clerk + Convex
└── components/
    └── ui/                 — shadcn/ui components

convex/
├── schema.ts               — Database schema (all tables)
├── users.ts                — User mutations and queries
├── conversations.ts        — Conversation mutations and queries
├── messages.ts             — Message mutations and queries
├── presence.ts             — Online status mutations and queries
├── typing.ts               — Typing indicator mutations and queries
├── lastRead.ts             — Unread count mutations and queries
└── auth.config.ts          — Clerk JWT authentication config
```

---

## Database Schema

| Table | Fields |
|---|---|
| `users` | clerkId, name, email, imageUrl |
| `conversations` | participantOne, participantTwo |
| `messages` | conversationId, senderId, text |
| `presence` | clerkId, online, lastSeen |
| `typing` | conversationId, clerkId, lastTyped |
| `lastRead` | conversationId, clerkId, lastReadTime |

---

## License

MIT
