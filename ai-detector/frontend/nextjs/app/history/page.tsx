"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, API_BASE_URL } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

interface HistoryItem {
  id: string;
  title: string;
  ai_score: number | null;
  plagiarism_score: number | null;
  summary: string | null;
  metadata: string | null;
  created_at: string;
}

export default function HistoryPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchLoading, setFetchLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading]);

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/history?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("Error fetching history list", error);
    } finally {
      setFetchLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/history/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert("Failed to delete this record.");
      }
    } catch (error) {
      console.error("Error deleting history item", error);
      alert("Failed to delete this record.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-on-background">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">hourglass_empty</span>
      </div>
    );
  }

  const filteredHistory = history.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const idMatch = item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || idMatch;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-sans">
      <Topbar searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder="Search history..." />

      <div className="flex pt-[72px] min-h-screen">
        <Sidebar />

        <main className="flex-1 md:ml-64 p-gutter max-w-container-max mx-auto w-full z-10 flex flex-col h-[calc(100vh-72px)] overflow-hidden">
          
          <div className="flex-1 overflow-y-auto pr-xs space-y-xl pb-24 custom-scrollbar">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-md pt-xs">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-background mb-xs">Analysis History</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Review and manage your past AI forensic scans.
                </p>
              </div>
              <div className="flex items-center gap-sm">
                <button 
                  onClick={() => router.push("/analyzer")}
                  className="flex items-center gap-xs px-md py-sm rounded-lg glass-card text-on-surface font-label-md cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>New Scan</span>
                </button>
              </div>
            </div>

            {/* Content List */}
            {fetchLoading ? (
              <div className="py-20 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl animate-spin text-primary block mb-md">sync</span>
                Loading index databases...
              </div>
            ) : filteredHistory.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="relative mb-lg">
                  <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full animate-pulse"></div>
                  <span 
                    className="material-symbols-outlined text-[120px] text-on-surface-variant opacity-20 relative z-10"
                    style={{ fontVariationSettings: "'wght' 100" }}
                  >
                    folder_open
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">
                  {searchQuery ? "No matching records" : "No analysis history found"}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto mb-lg">
                  {searchQuery 
                    ? "Try adjusting your keywords or document IDs."
                    : "It looks like you haven't performed any AI forensic scans yet. Start your first analysis to see it here."}
                </p>
                <button 
                  onClick={() => router.push("/analyzer")}
                  className="bg-primary text-on-primary font-label-md px-xl py-md rounded-xl hover:shadow-[0_0_20px_rgba(210,187,255,0.3)] transition-all cursor-pointer active:scale-95"
                >
                  Start New Analysis
                </button>
              </div>
            ) : (
              /* History Cards List */
              <div className="grid grid-cols-1 gap-md">
                {filteredHistory.map((item) => {
                  const isDeleting = deletingId === item.id;
                  const score = item.ai_score !== null ? Math.round(item.ai_score * 100) : null;
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`glass-card rounded-xl p-md flex flex-wrap md:flex-nowrap items-center justify-between gap-md group transition-all duration-300 ${
                        isDeleting ? "opacity-30 scale-95" : ""
                      }`}
                    >
                      <div className="flex items-center gap-md flex-1 min-w-[300px]">
                        <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 border border-white/5">
                          <span className="material-symbols-outlined text-primary">description</span>
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-body-lg text-body-lg font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-sm mt-xs">
                            <span className="font-code-sm text-code-sm text-on-surface-variant/60">
                              ID: {item.id.slice(0, 8)}...
                            </span>
                            <span className="w-1 h-1 rounded-full bg-on-surface-variant/30"></span>
                            <span className="font-label-md text-[12px] text-on-surface-variant">
                              {formatDate(item.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-xl shrink-0">
                        {score !== null && (
                          <div className="flex flex-col items-center">
                            <p className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-wider mb-xs">
                              AI Probability
                            </p>
                            <div className={`px-md py-xs rounded-full font-label-md text-[13px] border ${
                              score > 70 
                                ? "bg-error-container/20 border-error/30 text-error" 
                                : score > 30
                                ? "bg-secondary-container/20 border-secondary/30 text-secondary"
                                : "bg-primary-container/20 border-primary/30 text-primary"
                            }`}>
                              {score}% {score > 70 ? "Likely AI" : score > 30 ? "Mixed" : "Human"}
                            </div>
                          </div>
                        )}

                        {item.plagiarism_score !== null && (
                          <div className="flex flex-col items-center">
                            <p className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-wider mb-xs">
                              Plagiarism
                            </p>
                            <div className="px-md py-xs rounded-full bg-secondary-container/20 border border-secondary/30 text-secondary font-label-md text-[13px]">
                              {Math.round(item.plagiarism_score)}% Match
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-sm shrink-0">
                        <button 
                          onClick={() => router.push(`/analyzer?id=${item.id}`)}
                          className="w-10 h-10 rounded-lg flex items-center justify-center glass-card hover:bg-primary-container hover:text-on-primary-container transition-all cursor-pointer active:scale-95"
                          title="View analysis report"
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        
                        <button 
                          onClick={() => deleteItem(item.id)}
                          disabled={isDeleting}
                          className="w-10 h-10 rounded-lg flex items-center justify-center glass-card hover:bg-error-container hover:text-on-error-container transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:scale-100"
                          title="Delete report"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-container/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary-container/5 rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
}
