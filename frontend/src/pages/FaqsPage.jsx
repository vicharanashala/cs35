import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { faqApi, bookmarkApi } from "../services/api";
import { useDebounce } from "../hooks/useDebounce";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-hot-toast";
import Fuse from "fuse.js";
import HighlightText from "../components/HighlightText";

function getCategoryIcon(name) {
  const lower = name.toLowerCase();
  const baseProps = { fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  const iconStyle = { color: "#5E7A5A" };

  if (lower.includes("about the internship")) return (
    <svg {...baseProps} className="w-8 h-8 animate-icon-float" style={iconStyle}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  );
  if (lower.includes("timing")) return (
    <svg {...baseProps} className="w-8 h-8 animate-icon-wiggle delay-100" style={iconStyle}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  );
  if (lower.includes("noc")) return (
    <svg {...baseProps} className="w-8 h-8 animate-icon-bounce" style={iconStyle}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  );
  if (lower.includes("selection") || lower.includes("offer")) return (
    <svg {...baseProps} className="w-8 h-8 animate-icon-pulse delay-200" style={iconStyle}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  );
  if (lower.includes("work") || lower.includes("mentorship")) return (
    <svg {...baseProps} className="w-8 h-8 animate-icon-float delay-300" style={iconStyle}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
  );
  if (lower.includes("conduct")) return (
    <svg {...baseProps} className="w-8 h-8 animate-icon-wiggle delay-200" style={iconStyle}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
  );
  if (lower.includes("interviews")) return (
    <svg {...baseProps} className="w-8 h-8 animate-icon-bounce delay-100" style={iconStyle}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
  );
  if (lower.includes("certificate")) return (
    <svg {...baseProps} className="w-8 h-8 animate-icon-pulse" style={iconStyle}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
  );
  if (lower.includes("rosetta")) return (
    <svg {...baseProps} className="w-8 h-8 animate-icon-float delay-100" style={iconStyle}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
  );
  if (lower.includes("phase 1")) return (
    <svg {...baseProps} className="w-8 h-8 animate-icon-bounce delay-300" style={iconStyle}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
  );
  if (lower.includes("yaksha")) return (
    <svg {...baseProps} className="w-8 h-8 animate-icon-wiggle" style={iconStyle}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
  );
  if (lower.includes("vibe")) return (
    <svg {...baseProps} className="w-8 h-8 animate-icon-pulse delay-200" style={iconStyle}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  );
  if (lower.includes("team")) return (
    <svg {...baseProps} className="w-8 h-8 animate-icon-float delay-200" style={iconStyle}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
  );
  return (
    <svg {...baseProps} className="w-8 h-8 animate-icon-bounce delay-100" style={iconStyle}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
  );
}

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
            <HighlightText text={faq.question} matches={faq.matches?.find(m => m.key === 'question')?.indices} />
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
              className={`p-1.5 rounded-full border transition-all cursor-pointer hover:scale-110 flex items-center justify-center animate-fade-in ${
                isBookmarked
                  ? "bg-green-50 text-green-600 border-green-300"
                  : "bg-white text-gray-400 border-gray-200 hover:text-green-600 hover:border-green-300 hover:bg-green-50"
              }`}
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
              <HighlightText text={faq.answer} matches={faq.matches?.find(m => m.key === 'answer')?.indices} />
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pt-2">
                {/* Feedback */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">Was this helpful?</span>
                  <button
                    onClick={() => handleFeedback(true)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      voted === "up"
                        ? "bg-green-100 border-green-300 text-green-700 font-bold"
                        : "border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514" />
                    </svg>
                    {faq.helpfulCount > 0 && <span>{faq.helpfulCount}</span>}
                  </button>
                  <button
                    onClick={() => handleFeedback(false)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      voted === "down"
                        ? "bg-red-100 border-red-300 text-red-600 font-bold"
                        : "border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-300 hover:text-red-500"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.514" />
                    </svg>
                    {faq.unhelpfulCount > 0 && <span>{faq.unhelpfulCount}</span>}
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
  useEffect(() => {
    setActiveCategory(searchParams.get("category") || "All Categories");
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rawBookmarks = [], refetch: refetchBookmarks } = useQuery({
    queryKey: ["bookmarked-questions", user?._id],
    queryFn: () => bookmarkApi.list(user?._id),
    enabled: !!user?._id,
  });

  // Normalize: API may return plain array or { data: [] }
  const bookmarkedQuestions = Array.isArray(rawBookmarks)
    ? rawBookmarks
    : Array.isArray(rawBookmarks?.data)
    ? rawBookmarks.data
    : [];

  const handleToggleBookmark = async (faqId) => {
    if (!user?._id) return;
    const isBookmarked = bookmarkedQuestions.some((bq) => bq._id === faqId);

    // Optimistic update — flip the bookmark immediately in cache
    queryClient.setQueryData(["bookmarked-questions", user._id], (old) => {
      const list = Array.isArray(old) ? old : Array.isArray(old?.data) ? old.data : [];
      if (isBookmarked) {
        return list.filter((bq) => bq._id !== faqId);
      } else {
        return [...list, { _id: faqId }];
      }
    });

    try {
      await bookmarkApi.toggle(user._id, faqId);
      refetchBookmarks();
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile-bookmarks", user._id] });
      toast.success(isBookmarked ? "Bookmark removed" : "FAQ bookmarked! ✓");
    } catch (err) {
      // Rollback optimistic update on failure
      refetchBookmarks();
      console.error("Failed to toggle bookmark:", err);
      toast.error("Failed to update bookmark");
    }
  };

  const { data: faqs = [], isLoading, isError } = useQuery({
    queryKey: ["faqs", { limit: 2000 }],
    queryFn: () => faqApi.list({ limit: 2000 }),
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
    let arr = Array.isArray(faqs) ? [...faqs] : Array.isArray(faqs?.data) ? [...faqs.data] : [];
    if (activeCategory !== "All Categories") {
      if (activeCategory === "Others") {
         arr = arr.filter(f => f.category && f.category.startsWith("Others - "));
      } else {
         arr = arr.filter(f => f.category === activeCategory);
      }
    }
    if (search.trim()) {
      const q = search.trim();
      const fuse = new Fuse(arr, {
        keys: ['question', 'answer', 'tags', 'category'],
        includeMatches: true,
        threshold: 0.4,
        ignoreLocation: true,
      });
      arr = fuse.search(q).map(res => ({
        ...res.item,
        matches: res.matches
      }));
    }
    return arr;
  }, [faqs, activeCategory, search]);

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
    <div className="min-h-screen" style={{ background: "#F5F7F2" }}>
      
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
                {(() => {
                   const opts = new Set();
                   (Array.isArray(categories) ? categories : (categories?.data || [])).forEach(c => {
                      const catName = typeof c === 'string' ? c : c.name;
                      if (catName.startsWith("Others - ")) {
                         opts.add("Others");
                      } else {
                         opts.add(catName);
                      }
                   });
                   const arr = Array.from(opts);
                   return arr.sort((a, b) => {
                     if (a === "Others") return 1;
                     if (b === "Others") return -1;
                     return a.localeCompare(b);
                   });
                })().map(catName => <option key={catName} value={catName}>{catName}</option>)}
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
                      <div className="text-brand">
                        {getCategoryIcon(group.category)}
                      </div>
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
