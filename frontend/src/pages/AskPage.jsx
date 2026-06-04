import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
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

function CustomCategorySelect({ categories, value, onChange, hasError }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredOther, setHoveredOther] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setIsOpen(false);
        setHoveredOther(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalCats = [];
  const otherCats = [];
  categories.forEach(c => {
    const name = typeof c === 'string' ? c : c.name;
    if (name.startsWith("Others - ")) otherCats.push(name);
    else normalCats.push(name);
  });

  return (
    <div className="relative" ref={dropRef}>
      <div 
        className={`input cursor-pointer flex justify-between items-center bg-white ${hasError ? "border-red-500" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: "0.5rem 0.75rem", minHeight: "42px" }}
      >
        <span className={value ? "text-slate-800" : "text-slate-500"}>{value || "Select a category"}</span>
        <svg className="w-4 h-4 text-slate-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E2E8DE] shadow-xl rounded-xl z-50 py-1 flex flex-col max-h-72 overflow-y-auto">
          {normalCats.map(cat => (
            <div 
              key={cat}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === cat ? "bg-[#f0f4ef] text-[#5E7A5A] font-semibold" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"}`}
              onClick={() => { onChange(cat); setIsOpen(false); }}
            >
              {cat}
            </div>
          ))}
          
          {otherCats.length > 0 && (
            <div 
              className="relative group"
              onMouseEnter={() => setHoveredOther(true)}
              onMouseLeave={() => setHoveredOther(false)}
            >
              <div 
                className="px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer flex justify-between items-center"
                onClick={(e) => { e.stopPropagation(); setHoveredOther(!hoveredOther); }}
              >
                <span>Others</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
              
              {hoveredOther && (
                <div className="absolute left-[98%] top-0 ml-1 w-64 bg-white border border-[#E2E8DE] shadow-xl rounded-xl z-50 py-1 max-h-64 overflow-y-auto hidden sm:block">
                  {otherCats.map(cat => (
                    <div 
                      key={cat}
                      className={`px-4 py-2.5 text-sm cursor-pointer border-l-2 ${value === cat ? "border-[#5E7A5A] bg-[#f0f4ef] text-[#5E7A5A] font-semibold" : "border-transparent text-slate-700 hover:border-[#5E7A5A] hover:bg-slate-50"}`}
                      onClick={() => { onChange(cat); setIsOpen(false); }}
                    >
                      {cat.replace("Others - ", "")}
                    </div>
                  ))}
                </div>
              )}
              {/* Fallback for mobile */}
              {hoveredOther && (
                <div className="sm:hidden bg-slate-50 pl-4 py-1 border-y border-slate-100">
                  {otherCats.map(cat => (
                    <div 
                      key={cat}
                      className={`px-4 py-2.5 text-sm cursor-pointer ${value === cat ? "text-[#5E7A5A] font-semibold" : "text-slate-700 hover:bg-white"}`}
                      onClick={() => { onChange(cat); setIsOpen(false); }}
                    >
                      {cat.replace("Others - ", "")}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AskPage() {
  const navigate      = useNavigate();
  const location = useLocation();

  // Auto-focus textarea when navigated with state.openModal (e.g. from HomePage)
  useEffect(() => {
    if (location.state?.openModal && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])
  const textareaRef   = useRef(null);
  const queryClient  = useQueryClient();
  const { user } = useAuth();

  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const { data: editData } = useQuery({
    queryKey: ['question', editId],
    queryFn: () => questionApi.getById(editId),
    enabled: !!editId,
  });

  const [title, setTitle]               = useState("");
  const [category, setCategory]         = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [details, setDetails]           = useState("");
  const [tags, setTags]                 = useState([]);

  // Populate form if edit data loads
  useEffect(() => {
    if (editData && editId) {
      setTitle(editData.question || "");
      setCategory(editData.category || "");
      setDetails(editData.details || "");
      setTags(editData.tags || []);
    }
  }, [editData, editId]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);
  const [submitted, setSubmitted]       = useState("");
  const [touched, setTouched]           = useState({});
  const [error, setError]               = useState("");
  const [tagInput, setTagInput]         = useState("");

  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  // Debounced title state for semantic duplicate detection
  const [debouncedTitle, setDebouncedTitle] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTitle(title);
    }, 400);
    return () => clearTimeout(timer);
  }, [title]);

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


  const addTag = (value) => {
    const trimmed = value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const finalCategory = category === "new_category" ? customCategory.trim() : category;
  const titleError    = touched.title    && title.trim().length < 4;
  const categoryError = touched.category && !finalCategory;
  const isValid       = title.trim().length >= 4 && !!finalCategory;


  const { data: categoriesData = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => faqApi.listCategories(),
    staleTime: 1000 * 60 * 5,
  });
  const categories = useMemo(() => {
    return Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);
  }, [categoriesData]);

  // Semantic duplicate detection using React Query
  const { data: similarFaqs = [], isLoading: isCheckingSimilar } = useQuery({
    queryKey: ["similar-faqs", debouncedTitle],
    queryFn: () => faqApi.similar(debouncedTitle),
    enabled: debouncedTitle.trim().length >= 4,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const potentialDuplicates = useMemo(() => {
    if (!Array.isArray(similarFaqs)) return [];
    return similarFaqs.filter(f => f.similarity >= 0.70);
  }, [similarFaqs]);

  const relatedSuggestions = useMemo(() => {
    if (!Array.isArray(similarFaqs)) return [];
    return similarFaqs.filter(f => f.similarity >= 0.50 && f.similarity < 0.70);
  }, [similarFaqs]);

  const [expandedFaqId, setExpandedFaqId] = useState(null);



  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ title: true, category: true });
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      const contributorName = user?.name || "Student";
      // If student picked 'Add New Category', store the new cat name in pendingCategory
      const isNewCat = category === "new_category";
      const payload = {
        question: title.trim(),
        category: isNewCat ? "General" : finalCategory,
        pendingCategory: isNewCat ? finalCategory : undefined,
        details: details.trim(),
        tags,
      };

      if (editId) {
        await questionApi.update(editId, payload);
      } else {
        await questionApi.create({
          ...payload,
          contributorName,
          contributorId: user?._id,
        });
      }

      setSubmitted(title); setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["questions-open"] });
      queryClient.invalidateQueries({ queryKey: ["my-questions"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    } catch (err) {
      console.error("Failed to submit question:", err);
      setError("Failed to submit question. Please try again.");
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setShowSuccess(false); setTitle(""); setCategory(""); setCustomCategory(""); setDetails(""); setTouched({});
  };

  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => navigate("/queue"), 4000);
      return () => clearTimeout(t);
    }
  }, [showSuccess, navigate]);

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
              <h1 className="text-xl font-bold mb-1" style={{ color: "#1F2937" }}>{editId ? "Edit Question" : "Ask a Question"}</h1>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                {editId ? "Update your question details below." : "Be specific and clear. It helps others provide better answers."}
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

                {isCheckingSimilar && (
                  <div className="flex items-center gap-2 text-xs py-1 animate-fade-in" style={{ color: "#5E7A5A" }}>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Checking for duplicate answers...</span>
                  </div>
                )}

                {/* Duplicate Warning Card */}
                {potentialDuplicates.length > 0 && (
                  <div className="p-4 rounded-xl border animate-slide-down" style={{ background: "#FFFBEB", borderColor: "#FCD34D" }}>
                    <div className="flex gap-2.5 items-start">
                      <div className="shrink-0 text-amber-500 mt-0.5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold mb-1" style={{ color: "#92400E" }}>Wait, an answer already exists!</h4>
                        <p className="text-xs mb-3 text-amber-800">
                          We found highly similar questions in our database (above 70% match). Click "View Answer" to see if it solves your question instantly!
                        </p>
                        
                        <div className="space-y-2.5">
                          {potentialDuplicates.map((faq) => (
                            <div key={faq._id} className="p-3 bg-white rounded-lg border border-amber-200 shadow-sm transition-all hover:border-amber-400">
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full animate-fade-in" style={{ background: "#FEF3C7", color: "#B45309" }}>
                                  {Math.round(faq.similarity * 100)}% Match
                                </span>
                                <span className="text-xs" style={{ color: "#9CA3AF" }}>{faq.category}</span>
                              </div>
                              <p className="text-sm font-medium mt-1.5" style={{ color: "#1F2937" }}>
                                {faq.question}
                              </p>
                              
                              <button
                                type="button"
                                onClick={() => setExpandedFaqId(expandedFaqId === faq._id ? null : faq._id)}
                                className="text-xs font-semibold mt-2 underline flex items-center gap-1 cursor-pointer"
                                style={{ color: "#5E7A5A" }}
                              >
                                {expandedFaqId === faq._id ? "Hide Answer" : "View Answer"}
                                <svg className={`w-3 h-3 transition-transform ${expandedFaqId === faq._id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>

                              {expandedFaqId === faq._id && (
                                <div className="mt-3 p-3 rounded bg-slate-50 border border-slate-200 text-xs animate-slide-down">
                                  <p className="font-semibold text-slate-700 mb-1">Answer:</p>
                                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                                  <div className="mt-3 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={handleClose}
                                      className="px-3 py-1 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 text-xxs transition-colors cursor-pointer"
                                    >
                                      This solved my question
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}



                {/* Category */}
                <div className="space-y-3">
                  <div>
                    <label className="label">Category <span style={{ color: "#dc2626" }}>*</span></label>
                    <CustomCategorySelect 
                      categories={categories}
                      value={category}
                      onChange={(val) => { setCategory(val); setTouched((t) => ({ ...t, category: true })); }}
                      hasError={categoryError}
                    />
                  </div>
                  {categoryError && <p className="input-hint" style={{ color: "#dc2626" }}>Please provide a category</p>}


                </div>

                {/* Details */}
                <div>
                  <label className="label">Details</label>
                  <div className="flex items-center gap-2 mb-2">
                    {/* Speech to Text */}
                    <button type="button" onClick={toggleListen} title="Dictate (Speech to Text)"
                      className="w-8 h-8 rounded transition-colors flex items-center justify-center relative border cursor-pointer"
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
                    
                    <span className="text-xs" style={{ color: "#6B7280" }}>Click to dictate</span>
                  </div>
                  <textarea
                    className="input w-full p-3 resize-y min-h-[150px] bg-white rounded-lg border"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Write the details of your question..."
                    rows={6}
                    style={{ color: "#1F2937", borderColor: "#E2E8DE" }}
                  />
                </div>



                <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {editId ? "Updating..." : "Posting..."}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {editId ? "Update Question" : "Post Question"}
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

            {/* Related Questions (Semantic Suggestions) */}
            {relatedSuggestions.length > 0 && (
              <div className="card p-5 animate-fade-in">
                <h3 className="text-sm font-semibold mb-4" style={{ color: "#1F2937" }}>Related FAQs</h3>
                <div className="space-y-3">
                  {relatedSuggestions.map((faq) => (
                    <Link key={faq._id} to={`/faqs/${faq._id}`} className="block group">
                      <p className="text-sm leading-snug group-hover:underline font-medium" style={{ color: "#5E7A5A" }}>
                        {faq.question}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "#9CA3AF" }}>
                        <span className="font-semibold text-amber-600">{Math.round(faq.similarity * 100)}% match</span>
                        <span>·</span>
                        <span>{faq.category}</span>
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
