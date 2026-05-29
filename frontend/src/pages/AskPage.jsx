import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient  = useQueryClient();
  const { user } = useAuth();

  const [title, setTitle]               = useState("");
  const [category, setCategory]         = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [details, setDetails]           = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);
  const [submitted, setSubmitted]       = useState("");
  const [touched, setTouched]           = useState({});
  const [error, setError]               = useState("");

  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

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
      setDetails((prev) => prev + (prev ? " " : "") + transcript);
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
      setDetails((prev) => prev + imageMarkdown);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const insertFormat = (prefix, suffix = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = details.slice(start, end);
    const newText = details.slice(0, start) + prefix + selected + suffix + details.slice(end);
    setDetails(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const finalCategory = category === "new_category" ? customCategory.trim() : category;
  const titleError    = touched.title    && title.trim().length < 4;
  const categoryError = touched.category && !finalCategory;
  const isValid       = title.trim().length >= 4 && !!finalCategory;

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



  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ title: true, category: true });
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      const contributorName = user?.name || "Student";
      await questionApi.create({ question: title.trim(), category: finalCategory, details: details.trim(), tags: [], contributorName });
      setSubmitted(title);
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["questions-open"] });
      queryClient.invalidateQueries({ queryKey: ["my-questions"] });
    } catch (err) {
      console.error("Failed to submit question:", err);
      setError("Failed to submit question. Please try again.");
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setShowSuccess(false); setTitle(""); setCategory(""); setCustomCategory(""); setDetails(""); setTouched({});
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
                    placeholder="e.g. How do I apply for an NOC for my internship?"
                    className={`input ${titleError ? "input-error" : ""}`}
                  />
                  {titleError && <p className="input-hint" style={{ color: "#dc2626" }}>Please enter at least 4 characters</p>}
                </div>

                {/* Category */}
                <div className="space-y-3">
                  <div>
                    <label className="label">Category <span style={{ color: "#dc2626" }}>*</span></label>
                    <select
                      value={category}
                      onChange={(e) => { setCategory(e.target.value); setTouched((t) => ({ ...t, category: true })); }}
                      className={`input ${categoryError ? "input-error" : ""}`}
                    >
                      <option value="">Select a category</option>
                      {categories.map((c) => <option key={c}>{c}</option>)}
                      <option value="new_category">+ Add New Category</option>
                    </select>
                  </div>
                  {category === "new_category" && (
                    <div className="animate-fade-in">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => { setCustomCategory(e.target.value); setError(""); }}
                        onBlur={() => setTouched((t) => ({ ...t, category: true }))}
                        placeholder="Type new category name..."
                        className={`input ${categoryError ? "input-error" : ""}`}
                      />
                    </div>
                  )}
                  {categoryError && <p className="input-hint" style={{ color: "#dc2626" }}>Please provide a category</p>}
                </div>

                {/* Details */}
                <div>
                  <label className="label">Details</label>
                  <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #E2E8DE" }}>
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 px-3 py-2 border-b" style={{ borderColor: "#E2E8DE", background: "#F5F7F2" }}>
                      <button type="button" onClick={() => insertFormat("**", "**")} title="Bold"
                        className="w-8 h-8 rounded flex items-center justify-center text-base font-extrabold hover:bg-gray-200 transition-colors"
                        style={{ color: "#374151" }}>
                        B
                      </button>
                      <button type="button" onClick={() => insertFormat("*", "*")} title="Italic"
                        className="w-8 h-8 rounded flex items-center justify-center text-base font-serif italic font-bold hover:bg-gray-200 transition-colors"
                        style={{ color: "#374151" }}>
                        I
                      </button>
                      <div className="w-px h-4 mx-1" style={{ background: "#D1D5DB" }} />
                      <button type="button" onClick={() => insertFormat("- ")} title="Bullet list"
                        className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
                        style={{ color: "#374151" }}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                          <line x1="8" y1="6" x2="21" y2="6"></line>
                          <line x1="8" y1="12" x2="21" y2="12"></line>
                          <line x1="8" y1="18" x2="21" y2="18"></line>
                          <line x1="3" y1="6" x2="3.01" y2="6"></line>
                          <line x1="3" y1="12" x2="3.01" y2="12"></line>
                          <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                      </button>
                      <button type="button" onClick={() => insertFormat("1. ")} title="Numbered list"
                        className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
                        style={{ color: "#374151" }}>
                        <span className="text-sm font-bold">1.</span>
                      </button>
                      <button type="button" onClick={() => insertFormat("`", "`")} title="Code"
                        className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
                        style={{ color: "#374151" }}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => insertFormat("[", "](url)")} title="Link"
                        className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
                        style={{ color: "#374151" }}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                        </svg>
                      </button>
                      
                      <div className="w-px h-4 mx-1" style={{ background: "#D1D5DB" }} />
                      
                      {/* Speech to Text */}
                      <button type="button" onClick={toggleListen} title="Dictate (Speech to Text)"
                        className="w-8 h-8 rounded transition-colors flex items-center justify-center relative"
                        style={{ color: isListening ? "#fff" : "#374151", background: isListening ? "#ef4444" : "transparent" }}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                        {isListening && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                          </span>
                        )}
                      </button>

                      {/* Image Upload */}
                      <button type="button" onClick={() => fileInputRef.current?.click()} title="Upload Image"
                        className="w-8 h-8 rounded hover:bg-gray-200 transition-colors flex items-center justify-center"
                        style={{ color: "#374151" }}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </button>
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                      
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Write the details of your question…"
                      rows={6}
                      className="w-full px-4 py-3 text-sm resize-none focus:outline-none placeholder-gray-500"
                      style={{ color: "#1F2937", background: "#fff", minHeight: "140px", fontFamily: "inherit" }}
                    />
                  </div>
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
