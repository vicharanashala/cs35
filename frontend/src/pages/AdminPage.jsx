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

// ── Category Confirm Modal (shown when admin approves a question with new category) ───

function CategoryConfirmModal({ pendingCategory, existingCategories, onConfirm, onCancel }) {
  const [selected, setSelected] = useState("");
  const [customName, setCustomName] = useState(pendingCategory || "");
  const [showCustom, setShowCustom] = useState(false);

  // Set default selection to first category
  useEffect(() => {
    if (existingCategories && existingCategories.length > 0) {
      const first = existingCategories[0];
      setSelected(typeof first === "string" ? first : first.name);
    }
  }, [existingCategories]);

  const handleConfirm = () => {
    if (showCustom) {
      onConfirm(customName.trim());
    } else {
      onConfirm(selected);
    }
  };

  const isNewCategory = showCustom && !existingCategories.some(c => {
    const name = typeof c === "string" ? c : c.name;
    return name.toLowerCase() === customName.trim().toLowerCase();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="card p-6 max-w-md w-full mx-4 animate-scale-in bg-white rounded-2xl border border-slate-100 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🏷️</span>
          <div>
            <h3 className="font-extrabold text-base text-slate-800">Confirm Category</h3>
            <p className="text-xs text-slate-400 font-semibold">Assign verified category for this question:</p>
          </div>
        </div>

        {pendingCategory && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xxs font-bold text-amber-700 uppercase tracking-wider mb-1">Student suggested:</p>
            <p className="text-sm font-semibold text-amber-800">"{pendingCategory}"</p>
          </div>
        )}

        <div className="mb-4 space-y-3">
          <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400">Select Category</label>
          <select
            value={showCustom ? "__custom__" : selected}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "__custom__") {
                setShowCustom(true);
              } else {
                setShowCustom(false);
                setSelected(val);
              }
            }}
            className="input w-full rounded-xl py-2.5 px-3 text-sm border border-[#E2E8DE] focus:outline-none focus:border-[#5E7A5A] transition-all bg-white font-medium cursor-pointer shadow-xs text-slate-800"
          >
            {existingCategories.map(cat => {
              const name = typeof cat === "string" ? cat : cat.name;
              return <option key={name} value={name}>{name}</option>;
            })}
            <option value="__custom__" className="text-[#5E7A5A] font-semibold">+ Add Custom Category...</option>
          </select>

          {showCustom && (
            <div className="space-y-2 animate-fade-in">
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="Type custom category name..."
                className={`input w-full rounded-xl py-2 px-3 text-sm border focus:outline-none focus:border-[#5E7A5A] transition-all bg-white font-medium ${isNewCategory ? "border-amber-300 ring-2 ring-amber-300/20" : "border-[#E2E8DE]"}`}
              />
              {isNewCategory && customName.trim().length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                  <span className="text-sm">⚠️</span>
                  <div>
                    <strong className="font-bold">New Category Detected!</strong>
                    <p className="mt-0.5 text-amber-700/90 font-medium">"{customName}" is a new category. It will be added to the system and visible on the home page.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onCancel} className="btn-secondary px-4 py-2 text-xs rounded-xl font-bold">Skip</button>
          <button
            onClick={handleConfirm}
            disabled={showCustom ? !customName.trim() : !selected}
            className="btn-primary px-4 py-2 text-xs rounded-xl font-bold disabled:opacity-50 text-white"
            style={{ background: "#5E7A5A" }}
          >
            Confirm Category
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Dashboard ────────────────────────────────────────────

function DashboardTab({ setActiveTab, setPreselectedQuestionId }) {
  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: adminApi.getStats, refetchInterval: 30000 });
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["admin-questions-queue"],
    queryFn: () => questionApi.list(),
    refetchInterval: 15000,
  });

  const pendingQuestions = useMemo(() => {
    return questions.filter(q => 
      (q.status === "open" || q.status === "reopened") &&
      q.answers &&
      q.answers.length > 0 &&
      !q.answers.some(a => a.isVerified)
    );
  }, [questions]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { 
            label: "Open Questions", 
            value: stats?.openQuestions ?? "—", 
            icon: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z", 
            bg: "#FFFBEB", 
            color: "#D97706" 
          },
          { 
            label: "Verified FAQs", 
            value: stats?.totalFaqs ?? "—", 
            icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", 
            bg: "#FAF5FF", 
            color: "#9333EA" 
          },
          { 
            label: "Total Users", 
            value: stats?.totalUsers ?? "—", 
            icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", 
            bg: "#F0F9FF", 
            color: "#0284C7" 
          },
        ].map(({ label, value, icon, bg, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3.5 border border-[#E2E8DE]/80 hover:shadow-xs transition-all bg-white rounded-xl">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg, color: color }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
              </svg>
            </div>
            <div>
              <p className="text-xl font-extrabold" style={{ color: "#1F2937" }}>{value}</p>
              <p className="text-xs font-semibold" style={{ color: "#6B7280" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Verification Queue */}
      <div className="card p-5 bg-white border border-[#E2E8DE]/80 shadow-sm rounded-xl flex flex-col gap-3">
        <div className="flex justify-between items-center pb-2 border-b border-[#E2E8DE]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-500 shrink-0">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-extrabold text-xs tracking-wider uppercase text-slate-700">Verification Queue</h2>
              <p className="text-[10px] text-slate-400 font-medium">Answers waiting for administrative verification.</p>
            </div>
          </div>
          {pendingQuestions.length > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 uppercase tracking-wider animate-pulse">
              {pendingQuestions.length} pending
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2 py-2">
            {[1, 2].map(i => (
              <div key={i} className="skeleton h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : pendingQuestions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-semibold bg-slate-50/20 rounded-xl border border-dashed border-slate-200/80">
            ✨ All community answers are reviewed. Good job!
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8DE]/30 pr-1">
            {pendingQuestions.map(q => (
              <div key={q._id} className="py-2.5 flex items-center justify-between gap-4 transition-all duration-200 hover:bg-slate-50/50 rounded-lg px-2 -mx-2">
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="font-bold text-xs text-slate-800 hover:text-[#5E7A5A] transition-colors truncate block">{q.question}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap font-medium">
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border border-[#dde8db] bg-[#f0f4ef] text-[#3a4f38]"># {q.category}</span>
                    <span>· by <strong className="text-slate-500 font-semibold">{q.contributorName || "Student"}</strong></span>
                    <span>· {timeAgo(q.createdAt)}</span>
                    <span className="inline-flex items-center gap-0.5 text-amber-700 bg-amber-50/60 px-1.5 py-0.2 rounded border border-amber-100/60 font-bold text-[9px]">
                      💬 {q.answers.length} {q.answers.length === 1 ? "answer" : "answers"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPreselectedQuestionId(q._id);
                    setActiveTab("questions");
                  }}
                  className="btn-secondary text-[10px] px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all hover:bg-[#5E7A5A] hover:text-white hover:border-[#5E7A5A] active:scale-95 flex items-center gap-1 shrink-0 border-[#E2E8DE] text-slate-600 bg-white"
                >
                  Review
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Questions ────────────────────────────────────────────

function QuestionsTab({ preselectedQuestionId, setPreselectedQuestionId, setActiveTab }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState({ status: "", category: "", search: "" });
  const [selected, setSelected] = useState(null);
  const [answerDraft, setAnswerDraft] = useState("");
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [categoryConfirmModal, setCategoryConfirmModal] = useState(null); // { pendingCategory, questionId }
  const detailPanelRef = useRef(null);

  // Verification Confirm Category Modal
  const [verifyConfirm, setVerifyConfirm] = useState(null); // { answerId, pendingCategory }
  const [verifyCategoryInput, setVerifyCategoryInput] = useState("");
  const [isNewVerifyCategory, setIsNewVerifyCategory] = useState(false);
  const [isWritingAnswer, setIsWritingAnswer] = useState(false);

  useEffect(() => {
    if (preselectedQuestionId) {
      questionApi.getById(preselectedQuestionId)
        .then(q => {
          if (q) {
            setSelected(q);
            setPreselectedQuestionId(null);
          }
        })
        .catch(err => {
          console.error("Failed to fetch preselected question:", err);
          setPreselectedQuestionId(null);
        });
    }
  }, [preselectedQuestionId, setPreselectedQuestionId]);

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
      qc.invalidateQueries({ queryKey: ["category-stats"] });
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

  const { data: rawCategories = [] } = useQuery({ queryKey: ["categories"], queryFn: faqApi.listCategories });
  const categories = useMemo(() => {
    return Array.isArray(rawCategories) ? rawCategories : (Array.isArray(rawCategories?.data) ? rawCategories.data : []);
  }, [rawCategories]);

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

  const updateCategoryMut = useMutation({
    mutationFn: ({ id, category }) => questionApi.update(id, { category }),
    onSuccess: (res) => {
      qc.invalidateQueries(["question-detail"]);
      qc.invalidateQueries(["admin-questions"]);
      qc.invalidateQueries(["category-stats"]);
      setToast("Category updated successfully!");
      if (selected && selected._id === res?._id) {
        setSelected(prev => ({ ...prev, category: res.category }));
      }
    }
  });

  const answerMut = useMutation({
    mutationFn: ({ id, data }) => questionApi.addAnswer(id, data),
    onSuccess: () => {
      qc.invalidateQueries(["question-detail"]);
      qc.invalidateQueries(["admin-questions"]);
      qc.invalidateQueries(["category-stats"]);
      setToast("Answer submitted!");
    }
  });

  const verifyMut = useMutation({
    // Pass questionId to verification mutation so that the backend can mark the question answered, update the status, and link it
    mutationFn: ({ id, verified, questionId }) => answerApi.verify(id, verified, questionId),
    onSuccess: () => {
      qc.invalidateQueries(["question-detail"]);
      qc.invalidateQueries(["admin-questions"]);
      qc.invalidateQueries(["category-stats"]);
      qc.invalidateQueries({ queryKey: ["user-profile"] });
    }
  });

  const closeMut = useMutation({ mutationFn: (id) => questionApi.close(id), onSuccess: () => { qc.invalidateQueries(["question-detail"]); qc.invalidateQueries(["admin-questions"]); setToast("Question closed."); } });
  const reopenMut = useMutation({ mutationFn: (id) => questionApi.reopen(id), onSuccess: () => { qc.invalidateQueries(["question-detail"]); qc.invalidateQueries(["admin-questions"]); setToast("Question reopened."); } });
  const deleteMut = useMutation({ mutationFn: (id) => questionApi.delete(id), onSuccess: () => { setSelected(null); qc.invalidateQueries(["admin-questions"]); qc.invalidateQueries(["category-stats"]); setToast("Question deleted."); } });
  const convertMut = useMutation({
    mutationFn: ({ id, answerId, category }) => questionApi.convertToFaq(id, { answerId, category }),
    onSuccess: () => {
      qc.invalidateQueries(["admin-questions"]);
      qc.invalidateQueries(["admin-stats"]);
      qc.invalidateQueries(["category-stats"]);
      qc.invalidateQueries(["admin-faqs"]);
      setToast("Converted to FAQ!");
    }
  });

  const handleSubmitAnswer = () => {
    if (!answerDraft.trim() || !selected) return;
    answerMut.mutate({ id: selected._id, data: { content: answerDraft, contributorName: "Admin" } });
    setAnswerDraft("");
    setIsWritingAnswer(false);
  };

  const handleVerifyClick = (answerId, currentCategory) => {
    const targetCat = currentCategory || (selected && selected.category) || "";
    // Check if targetCat exists in our active categories list (case-insensitive)
    const matched = categories && Array.isArray(categories) ? categories.find(c => {
      const name = typeof c === "string" ? c : (c?.name || "");
      return name && name.toLowerCase() === targetCat.toLowerCase();
    }) : null;
    
    // If it exists in categories list, use its exact casing. Otherwise, default to the first category in the list or "General"
    let defaultCatInput = "General";
    if (matched) {
      defaultCatInput = typeof matched === "string" ? matched : (matched?.name || "General");
    } else if (targetCat) {
      defaultCatInput = targetCat;
    } else if (categories && categories.length > 0) {
      const first = categories[0];
      defaultCatInput = typeof first === "string" ? first : (first?.name || "General");
    }

    setVerifyConfirm({ answerId, category: defaultCatInput });
    setVerifyCategoryInput(defaultCatInput || "General");
    
    const isNew = !categories || !Array.isArray(categories) || !categories.some(c => {
      const name = typeof c === "string" ? c : (c?.name || "");
      return name && name.toLowerCase() === (defaultCatInput || "General").toLowerCase();
    });
    setIsNewVerifyCategory(isNew);
  };

  const handleVerifyConfirmSubmit = async () => {
    if (!verifyConfirm) return;
    const catName = (verifyCategoryInput || "").trim() || "General";
    try {
      const isNew = !categories.some(c => {
        const name = typeof c === "string" ? c : (c?.name || "");
        return name && name.toLowerCase() === catName.toLowerCase();
      });
      
      let finalCatName = catName;
      if (isNew && !finalCatName.startsWith("Others - ")) {
        finalCatName = `Others - ${finalCatName}`;
      }
      
      if (isNew) {
        await categoryApi.confirm(finalCatName);
      }
      
      await verifyMut.mutateAsync({ id: verifyConfirm.answerId, verified: true, questionId: selected._id });
      await convertMut.mutateAsync({ id: selected._id, answerId: verifyConfirm.answerId, category: finalCatName });
      
      setVerifyConfirm(null);
      setSelected(null);
      setToast(`Verified & converted to FAQ under category "${catName}"`);
      if (typeof setActiveTab === "function") {
        setActiveTab("faqs");
      }
    } catch (err) {
      setToast("Verification process failed.");
    }
  };

  const handleVerifyCategoryInputChange = (val) => {
    const safeVal = val || "";
    setVerifyCategoryInput(safeVal);
    const isNew = !categories.some(c => {
      const name = typeof c === "string" ? c : (c?.name || "");
      return name && name.toLowerCase() === safeVal.trim().toLowerCase();
    });
    setIsNewVerifyCategory(isNew && safeVal.trim().length > 0);
  };

  return (
    <div className="h-full flex flex-col">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {confirm && <ConfirmModal message={confirm.message} onConfirm={() => { confirm.action(); setConfirm(null); }} onCancel={() => setConfirm(null)} />}
      {categoryConfirmModal && (
        <CategoryConfirmModal
          pendingCategory={categoryConfirmModal.pendingCategory}
          existingCategories={categories}
          onConfirm={async (confirmedName) => {
            try {
              await categoryApi.confirm(confirmedName);
              await questionApi.update(categoryConfirmModal.questionId, { category: confirmedName, pendingCategory: undefined });
              qc.invalidateQueries(["admin-questions"]);
              qc.invalidateQueries(["categories"]);
              qc.invalidateQueries(["category-stats"]);
              setSelected(null);
              setToast(`Category "${confirmedName}" confirmed!`);
            } catch {
              setToast("Failed to confirm category.");
            }
            setCategoryConfirmModal(null);
          }}
          onCancel={() => setCategoryConfirmModal(null)}
        />
      )}

      {verifyConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="card p-6 max-w-md w-full mx-4 animate-scale-in border border-slate-100/80 shadow-2xl bg-white rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="font-extrabold text-base text-slate-800">Confirm Category for FAQ</h3>
                <p className="text-xs text-slate-400 font-medium">Verify answer and add question to FAQ under category:</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Category Name</label>
              <div className="relative">
                <select
                  value={categories && categories.some(c => (typeof c === "string" ? c : (c?.name || "")) === verifyCategoryInput) ? verifyCategoryInput : "__custom__"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "__custom__") {
                      handleVerifyCategoryInputChange("");
                    } else {
                      handleVerifyCategoryInputChange(val);
                    }
                  }}
                  className="input w-full rounded-xl py-2.5 px-3 text-sm border border-[#E2E8DE] focus:outline-none focus:border-[#5E7A5A] transition-all bg-white font-medium cursor-pointer shadow-xs text-slate-800"
                >
                  {categories && categories.map(c => {
                    const name = typeof c === "string" ? c : (c?.name || "");
                    if (!name) return null;
                    return <option key={name} value={name} className="text-slate-800 bg-white py-1">{name}</option>;
                  })}
                  <option value="__custom__" className="text-[#5E7A5A] font-semibold bg-white py-1">+ Add Custom Category...</option>
                </select>

                {(!categories || !categories.some(c => (typeof c === "string" ? c : (c?.name || "")) === verifyCategoryInput) || !verifyCategoryInput) && (
                  <input
                    type="text"
                    value={verifyCategoryInput}
                    onChange={e => handleVerifyCategoryInputChange(e.target.value)}
                    placeholder="Enter custom category name..."
                    className={`input w-full rounded-xl py-2 px-3 text-sm border focus:outline-none focus:border-[#5E7A5A] transition-all bg-white font-medium mt-2.5 ${isNewVerifyCategory ? "border-amber-300 ring-2 ring-amber-300/20" : "border-[#E2E8DE]"}`}
                  />
                )}
              </div>

              {isNewVerifyCategory && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2 animate-fade-in">
                  <span className="text-sm">⚠️</span>
                  <div>
                    <strong className="font-bold">New Category Detected!</strong>
                    <p className="mt-0.5 text-amber-700/90 font-medium">"{verifyCategoryInput}" does not match any current active category. It will be added as a new category and listed on the home/FAQ pages.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setVerifyConfirm(null)} className="btn-secondary px-4 py-2 text-xs rounded-xl font-bold cursor-pointer">Cancel</button>
              <button
                onClick={handleVerifyConfirmSubmit}
                disabled={!verifyCategoryInput || !verifyCategoryInput.trim()}
                className="btn-primary px-4 py-2 text-xs rounded-xl font-bold disabled:opacity-50 cursor-pointer text-white"
                style={{ background: "#5E7A5A" }}
              >
                Verify & Add to FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {isWritingAnswer && selected && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col p-6 mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Write Administrative Answer</h3>
                <p className="text-xxs text-slate-400 mt-0.5 font-semibold">Adding an official administrative reply to this question</p>
              </div>
              <button onClick={() => setIsWritingAnswer(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700 cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="bg-[#f0f4ef]/30 border border-[#dde8db] rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed font-semibold">
                {selected.question}
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={toggleListen} title="Dictate (Speech to Text)"
                  className="w-8 h-8 rounded-xl transition-colors flex items-center justify-center relative border cursor-pointer hover:bg-gray-50 border-slate-200"
                  style={{ color: isListening ? "#fff" : "#374151", background: isListening ? "#ef4444" : "transparent" }}>
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
                <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider">Speech-to-Text</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#5E7A5A] transition-all bg-white">
                <textarea
                  className="w-full min-h-[140px] p-3 text-sm focus:outline-none border-0 text-slate-700 bg-white"
                  placeholder="Write the official administrative answer..."
                  value={answerDraft}
                  onChange={(e) => setAnswerDraft(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 pt-4 border-t border-slate-100 flex-wrap">
              <button onClick={() => { setIsWritingAnswer(false); setSelected(selected); }} className="btn-secondary text-xs px-4 py-2 cursor-pointer rounded-xl font-bold">Back to Question</button>
              <button onClick={handleSubmitAnswer} disabled={!answerDraft.trim() || answerMut.isPending} className="btn-primary text-xs px-5 py-2.5 cursor-pointer rounded-xl font-bold transition-transform active:scale-95 text-white" style={{ background: "#5E7A5A" }}>
                {answerMut.isPending ? "Submitting..." : "Submit Answer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-5 flex-wrap items-center">
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
            <h2 className="font-bold text-sm text-slate-800">Questions ({questions.filter(q => q.status === "open" || q.status === "reopened").length})</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Click a question to view details, verify answers, or write administrative replies.</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8DE]/60">
          {qLoad ? (
            <div className="p-5 space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-20 w-full rounded-2xl" />)}</div>
          ) : questions.filter(q => q.status === "open" || q.status === "reopened").length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400 font-medium">No questions found matching your filter criteria.</div>
          ) : (
            questions.filter(q => q.status === "open" || q.status === "reopened").map(q => (
              <button key={q._id} onClick={() => { setSelected(q); setAnswerDraft(""); }}
                className="w-full text-left p-5 transition-all duration-200 hover:bg-[#f0f4ef]/20 cursor-pointer border-l-4 border-transparent flex flex-col gap-2" style={selected?._id === q._id ? { background: "#f0f4ef/40", borderLeftColor: "#5E7A5A" } : {}}>
                <div className="flex justify-between items-start gap-4 w-full">
                  <span className="font-semibold text-sm line-clamp-1 pr-2 text-slate-800 hover:text-[#5E7A5A] transition-colors">{q.question}</span>
                  <StatusBadge status={q.status} />
                </div>
                <div className="flex items-center gap-2.5 text-[11px] text-slate-400 mt-1 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#dde8db] bg-[#f0f4ef] text-[#3a4f38]"># {q.category}</span>
                  {q.pendingCategory && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-700">✨ New: {q.pendingCategory}</span>
                  )}
                  <span>· by <strong className="text-slate-600 font-semibold">{q.contributorName || "Student"}</strong></span>
                  <span>· {timeAgo(q.createdAt)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {selected && !isWritingAnswer && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl bg-white max-h-[85vh] rounded-2xl shadow-2xl flex flex-col border border-slate-100/80 animate-scale-in m-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-start bg-gradient-to-r from-[#f0f4ef]/60 to-white shrink-0 border-[#E2E8DE]">
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {selected.status !== "reopened" && <StatusBadge status={selected.status} />}
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border border-[#dde8db] bg-[#f0f4ef] text-[#3a4f38]"># {selected.category}</span>
                  {selected.pendingCategory && (
                    <button
                      onClick={() => setCategoryConfirmModal({ pendingCategory: selected.pendingCategory, questionId: selected._id })}
                      className="text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      ✨ Confirm "{selected.pendingCategory}"
                    </button>
                  )}
                  {!selected.pendingCategory && (
                    <select
                      value={selected.category}
                      onChange={(e) => {
                        const newCategory = e.target.value;
                        setSelected(prev => ({ ...prev, category: newCategory }));
                        updateCategoryMut.mutate({ id: selected._id, category: newCategory });
                      }}
                      className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border border-[#dde8db] bg-[#f0f4ef] text-[#3a4f38] focus:outline-none cursor-pointer shadow-xs"
                    >
                      {categories.map(c => {
                        const name = typeof c === "string" ? c : c.name;
                        return <option key={name} value={name}># {name}</option>;
                      })}
                    </select>
                  )}
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
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-50/40 min-h-0">
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
                              <button onClick={() => handleVerifyClick(a._id, selected.category)} className="text-xxs font-bold px-2.5 py-1 rounded bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors cursor-pointer">Verify</button>
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
            </div>

            {/* Footer Options */}
            <div className="p-6 border-t border-slate-200 bg-white shrink-0 flex justify-between items-center gap-4 flex-wrap">
              <div className="flex gap-2">
                <button onClick={() => setConfirm({ message: "Are you sure you want to delete this question permanently? This will also delete all replies.", action: () => deleteMut.mutate(selected._id) })} className="btn-secondary text-xs px-3 py-2 text-red-600 border-red-200 hover:bg-red-50 cursor-pointer rounded-xl">Delete</button>
              </div>

              <button
                onClick={() => setIsWritingAnswer(true)}
                className="btn-primary text-xs px-5 py-2.5 cursor-pointer rounded-xl font-bold transition-transform active:scale-95 text-white"
                style={{ background: "#5E7A5A" }}
              >
                Write Administrative Answer
              </button>
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
    const arr = Array.isArray(faqs) ? faqs : (Array.isArray(faqs?.data) ? faqs.data : []);
    return [...arr].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [faqs]);

  const { data: rawCategories = [] } = useQuery({ queryKey: ["categories"], queryFn: faqApi.listCategories });
  const categories = useMemo(() => {
    return Array.isArray(rawCategories) ? rawCategories : (Array.isArray(rawCategories?.data) ? rawCategories.data : []);
  }, [rawCategories]);

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
          {categories.map(c => { const name = typeof c === "string" ? c : c.name; return <option key={name} value={name}>{name}</option>; })}
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
                <div className="space-y-3 mt-2">
                  <input className="input text-sm font-medium w-full" value={editing.question || ""} onChange={e => setEditing(p => ({ ...p, question: e.target.value }))} placeholder="Question" />
                  
                  <select 
                    className="input text-sm py-2 w-full" 
                    value={editing.category || ""} 
                    onChange={e => setEditing(p => ({ ...p, category: e.target.value }))}
                  >
                    <option value="">Select Category...</option>
                    {(() => {
                       const arr = Array.from(categories);
                       return arr.sort((a, b) => {
                         const nameA = typeof a === "string" ? a : a.name;
                         const nameB = typeof b === "string" ? b : b.name;
                         if (nameA === "Others") return 1;
                         if (nameB === "Others") return -1;
                         return nameA.localeCompare(nameB);
                       });
                    })().map(c => { 
                      const name = typeof c === "string" ? c : c.name; 
                      return <option key={name} value={name}>{name}</option>; 
                    })}
                  </select>

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
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <input className="input py-2" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Category name..." list="cat-list" />
            <datalist id="cat-list">{categories.map(c => { const name = typeof c === "string" ? c : c.name; return <option key={name} value={name} />; })}</datalist>
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
  const [expandedOthers, setExpandedOthers] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [editName, setEditName] = useState("");

  const { data: cats = [], isLoading } = useQuery({ queryKey: ["category-stats"], queryFn: categoryApi.getStats });

  const createMut = useMutation({ mutationFn: (name) => categoryApi.create(name), onSuccess: (res) => { qc.invalidateQueries(["category-stats"]); setNewCat(""); setToast(res?.alreadyExists ? "Category already exists." : "Category added!"); } });
  
  const renameMut = useMutation({
    mutationFn: ({ oldName, newName }) => categoryApi.rename(oldName, newName),
    onSuccess: () => {
      qc.invalidateQueries(["category-stats"]);
      qc.invalidateQueries(["admin-stats"]);
      setEditingCat(null);
      setToast("Category renamed!");
    }
  });

  return (
    <div className="h-full flex flex-col min-h-0">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="flex gap-3 mb-4">
        <input className="input py-2 text-sm flex-1" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New category name..." />
        <button onClick={() => {
           let catName = newCat.trim();
           if (catName && !catName.startsWith("Others - ") && catName.toLowerCase() !== "others") {
              catName = `Others - ${catName}`;
           }
           if (catName) createMut.mutate(catName);
        }} className="btn-primary text-sm px-4 py-2 shrink-0" disabled={!newCat.trim()}>
          Add Category
        </button>
      </div>

      {expandedOthers && (
        <button onClick={() => setExpandedOthers(false)} className="inline-flex items-center gap-1.5 text-xs mb-3 text-slate-500 hover:text-slate-700 transition-colors self-start">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to all categories
        </button>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 w-full" />)}</div>
      ) : cats.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: "#9CA3AF" }}>No categories found.</div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {(() => {
              const normalCats = [];
              const otherCats = [];
              let otherFaqCount = 0;
              let otherQuestionCount = 0;

              cats.forEach(cat => {
                if (cat.name.startsWith("Others - ")) {
                  otherCats.push(cat);
                  otherFaqCount += cat.faqCount || 0;
                  otherQuestionCount += cat.questionCount || 0;
                } else {
                  normalCats.push(cat);
                }
              });

              let displayCats = [];
              if (expandedOthers) {
                 displayCats = [...otherCats];
              } else {
                 displayCats = [...normalCats];
                 if (otherCats.length > 0) {
                    displayCats.push({
                      name: "Others",
                      faqCount: otherFaqCount,
                      questionCount: otherQuestionCount,
                      isOthersGroup: true
                    });
                 }
              }

              return displayCats.map(cat => (
                <div 
                  key={cat.name} 
                  onClick={() => {
                    if (cat.isOthersGroup) setExpandedOthers(true);
                  }}
                  className={`card p-3 flex flex-col justify-between gap-2.5 bg-white border border-[#E2E8DE]/80 hover:border-[#bdd4ba] rounded-lg hover:shadow-xs transition-all relative overflow-hidden group ${cat.isOthersGroup ? 'cursor-pointer' : ''}`}
                >
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-[#5E7A5A]/10 group-hover:bg-[#5E7A5A] transition-all shrink-0" />
                  
                  {editingCat === cat.name ? (
                    <div className="pt-1 flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                      <input 
                        className="input text-[11px] py-1 px-1.5 font-semibold text-slate-800" 
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setEditingCat(null)} className="text-[9px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 hover:bg-gray-200">Cancel</button>
                        <button onClick={() => editName.trim() && renameMut.mutate({ oldName: cat.name, newName: editName.trim() })} className="text-[9px] px-1.5 py-0.5 bg-[#5E7A5A] rounded text-white hover:bg-[#4a6247]" disabled={!editName.trim()}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start pt-1">
                      <h4 className="font-semibold text-[11px] text-slate-800 line-clamp-2 leading-tight flex-1 pr-2" title={cat.name}>{cat.name}</h4>
                      {!cat.isOthersGroup && (
                        <button onClick={(e) => { e.stopPropagation(); setEditingCat(cat.name); setEditName(cat.name); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#5E7A5A] transition-opacity shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                    <span className="inline-flex items-center gap-0.5" title={`${cat.faqCount} FAQs`}>
                      📖 {cat.faqCount}
                    </span>
                    <span className="inline-flex items-center gap-0.5" title={`${cat.questionCount} Questions`}>
                      ❓ {cat.questionCount}
                    </span>
                  </div>
                </div>
              ));
            })()}
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
                  <th className="text-center p-3 font-semibold" style={{ color: "#6B7280" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
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
                      <div className="flex gap-1 justify-center flex-wrap">
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


// ── Main AdminPage ────────────────────────────────────────────

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM14 11a1 1 0 011-1h4a1 1 0 011 1v8a1 1 0 01-1 1h-4a1 1 0 01-1-1v-8z" },
  { id: "questions", label: "Questions", icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.007 2.917-.546.086-.99.622-1.16 1.21 M12 17v.01" },
  { id: "faqs", label: "FAQ Management", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { id: "categories", label: "Categories", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { id: "users", label: "Users", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [preselectedQuestionId, setPreselectedQuestionId] = useState(null);

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
      case "dashboard": return <DashboardTab setActiveTab={setActiveTab} setPreselectedQuestionId={setPreselectedQuestionId} />;
      case "questions": return <QuestionsTab preselectedQuestionId={preselectedQuestionId} setPreselectedQuestionId={setPreselectedQuestionId} setActiveTab={setActiveTab} />;
      case "faqs": return <FaqsTab />;
      case "categories": return <CategoriesTab />;
      case "users": return <UsersTab />;
      default: return <DashboardTab setActiveTab={setActiveTab} setPreselectedQuestionId={setPreselectedQuestionId} />;
    }
  };  return (
    <div className="h-screen flex font-sans overflow-hidden" style={{ background: "#F5F7F2" }}>
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
