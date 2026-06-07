"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, login, register, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (user) {
      router.push("/");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormLoading(true);

    try {
      if (activeTab === "login") {
        await login(email, password);
      } else {
        if (!fullName.trim()) {
          throw new Error("Full name is required");
        }
        await register(email, password, fullName);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full overflow-hidden relative selection:bg-primary/30">
      {/* Background Ambient Glows */}
      <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-primary/10 glow-sphere rounded-full z-0"></div>
      <div className="absolute -bottom-[10%] -right-[5%] w-[35%] h-[35%] bg-secondary/10 glow-sphere rounded-full z-0"></div>

      {/* Left Branding Panel (Desktop Only) */}
      <section className="hidden md:flex md:w-1/2 flex-col justify-between p-xl relative overflow-hidden bg-surface-container-lowest/40 border-r border-white/5 z-10">
        {/* Brand Identity */}
        <div className="space-y-md">
          <div className="flex items-center space-x-sm">
            <div className="w-10 h-10 rounded-lg gradient-button flex items-center justify-center">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                security
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">Beta-AI</h1>
          </div>
          <div className="pt-xl max-w-md">
            <h2 className="font-display-lg text-display-lg mb-md leading-tight">
              <span className="gradient-text">Detect.</span>
              <br />
              Analyze. Trust.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              The ultimate digital forensics platform for high-performance AI detection and content integrity.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-lg mb-xl z-10">
          <div className="flex items-start space-x-md group">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
              <span className="material-symbols-outlined text-primary">search_check</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">AI Detection</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Identify synthetic patterns with 99.9% accuracy.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-md group">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-secondary/10 transition-colors shrink-0">
              <span className="material-symbols-outlined text-secondary">content_copy</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Plagiarism Scanning</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Cross-reference billions of documents in seconds.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-md group">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-tertiary/10 transition-colors shrink-0">
              <span className="material-symbols-outlined text-tertiary">auto_awesome</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Smart Summarization</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Extract core forensic insights from massive datasets.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Asset Background overlay */}
        <div className="absolute bottom-[-10%] left-[-5%] w-full opacity-20 pointer-events-none">
          <img
            alt="AI Network Architecture"
            className="w-full h-auto"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuBLRw6BGQhiw5clmZ5ZkJw95kIXD8zBQrqmgmDC5MpE_afQuVi5MirKnhRZFLJYbWA6T21UduuTvOhlQs8TF8eyeN20ii8x2Cc05hj1r-RyyUzTuIzxkppm6MXAZLJxXEezkirkVHNZAF1AfOLyjAwt_R5k1m73X89BiQY-wjg8o5sNjs3Xr57gVMSv5zmNaV0IFzHLJgc6guAbbOk3jA4Ub5VMNNlFbMgUot2dChsS2JrnFLkDr_Q7qels7r7UUFA_oqU2Lddqg"
          />
        </div>
      </section>

      {/* Right Interaction Panel */}
      <section className="w-full md:w-1/2 flex flex-col items-center justify-center p-md z-20">
        <div className="w-full max-w-[440px] glass-card rounded-xl p-xl shadow-2xl">
          {/* Tab Switcher */}
          <div className="flex bg-surface-container-lowest/50 p-1 rounded-lg mb-xl border border-white/5">
            <button
              type="button"
              className={`flex-1 py-sm font-label-md text-label-md rounded-md transition-all ${
                activeTab === "login"
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              onClick={() => {
                setActiveTab("login");
                setError(null);
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 py-sm font-label-md text-label-md rounded-md transition-all ${
                activeTab === "register"
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              onClick={() => {
                setActiveTab("register");
                setError(null);
              }}
            >
              Register
            </button>
          </div>

          {/* Form Content */}
          <div className="mb-lg">
            <h2 className="font-headline-lg text-headline-lg mb-xs text-on-surface">
              {activeTab === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {activeTab === "login"
                ? "Access your forensics dashboard."
                : "Start your forensic journey with Beta-AI."}
            </p>
          </div>

          {error && (
            <div className="mb-md p-sm rounded bg-error/20 border border-error/50 text-error font-body-md text-sm text-center">
              {error}
            </div>
          )}

          <form className="space-y-md" onSubmit={handleSubmit}>
            {activeTab === "register" && (
              <div className="space-y-sm">
                <label className="font-label-md text-label-md text-on-surface-variant">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary input-focus-glow transition-all"
                  placeholder="John Doe"
                  type="text"
                  required
                />
              </div>
            )}
            <div className="space-y-sm">
              <label className="font-label-md text-label-md text-on-surface-variant">Email Address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary input-focus-glow transition-all"
                placeholder="name@company.com"
                type="email"
                required
              />
            </div>
            <div className="space-y-sm">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface-variant">Password</label>
                {activeTab === "login" && (
                  <a className="font-label-md text-label-md text-primary hover:underline" href="#">
                    Forgot?
                  </a>
                )}
              </div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary input-focus-glow transition-all"
                placeholder="••••••••"
                type="password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={formLoading}
              className="w-full gradient-button py-md rounded-lg font-label-md text-label-md text-white font-bold flex items-center justify-center space-x-sm mt-lg cursor-pointer active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              <span>{formLoading ? "Loading..." : activeTab === "login" ? "Continue" : "Create Account"}</span>
              {!formLoading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
          </form>

          <div className="relative my-xl">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-transparent px-sm font-label-md text-label-md text-on-surface-variant">
                Or continue with
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setError("Google SSO is not enabled on local backend.");
            }}
            className="w-full flex items-center justify-center space-x-md py-sm border border-outline-variant rounded-lg bg-transparent hover:bg-white/5 transition-colors font-label-md text-label-md text-on-surface cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="currentColor"
              ></path>
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="currentColor"
              ></path>
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="currentColor"
              ></path>
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                fill="currentColor"
              ></path>
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>

        {/* Footer Links */}
        <footer className="mt-xl flex space-x-lg">
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors text-xs" href="#">
            Privacy Policy
          </a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors text-xs" href="#">
            Terms of Service
          </a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors text-xs" href="#">
            Contact Support
          </a>
        </footer>
      </section>
    </main>
  );
}
