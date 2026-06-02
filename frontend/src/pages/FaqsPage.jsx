import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { faqApi, bookmarkApi } from "../services/api";
import { useDebounce } from "../hooks/useDebounce";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-hot-toast";


function FAQCard({ faq, isBookmarked, onToggleBookmark }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [voted, setVoted] = useState(null); // 'up' | 'down' | null
  const [showReasonBox, setShowReasonBox] = useState(false);
  const [reason, setReason] = useState("");
  const [submittingReason, setSubmittingReason] = useState(false);
  const qc = useQueryClient();

  const feedbackMutation = useMutation({
    mutationFn: (body) => faqApi.feedback(faq._id, body),
    onSuccess: () => qc.invalidateQueries(["faqs"]),
  });

  const handleFeedback = (helpful) => {
    const isUp = helpful;
    const clickedType = isUp ? "up" : "down";

    if (voted === clickedType) {
      // Deselect (Instagram toggle)
      setVoted(null);
      setShowReasonBox(false);
      feedbackMutation.mutate({
        helpful: isUp,
        deselect: true,
      });
    } else {
      const prev = voted;
      setVoted(clickedType);

      if (clickedType === "down") {
        setShowReasonBox(true);
      } else {
        setShowReasonBox(false);
        feedbackMutation.mutate({
          helpful: true,
          previousVote: prev,
        });
      }
    }
  };

  const handleReasonSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmittingReason(true);
    feedbackMutation.mutate({
      helpful: false,
      previousVote: voted === "up" ? "up" : null,
      reason: reason.trim(),
      userLabel: user?.email || user?.name || "Student",
    }, {
      onSuccess: () => {
        setShowReasonBox(false);
        setReason("");
        setSubmittingReason(false);
      },
      onError: () => {
        setSubmittingReason(false);
      }
    });
  };

  return (
    <div className={`card overflow-hidden transition-shadow duration-300 ${open ? "shadow-md ring-1" : "shadow-sm hover:shadow-md"}`} style={open ? { ringColor: "#5E7A5A", borderColor: "#bdd4ba" } : { borderColor: "#E2E8DE" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
        role="button"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="badge badge-green flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-md text-xs font-semibold">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Verified Answer
            </span>
          </div>
          <h3 className="text-[1.05rem] font-bold leading-snug" style={{ color: "#1F2937" }}>
            {faq.question}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {user && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(faq._id);
              }}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark FAQ"}
              className="p-1.5 rounded-full border transition-all cursor-pointer hover:scale-110 flex items-center justify-center animate-fade-in"
              style={
                isBookmarked
                  ? { background: "#F0FDF4", color: "#059669", borderColor: "#6EE7B7" }
                  : { background: "#ffffff", color: "#9CA3AF", borderColor: "#E2E8DE" }
              }
            >
              <svg className="w-4.5 h-4.5" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          )}
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
            <svg
              className="w-5 h-5 transition-transform duration-300"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {open && (
        <div className="px-6 pb-6 pt-2 bg-white animate-fade-in">
          <div className="w-full h-px bg-gray-100 mb-4"></div>
          <div className="flex flex-col gap-4">
            <p className="text-[0.95rem] leading-relaxed whitespace-pre-line text-gray-600">
              {faq.answer}
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pt-2">
                {/* Feedback */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">Was this helpful?</span>
                  <button
                    onClick={() => handleFeedback(true)}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      voted === "up"
                        ? "bg-green-100 border-green-300 text-green-700 font-bold"
                        : "border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                    }`}
                  >
                    👍 {faq.helpfulCount > 0 && <span>{faq.helpfulCount}</span>}
                  </button>
                  <button
                    onClick={() => handleFeedback(false)}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      voted === "down"
                        ? "bg-red-100 border-red-300 text-red-600 font-bold"
                        : "border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-300 hover:text-red-500"
                    }`}
                  >
                    👎 {faq.unhelpfulCount > 0 && <span>{faq.unhelpfulCount}</span>}
                  </button>
                </div>
                <Link to={`/faq/${faq._id}`} className="text-sm font-semibold hover:underline flex items-center gap-1" style={{ color: "#5E7A5A" }}>
                  Read full documentation
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
              {showReasonBox && (
                <form onSubmit={handleReasonSubmit} className="p-4 bg-gray-50 border rounded-xl animate-fade-in space-y-3" style={{ borderColor: "#E2E8DE" }}>
                  <label htmlFor={`reason-${faq._id}`} className="block text-xs font-semibold text-gray-700">
                    Please tell us why this was not helpful:
                  </label>
                  <textarea
                    id={`reason-${faq._id}`}
                    className="input text-xs w-full h-20 resize-none bg-white"
                    placeholder="Tell us what is wrong, out of date, or missing..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setVoted(null);
                        setShowReasonBox(false);
                        setReason("");
                      }}
                      className="btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReason || !reason.trim()}
                      className="btn-primary btn-sm bg-red-600 hover:bg-red-700"
                    >
                      {submittingReason ? "Submitting..." : "Submit Feedback"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-6 border border-gray-100">
      <div className="skeleton h-4 w-32 mb-4" />
      <div className="skeleton h-6 w-3/4 mb-3" />
      <div className="skeleton h-4 w-1/2" />
    </div>
  );
}

export default function FaqsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All Categories";
  const initialSearch = searchParams.get("q") || "";
  
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookmarkedQuestions = [], refetch: refetchBookmarks } = useQuery({
    queryKey: ["bookmarked-questions", user?._id],
    queryFn: () => bookmarkApi.list(user?._id),
    enabled: !!user?._id,
  });

  const handleToggleBookmark = async (faqId) => {
    if (!user?._id) return;
    const isBookmarked = bookmarkedQuestions.some((bq) => bq._id === faqId);
    try {
      await bookmarkApi.toggle(user._id, faqId);
      refetchBookmarks();
      queryClient.invalidateQueries({ queryKey: ["bookmarked-questions", user._id] });
      queryClient.invalidateQueries({ queryKey: ["user-profile-bookmarks", user._id] });
      toast.success(isBookmarked ? "Bookmark removed" : "FAQ bookmarked!");
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
      toast.error("Failed to update bookmark");
    }
  };

  const debouncedSearch = useDebounce(search, 300);

  const { data: faqs = [], isLoading, isError } = useQuery({
    queryKey: ["faqs", activeCategory, debouncedSearch],
    queryFn: () => faqApi.list({
      category: activeCategory !== "All Categories" ? activeCategory : undefined,
      search: debouncedSearch.trim() || undefined
    }),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => faqApi.listCategories(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: trendingSearches = [] } = useQuery({
    queryKey: ["trending-searches"],
    queryFn: () => faqApi.trending(),
    staleTime: 1000 * 60 * 2,
  });

  const filtered = useMemo(() => {
    return Array.isArray(faqs) ? [...faqs] : Array.isArray(faqs?.data) ? [...faqs.data] : [];
  }, [faqs]);

  const groupedFaqs = useMemo(() => {
    const groups = {};
    for (const faq of filtered) {
      const cat = faq.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(faq);
    }
    return Object.keys(groups).sort().map(cat => ({
      category: cat,
      faqs: groups[cat]
    }));
  }, [filtered]);

  // Smooth scroll helper for the quick links
  const scrollToCategory = (cat) => {
    const el = document.getElementById(`category-${cat}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 32;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      
      {/* ── Premium Hero Section ── */}
      <div className="bg-white border-b border-gray-200 py-8 lg:py-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(#E2E8DE 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="container-md text-center relative z-10 px-4">
          <div className="inline-flex items-center justify-center p-2 rounded-xl mb-4 shadow-sm bg-green-50 text-green-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight text-gray-900">
            How can we help?
          </h1>
          <p className="text-base md:text-lg mx-auto max-w-2xl mb-6 text-gray-500">
            Search our knowledge base to find verified answers quickly.
          </p>

          {/* Search and Filter */}
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 shadow-sm rounded-xl bg-white border border-gray-200 focus-within:ring-2 focus-within:ring-green-50 focus-within:border-green-500 transition-all">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full bg-transparent border-none py-3 pl-12 pr-4 text-base font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 rounded-xl"
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearch(val);
                  setSearchParams((prev) => {
                    if (val.trim()) prev.set("q", val.trim());
                    else prev.delete("q");
                    return prev;
                  });
                }}
                placeholder="Search by keyword, topic, or question..."
              />
            </div>
            
            <div className="md:w-56 shrink-0 shadow-sm rounded-xl bg-white border border-gray-200 focus-within:ring-2 focus-within:ring-green-50 focus-within:border-green-500 transition-all">
              <select
                className="w-full h-full bg-transparent border-none py-3 px-4 text-base font-medium text-gray-900 focus:outline-none focus:ring-0 rounded-xl cursor-pointer"
                value={activeCategory}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveCategory(val);
                  setSearchParams((prev) => {
                    if (val !== "All Categories") prev.set("category", val);
                    else prev.delete("category");
                    return prev;
                  });
                }}
              >
                <option>All Categories</option>
                {(Array.isArray(categories) ? categories : (categories?.data || [])).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Trending Searches ── */}
      {trendingSearches.length > 0 && !search.trim() && (
        <div className="border-b border-gray-100 bg-white py-3">
          <div className="container-md px-4 max-w-4xl mx-auto flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">🔥 Trending:</span>
            {trendingSearches.map((t) => (
              <button
                key={t.query}
                onClick={() => {
                  setSearch(t.query);
                  setSearchParams((prev) => { prev.set("q", t.query); return prev; });
                }}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 hover:bg-green-100 hover:text-green-700 text-gray-600 transition-colors border border-gray-200 hover:border-green-300"
              >
                {t.query}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="container-md py-12 px-4 max-w-4xl mx-auto">
        
        {/* Results Header */}
        {!isLoading && !isError && filtered.length > 0 && (search.trim() || activeCategory !== "All Categories") && (
          <div className="flex flex-wrap justify-between items-center gap-4 p-4 mb-8 bg-green-50 rounded-xl border border-green-100">
            <span className="text-sm font-medium text-green-800">
              Found {filtered.length} {filtered.length === 1 ? "result" : "results"}
              {activeCategory !== "All Categories" && <> in <strong>{activeCategory}</strong></>}
              {search.trim() && <> matching &ldquo;<strong>{search.trim()}</strong>&rdquo;</>}
            </span>
            <button
              onClick={() => { setSearch(""); setActiveCategory("All Categories"); setSearchParams({}); }}
              className="text-xs font-bold uppercase tracking-wider hover:bg-green-100 px-3 py-1.5 rounded-lg text-green-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* List Content */}
        <div className="space-y-4">
          {isLoading && [...Array(5)].map((_, i) => <SkeletonCard key={i} />)}

          {isError && (
            <div className="card p-10 text-center bg-white shadow-sm border border-red-100 rounded-2xl">
              <p className="font-bold text-lg text-red-600 mb-2">Failed to load FAQs</p>
              <p className="text-sm text-gray-500">Please check your connection or try again later.</p>
            </div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            search.trim() ? (
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5 animate-fade-in">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Smart Search Results (sorted by relevance):
                </div>
                {filtered.map((faq) => (
                  <FAQCard 
                    key={faq._id} 
                    faq={faq} 
                    isBookmarked={bookmarkedQuestions.some((bq) => bq._id === faq._id)}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-16">
                {groupedFaqs.map((group) => (
                  <div key={group.category} id={`category-${group.category}`} className="scroll-mt-12">
                    
                    {/* Category Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                        {group.category}
                      </h2>
                      <div className="h-px bg-gray-200 flex-1 mt-2"></div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-500 mt-1 shadow-sm border border-gray-200">
                        {group.faqs.length} {group.faqs.length === 1 ? 'FAQ' : 'FAQs'}
                      </span>
                    </div>
                    
                    {/* Category Accordions */}
                    <div className="space-y-4">
                      {group.faqs.map((faq) => (
                        <FAQCard 
                          key={faq._id} 
                          faq={faq} 
                          isBookmarked={bookmarkedQuestions.some((bq) => bq._id === faq._id)}
                          onToggleBookmark={handleToggleBookmark}
                        />
                      ))}
                    </div>
                    
                  </div>
                ))}
              </div>
            )
          )}

          {/* Empty State */}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="card p-12 text-center bg-white shadow-sm border border-gray-200 rounded-2xl">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="font-bold text-2xl mb-3 text-gray-900">No matches found</p>
              <p className="text-lg mb-8 text-gray-500 max-w-md mx-auto">
                We couldn't find any official answers matching "{search.trim()}".
              </p>
              <Link to="/ask" className="btn-primary shadow-md hover:shadow-lg transition-all text-lg px-8 py-3">
                Ask the Community Instead
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
