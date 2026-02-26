"use client";

import { useSyncUser } from "@/hooks/useSyncUser";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";
import styles from "./page.module.css";

/**
 * Home page — shows all users with search and allows starting a conversation.
 */
export default function Home() {
  useSyncUser();
  const { user } = useUser();
  const [search, setSearch] = useState("");

  const users = useQuery(
    api.users.getAllUsers,
    user ? { currentClerkId: user.id } : "skip"
  );

  const filtered = users?.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.appTitle}>Chat App</h1>
          <UserButton />
        </div>

        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.userList}>
          {users === undefined && (
            <p className={styles.loadingText}>Loading users...</p>
          )}
          {filtered?.length === 0 && search !== "" && (
            <p className={styles.emptyText}>No users found for "{search}"</p>
          )}
          {filtered?.length === 0 && search === "" && (
            <p className={styles.emptyText}>No other users registered yet.</p>
          )}
          {filtered?.map((u) => (
            <div key={u._id} className={styles.userItem}>
              <img
                src={u.imageUrl}
                alt={u.name}
                className={styles.userAvatar}
              />
              <span className={styles.userName}>{u.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.mainArea}>
        <p className={styles.selectPrompt}>Select a user to start chatting</p>
      </div>
    </div>
  );
}