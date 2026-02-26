"use client";

import { useSyncUser } from "@/hooks/useSyncUser";
import { UserButton } from "@clerk/nextjs";

export default function Home() {
  useSyncUser();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Chat App</h1>
        <UserButton />
      </div>
    </div>
  );
}