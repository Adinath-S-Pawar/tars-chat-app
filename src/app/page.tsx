"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useSyncUser } from "@/hooks/useSyncUser";
import { formatMessageTime } from "@/lib/formatTime";
import { ArrowLeft } from "lucide-react";
import { usePresence } from "@/hooks/usePresence";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";

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
      <div className="h-9 w-9 rounded-full bg-[#3f4147] shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="h-3.5 w-28 rounded bg-[#3f4147]" />
        <div className="h-3 w-20 rounded bg-[#383a40]" />
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const prevMessageCountRef = useRef(0);

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    bottomRef.current?.scrollIntoView({ behavior });
  }

  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!messages) return;

    if (isInitialLoad.current) {
      scrollToBottom("instant");
      isInitialLoad.current = false;
      prevMessageCountRef.current = messages.length;
      return;
    }

    const newMessageArrived = messages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    if (!newMessageArrived) return;

    if (isUserScrolledUp) {
      setShowNewMessages(true);
    } else {
      scrollToBottom("smooth");
    }
  }, [messages, isUserScrolledUp]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const scrolledUp = distanceFromBottom > 100;

    setIsUserScrolledUp(scrolledUp);
    if (!scrolledUp) setShowNewMessages(false);
  }

  if (messages === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#949ba4]">
          <div className="h-8 w-8 rounded-full border-2 border-[#3f4147] border-t-[#5865f2] animate-spin" />
          <span className="text-sm">Loading messages…</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[#949ba4]">No messages yet. Say hello! 👋</p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-3"
      >
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
                      ? "bg-[#5865f2] text-white rounded-br-sm"
                      : "bg-[#404249] text-white rounded-bl-sm"
                    }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-[#949ba4] mt-1 px-1">
                  {formatMessageTime(msg._creationTime)}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {showNewMessages && (
        <button
          onClick={() => {
            scrollToBottom("smooth");
            setShowNewMessages(false);
            setIsUserScrolledUp(false);
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transition-colors"
        >
          ↓ New messages
        </button>
      )}
    </div>
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
  const setTyping = useMutation(api.typing.setTyping);
  const clearTyping = useMutation(api.typing.clearTyping);
  const markAsRead = useMutation(api.lastRead.markAsRead);
  const typingUsers = useQuery(api.typing.getTyping, {
    conversationId: conversationId as string,
    currentClerkId,
  });

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTypingLocal, setIsTypingLocal] = useState(false);

  useEffect(() => {
    if (currentClerkId) {
      markAsRead({ conversationId, clerkId: currentClerkId });
    }
  }, [conversationId, currentClerkId]);

  const handleTyping = useCallback(() => {
    if (!isTypingLocal) {
      setIsTypingLocal(true);
      setTyping({ conversationId: conversationId as string, clerkId: currentClerkId });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingLocal(false);
      clearTyping({ conversationId: conversationId as string, clerkId: currentClerkId });
    }, 10000);
  }, [conversationId, currentClerkId, setTyping, clearTyping, isTypingLocal]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;

    setText("");

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTypingLocal(false);
    clearTyping({ conversationId: conversationId as string, clerkId: currentClerkId });

    await sendMessage({ conversationId, senderId: currentClerkId, text: trimmed });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isTyping = typingUsers && typingUsers.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#3f4147] bg-[#36393f] shrink-0">
        <button
          onClick={onBack}
          className="md:hidden mr-1 p-1.5 rounded-lg text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#383a40] transition-colors"
          aria-label="Back to sidebar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar className="h-9 w-9">
          <AvatarImage src={otherUser.imageUrl} alt={otherUser.name} />
          <AvatarFallback className="bg-[#383a40] text-[#dbdee1] text-xs font-medium">
            {getInitials(otherUser.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-[#dbdee1]">{otherUser.name}</p>
          {isTyping ? (
            <p className="text-xs text-[#23a55a] animate-pulse">typing...</p>
          ) : (
            <p className="text-xs text-[#949ba4]">{otherUser.email}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList
        conversationId={conversationId}
        currentClerkId={currentClerkId}
      />

      {/* Input area */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[#3f4147] bg-[#36393f] shrink-0">
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            setIsTypingLocal(false);
            clearTyping({ conversationId: conversationId as string, clerkId: currentClerkId });
          }}
          placeholder="Type a message…"
          className="flex-1 bg-[#26282d] border-[#3f4147] text-[#dbdee1] placeholder:text-[#949ba4] focus-visible:ring-[#5865f2]"
        />
        <Button
          onClick={handleSend}
          disabled={!text.trim()}
          className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 shrink-0 disabled:opacity-40"
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

  usePresence(user?.id);

  useEffect(() => {
  if (activeConversationId && user) {
    markAsRead({ conversationId: activeConversationId, clerkId: user.id });
  }
}, [activeConversationId, user]);

  const allUserIds = allUsers?.map((u) => u.clerkId) ?? [];
  const presenceRecords = useQuery(
    api.presence.getPresence,
    allUserIds.length > 0 ? { clerkIds: allUserIds } : "skip"
  );

  function isOnline(clerkId: string): boolean {
    return presenceRecords?.some((p) => p?.clerkId === clerkId && p?.online) ?? false;
  }

  const markAsRead = useMutation(api.lastRead.markAsRead);

  async function handleSelectUser(otherUser: ConvUser) {
    if (!user) return;
    const convId = await getOrCreateConversation({
      currentClerkId: user.id,
      otherClerkId: otherUser.clerkId,
    });
    setActiveConversationId(convId as Id<"conversations">);
    setActiveOtherUser(otherUser);
    markAsRead({ conversationId: convId as Id<"conversations">, clerkId: user.id });
  }

  function handleSelectConversation(conv: Conversation) {
    setActiveConversationId(conv._id);
    setActiveOtherUser(conv.otherUser);
    if (user) markAsRead({ conversationId: conv._id, clerkId: user.id });
  }

  function handleBack() {
    setActiveConversationId(null);
    setActiveOtherUser(null);
  }

  const unreadCounts = useQuery(
    api.lastRead.getAllUnreadCounts,
    user ? { clerkId: user.id } : "skip"
  );

  return (
    <div className="flex h-screen bg-[#36393f] text-white overflow-hidden">
      {/* ── Sidebar ── hidden on mobile when a chat is open */}
      <aside
        className={`w-full md:w-80 flex-col border-r border-[#3f4147] bg-[#2b2d31] shrink-0 ${chatOpen ? "hidden md:flex" : "flex"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#3f4147]">
          <h1 className="text-lg font-bold tracking-tight text-[#dbdee1]">ChatApp</h1>
          <UserButton />
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-[#3f4147]">
          <Input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1e1f22] border-[#3f4147] text-[#dbdee1] placeholder:text-[#949ba4] focus-visible:ring-[#5865f2]"
          />
        </div>

        <ScrollArea className="flex-1">
          {/* ── Conversations Section ── */}
          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#949ba4]">
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
            <p className="px-4 py-3 text-sm text-[#949ba4]">No conversations yet.</p>
          ) : (
            <div className="flex flex-col py-1">
              {conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-left w-full transition-colors hover:bg-[#383a40] cursor-pointer ${activeConversationId === conv._id ? "bg-[#383a40]" : ""
                    }`}
                >
                  <div className="relative">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={conv.otherUser?.imageUrl} alt={conv.otherUser?.name} />
                      <AvatarFallback className="bg-[#383a40] text-[#dbdee1] text-xs font-medium">
                        {conv.otherUser ? getInitials(conv.otherUser.name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    {conv.otherUser && isOnline(conv.otherUser.clerkId) && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#23a55a] ring-2 ring-[#2b2d31]" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate text-[#dbdee1]">
                        {conv.otherUser?.name ?? "Unknown"}
                      </span>
                      {unreadCounts && unreadCounts[conv._id] > 0 && (
                        <Badge className="bg-[#f23f43] text-white text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full px-1.5 ml-2 shrink-0">
                          {unreadCounts[conv._id] > 99 ? "99+" : unreadCounts[conv._id]}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-[#949ba4] truncate">
                      {conv.lastMessage ? conv.lastMessage.text : "No messages yet"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="px-4 py-2">
            <Separator className="bg-[#3f4147]" />
          </div>

          {/* ── Users Section ── */}
          <div className="px-4 pt-1 pb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#949ba4]">
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
            <p className="px-4 py-3 text-sm text-[#949ba4]">
              {search ? `No users found for "${search}"` : "No other users yet."}
            </p>
          ) : (
            <div className="flex flex-col py-1">
              {filteredUsers?.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleSelectUser(u)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-left w-full transition-colors hover:bg-[#383a40] cursor-pointer ${activeOtherUser?._id === u._id && activeConversationId
                      ? "bg-[#383a40]"
                      : ""
                    }`}
                >
                  <div className="relative">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={u.imageUrl} alt={u.name} />
                      <AvatarFallback className="bg-[#383a40] text-[#dbdee1] text-xs font-medium">
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline(u.clerkId) && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#23a55a] ring-2 ring-[#2b2d31]" />
                    )}
                  </div>
                  <span className="text-sm font-medium truncate text-[#dbdee1]">{u.name}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* ── Main Chat Area ── hidden on mobile when no chat is open */}
      <main
        className={`flex-col flex-1 bg-[#36393f] overflow-hidden ${chatOpen ? "flex" : "hidden md:flex"
          }`}
      >
        {!chatOpen ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-[#949ba4] select-none">
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
              <p className="text-base font-semibold text-[#dbdee1]">
                No conversation selected
              </p>
              <p className="text-sm text-[#949ba4]">
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