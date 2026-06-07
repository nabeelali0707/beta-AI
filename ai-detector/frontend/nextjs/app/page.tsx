"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, API_BASE_URL } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Link from "next/link";

interface HistoryItem {
  id: string;
  title: string;
  ai_score: number | null;
  plagiarism_score: number | null;
  summary: string | null;
  metadata: string | null;
  created_at: string;
}

export default function Dashboard() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    aiDetections: 0,
    plagiarismChecks: 0,
    avgScore: 0,
  });
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading]);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/history?limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const items: HistoryItem[] = data.history || [];
        setHistory(items);
        calculateStats(items);
      }
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setFetchLoading(false);
    }
  };

  const calculateStats = (items: HistoryItem[]) => {
    const total = items.length;
    let aiCount = 0;
    let plagCount = 0;
    let totalScoreSum = 0;
    let scoreCount = 0;

    items.forEach((item) => {
      if (item.ai_score !== null) {
        if (item.ai_score > 0.5) aiCount++;
        totalScoreSum += item.ai_score * 100;
        scoreCount++;
      }
      if (item.plagiarism_score !== null) {
        plagCount++;
      }
    });

    const avg = scoreCount > 0 ? Math.round(totalScoreSum / scoreCount) : 0;

    setStats({
      totalAnalyses: total,
      aiDetections: aiCount,
      plagiarismChecks: plagCount,
      avgScore: avg,
    });
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-on-background font-sans">
        <div className="flex flex-col items-center space-y-md">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">hourglass_empty</span>
          <p className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
            Initializing Forensics Session...
          </p>
        </div>
      </div>
    );
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-background text-on-background min-h-screen select-none font-sans">
      <Topbar />

      <div className="flex pt-[72px] min-h-screen">
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 md:ml-64 p-gutter max-w-container-max mx-auto w-full z-10">
          {/* Greeting */}
          <section className="mb-xl">
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
              Welcome back, {user.full_name || "Agent"}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              System status: <span className="text-secondary font-medium">Fully Operational</span>.{" "}
              {stats.totalAnalyses} records indexed in session.
            </p>
          </section>

          {/* Stat Cards Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
            <div className="glass-card p-lg rounded-xl">
              <div className="flex justify-between items-start mb-md">
                <span className="material-symbols-outlined text-primary">data_exploration</span>
                <span className="font-label-md text-label-md text-secondary">+100%</span>
              </div>
              <div className="font-display-lg text-[32px] font-bold text-on-surface">{stats.totalAnalyses}</div>
              <div className="font-label-md text-label-md text-on-surface-variant">Total Analyses</div>
            </div>
            
            <div className="glass-card p-lg rounded-xl">
              <div className="flex justify-between items-start mb-md">
                <span className="material-symbols-outlined text-primary">psychology</span>
                <span className="font-label-md text-label-md text-error">
                  {stats.totalAnalyses > 0 ? Math.round((stats.aiDetections / stats.totalAnalyses) * 100) : 0}%
                </span>
              </div>
              <div className="font-display-lg text-[32px] font-bold text-on-surface">{stats.aiDetections}</div>
              <div className="font-label-md text-label-md text-on-surface-variant">AI Detections</div>
            </div>

            <div className="glass-card p-lg rounded-xl">
              <div className="flex justify-between items-start mb-md">
                <span className="material-symbols-outlined text-primary">content_copy</span>
                <span className="font-label-md text-label-md text-secondary">Active</span>
              </div>
              <div className="font-display-lg text-[32px] font-bold text-on-surface">{stats.plagiarismChecks}</div>
              <div className="font-label-md text-label-md text-on-surface-variant">Plagiarism Checks</div>
            </div>

            <div className="glass-card p-lg rounded-xl border-primary/30">
              <div className="flex justify-between items-start mb-md">
                <span className="material-symbols-outlined text-primary">speed</span>
                <span className="font-label-md text-label-md text-primary">Peak</span>
              </div>
              <div className="font-display-lg text-[32px] font-bold text-on-surface">{stats.avgScore}%</div>
              <div className="font-label-md text-label-md text-on-surface-variant">Avg. AI Score</div>
            </div>
          </section>

          {/* Quick Actions (Asymmetric Bento) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
            {/* Large Primary Action */}
            <div 
              onClick={() => router.push("/analyzer")}
              className="md:col-span-2 relative overflow-hidden glass-card rounded-xl p-xl group cursor-pointer"
            >
              <div className="relative z-10">
                <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Analyze Text</h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-lg">
                  Paste your content here for instant forensic analysis using our proprietary Beta-V3 neural engine.
                </p>
                <button className="bg-white/10 hover:bg-white/20 text-white px-lg py-sm rounded-lg border border-white/10 transition-colors font-label-md text-label-md cursor-pointer">
                  Open Editor
                </button>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-20 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-[200px] text-primary" style={{ fontVariationSettings: "'wght' 100" }}>
                  description
                </span>
              </div>
            </div>

            {/* Secondary Actions Column */}
            <div className="flex flex-col gap-lg">
              <div 
                onClick={() => router.push("/analyzer?upload=true")}
                className="glass-card rounded-xl p-lg flex items-center justify-between group cursor-pointer flex-1"
              >
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-bold mb-xs">Upload File</div>
                  <div className="font-code-sm text-code-sm text-on-surface-variant">PDF, DOCX, TXT</div>
                </div>
                <span className="material-symbols-outlined text-primary group-hover:-translate-y-1 transition-transform">
                  upload_file
                </span>
              </div>
              
              <div 
                onClick={() => router.push("/history")}
                className="glass-card rounded-xl p-lg flex items-center justify-between group cursor-pointer flex-1"
              >
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-bold mb-xs">Full Report</div>
                  <div className="font-code-sm text-code-sm text-on-surface-variant">Batch Export Data</div>
                </div>
                <span className="material-symbols-outlined text-secondary group-hover:translate-x-1 transition-transform">
                  database
                </span>
              </div>
            </div>
          </section>

          {/* Recent History Table */}
          <section className="glass-card rounded-xl overflow-hidden mb-xl">
            <div className="px-lg py-md border-b border-white/5 flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-on-surface">Recent History</h3>
              <Link href="/history" className="text-primary font-label-md text-label-md hover:underline">
                View All
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              {fetchLoading ? (
                <div className="p-xl text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-2xl animate-spin text-primary mr-2 align-middle">
                    sync
                  </span>
                  Loading recent history...
                </div>
              ) : history.length === 0 ? (
                <div className="p-xl text-center text-on-surface-variant">
                  No analysis records found. Click "Analyze Text" to run your first check.
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-white/2 border-b border-white/5">
                    <tr>
                      <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                        Document Name
                      </th>
                      <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                        Forensic Score
                      </th>
                      <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.slice(0, 5).map((item) => {
                      const score = item.ai_score !== null ? Math.round(item.ai_score * 100) : null;
                      
                      let typeLabel = "Analysis";
                      let typeClass = "bg-primary-container/20 text-primary";
                      
                      if (score !== null) {
                        if (score > 70) {
                          typeLabel = "Synthesized";
                          typeClass = "bg-error-container/20 text-error";
                        } else if (score > 30) {
                          typeLabel = "Hybrid";
                          typeClass = "bg-secondary-container/20 text-secondary";
                        } else {
                          typeLabel = "Human";
                          typeClass = "bg-success-container/20 text-primary"; // primary fits green-blue theme
                        }
                      }

                      return (
                        <tr key={item.id} className="hover:bg-white/2 transition-colors">
                          <td className="px-lg py-md">
                            <div className="font-body-md text-body-md text-on-surface truncate max-w-xs md:max-w-md">
                              {item.title}
                            </div>
                          </td>
                          <td className="px-lg py-md">
                            <span className={`px-sm py-xs rounded font-code-sm text-code-sm ${typeClass}`}>
                              {typeLabel}
                            </span>
                          </td>
                          <td className="px-lg py-md font-body-md text-body-md text-on-surface-variant">
                            {formatTimeAgo(item.created_at)}
                          </td>
                          <td className="px-lg py-md">
                            {score !== null ? (
                              <div className="flex items-center gap-sm">
                                <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${score > 70 ? "bg-error" : score > 30 ? "bg-secondary" : "bg-primary"}`}
                                    style={{ width: `${score}%` }}
                                  ></div>
                                </div>
                                <span className={`font-bold font-code-sm text-code-sm ${score > 70 ? "text-error" : score > 30 ? "text-secondary" : "text-primary"}`}>
                                  {score}% AI
                                </span>
                              </div>
                            ) : item.plagiarism_score !== null ? (
                              <span className="text-secondary font-bold font-code-sm text-code-sm">
                                {Math.round(item.plagiarism_score)}% Plag.
                              </span>
                            ) : (
                              <span className="text-on-surface-variant font-code-sm text-code-sm">Checked</span>
                            )}
                          </td>
                          <td className="px-lg py-md">
                            <button 
                              onClick={() => router.push(`/analyzer?id=${item.id}`)}
                              className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Background Atmospheric Effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-container/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary-container/5 rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
}
