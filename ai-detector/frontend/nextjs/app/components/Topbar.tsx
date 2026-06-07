"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

interface TopbarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  placeholder?: string;
}

export default function Topbar({ searchQuery, onSearchChange, placeholder = "Search analyses..." }: TopbarProps) {
  const { user } = useAuth();
  const router = useRouter();

  const userInitials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "AI";

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/30 backdrop-blur-xl border-b border-white/10 shadow-sm">
      <div className="flex justify-between items-center px-gutter py-md w-full max-w-container-max mx-auto">
        <div className="flex items-center gap-xl">
          <Link href="/" className="font-headline-md text-headline-md font-bold text-on-surface">
            Beta-AI
          </Link>
          
          {/* Search Bar */}
          {onSearchChange !== undefined && (
            <div className="hidden md:flex items-center bg-surface-container-highest/50 border border-outline-variant/30 rounded-full px-md py-xs w-80">
              <span className="material-symbols-outlined text-on-surface-variant mr-sm">search</span>
              <input
                type="text"
                value={searchQuery || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-transparent border-none focus:ring-0 outline-none text-body-md w-full placeholder-on-surface-variant"
                placeholder={placeholder}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-md">
          <button
            onClick={() => router.push("/profile")}
            className="p-sm text-on-surface-variant hover:bg-white/5 transition-colors rounded-full cursor-pointer active:scale-95 transition-transform"
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          
          <button
            onClick={() => router.push("/profile")}
            className="p-sm text-on-surface-variant hover:bg-white/5 transition-colors rounded-full cursor-pointer active:scale-95 transition-transform"
            title="Settings"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
          
          <Link href="/profile" className="h-8 w-8 rounded-full overflow-hidden border border-primary-container bg-primary-container flex items-center justify-center text-on-primary font-bold text-xs cursor-pointer hover:opacity-90">
            {userInitials}
          </Link>
        </div>
      </div>
    </header>
  );
}
