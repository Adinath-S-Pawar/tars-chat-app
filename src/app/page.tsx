"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useSyncUser } from "@/hooks/useSyncUser";
import { formatMessageTime } from "@/lib/formatTime";
import { ArrowLeft } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type ConvUser = {
  _id: Id<"users">;
  clerkId: string;
  name: string;
  email: string;
  imageUrl: string;
};

type Conversation = {
  _id: Id<"conversations">;
  participantOne: string;
  participantTwo: string;
  otherUser: ConvUser;
  lastMessage?: {
    _id: Id<"messages">;
    text: string;
    senderId: string;
    _creationTime: number;
  } | null;
};

type Message = {
  _id: Id<"messages">;
  conversationId: Id<"conversations">;
  senderId: string;
  text: string;
  _creationTime: number;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Skeleton row for sidebar loading state */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-zinc-700 shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="h-3.5 w-28 rounded bg-zinc-700" />
        <div className="h-3 w-20 rounded bg-zinc-800" />
      </div>
    </div>
  );
}

interface MessageListProps {
  conversationId: Id<"conversations">;
  currentClerkId: string;
}

function MessageList({ conversationId, currentClerkId }: MessageListProps) {
  const messages = useQuery(api.messages.getMessages, { conversationId }) as
    | Message[]
    | undefined;

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <div className="h-8 w-8 rounded-full border-2 border-zinc-600 border-t-zinc-400 animate-spin" />
          <span className="text-sm">Loading messages…</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-zinc-500">No messages yet. Say hello! 👋</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4 py-3">
      <div className="flex flex-col gap-2">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentClerkId;
          return (
            <div
              key={msg._id}
              className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-xl text-sm leading-relaxed ${isMine
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-zinc-700 text-zinc-100 rounded-bl-sm"
                  }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 px-1">
                {formatMessageTime(msg._creationTime)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

interface ChatAreaProps {
  conversationId: Id<"conversations">;
  otherUser: ConvUser;
  currentClerkId: string;
  onBack: () => void;
}

function ChatArea({ conversationId, otherUser, currentClerkId, onBack }: ChatAreaProps) {
  const [text, setText] = useState("");
  const sendMessage = useMutation(api.messages.sendMessage);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    await sendMessage({ conversationId, senderId: currentClerkId, text: trimmed });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-800 bg-zinc-900 shrink-0">
        {/* Back button — mobile only */}
        <button
          onClick={onBack}
          className="md:hidden mr-1 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Back to sidebar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar className="h-9 w-9">
          <AvatarImage src={otherUser.imageUrl} alt={otherUser.name} />
          <AvatarFallback className="bg-zinc-700 text-zinc-200 text-xs font-medium">
            {getInitials(otherUser.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold">{otherUser.name}</p>
          <p className="text-xs text-zinc-400">{otherUser.email}</p>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        conversationId={conversationId}
        currentClerkId={currentClerkId}
      />

      {/* Input area */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-zinc-800 bg-zinc-900 shrink-0">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-600"
        />
        <Button
          onClick={handleSend}
          disabled={!text.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 shrink-0 disabled:opacity-40"
        >
          Send
        </Button>
      </div>
    </div>
  );
}

export default function Home() {
  useSyncUser();
  const { user } = useUser();

  const [search, setSearch] = useState("");
  const [activeConversationId, setActiveConversationId] =
    useState<Id<"conversations"> | null>(null);
  const [activeOtherUser, setActiveOtherUser] = useState<ConvUser | null>(null);

  const chatOpen = activeConversationId !== null && activeOtherUser !== null;

  const getOrCreateConversation = useMutation(
    api.conversations.getOrCreateConversation
  );

  const conversations = useQuery(
    api.conversations.getUserConversations,
    user ? { currentClerkId: user.id } : "skip"
  ) as Conversation[] | undefined;

  const allUsers = useQuery(
    api.users.getAllUsers,
    user ? { currentClerkId: user.id } : "skip"
  ) as ConvUser[] | undefined;

  const filteredUsers = allUsers?.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSelectUser(otherUser: ConvUser) {
    if (!user) return;
    const convId = await getOrCreateConversation({
      currentClerkId: user.id,
      otherClerkId: otherUser.clerkId,
    });
    setActiveConversationId(convId as Id<"conversations">);
    setActiveOtherUser(otherUser);
  }

  function handleSelectConversation(conv: Conversation) {
    setActiveConversationId(conv._id);
    setActiveOtherUser(conv.otherUser);
  }

  function handleBack() {
    setActiveConversationId(null);
    setActiveOtherUser(null);
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* ── Sidebar ── hidden on mobile when a chat is open */}
      <aside
        className={`w-full md:w-80 flex-col border-r border-zinc-800 bg-zinc-900 shrink-0 ${chatOpen ? "hidden md:flex" : "flex"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
          <h1 className="text-lg font-bold tracking-tight">ChatApp</h1>
          <UserButton />
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-zinc-800">
          <Input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-600"
          />
        </div>

        <ScrollArea className="flex-1">
          {/* ── Conversations Section ── */}
          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Conversations
            </p>
          </div>

          {conversations === undefined ? (
            <div className="flex flex-col gap-1 py-1">
              {[...Array(3)].map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-500">
              No conversations yet.
            </p>
          ) : (
            <div className="flex flex-col py-1">
              {conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-left w-full transition-colors hover:bg-zinc-800 cursor-pointer ${activeConversationId === conv._id ? "bg-zinc-800" : ""
                    }`}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage
                      src={conv.otherUser?.imageUrl}
                      alt={conv.otherUser?.name}
                    />
                    <AvatarFallback className="bg-zinc-700 text-zinc-200 text-xs font-medium">
                      {conv.otherUser ? getInitials(conv.otherUser.name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      {conv.otherUser?.name ?? "Unknown"}
                    </span>
                    <span className="text-xs text-zinc-500 truncate">
                      {conv.lastMessage ? conv.lastMessage.text : "No messages yet"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="px-4 py-2">
            <Separator className="bg-zinc-800" />
          </div>

          {/* ── Users Section ── */}
          <div className="px-4 pt-1 pb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Users
            </p>
          </div>

          {allUsers === undefined ? (
            <div className="flex flex-col gap-1 py-1">
              {[...Array(4)].map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : filteredUsers?.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-500">
              {search ? `No users found for "${search}"` : "No other users yet."}
            </p>
          ) : (
            <div className="flex flex-col py-1">
              {filteredUsers?.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleSelectUser(u)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-left w-full transition-colors hover:bg-zinc-800 cursor-pointer ${activeOtherUser?._id === u._id && activeConversationId
                    ? "bg-zinc-800"
                    : ""
                    }`}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={u.imageUrl} alt={u.name} />
                    <AvatarFallback className="bg-zinc-700 text-zinc-200 text-xs font-medium">
                      {getInitials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">{u.name}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* ── Main Chat Area ── hidden on mobile when no chat is open */}
      <main
        className={`flex-col flex-1 bg-zinc-950 overflow-hidden ${chatOpen ? "flex" : "hidden md:flex"
          }`}
      >
        {!chatOpen ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-zinc-600 select-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-40"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <div className="text-center space-y-1">
              <p className="text-base font-semibold text-zinc-400">
                No conversation selected
              </p>
              <p className="text-sm text-zinc-600">
                Pick a user or conversation from the sidebar to start chatting.
              </p>
            </div>
          </div>
        ) : (
          <ChatArea
            key={activeConversationId!}
            conversationId={activeConversationId!}
            otherUser={activeOtherUser!}
            currentClerkId={user?.id ?? ""}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
}