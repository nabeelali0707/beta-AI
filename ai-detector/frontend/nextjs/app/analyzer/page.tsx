"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, API_BASE_URL } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

type AnalysisType = "ai-detect" | "plagiarism" | "summarize" | "full-report";

interface SentenceInfo {
  sentence: string;
  ai_score: number;
  suspicious: boolean;
}

interface MatchSection {
  text: string;
  similarity: number;
  source: string;
}

interface AnalyticsInfo {
  word_count?: number;
  character_count?: number;
  sentence_count?: number;
  reading_time_minutes?: number;
  readability_score?: number;
  vocabulary_diversity?: number;
}

interface ResultData {
  ai_score?: number | null;
  confidence_score?: number | null;
  sentence_analysis?: SentenceInfo[];
  plagiarism_score?: number | null;
  matched_sections?: MatchSection[];
  matches_found?: number;
  summary?: string;
  analytics?: AnalyticsInfo;
}

export default function AnalyzerPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("ai-detect");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading]);

  useEffect(() => {
    const historicalId = searchParams.get("id");
    if (historicalId && token) {
      loadHistoricalAnalysis(historicalId);
    }

    const triggerUpload = searchParams.get("upload");
    if (triggerUpload === "true") {
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 300);
    }
  }, [searchParams, token]);

  const loadHistoricalAnalysis = async (id: string) => {
    setStatus("loading");
    try {
      const response = await fetch(`${API_BASE_URL}/history/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load analysis history detail");
      }

      const data = await response.json();
      setTitle(data.title);
      
      // Parse metadata if available
      let parsedMeta: ResultData = {};
      if (data.metadata) {
        try {
          const parsed = JSON.parse(data.metadata);
          // If it was a full report, it will be nested
          if (parsed.ai || parsed.plagiarism || parsed.summary || parsed.analytics) {
            parsedMeta = {
              ai_score: parsed.ai?.ai_score,
              confidence_score: parsed.ai?.confidence_score,
              sentence_analysis: parsed.ai?.sentence_analysis,
              plagiarism_score: parsed.plagiarism?.plagiarism_score,
              matched_sections: parsed.plagiarism?.matched_sections,
              matches_found: parsed.plagiarism?.matches_found,
              summary: parsed.summary?.summary || data.summary,
              analytics: parsed.analytics,
            };
          } else {
            parsedMeta = parsed;
          }
        } catch (e) {
          console.error("Failed to parse metadata", e);
        }
      }

      setResult({
        ai_score: data.ai_score,
        plagiarism_score: data.plagiarism_score,
        summary: data.summary || parsedMeta.summary,
        ...parsedMeta,
      });

      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to load historical scan.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFile(files[0]);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setErrorState(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to upload file");
      }

      setTitle(file.name.replace(/\.[^/.]+$/, ""));
      setText(data.extracted_text || "");
    } catch (err: any) {
      setErrorState(err.message || "File upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const runAnalysis = async () => {
    if (!text.trim()) {
      setErrorState("Please enter content or upload a file to analyze.");
      return;
    }

    const payloadTitle = title.trim() || `Untitled Analysis - ${new Date().toLocaleDateString()}`;
    setStatus("loading");
    setResult(null);
    setErrorMessage(null);

    let endpoint = `${API_BASE_URL}/analysis/ai-detect`;
    let bodyObj: any = { title: payloadTitle, text };

    if (analysisType === "plagiarism") {
      endpoint = `${API_BASE_URL}/analysis/plagiarism`;
    } else if (analysisType === "summarize") {
      endpoint = `${API_BASE_URL}/analysis/summarize`;
      bodyObj.summary_type = "short";
    } else if (analysisType === "full-report") {
      endpoint = `${API_BASE_URL}/analysis/full-report`;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyObj),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Analysis request failed");
      }

      setResult(data);
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "An error occurred during scanning.");
    }
  };

  const downloadReport = async () => {
    if (!result || !token) return;
    try {
      const payloadTitle = title.trim() || "Beta-AI Report";
      const response = await fetch(`${API_BASE_URL}/analysis/full-report/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: payloadTitle, text }),
      });

      if (!response.ok) throw new Error("Failed to download report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${payloadTitle.toLowerCase().replace(/ /g, "-")}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error(error);
      alert("Failed to export Markdown report.");
    }
  };

  const setErrorState = (msg: string | null) => {
    setErrorMessage(msg);
    if (msg) {
      setStatus("error");
    } else {
      setStatus("idle");
    }
  };

  const discardResult = () => {
    setResult(null);
    setStatus("idle");
    setText("");
    setTitle("");
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-on-background">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">hourglass_empty</span>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen font-sans">
      <Topbar />

      <div className="flex pt-[72px] min-h-screen">
        <Sidebar />

        <main className="flex-1 md:ml-64 p-gutter max-w-container-max mx-auto w-full z-10">
          <div className="flex flex-col lg:flex-row gap-lg items-stretch min-h-[calc(100vh-120px)]">
            
            {/* Left Panel: Inputs */}
            <div className="w-full lg:w-1/2 flex flex-col space-y-md">
              <div className="glass-panel p-lg rounded-xl flex-1 flex flex-col space-y-md">
                <h2 className="font-headline-md text-headline-md text-on-surface">Forensic Editor</h2>
                
                {/* Title */}
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface-variant px-xs">Document Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-white/10 rounded-lg p-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-white/20"
                    placeholder="e.g., Thesis Chapter 1 Draft"
                    type="text"
                  />
                </div>

                {/* Text Content */}
                <div className="flex-1 flex flex-col space-y-xs min-h-[300px]">
                  <label className="font-label-md text-label-md text-on-surface-variant px-xs">Content to Scan</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full flex-1 bg-surface-container-lowest border border-white/10 rounded-lg p-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none placeholder:text-white/20"
                    placeholder="Paste your paragraphs here to verify linguistic perplexity, plagiarism match patterns, or summaries..."
                  ></textarea>
                </div>

                {/* Upload Zone */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 rounded-xl p-lg flex flex-col items-center justify-center bg-white/5 hover:bg-white/[0.08] hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-3xl mb-sm">
                    {isUploading ? "sync" : "upload_file"}
                  </span>
                  <p className="font-label-md text-label-md text-on-surface">
                    {isUploading ? "Processing File..." : "Click to upload or drag & drop"}
                  </p>
                  <p className="text-[12px] text-on-surface-variant mt-xs">PDF, DOCX, TXT (Max 50MB)</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="glass-panel p-lg rounded-xl flex flex-col space-y-md">
                <div className="space-y-sm">
                  <label className="font-label-md text-label-md text-on-surface-variant px-xs">Analysis Type</label>
                  <div className="grid grid-cols-2 gap-sm">
                    {[
                      { id: "ai-detect", label: "AI Detection", icon: "auto_awesome" },
                      { id: "plagiarism", label: "Plagiarism", icon: "find_in_page" },
                      { id: "summarize", label: "Summarize", icon: "summarize" },
                      { id: "full-report", label: "Full Report", icon: "article" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setAnalysisType(item.id as AnalysisType)}
                        className={`p-md rounded-lg border font-label-md text-label-md flex items-center justify-center space-x-xs transition-all cursor-pointer active:scale-95 ${
                          analysisType === item.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-white/10 bg-white/5 text-on-surface-variant hover:border-white/20"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={runAnalysis}
                  disabled={status === "loading"}
                  className="w-full py-lg btn-primary-gradient rounded-xl text-white font-bold text-lg flex items-center justify-center space-x-md active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:scale-100"
                >
                  <span className="material-symbols-outlined">rocket_launch</span>
                  <span>{status === "loading" ? "Analyzing Dataset..." : "Run Deep Analysis"}</span>
                </button>
              </div>
            </div>

            {/* Right Panel: Results & Loading States */}
            <div className="w-full lg:w-1/2 flex flex-col space-y-md">
              {status === "idle" && (
                <div className="glass-panel p-lg rounded-xl flex-1 flex flex-col items-center justify-center text-center">
                  <div className="flex flex-col items-center space-y-sm text-on-surface-variant/40">
                    <span className="material-symbols-outlined text-5xl">hourglass_empty</span>
                    <p className="font-label-md text-label-md uppercase tracking-widest">Awaiting Input</p>
                    <p className="text-xs max-w-xs leading-normal">
                      Input text in the editor or upload a document, select your scanning vectors, and launch the engine.
                    </p>
                  </div>
                </div>
              )}

              {status === "loading" && (
                <div className="glass-panel p-lg rounded-xl flex-1 flex flex-col space-y-md">
                  <div className="flex items-center justify-between mb-lg">
                    <div className="h-8 w-40 skeleton-gradient rounded-lg opacity-80"></div>
                    <div className="h-6 w-24 skeleton-gradient rounded-full opacity-60"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-md mb-xl">
                    <div className="h-24 skeleton-gradient rounded-xl opacity-40"></div>
                    <div className="h-24 skeleton-gradient rounded-xl opacity-40"></div>
                    <div className="h-24 skeleton-gradient rounded-xl opacity-40"></div>
                  </div>
                  <div className="flex-1 flex flex-col space-y-md">
                    <div className="h-4 w-full skeleton-gradient rounded opacity-40"></div>
                    <div className="h-4 w-[92%] skeleton-gradient rounded opacity-40"></div>
                    <div className="h-4 w-[85%] skeleton-gradient rounded opacity-30"></div>
                    <div className="h-4 w-full skeleton-gradient rounded opacity-40"></div>
                    <div className="h-4 w-[78%] skeleton-gradient rounded opacity-30"></div>
                    <div className="mt-xl h-48 w-full skeleton-gradient rounded-xl opacity-20 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center space-y-sm text-on-surface-variant/40 animate-pulse">
                          <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
                          <p className="font-label-md text-label-md uppercase tracking-widest text-primary font-bold">
                            Engine Running
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="glass-panel p-lg rounded-xl flex-1 flex flex-col items-center justify-center text-center">
                  <div className="flex flex-col items-center space-y-sm text-error">
                    <span className="material-symbols-outlined text-5xl">warning</span>
                    <p className="font-label-md text-label-md uppercase tracking-widest font-bold">Analysis Terminated</p>
                    <p className="text-sm max-w-sm leading-normal text-on-surface-variant">
                      {errorMessage || "Linguistic scan halted due to connection reset."}
                    </p>
                    <button
                      onClick={() => setStatus("idle")}
                      className="mt-md px-lg py-sm rounded-lg bg-white/5 border border-white/10 text-on-surface hover:bg-white/10 text-xs cursor-pointer"
                    >
                      Reset Editor
                    </button>
                  </div>
                </div>
              )}

              {status === "success" && result && (
                <div className="glass-panel p-lg rounded-xl flex-1 flex flex-col overflow-y-auto max-h-[85vh] space-y-lg custom-scrollbar">
                  
                  {/* Result Header */}
                  <div className="flex justify-between items-start border-b border-white/5 pb-md">
                    <div>
                      <span className="bg-error-container text-on-error-container text-code-sm font-label-md px-sm py-0.5 rounded-full uppercase tracking-wider text-xs">
                        Report Compiled
                      </span>
                      <h3 className="font-headline-md text-headline-md text-on-surface mt-xs">Forensic Breakdown</h3>
                    </div>
                    
                    <button 
                      onClick={discardResult}
                      className="p-sm text-on-surface-variant hover:text-error hover:bg-white/5 rounded-full cursor-pointer"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>

                  {/* AI score Gauge (If present) */}
                  {result.ai_score !== undefined && result.ai_score !== null && (
                    <div className="flex flex-col items-center justify-center py-md bg-white/2 rounded-xl border border-white/5">
                      <p className="font-label-md text-label-md text-on-surface-variant mb-md self-start px-md">AI PROBABILITY</p>
                      
                      <div className="relative w-48 h-48 rounded-full flex items-center justify-center p-md" style={{
                        background: `conic-gradient(${result.ai_score > 0.7 ? '#ffb4ab' : '#7c3aed'} ${result.ai_score * 100}%, transparent 0)`
                      }}>
                        <div className="bg-background w-full h-full rounded-full flex flex-col items-center justify-center shadow-inner">
                          <span className={`font-display-lg text-[36px] font-bold ${result.ai_score > 0.7 ? 'text-error' : 'text-primary'}`}>
                            {Math.round(result.ai_score * 100)}%
                          </span>
                          <span className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider">
                            {result.ai_score > 0.7 ? "Synthesized" : result.ai_score > 0.3 ? "Hybrid/Mixed" : "Human Written"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Plagiarism (If present) */}
                  {result.plagiarism_score !== undefined && result.plagiarism_score !== null && (
                    <div className="bg-white/2 p-md rounded-xl border border-white/5 space-y-md">
                      <div className="flex justify-between items-center">
                        <h4 className="font-label-md text-label-md text-on-surface-variant">PLAGIARISM MATCH</h4>
                        <span className="text-secondary font-bold font-code-sm text-code-sm text-lg">
                          {Math.round(result.plagiarism_score)}%
                        </span>
                      </div>
                      
                      {result.matched_sections && result.matched_sections.length > 0 ? (
                        <div className="space-y-xs">
                          {result.matched_sections.map((match, idx) => (
                            <div key={idx} className="p-sm rounded bg-white/5 border border-white/5">
                              <div className="flex justify-between text-xs font-label-md mb-1 text-on-surface-variant">
                                <span className="truncate max-w-[200px] text-on-surface font-semibold">{match.source}</span>
                                <span className="text-secondary">{Math.round(match.similarity * 100)}% Match</span>
                              </div>
                              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                <div className="bg-secondary h-full" style={{ width: `${match.similarity * 100}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-on-surface-variant">No significant copy-paste patterns indexed.</p>
                      )}
                    </div>
                  )}

                  {/* Highlighted Literal Analysis */}
                  {result.sentence_analysis && result.sentence_analysis.length > 0 && (
                    <div className="space-y-sm">
                      <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">LITERAL HIGHLIGHTS</h4>
                      <div className="p-md rounded-xl bg-white/2 border border-white/5 text-sm leading-relaxed font-body-md text-on-surface max-h-60 overflow-y-auto custom-scrollbar">
                        {result.sentence_analysis.map((s, idx) => {
                          const isAi = s.ai_score > 0.6;
                          return (
                            <span 
                              key={idx} 
                              className={`cursor-help ${
                                isAi 
                                  ? "bg-error/15 border-b-2 border-error/50" 
                                  : s.ai_score < 0.3
                                  ? "bg-primary/15 border-b-2 border-primary/50"
                                  : "bg-secondary/15 border-b-2 border-secondary/50"
                              } mr-1 px-0.5`}
                              title={`AI Confidence: ${Math.round(s.ai_score * 100)}%`}
                            >
                              {s.sentence}{" "}
                            </span>
                          );
                        })}
                      </div>
                      <div className="flex gap-md text-xs">
                        <div className="flex items-center gap-xs">
                          <div className="w-2.5 h-2.5 bg-error rounded-sm"></div>
                          <span className="text-on-surface-variant text-[11px]">AI Class</span>
                        </div>
                        <div className="flex items-center gap-xs">
                          <div className="w-2.5 h-2.5 bg-primary rounded-sm"></div>
                          <span className="text-on-surface-variant text-[11px]">Human Class</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summarize Summary text */}
                  {result.summary && (
                    <div className="space-y-sm">
                      <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">EXECUTIVE SUMMARY</h4>
                      <div className="p-md rounded-xl bg-surface-container-high border border-white/5 text-sm leading-relaxed text-on-surface-variant font-body-md">
                        {result.summary}
                      </div>
                    </div>
                  )}

                  {/* Analytics Stats */}
                  {result.analytics && (
                    <div className="space-y-sm">
                      <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">WRITING METRICS</h4>
                      <div className="grid grid-cols-2 gap-sm">
                        <div className="p-sm bg-white/2 border border-white/5 rounded-lg flex flex-col">
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Word Count</span>
                          <span className="text-lg font-bold text-on-surface">{result.analytics.word_count || 0}</span>
                        </div>
                        <div className="p-sm bg-white/2 border border-white/5 rounded-lg flex flex-col">
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Vocabulary Range</span>
                          <span className="text-lg font-bold text-secondary">
                            {result.analytics.vocabulary_diversity !== undefined
                              ? `${Math.round(result.analytics.vocabulary_diversity * 100)}%`
                              : "High"}
                          </span>
                        </div>
                        <div className="p-sm bg-white/2 border border-white/5 rounded-lg flex flex-col">
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Readability Score</span>
                          <span className="text-lg font-bold text-on-surface">
                            {result.analytics.readability_score || "Grade 12"}
                          </span>
                        </div>
                        <div className="p-sm bg-white/2 border border-white/5 rounded-lg flex flex-col">
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Est. Reading Time</span>
                          <span className="text-lg font-bold text-primary">
                            {result.analytics.reading_time_minutes || 0} Min
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Footer */}
                  <div className="border-t border-white/5 pt-md flex gap-sm">
                    <button
                      onClick={discardResult}
                      className="flex-1 py-md border border-white/10 glass-card rounded-lg text-xs font-bold hover:bg-white/5 cursor-pointer text-center active:scale-95"
                    >
                      Discard
                    </button>
                    
                    <button
                      onClick={downloadReport}
                      className="flex-1 py-md bg-gradient-to-r from-primary to-secondary text-background rounded-lg text-xs font-bold flex items-center justify-center gap-xs cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(210,187,255,0.2)]"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      <span>Export MD</span>
                    </button>
                  </div>
                  
                </div>
              )}
            </div>

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
