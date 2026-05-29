import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, questionApi, faqApi, answerApi, faqAdminApi, categoryApi, userApi } from "../services/api";
import { useAuth } from "../hooks/useAuth";

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
    open: { bg: "#fef3c7", color: "#92400e", label: "Open" },
    answered: { bg: "#d1fae5", color: "#065f46", label: "Answered" },
    reopened: { bg: "#fed7aa", color: "#9a3412", label: "Reopened" },
    closed: { bg: "#f3f4f6", color: "#374151", label: "Closed" },
    verified: { bg: "#d1fae5", color: "#065f46", label: "Verified" },
  };
  const s = map[status] || { bg: "#f3f4f6", color: "#374151", label: status };
  return <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
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

// ── Tab: Dashboard ────────────────────────────────────────────

function DashboardTab() {
  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: adminApi.getStats, refetchInterval: 30000 });

  return (
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

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["admin-questions", filter],
    queryFn: () => questionApi.list({ status: filter.status || undefined, category: filter.category || undefined, search: filter.search || undefined }),
  });

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: faqApi.listCategories });

  const { data: detail } = useQuery({
    queryKey: ["question-detail", selected?._id],
    queryFn: () => questionApi.getById(selected._id),
    enabled: !!selected?._id,
  });

  const answerMut = useMutation({ mutationFn: ({ id, data }) => questionApi.addAnswer(id, data), onSuccess: () => { qc.invalidateQueries(["question-detail"]); qc.invalidateQueries(["admin-questions"]); setToast("Answer submitted!"); } });
  const verifyMut = useMutation({ mutationFn: ({ id, verified }) => answerApi.verify(id, verified), onSuccess: () => { qc.invalidateQueries(["question-detail"]); qc.invalidateQueries(["admin-questions"]); } });
  const closeMut = useMutation({ mutationFn: (id) => questionApi.close(id), onSuccess: () => { qc.invalidateQueries(["question-detail"]); qc.invalidateQueries(["admin-questions"]); setToast("Question closed."); } });
  const reopenMut = useMutation({ mutationFn: (id) => questionApi.reopen(id), onSuccess: () => { qc.invalidateQueries(["question-detail"]); qc.invalidateQueries(["admin-questions"]); setToast("Question reopened."); } });
  const deleteMut = useMutation({ mutationFn: (id) => questionApi.delete(id), onSuccess: () => { setSelected(null); qc.invalidateQueries(["admin-questions"]); setToast("Question deleted."); } });
  const convertMut = useMutation({ mutationFn: ({ id, answerId }) => questionApi.convertToFaq(id, answerId), onSuccess: () => { qc.invalidateQueries(["admin-questions"]); qc.invalidateQueries(["admin-stats"]); setToast("Converted to FAQ!"); } });

  const handleSubmitAnswer = () => {
    if (!answerDraft.trim() || !selected) return;
    answerMut.mutate({ id: selected._id, data: { content: answerDraft, contributorName: "Admin" } });
    setAnswerDraft("");
  };

  return (
    <div className="h-full flex flex-col">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {confirm && <ConfirmModal message={confirm.message} onConfirm={() => { confirm.action(); setConfirm(null); }} onCancel={() => setConfirm(null)} />}

      <div className="flex gap-3 mb-4 flex-wrap">
        <select className="input py-2 text-sm" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={{ maxWidth: 160 }}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="answered">Answered</option>
          <option value="reopened">Reopened</option>
          <option value="closed">Closed</option>
        </select>
        <select className="input py-2 text-sm" value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))} style={{ maxWidth: 160 }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="search-wrap flex-1" style={{ maxWidth: 300 }}>
          <svg className="search-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className="search-input text-sm" placeholder="Search questions..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 min-h-0">
        <div className="xl:col-span-5 card overflow-hidden flex flex-col min-h-0">
          <div className="p-4 border-b shrink-0" style={{ borderColor: "#E2E8DE" }}>
            <h2 className="font-semibold text-sm" style={{ color: "#1F2937" }}>Questions ({questions.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 w-full" />)}</div>
            ) : questions.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: "#9CA3AF" }}>No questions found.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#E2E8DE" }}>
                {questions.map(q => (
                  <button key={q._id} onClick={() => { setSelected(q); setAnswerDraft(""); }}
                    className="w-full text-left p-4 transition-colors" style={selected?._id === q._id ? { background: "#f0f4ef" } : {}}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm line-clamp-1 pr-2" style={{ color: "#1F2937" }}>{q.question}</span>
                      <StatusBadge status={q.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: "#9CA3AF" }}>
                      <span className="tag tag-brand">{q.category}</span>
                      <span>· {q.contributorName || "Student"}</span>
                      <span>· {timeAgo(q.createdAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-7 card overflow-hidden flex flex-col min-h-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#f0f4ef" }}>
                  <svg className="w-8 h-8" style={{ color: "#9CA3AF" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg" style={{ color: "#1F2937" }}>Select a question</h3>
                <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Choose a question to view details and answer it.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-5 border-b overflow-y-auto" style={{ borderColor: "#E2E8DE", background: "#F5F7F2", maxHeight: "40%" }}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h2 className="text-base font-bold mb-1" style={{ color: "#1F2937" }}>{selected.question}</h2>
                    <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
                      <span>by <strong>{selected.contributorName || "Student"}</strong></span>
                      <span>· {timeAgo(selected.createdAt)}</span>
                      <span>· <StatusBadge status={selected.status} /></span>
                    </div>
                  </div>
                  <span className="tag tag-brand ml-2">{selected.category}</span>
                </div>
                {selected.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selected.tags.map(t => <span key={t} className="tag tag-brand text-xs">{t}</span>)}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                {detail?.answers?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#9CA3AF" }}>Community Answers</h3>
                    {detail.answers.map(a => (
                      <div key={a._id} className="p-3 rounded-lg mb-2" style={{ background: a.isVerified ? "#d1fae5" : "#f9fafb", border: `1px solid ${a.isVerified ? "#6ee7b7" : "#e5e7eb"}` }}>
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: "#374151" }}>{a.contributorName}</span>
                            {a.isVerified && <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: "#059669", color: "#fff" }}>Verified</span>}
                          </div>
                          <div className="flex gap-2">
                            {!a.isVerified && <button onClick={() => verifyMut.mutate({ id: a._id, verified: true })} className="text-xs px-2 py-1 rounded" style={{ background: "#d1fae5", color: "#065f46" }}>Verify</button>}
                            {a.isVerified && <button onClick={() => verifyMut.mutate({ id: a._id, verified: false })} className="text-xs px-2 py-1 rounded" style={{ background: "#fef3c7", color: "#92400e" }}>Unverify</button>}
                            <button onClick={() => deleteMut.mutate(a._id)} className="text-xs px-2 py-1 rounded" style={{ background: "#fef2f2", color: "#dc2626" }}>Delete</button>
                          </div>
                        </div>
                        <p className="text-sm" style={{ color: "#374151" }}>{a.content}</p>
                        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{timeAgo(a.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-3 border-t" style={{ borderColor: "#E2E8DE" }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#9CA3AF" }}>Admin Answer</h3>
                  <textarea className="input w-full text-sm resize-none" rows={4} value={answerDraft} onChange={e => setAnswerDraft(e.target.value)} placeholder="Write your official answer..." />
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex gap-2 flex-wrap">
                      {selected.status !== "closed" && <button onClick={() => closeMut.mutate(selected._id)} className="btn-secondary text-xs px-3 py-1.5">Close</button>}
                      {selected.status === "closed" && <button onClick={() => reopenMut.mutate(selected._id)} className="btn-secondary text-xs px-3 py-1.5">Reopen</button>}
                      <button onClick={() => setConfirm({ message: "Delete this question permanently?", action: () => deleteMut.mutate(selected._id) })} className="btn-secondary text-xs px-3 py-1.5" style={{ color: "#dc2626" }}>Delete</button>
                      <button onClick={() => setConfirm({ message: "Convert this question + verified answer to FAQ?", action: () => convertMut.mutate({ id: selected._id }) })} className="btn-secondary text-xs px-3 py-1.5" style={{ color: "#059669" }}>Convert to FAQ</button>
                    </div>
                    <button onClick={handleSubmitAnswer} disabled={!answerDraft.trim() || answerMut.isPending} className="btn-primary text-xs px-4 py-1.5">
                      {answerMut.isPending ? "Submitting..." : "Submit Answer"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
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

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["admin-faqs", filter],
    queryFn: () => faqApi.list({ category: filter.category || undefined, search: filter.search || undefined }),
  });

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
      ) : faqs.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: "#9CA3AF" }}>No FAQs found.</div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {faqs.map(faq => (
            <div key={faq._id} className="card p-4" style={faq.isPinned ? { borderLeft: "3px solid #5E7A5A" } : {}}>
              {editing?._id === faq._id ? (
                <div className="space-y-3">
                  <input className="input text-sm" defaultValue={editing.question} onChange={e => setEditing(p => ({ ...p, question: e.target.value }))} />
                  <textarea className="input text-sm resize-none" rows={3} defaultValue={editing.answer} onChange={e => setEditing(p => ({ ...p, answer: e.target.value }))} />
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
                  <p className="text-sm mb-2 line-clamp-2" style={{ color: "#6B7280" }}>{faq.answer}</p>
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
            <textarea className="input py-2 resize-none" rows={3} value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} placeholder="Enter answer..." />
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
          <table className="w-full text-sm">
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
      )}
    </div>
  );
}

// ── Tab: Users ─────────────────────────────────────────────────

function UsersTab() {
  const qc = useQueryClient();
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: userApi.list });

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
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
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
              {filtered.map(u => (
                <tr key={u._id} className="border-b" style={{ borderColor: "#F5F7F2" }}>
                  <td className="p-3 font-medium" style={{ color: "#1F2937" }}>{u.name || "—"}</td>
                  <td className="p-3" style={{ color: "#374151" }}>{u.username || "—"}</td>
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
                    <div className="flex gap-1 justify-center">
                      {u.role !== "admin" && (
                        u.isActive
                          ? <button onClick={() => updateMut.mutate({ id: u._id, data: { isActive: false } })} className="text-xs px-2 py-1 rounded" style={{ background: "#fef3c7", color: "#92400e" }}>Suspend</button>
                          : <button onClick={() => updateMut.mutate({ id: u._id, data: { isActive: true } })} className="text-xs px-2 py-1 rounded" style={{ background: "#d1fae5", color: "#065f46" }}>Activate</button>
                      )}
                      {u.role !== "admin" && <button onClick={() => deleteMut.mutate(u._id)} className="text-xs px-2 py-1 rounded" style={{ background: "#fef2f2", color: "#dc2626" }}>Delete</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
      default: return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#F5F7F2" }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shrink-0 flex flex-col hidden md:flex" style={{ borderColor: "#E2E8DE" }}>
        <div className="h-16 flex items-center px-6 border-b" style={{ borderColor: "#E2E8DE" }}>
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-full shadow-sm mr-2" />
          <span className="font-bold text-base" style={{ color: "#1F2937" }}>AskSam Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(nav => (
            <button key={nav.id} onClick={() => setActiveTab(nav.id)}
              className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={activeTab === nav.id ? { background: "#f0f4ef", color: "#5E7A5A" } : { color: "#6B7280" }}>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={nav.icon} />
              </svg>
              {nav.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: "#E2E8DE" }}>
          <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0" style={{ borderColor: "#E2E8DE" }}>
          <h1 className="font-semibold text-lg" style={{ color: "#1F2937" }}>{NAV.find(n => n.id === activeTab)?.label || "Dashboard"}</h1>
          <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 transition-transform hover:scale-105" style={{ background: "#5E7A5A" }}>
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border py-1 z-50 animate-fade-in" style={{ borderColor: "#E2E8DE" }}>
                <div className="px-4 py-2 border-b" style={{ borderColor: "#F5F7F2" }}>
                  <p className="text-sm font-semibold truncate" style={{ color: "#1F2937" }}>{user?.name || "Admin"}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{user?.email || user?.username || ""}</p>
                </div>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Sign Out
                </button>
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
