"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/", icon: "dashboard" },
    { name: "Analyzer", href: "/analyzer", icon: "analytics" },
    { name: "History", href: "/history", icon: "history" },
    { name: "Profile", href: "/profile", icon: "person" },
  ];

  return (
    <aside className="hidden md:flex flex-col h-[calc(100vh-72px)] w-64 fixed left-0 top-[72px] p-md space-y-md bg-surface-dim/30 backdrop-blur-xl border-r border-white/10 shadow-xl z-40">
      <nav className="flex flex-col gap-xs flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-md px-md py-sm font-label-md text-label-md duration-200 ease-in-out rounded-lg ${
                isActive
                  ? "bg-primary-container text-on-primary-container font-bold"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-md border-t border-white/5 space-y-sm">
        {user && (
          <div className="flex items-center gap-sm px-xs py-1">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-sm">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="font-label-md text-on-surface truncate text-sm">
                {user.full_name || "User"}
              </p>
              <p className="text-[10px] text-on-surface-variant truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="text-on-surface-variant hover:text-error p-sm rounded-lg hover:bg-white/5"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        )}
        
        <button
          onClick={() => router.push("/analyzer")}
          className="w-full bg-gradient-to-r from-primary-container to-secondary-container text-white font-label-md text-label-md py-md rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Analysis
        </button>
      </div>
    </aside>
  );
}
