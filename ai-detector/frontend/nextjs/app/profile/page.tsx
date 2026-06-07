"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, token, loading, updateProfile, logout } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Populate fields when user data is ready
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFormLoading(true);
    try {
      await updateProfile(fullName);
      setSuccess("Profile updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="bg-background text-on-background min-h-screen select-none font-sans relative">
      {/* Background ambient glows */}
      <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-primary/10 glow-sphere rounded-full z-0" />
      <div className="absolute -bottom-[10%] -right-[5%] w-[35%] h-[35%] bg-secondary/10 glow-sphere rounded-full z-0" />

      <main className="flex pt-[72px] min-h-screen">
        {/* Main content area */}
        <section className="flex-1 p-gutter max-w-container-max mx-auto w-full z-10">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-lg">
            User Profile
          </h1>

          {error && (
            <div className="mb-md p-sm rounded bg-error/20 border border-error/50 text-error font-body-md text-sm text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-md p-sm rounded bg-primary/20 border border-primary/50 text-primary font-body-md text-sm text-center">
              {success}
            </div>
          )}

          <form className="glass-card p-xl rounded-xl" onSubmit={handleSubmit}>
            <div className="space-y-sm mb-lg">
              <label className="font-label-md text-label-md text-on-surface-variant">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary input-focus-glow transition-all"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-sm mb-lg">
              <label className="font-label-md text-label-md text-on-surface-variant">Email (read‑only)</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface-variant placeholder:text-outline focus:outline-none focus:border-primary input-focus-glow transition-all opacity-70"
              />
            </div>

            <div className="flex items-center space-x-md mt-lg">
              <button
                type="submit"
                disabled={formLoading}
                className="gradient-button py-sm px-lg rounded-lg font-label-md text-label-md text-white font-bold flex items-center justify-center space-x-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="bg-surface-container-lowest hover:bg-surface-container-lowest/80 border border-outline-variant text-on-surface rounded-lg py-sm px-lg font-label-md transition-colors"
              >
                Log Out
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
