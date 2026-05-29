import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { questionApi, faqApi } from "../services/api";
import { useAuth } from "../hooks/useAuth";

const TIPS = [
  "Be specific and clear",
  "Provide enough details",
  "Add relevant tags",
  "Search before posting",
];

function SuccessModal({ show, question, onClose }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl animate-scale-in">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center"
          style={{ background: "#f0f4ef" }}>
          <svg className="w-7 h-7" style={{ color: "#5E7A5A" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "#1F2937" }}>Question submitted!</h2>
        <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
          Your question has been added to the community queue and will be answered soon.
        </p>
        {question && (
          <div className="rounded-lg px-4 py-3 mb-6 text-left" style={{ background: "#F5F7F2", border: "1px solid #E2E8DE" }}>
            <p className="text-sm font-medium line-clamp-2" style={{ color: "#1F2937" }}>{question}</p>
          </div>
        )}
        <div className="flex gap-3">
          <Link to="/queue" className="btn-primary flex-1 text-sm justify-center">View Queue</Link>
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Ask Another</button>
        </div>
      </div>
    </div>
  );
}

export default function AskPage() {
  const navigate      = useNavigate();
  const textareaRef   = useRef(null);
  const { user } = useAuth();

  const [title, setTitle]               = useState("");
  const [category, setCategory]         = useState("");
  const [details, setDetails]           = useState("");
  const [tags, setTags]                 = useState([]);
  const [tagInput, setTagInput]         = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);
  const [submitted, setSubmitted]       = useState("");
  const [touched, setTouched]           = useState({});
  const [error, setError]               = useState("");

  const titleError    = touched.title    && title.trim().length < 4;
  const categoryError = touched.category && !category;
  const isValid       = title.trim().length >= 4 && !!category;

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => faqApi.listCategories(),
    staleTime: 1000 * 60 * 5,
  });

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [details]);

  // Related questions from FAQ
  const { data: faqs = [] } = useQuery({
    queryKey: ["faqs"],
    queryFn: () => faqApi.list(),
    staleTime: 1000 * 60 * 5,
  });

  const related = useMemo(() => {
    if (title.trim().length < 3) return [];
    const q = title.toLowerCase();
    return faqs.filter((f) => f.question?.toLowerCase().includes(q) || f.category?.toLowerCase().includes(q)).slice(0, 4);
  }, [title, faqs]);

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t) && tags.length < 5) setTags((p) => [...p, t]);
    setTagInput("");
  };

  const handleTagKey = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
    if (e.key === "Backspace" && tagInput === "" && tags.length > 0) setTags((p) => p.slice(0, -1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ title: true, category: true });
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      const contributorName = user?.name || "Student";
      await questionApi.create({ question: title.trim(), category, details: details.trim(), tags, contributor: contributorName });
      setSubmitted(title);
      setShowSuccess(true);
    } catch (err) {
      console.error("Failed to submit question:", err);
      setError("Failed to submit question. Please try again.");
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setShowSuccess(false); setTitle(""); setCategory(""); setDetails(""); setTags([]); setTouched({});
  };

  return (
    <div style={{ background: "#F5F7F2" }}>
      <div className="container-xl py-8">
        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
          style={{ color: "#6B7280" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to questions
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Form ── */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h1 className="text-xl font-bold mb-1" style={{ color: "#1F2937" }}>Ask a Question</h1>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                Be specific and clear. It helps others provide better answers.
              </p>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {error && (
                  <div className="p-3 rounded-md text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                    {error}
                  </div>
                )}
                {/* Title */}
                <div>
                  <label className="label">Title <span style={{ color: "#dc2626" }}>*</span></label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setError(""); }}
                    onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                    placeholder="What is your question about?"
                    className={`input ${titleError ? "input-error" : ""}`}
                  />
                  {titleError && <p className="input-hint" style={{ color: "#dc2626" }}>Please enter at least 4 characters</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="label">Category <span style={{ color: "#dc2626" }}>*</span></label>
                  <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setTouched((t) => ({ ...t, category: true })); }}
                    className={`input ${categoryError ? "input-error" : ""}`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  {categoryError && <p className="input-hint" style={{ color: "#dc2626" }}>Please select a category</p>}
                </div>

                {/* Details */}
                <div>
                  <label className="label">Details</label>
                  <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #E2E8DE" }}>
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 px-3 py-2 border-b" style={{ borderColor: "#E2E8DE", background: "#F5F7F2" }}>
                      {["B", "I", "U"].map((f) => (
                        <button key={f} type="button"
                          className="w-7 h-7 text-xs font-bold rounded hover:bg-white transition-colors flex items-center justify-center"
                          style={{ color: "#6B7280" }}>
                          {f}
                        </button>
                      ))}
                      <div className="w-px h-4 mx-1" style={{ background: "#E2E8DE" }} />
                      {[
                        "M4 6h16M4 12h16M4 18h8",
                        "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2",
                        "M3 10h18M3 14h18",
                        "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.1-1.1",
                      ].map((d, i) => (
                        <button key={i} type="button"
                          className="w-7 h-7 rounded hover:bg-white transition-colors flex items-center justify-center"
                          style={{ color: "#6B7280" }}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
                          </svg>
                        </button>
                      ))}
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Write the details of your question…"
                      rows={6}
                      className="w-full px-4 py-3 text-sm resize-none focus:outline-none"
                      style={{ color: "#1F2937", background: "#fff", minHeight: "140px", fontFamily: "inherit" }}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="label">Tags (optional)</label>
                  <div
                    className="input flex flex-wrap gap-1.5 min-h-[44px] cursor-text"
                    style={{ paddingTop: tags.length > 0 ? "0.5rem" : undefined }}
                    onClick={() => document.getElementById("tag-input").focus()}
                  >
                    {tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full"
                        style={{ background: "#f8f0e0", color: "#8B6914" }}>
                        #{tag}
                        <button type="button" onClick={(e) => { e.stopPropagation(); setTags(tags.filter((t) => t !== tag)); }}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                    <input
                      id="tag-input"
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKey}
                      onBlur={addTag}
                      placeholder={tags.length === 0 ? "Add tags (e.g. noc, offer letter, vibe)" : ""}
                      className="flex-1 min-w-[160px] bg-transparent text-sm focus:outline-none"
                      style={{ color: "#1F2937" }}
                    />
                  </div>
                  <p className="input-hint">Press Enter or comma to add. Max 5 tags.</p>
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Posting…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Post Question
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">
            {/* Tips */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: "#1F2937" }}>Tips for a good question</h3>
              <ul className="space-y-2.5">
                {TIPS.map((tip) => (
                  <li key={tip} className="flex items-start gap-2.5 text-sm" style={{ color: "#6B7280" }}>
                    <svg className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#5E7A5A" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Related Questions */}
            {related.length > 0 && (
              <div className="card p-5 animate-fade-in">
                <h3 className="text-sm font-semibold mb-4" style={{ color: "#1F2937" }}>Related Questions</h3>
                <div className="space-y-3">
                  {related.map((faq) => (
                    <Link key={faq._id} to={`/faq/${faq._id}`}
                      className="block group">
                      <p className="text-sm leading-snug group-hover:underline" style={{ color: "#5E7A5A" }}>
                        {faq.question}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "#9CA3AF" }}>
                        <span>{faq.category}</span>
                        {faq.answerCount > 0 && <span>· {faq.answerCount} answers</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <SuccessModal show={showSuccess} question={submitted} onClose={handleClose} />
    </div>
  );
}
