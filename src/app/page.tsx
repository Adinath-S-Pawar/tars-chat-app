"use client";

import { useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSyncUser } from "@/hooks/useSyncUser";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Id } from "../../convex/_generated/dataModel";

/**
 * Home page — dark-themed layout with a user sidebar and a main chat area.
 */
export default function Home() {
  useSyncUser();
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);

  const users = useQuery(
    api.users.getAllUsers,
    user ? { currentClerkId: user.id } : "skip"
  );

  const filtered = users?.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* ── Left Sidebar ── */}
      <aside className="w-80 flex flex-col border-r border-zinc-800 bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
          <h1 className="text-lg font-semibold tracking-tight">Chat App</h1>
          <UserButton />
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-zinc-800">
          <Input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400 focus-visible:ring-zinc-600"
          />
        </div>

        {/* User List */}
        <ScrollArea className="flex-1">
          <div className="py-2">
            {/* Loading state */}
            {users === undefined && (
              <div className="flex flex-col gap-3 px-4 py-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-9 w-9 rounded-full bg-zinc-700 shrink-0" />
                    <div className="h-4 w-32 rounded bg-zinc-700" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty states */}
            {users !== undefined && filtered?.length === 0 && search !== "" && (
              <p className="px-4 py-6 text-sm text-zinc-400 text-center">
                No users found for &ldquo;{search}&rdquo;
              </p>
            )}
            {users !== undefined && filtered?.length === 0 && search === "" && (
              <p className="px-4 py-6 text-sm text-zinc-400 text-center">
                No other users registered yet.
              </p>
            )}

            {/* User rows */}
            {filtered?.map((u) => (
              <button
                key={u._id}
                onClick={() => setSelectedUserId(u._id)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-zinc-800 cursor-pointer ${
                  selectedUserId === u._id ? "bg-zinc-800" : ""
                }`}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={u.imageUrl} alt={u.name} />
                  <AvatarFallback className="bg-zinc-700 text-zinc-200 text-xs font-medium">
                    {u.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">{u.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* ── Main Area ── */}
      <main className="flex flex-1 items-center justify-center bg-zinc-950">
        {selectedUserId === null ? (
          <div className="flex flex-col items-center gap-3 text-zinc-500 select-none">
            <p className="text-base font-medium">Select a user to start chatting</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-zinc-400 select-none">
            <span className="text-4xl">🚧</span>
            <p className="text-base font-medium">Chat area coming soon</p>
          </div>
        )}
      </main>
    </div>
  );
}