import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { adminApi, questionApi, faqApi, answerApi, faqAdminApi, categoryApi, userApi } from "../services/api";
import { socket } from "../services/socket";
import { useDebounce } from "../hooks/useDebounce";
import logo from "../assets/logo.png";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { getUserTitle } from "../utils/gamification";

// ── Helpers ───────────────────────────────────────────────────

function timeAgo(date) {
  if (!date) return "—";
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function StatusBadge({ status }) {
  const map = {
    open: { bg: "#fffbeb", border: "#fde68a", color: "#b45309", label: "Open" },
    answered: { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", label: "Answered" },
    reopened: { bg: "#fff7ed", border: "#fed7aa", color: "#c2410c", label: "Reopened" },
    closed: { bg: "#f9fafb", border: "#e5e7eb", color: "#4B5563", label: "Closed" },
    verified: { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", label: "Verified" },
  };
  const s = map[status] || { bg: "#f9fafb", border: "#e5e7eb", color: "#4B5563", label: status };
  return (
    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border" style={{ background: s.bg, borderColor: s.border, color: s.color }}>
      {s.label}
    </span>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="card p-6 max-w-sm w-full mx-4 animate-scale-in">
        <h3 className="font-bold text-lg mb-3" style={{ color: "#1F2937" }}>Confirm Action</h3>
        <p className="text-sm mb-5" style={{ color: "#6B7280" }}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary px-4 py-2">Cancel</button>
          <button onClick={onConfirm} className="btn-primary px-4 py-2" style={{ background: "#dc2626" }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  const colors = type === "success" ? { bg: "#d1fae5", color: "#065f46" } : { bg: "#fef2f2", color: "#dc2626" };
  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg animate-slide-up" style={{ background: colors.bg, color: colors.color }}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

function AdjustPointsModal({ user, onConfirm, onCancel }) {
  const [points, setPoints] = useState(user?.reputation || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="card p-6 max-w-sm w-full mx-4 animate-scale-in">
        <h3 className="font-bold text-lg mb-3" style={{ color: "#1F2937" }}>Adjust Reputation</h3>
        <p className="text-sm mb-5" style={{ color: "#6B7280" }}>Set total reputation points for <strong>{user?.name}</strong>.</p>
        <input 
          type="number" 
          value={points} 
          onChange={(e) => setPoints(Number(e.target.value))} 
          className="input mb-5" 
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary px-4 py-2">Cancel</button>
          <button onClick={() => onConfirm(points)} className="btn-primary px-4 py-2" style={{ background: "#059669" }}>Save Points</button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Dashboard ────────────────────────────────────────────

function DashboardTab() {
  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: adminApi.getStats, refetchInterval: 30000 });
  const { data: failedSearches = [] } = useQuery({ queryKey: ["failed-searches"], queryFn: faqApi.failedSearches, staleTime: 1000 * 60 });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Questions", value: stats?.totalQuestions ?? "—", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
          { label: "Open Questions", value: stats?.openQuestions ?? "—", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
          { label: "Answered", value: stats?.answeredQuestions ?? "—", icon: "M5 13l4 4L19 7" },
          { label: "Verified Answers", value: stats?.verifiedQuestions ?? "—", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
          { label: "Total FAQs", value: stats?.totalFaqs ?? "—", icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.007 2.917-.546.086-.99.622-1.16 1.21a2.85 2.85 0 01-2.917 0A2.85 2.85 0 008.228 9z" },
          { label: "Categories", value: stats?.totalCategories ?? "—", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
          { label: "Total Users", value: stats?.totalUsers ?? "—", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#f0f4ef", color: "#5E7A5A" }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "#1F2937" }}>{value}</p>
              <p className="text-sm font-medium" style={{ color: "#6B7280" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Failed Searches Panel ── */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">&#x26A0;&#xFE0F;</span>
          <h2 className="font-bold text-base" style={{ color: "#1F2937" }}>Knowledge Gaps &mdash; Failed Searches</h2>
          <span className="ml-auto text-xs text-gray-400">Students searched for these but found no results. Create FAQs for the top queries!</span>
        </div>
        {failedSearches.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">✨ No failed searches yet &mdash; your knowledge base is solid!</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {failedSearches.map((item, i) => (
              <div key={item.query} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: i < 3 ? "#fee2e2" : "#f3f4f6", color: i < 3 ? "#dc2626" : "#6b7280" }}>{i + 1}</span>
                  <span className="text-sm font-medium text-gray-700">{item.query}</span>
                </div>
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">{item.count}x searched</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Questions ────────────────────────────────────────────

function QuestionsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState({ status: "", category: "", search: "" });
  const [selected, setSelected] = useState(null);
  const [answerDraft, setAnswerDraft] = useState("");
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const detailPanelRef = useRef(null);

  useEffect(() => {
    if (selected && window.innerWidth < 1024) {
      detailPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selected]);

  const debouncedFilterSearch = useDebounce(filter.search, 300);

  const { data: questions = [], isLoading: qLoad } = useQuery({
    queryKey: ["admin-questions", { ...filter, search: debouncedFilterSearch }],
    queryFn: () => questionApi.list({ status: filter.status || undefined, category: filter.category || undefined, search: debouncedFilterSearch || undefined }),
  });

  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;
    const handleUpdate = () => {
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
      qc.invalidateQueries({ queryKey: ["question-detail"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    };
    socket.on("questionAdded", handleUpdate);
    socket.on("statusUpdated", handleUpdate);
    socket.on("answerAdded", handleUpdate);
    return () => {
      socket.off("questionAdded", handleUpdate);
      socket.off("statusUpdated", handleUpdate);
      socket.off("answerAdded", handleUpdate);
    };
  }, [qc]);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: faqApi.listCategories });

  const { data: detail } = useQuery({
    queryKey: ["question-detail", selected?._id],
    queryFn: () => questionApi.getById(selected._id),
    enabled: !!selected?._id,
  });

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAnswerDraft((prev) => prev + (prev ? " " : "") + transcript);
    };
    recognition.onerror = (e) => {
      console.error("Speech error:", e);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      const imageMarkdown = `\n![Image](${base64})\n`;
      setAnswerDraft((prev) => prev + imageMarkdown);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const updateCategoryMut = useMutation({
    mutationFn: ({ id, category }) => questionApi.update(id, { category }),
    onSuccess: (res) => {
      qc.invalidateQueries(["question-detail"]);
      qc.invalidateQueries(["admin-questions"]);
      setToast("Category updated successfully!");
      if (selected && selected._id === res?._id) {
        setSelected(prev => ({ ...prev, category: res.category }));
      }
    }
  });

  const answerMut = useMutation({ mutationFn: ({ id, data }) => questionApi.addAnswer(id, data), onSuccess: () => { qc.invalidateQueries(["question-detail"]); qc.invalidateQueries(["admin-questions"]); setToast("Answer submitted!"); } });
  const verifyMut = useMutation({ mutationFn: ({ id, verified }) => answerApi.verify(id, verified), onSuccess: () => { qc.invalidateQueries(["question-detail"]); qc.invalidateQueries(["admin-questions"]); qc.invalidateQueries({ queryKey: ["user-profile"] }); qc.invalidateQueries({ queryKey: ["users-leaderboard"] }); } });
  const closeMut = useMutation({ mutationFn: (id) => questionApi.close(id), onSuccess: () => { qc.invalidateQueries(["question-detail"]); qc.invalidateQueries(["admin-questions"]); setToast("Question closed."); } });
  const reopenMut = useMutation({ mutationFn: (id) => questionApi.reopen(id), onSuccess: () => { qc.invalidateQueries(["question-detail"]); qc.invalidateQueries(["admin-questions"]); setToast("Question reopened."); } });
  const deleteMut = useMutation({ mutationFn: (id) => questionApi.delete(id), onSuccess: () => { setSelected(null); qc.invalidateQueries(["admin-questions"]); setToast("Question deleted."); } });
  const convertMut = useMutation({ mutationFn: ({ id, answerId }) => questionApi.convertToFaq(id, answerId), onSuccess: () => { qc.invalidateQueries(["admin-questions"]); qc.invalidateQueries(["admin-stats"]); setToast("Converted to FAQ!"); } });

  const handleSubmitAnswer = () => {
    if (!answerDraft.trim() || !selected) return;
    answerMut.mutate({ id: selected._id, data: { content: answerDraft, contributorName: "Admin" } });
    setAnswerDraft("");
  };  return (
    <div className="h-full flex flex-col">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {confirm && <ConfirmModal message={confirm.message} onConfirm={() => { confirm.action(); setConfirm(null); }} onCancel={() => setConfirm(null)} />}

      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <select className="input py-2.5 text-sm bg-white border border-[#E2E8DE] rounded-xl hover:border-[#bdd4ba] focus:border-[#5E7A5A] transition-all cursor-pointer font-medium text-slate-700 shadow-xs" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={{ maxWidth: 160 }}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="answered">Answered</option>
          <option value="reopened">Reopened</option>
          <option value="closed">Closed</option>
        </select>
        <select className="input py-2.5 text-sm bg-white border border-[#E2E8DE] rounded-xl hover:border-[#bdd4ba] focus:border-[#5E7A5A] transition-all cursor-pointer font-medium text-slate-700 shadow-xs" value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))} style={{ maxWidth: 160 }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="search-wrap flex-1 max-w-[320px]">
          <svg className="search-icon w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className="search-input text-sm rounded-xl py-2.5 pl-10 border border-[#E2E8DE] focus:border-[#5E7A5A] transition-all shadow-xs" placeholder="Search questions..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
        </div>
      </div>

      <div className="flex-1 card overflow-hidden flex flex-col min-h-0 h-full shadow-md rounded-2xl border border-[#E2E8DE] bg-white">
        <div className="p-5 border-b shrink-0 flex justify-between items-center bg-[#F5F7F2]/80 backdrop-blur-xs" style={{ borderColor: "#E2E8DE" }}>
          <div>
            <h2 className="font-bold text-sm text-slate-800">Questions ({questions.length})</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Click a question to view details, verify answers, or write administrative replies.</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8DE]/60">
          {qLoad ? (
            <div className="p-5 space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-20 w-full rounded-2xl" />)}</div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400 font-medium">No questions found matching your filter criteria.</div>
          ) : (
            questions.map(q => (
              <button key={q._id} onClick={() => { setSelected(q); setAnswerDraft(""); }}
                className="w-full text-left p-5 transition-all duration-200 hover:bg-[#f0f4ef]/20 cursor-pointer border-l-4 border-transparent flex flex-col gap-2" style={selected?._id === q._id ? { background: "#f0f4ef/40", borderLeftColor: "#5E7A5A" } : {}}>
                <div className="flex justify-between items-start gap-4 w-full">
                  <span className="font-semibold text-sm line-clamp-1 pr-2 text-slate-800 hover:text-[#5E7A5A] transition-colors">{q.question}</span>
                  <StatusBadge status={q.status} />
                </div>
                <div className="flex items-center gap-2.5 text-[11px] text-slate-400 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#dde8db] bg-[#f0f4ef] text-[#3a4f38]"># {q.category}</span>
                  <span>· by <strong className="text-slate-600 font-semibold">{q.contributorName || "Student"}</strong></span>
                  <span>· {timeAgo(q.createdAt)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {selected && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-100/80 animate-slide-in-right" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-start bg-gradient-to-r from-[#f0f4ef]/60 to-white shrink-0 border-[#E2E8DE]">
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <StatusBadge status={selected.status} />
                  <select
                    value={selected.category}
                    onChange={(e) => {
                      const newCategory = e.target.value;
                      setSelected(prev => ({ ...prev, category: newCategory }));
                      updateCategoryMut.mutate({ id: selected._id, category: newCategory });
                    }}
                    className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border border-[#dde8db] bg-[#f0f4ef] text-[#3a4f38] focus:outline-none cursor-pointer shadow-xs"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}># {c}</option>
                    ))}
                  </select>
                </div>
                <h2 className="text-lg font-bold leading-snug text-slate-800">{selected.question}</h2>
                <p className="text-xs text-slate-400 mt-1.5 font-medium">
                  by <strong className="text-slate-600 font-semibold">{selected.contributorName || "Student"}</strong> · {timeAgo(selected.createdAt)}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer border border-slate-200/60 shadow-xs bg-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-50/40">
              {selected.tags?.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-400">Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.map(t => <span key={t} className="px-2 py-0.5 rounded text-xs bg-white border border-[#E2E8DE] text-slate-600 font-medium">#{t}</span>)}
                  </div>
                </div>
              )}

              {selected.details && (
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-400">Question Details</h3>
                  <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-xs text-sm leading-relaxed text-slate-600 quill-content" dangerouslySetInnerHTML={{ __html: selected.details }} />
                </div>
              )}

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-400">Community Answers</h3>
                {detail?.answers?.length > 0 ? (
                  <div className="space-y-3">
                    {detail.answers.map(a => (
                      <div key={a._id} className="p-4 rounded-xl border transition-all shadow-xs" style={{ background: a.isVerified ? "#f0fdf4" : "#ffffff", borderColor: a.isVerified ? "#bbf7d0" : "#e5e7eb" }}>
                        <div className="flex justify-between items-center gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{a.contributorName}</span>
                            {a.isVerified && <span className="badge badge-green bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xxs font-bold border border-emerald-100">Verified</span>}
                          </div>
                          <div className="flex gap-1.5">
                            {!a.isVerified ? (
                              <button onClick={() => verifyMut.mutate({ id: a._id, verified: true })} className="text-xxs font-bold px-2.5 py-1 rounded bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors cursor-pointer">Verify</button>
                            ) : (
                              <button onClick={() => verifyMut.mutate({ id: a._id, verified: false })} className="text-xxs font-bold px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer">Unverify</button>
                            )}
                            <button onClick={() => deleteMut.mutate(a._id)} className="text-xxs font-bold px-2.5 py-1 rounded bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors cursor-pointer">Delete</button>
                          </div>
                        </div>
                        <div className="text-sm leading-relaxed text-slate-600 quill-content" dangerouslySetInnerHTML={{ __html: a.content }} />
                        <p className="text-xxs text-slate-400 mt-2">Submitted {timeAgo(a.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">No answers posted yet by the community.</p>
                )}
              </div>

              {/* Editor Section */}
              <div className="mt-auto pt-6 border-t border-slate-200/80 bg-white p-6 -mx-6 -mb-6 shadow-xs" style={{ boxShadow: "0 -4px 10px -2px rgba(0,0,0,0.03)" }}>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-400">Write Administrative Answer</h3>
                
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    {/* Speech to Text */}
                    <button type="button" onClick={toggleListen} title="Dictate (Speech to Text)"
                      className="w-8 h-8 rounded transition-colors flex items-center justify-center relative border cursor-pointer hover:bg-gray-50"
                      style={{ color: isListening ? "#fff" : "#374151", background: isListening ? "#ef4444" : "transparent", borderColor: "#E2E8DE" }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                      </svg>
                      {isListening && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                      )}
                    </button>
                    <span className="text-xs text-slate-500">Dictate</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="w-8 h-8 rounded transition-colors flex items-center justify-center border cursor-pointer hover:bg-gray-50 bg-white"
                      style={{ color: "#374151", borderColor: "#E2E8DE" }} title="Upload Screenshot/Image">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    <span className="text-xs text-slate-500">Upload Image</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs focus-within:border-[#5E7A5A] transition-all bg-white mb-4">
                  <textarea
                    className="w-full min-h-[120px] p-3 text-sm focus:outline-none border-0 text-slate-700 bg-white"
                    placeholder="Write the official administrative answer..."
                    value={answerDraft}
                    onChange={(e) => setAnswerDraft(e.target.value)}
                  />
                </div>
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <div className="flex gap-2">
                    {selected.status !== "closed" ? (
                      <button onClick={() => closeMut.mutate(selected._id)} className="btn-secondary text-xs px-3 py-2 cursor-pointer rounded-xl">Close Question</button>
                    ) : (
                      <button onClick={() => reopenMut.mutate(selected._id)} className="btn-secondary text-xs px-3 py-2 cursor-pointer rounded-xl">Reopen Question</button>
                    )}
                    <button onClick={() => setConfirm({ message: "Are you sure you want to delete this question permanently? This will also delete all replies.", action: () => deleteMut.mutate(selected._id) })} className="btn-secondary text-xs px-3 py-2 text-red-600 border-red-200 hover:bg-red-50 cursor-pointer rounded-xl">Delete</button>
                    <button onClick={() => setConfirm({ message: "Create an official FAQ from this question + verified answer?", action: () => convertMut.mutate({ id: selected._id }) })} className="btn-secondary text-xs px-3 py-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 cursor-pointer rounded-xl">Convert to FAQ</button>
                  </div>
                  <button onClick={handleSubmitAnswer} disabled={!answerDraft.trim() || answerMut.isPending} className="btn-primary text-xs px-5 py-2.5 cursor-pointer rounded-xl font-bold transition-transform active:scale-95">
                    {answerMut.isPending ? "Submitting..." : "Submit Answer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Tab: FAQs ─────────────────────────────────────────────────

function FaqsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState({ category: "", search: "" });
  const [editing, setEditing] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const debouncedFilterSearch = useDebounce(filter.search, 300);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["admin-faqs", { ...filter, search: debouncedFilterSearch }],
    queryFn: () => faqApi.list({ category: filter.category || undefined, search: debouncedFilterSearch || undefined }),
  });

  const faqList = useMemo(() => {
    return Array.isArray(faqs) ? faqs : (Array.isArray(faqs?.data) ? faqs.data : []);
  }, [faqs]);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: faqApi.listCategories });

  const updateMut = useMutation({ mutationFn: ({ id, data }) => faqAdminApi.update(id, data), onSuccess: () => { qc.invalidateQueries(["admin-faqs"]); setEditing(null); setToast("FAQ updated!"); } });
  const deleteMut = useMutation({ mutationFn: (id) => faqAdminApi.delete(id), onSuccess: () => { qc.invalidateQueries(["admin-faqs"]); setToast("FAQ deleted."); } });
  const pinMut = useMutation({ mutationFn: ({ id, pinned }) => faqAdminApi.pin(id, pinned), onSuccess: () => { qc.invalidateQueries(["admin-faqs"]); } });
  const createMut = useMutation({ mutationFn: (data) => faqAdminApi.create(data), onSuccess: () => { qc.invalidateQueries(["admin-faqs"]); setCreateOpen(false); setToast("FAQ created!"); } });

  return (
    <div className="h-full flex flex-col min-h-0">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <select className="input py-2 text-sm" value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))} style={{ maxWidth: 160 }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="search-wrap flex-1" style={{ maxWidth: 300 }}>
          <svg className="search-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className="search-input text-sm" placeholder="Search FAQs..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary text-sm px-4 py-2 shrink-0">+ New FAQ</button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 w-full" />)}</div>
      ) : faqList.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: "#9CA3AF" }}>No FAQs found.</div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {faqList.map(faq => (
            <div key={faq._id} className="card p-4" style={faq.isPinned ? { borderLeft: "3px solid #5E7A5A" } : {}}>
              {editing?._id === faq._id ? (
                <div className="space-y-3">
                  <input className="input text-sm" defaultValue={editing.question} onChange={e => setEditing(p => ({ ...p, question: e.target.value }))} />
                  <textarea
                    className="w-full min-h-[120px] p-3 text-sm border rounded-lg focus:outline-none border-slate-200 text-slate-700 bg-white"
                    placeholder="Write the official administrative answer..."
                    value={editing.answer || ""}
                    onChange={(e) => setEditing(p => ({ ...p, answer: e.target.value }))}
                  />
                  <div className="flex items-center gap-4 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                        if (!SpeechRecognition) {
                          alert("Speech recognition is not supported in this browser.");
                          return;
                        }
                        const rec = new SpeechRecognition();
                        rec.onresult = (ev) => {
                          const txt = ev.results[0][0].transcript;
                          setEditing(p => ({ ...p, answer: (p.answer || "") + (p.answer ? " " : "") + txt }));
                        };
                        rec.start();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-[#E2E8DE] hover:bg-gray-50 bg-white cursor-pointer"
                    >
                      🎙️ Dictate
                    </button>
                    <label className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-[#E2E8DE] hover:bg-gray-50 bg-white cursor-pointer">
                      📷 Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target.result;
                            setEditing(p => ({ ...p, answer: (p.answer || "") + `\n![Image](${base64})\n` }));
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateMut.mutate({ id: faq._id, data: { question: editing.question, answer: editing.answer, category: editing.category } })} className="btn-primary text-xs px-3 py-1.5">Save</button>
                    <button onClick={() => setEditing(null)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm" style={{ color: "#1F2937" }}>{faq.question}</span>
                      {faq.isPinned && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#5E7A5A", color: "#fff" }}>Pinned</span>}
                    </div>
                    <span className="tag tag-brand text-xs">{faq.category}</span>
                  </div>
                  <div className="text-sm mb-2 line-clamp-2 quill-content" style={{ color: "#6B7280" }} dangerouslySetInnerHTML={{ __html: faq.answer }} />
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditing({ ...faq })} className="text-xs px-2 py-1 rounded" style={{ background: "#f3f4f6", color: "#374151" }}>Edit</button>
                    <button onClick={() => pinMut.mutate({ id: faq._id, pinned: !faq.isPinned })} className="text-xs px-2 py-1 rounded" style={{ background: faq.isPinned ? "#fef3c7" : "#d1fae5", color: faq.isPinned ? "#92400e" : "#065f46" }}>
                      {faq.isPinned ? "Unpin" : "Pin"}
                    </button>
                    <button onClick={() => deleteMut.mutate(faq._id)} className="text-xs px-2 py-1 rounded" style={{ background: "#fef2f2", color: "#dc2626" }}>Delete</button>
                    <span className="text-xs ml-auto" style={{ color: "#9CA3AF" }}>Updated {timeAgo(faq.updatedAt)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {createOpen && <FaqCreateModal onClose={() => setCreateOpen(false)} onCreate={(data) => createMut.mutate(data)} isCreating={createMut.isPending} categories={categories} />}
    </div>
  );
}

function FaqCreateModal({ onClose, onCreate, isCreating, categories }) {
  const [form, setForm] = useState({ question: "", answer: "", category: "" });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="card p-6 w-full max-w-lg mx-4 animate-scale-in">
        <h3 className="font-bold text-lg mb-4" style={{ color: "#1F2937" }}>Create New FAQ</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Question</label>
            <input className="input py-2" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="Enter question..." />
          </div>
          <div>
            <label className="label">Answer</label>
            <textarea
              className="w-full min-h-[120px] p-3 text-sm border rounded-lg focus:outline-none border-slate-200 text-slate-700 bg-white"
              placeholder="Enter answer..."
              value={form.answer}
              onChange={(e) => setForm(f => ({ ...f, answer: e.target.value }))}
            />
            <div className="flex items-center gap-4 mt-1">
              <button
                type="button"
                onClick={() => {
                  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                  if (!SpeechRecognition) {
                    alert("Speech recognition is not supported in this browser.");
                    return;
                  }
                  const rec = new SpeechRecognition();
                  rec.onresult = (ev) => {
                    const txt = ev.results[0][0].transcript;
                    setForm(f => ({ ...f, answer: f.answer + (f.answer ? " " : "") + txt }));
                  };
                  rec.start();
                }}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-[#E2E8DE] hover:bg-gray-50 bg-white cursor-pointer"
              >
                🎙️ Dictate
              </button>
              <label className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-[#E2E8DE] hover:bg-gray-50 bg-white cursor-pointer">
                📷 Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const base64 = event.target.result;
                      setForm(f => ({ ...f, answer: f.answer + `\n![Image](${base64})\n` }));
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <input className="input py-2" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Category name..." list="cat-list" />
            <datalist id="cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="btn-secondary px-4 py-2">Cancel</button>
          <button onClick={() => onCreate(form)} disabled={!form.question || !form.answer || !form.category || isCreating} className="btn-primary px-4 py-2">
            {isCreating ? "Creating..." : "Create FAQ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Categories ───────────────────────────────────────────

function CategoriesTab() {
  const qc = useQueryClient();
  const [toast, setToast] = useState(null);
  const [newCat, setNewCat] = useState("");

  const { data: cats = [], isLoading } = useQuery({ queryKey: ["category-stats"], queryFn: categoryApi.getStats });

  const createMut = useMutation({ mutationFn: (name) => categoryApi.create(name), onSuccess: (res) => { qc.invalidateQueries(["category-stats"]); setNewCat(""); setToast(res?.alreadyExists ? "Category already exists." : "Category added!"); } });

  return (
    <div className="h-full flex flex-col min-h-0">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="flex gap-3 mb-4">
        <input className="input py-2 text-sm flex-1" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New category name..." />
        <button onClick={() => newCat.trim() && createMut.mutate(newCat.trim())} className="btn-primary text-sm px-4 py-2 shrink-0" disabled={!newCat.trim()}>
          Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 w-full" />)}</div>
      ) : cats.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: "#9CA3AF" }}>No categories found.</div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b" style={{ borderColor: "#E2E8DE" }}>
                  <th className="text-left p-3 font-semibold" style={{ color: "#6B7280" }}>Category</th>
                  <th className="text-center p-3 font-semibold" style={{ color: "#6B7280" }}>FAQs</th>
                  <th className="text-center p-3 font-semibold" style={{ color: "#6B7280" }}>Questions</th>
                </tr>
              </thead>
              <tbody>
                {cats.map(cat => (
                  <tr key={cat.name} className="border-b" style={{ borderColor: "#F5F7F2" }}>
                    <td className="p-3 font-medium" style={{ color: "#1F2937" }}>{cat.name}</td>
                    <td className="p-3 text-center" style={{ color: "#6B7280" }}>{cat.faqCount}</td>
                    <td className="p-3 text-center" style={{ color: "#6B7280" }}>{cat.questionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Users ─────────────────────────────────────────────────

function UsersTab() {
  const qc = useQueryClient();
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [adjustUser, setAdjustUser] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data: users = [], isLoading } = useQuery({ queryKey: ["admin-users", debouncedSearch], queryFn: () => userApi.list(debouncedSearch || undefined) });

  const updateMut = useMutation({ mutationFn: ({ id, data }) => userApi.update(id, data), onSuccess: () => { qc.invalidateQueries(["admin-users"]); qc.invalidateQueries(["admin-stats"]); setToast("User updated!"); } });
  const deleteMut = useMutation({ mutationFn: (id) => userApi.delete(id), onSuccess: () => { qc.invalidateQueries(["admin-users"]); qc.invalidateQueries(["admin-stats"]); setToast("User deleted."); } });

  const filtered = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.username?.toLowerCase().includes(s) || u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
  });

  return (
    <div className="h-full flex flex-col min-h-0">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {adjustUser && (
        <AdjustPointsModal 
          user={adjustUser}
          onConfirm={(newPoints) => {
            updateMut.mutate({ id: adjustUser._id, data: { reputation: newPoints } });
            setAdjustUser(null);
          }}
          onCancel={() => setAdjustUser(null)}
        />
      )}

      <div className="mb-4">
        <div className="search-wrap" style={{ maxWidth: 300 }}>
          <svg className="search-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className="search-input text-sm" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: "#9CA3AF" }}>No users found.</div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="border-b" style={{ borderColor: "#E2E8DE" }}>
                  <th className="text-left p-3 font-semibold" style={{ color: "#6B7280" }}>Name</th>
                  <th className="text-left p-3 font-semibold" style={{ color: "#6B7280" }}>Username</th>
                  <th className="text-center p-3 font-semibold" style={{ color: "#6B7280" }}>Role</th>
                  <th className="text-center p-3 font-semibold" style={{ color: "#6B7280" }}>Status</th>
                  <th className="text-center p-3 font-semibold" style={{ color: "#6B7280" }}>Joined</th>
                  <th className="text-center p-3 font-semibold" style={{ color: "#6B7280" }}>Questions</th>
                  <th className="text-center p-3 font-semibold" style={{ color: "#6B7280" }}>Reputation</th>
                  <th className="text-center p-3 font-semibold" style={{ color: "#6B7280" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const rank = getUserTitle(u.reputation || 0);
                  return (
                  <tr key={u._id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "#F5F7F2" }}>
                    <td className="p-3 font-medium" style={{ color: "#1F2937" }}>{u.name || "—"}</td>
                    <td className="p-3" style={{ color: "#374151" }}>{u.username || u.email || "—"}</td>
                    <td className="p-3 text-center">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: u.role === "admin" ? "#fef3c7" : "#dbeafe", color: u.role === "admin" ? "#92400e" : "#1e40af" }}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: u.isActive ? "#d1fae5" : "#fee2e2", color: u.isActive ? "#065f46" : "#dc2626" }}>
                        {u.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="p-3 text-center" style={{ color: "#6B7280" }}>{timeAgo(u.createdAt)}</td>
                    <td className="p-3 text-center" style={{ color: "#6B7280" }}>{u.questionsAsked?.length || 0}</td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm" style={{ color: rank.color }}>{u.reputation || 0} pts</span>
                        <span className="text-xs font-semibold px-1.5 rounded-full mt-1" style={{ background: rank.bg, color: rank.color }}>{rank.title}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-1 justify-center flex-wrap">
                        {u.role !== "admin" && (
                          <button onClick={() => setAdjustUser(u)} className="text-xs px-2 py-1 rounded" style={{ background: "#EEF2FF", color: "#4F46E5" }}>Adj Pts</button>
                        )}
                        {u.role !== "admin" && (
                          u.isActive
                            ? <button onClick={() => updateMut.mutate({ id: u._id, data: { isActive: false } })} className="text-xs px-2 py-1 rounded" style={{ background: "#fef3c7", color: "#92400e" }}>Suspend</button>
                            : <button onClick={() => updateMut.mutate({ id: u._id, data: { isActive: true } })} className="text-xs px-2 py-1 rounded" style={{ background: "#d1fae5", color: "#065f46" }}>Activate</button>
                        )}
                        {u.role !== "admin" && <button onClick={() => deleteMut.mutate(u._id)} className="text-xs px-2 py-1 rounded" style={{ background: "#fef2f2", color: "#dc2626" }}>Delete</button>}
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Feedback ──────────────────────────────────────────────

function FeedbackTab() {
  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ["admin-unhelpful-feedback"],
    queryFn: () => faqApi.listUnhelpfulFeedback(),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-white shadow-md rounded-2xl border border-[#E2E8DE]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📢</span>
          <h2 className="font-extrabold text-base text-slate-800">
            Feedback ({feedbacks.length})
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Students submitted these comments explaining why a verified FAQ was not helpful. Use this to revise answers or fill knowledge gaps!
        </p>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400 font-medium bg-white rounded-2xl border border-slate-100">
            ✨ No unhelpful feedback comments yet! Your FAQs are super clear and helpful!
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 animate-fade-in">
            {feedbacks.map((fb, idx) => (
              <div key={idx} className="p-5 rounded-2xl border bg-white shadow-xs border-[#E2E8DE] hover:border-[#bdd4ba] transition-all flex flex-col gap-2">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">
                      FAQ: {fb.question}
                    </h3>
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded border border-[#dde8db] bg-[#f0f4ef] text-[#3a4f38] mt-1">
                      {fb.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium">
                    {timeAgo(fb.createdAt)}
                  </span>
                </div>
                
                <div className="p-4 rounded-xl bg-red-50/40 border border-red-100 mt-2">
                  <p className="text-xs font-semibold text-red-600 mb-1">
                    Feedback comment:
                  </p>
                  <p className="text-sm text-slate-700 font-medium italic">
                    &ldquo;{fb.reason}&rdquo;
                  </p>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                  <span>
                    Submitted by: <strong className="text-slate-600">{fb.userLabel}</strong>
                  </span>
                  <Link
                    to={`/faqs?category=${encodeURIComponent(fb.category)}`}
                    className="text-xs font-bold hover:underline"
                    style={{ color: "#5E7A5A" }}
                  >
                    View FAQ →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main AdminPage ────────────────────────────────────────────

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "questions", label: "Questions", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { id: "faqs", label: "FAQ Management", icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.007 2.917-.546.086-.99.622-1.16 1.21a2.85 2.85 0 01-2.917 0A2.85 2.85 0 008.228 9z" },
  { id: "categories", label: "Categories", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { id: "users", label: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { id: "feedback", label: "Feedback", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" }
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardTab />;
      case "questions": return <QuestionsTab />;
      case "faqs": return <FaqsTab />;
      case "categories": return <CategoriesTab />;
      case "users": return <UsersTab />;
      case "feedback": return <FeedbackTab />;
      default: return <DashboardTab />;
    }
  };  return (
    <div className="min-h-screen flex font-sans" style={{ background: "#F5F7F2" }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shrink-0 flex flex-col hidden md:flex" style={{ borderColor: "#E2E8DE" }}>
        <div className="h-16 flex items-center px-6 border-b bg-gradient-to-r from-[#f0f4ef]/60 to-white" style={{ borderColor: "#E2E8DE" }}>
          <img src={logo} alt="Logo" className="w-8 h-8 object-contain rounded-full shadow-sm mr-2.5 ring-2 ring-white" />
          <span className="font-extrabold text-base tracking-tight text-slate-800">AskSam <span className="text-[#5E7A5A]">Admin</span></span>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto bg-slate-50/20">
          {NAV.map(nav => (
            <button key={nav.id} onClick={() => setActiveTab(nav.id)}
              className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border-l-4 border-transparent"
              style={activeTab === nav.id ? { background: "#f0f4ef", color: "#5E7A5A", borderLeftColor: "#5E7A5A", fontWeight: "700" } : { color: "#6B7280" }}>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={nav.icon} />
              </svg>
              {nav.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t bg-slate-50/50" style={{ borderColor: "#E2E8DE" }}>
          <button onClick={handleLogout} className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50/60 border border-transparent hover:border-red-100 transition-all cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0" style={{ borderColor: "#E2E8DE" }}>
          <h1 className="font-bold text-lg text-slate-800">{NAV.find(n => n.id === activeTab)?.label || "Dashboard"}</h1>
          <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer border-2 border-white ring-2 ring-[#5E7A5A]/30" style={{ background: "#5E7A5A" }}>
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-52 bg-white rounded-2xl shadow-xl border py-1.5 z-50 animate-scale-in" style={{ borderColor: "#E2E8DE" }}>
                <div className="px-4 py-2.5 border-b" style={{ borderColor: "#F5F7F2" }}>
                  <p className="text-sm font-bold truncate text-slate-800">{user?.name || "Admin"}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{user?.email || ""}</p>
                </div>
                <div className="p-1">
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 flex-1 min-h-0 overflow-y-auto" onClick={() => setDropdownOpen(false)}>
          {renderTab()}
        </div>
      </main>
    </div>
  );
}
