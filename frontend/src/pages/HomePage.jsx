import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "../hooks/useDebounce";
import { faqApi, questionApi, userApi, bookmarkApi } from "../services/api";
import hero from "../assets/hero.png";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-hot-toast";
import FloatingBubbles from "../components/FloatingBubbles";

function timeAgo(d) {
  if (!d) return "";
  const date = new Date(d);
  if (date.getTime() === 0 || isNaN(date.getTime())) return "";
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

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

export default function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  const { data: bookmarkedQuestions = [], refetch: refetchBookmarks } = useQuery({
    queryKey: ["bookmarked-questions", user?._id],
    queryFn: () => bookmarkApi.list(user?._id),
    enabled: !!user?._id,
  });

  const handleToggleBookmark = async (id) => {
    if (!user?._id) return;
    const isBookmarked = bookmarkedQuestions.some((bq) => bq._id === id);
    try {
      await bookmarkApi.toggle(user._id, id);
      refetchBookmarks();
      queryClient.invalidateQueries({ queryKey: ["bookmarked-questions", user._id] });
      queryClient.invalidateQueries({ queryKey: ["user-profile-bookmarks", user._id] });
      toast.success(isBookmarked ? "Bookmark removed" : "Question bookmarked!");
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
      toast.error("Failed to update bookmark");
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/faqs?q=${encodeURIComponent(search.trim())}`);
  };

  // 1. Verified FAQs (Official Knowledge)
  const { data: faqs = [], isLoading: loadingFaqs } = useQuery({
    queryKey: ["faqs"],
    queryFn: () => faqApi.list(),
    staleTime: 1000 * 60 * 5,
  });

  const faqList = useMemo(() => {
    return Array.isArray(faqs) ? faqs : (Array.isArray(faqs?.data) ? faqs.data : []);
  }, [faqs]);

  const topFaqs = useMemo(() =>
    [...faqList].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4),
  [faqList]);

  const debouncedSearch = useDebounce(search, 300);

  const { data: searchResultsData = [] } = useQuery({
    queryKey: ['faq-search-home', debouncedSearch],
    queryFn: () => faqApi.list({ search: debouncedSearch }),
    enabled: debouncedSearch.trim().length > 1,
    staleTime: 60000,
  });
  const searchResults = Array.isArray(searchResultsData)
    ? searchResultsData.slice(0, 6)
    : Array.isArray(searchResultsData?.data)
      ? searchResultsData.data.slice(0, 6)
      : [];

  // 2. Categories
  const { data: categoriesData = [], isLoading: loadingCats } = useQuery({
    queryKey: ["categories"],
    queryFn: () => faqApi.listCategories(),
    staleTime: 1000 * 60 * 5,
  });
  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);

  // 3. Recent Discussions (Community)
  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ["questions-recent"],
    queryFn: () => questionApi.listOpen(),
    staleTime: 1000 * 30,
  });

  const recentDiscussions = useMemo(() =>
    [...questions].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 3),
  [questions]);

  return (
    <div style={{ background: "#F5F7F2" }}>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #F5F7F2 0%, #ffffff 100%)", borderBottom: "1px solid #E2E8DE" }}>
        {/* Soft abstract blobs for background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30" style={{ background: "#dde8db" }}></div>
          <div className="absolute top-24 -right-24 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30" style={{ background: "#f8f0e0" }}></div>
        </div>
        <div className="container-xl py-16 sm:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="max-w-2xl">
              <h1 className="text-5xl sm:text-6xl lg:text-[4rem] font-extrabold tracking-tight mb-6 text-gray-900 leading-[1.05]">
                Get Answers.<br />
                <span style={{ color: "#5E7A5A" }}>Share Knowledge.</span>
              </h1>
              <p className="text-lg sm:text-xl mb-10 text-gray-600 leading-relaxed max-w-lg">
                Ask questions, help others, and build a smarter student community together. Your experience makes a difference.
              </p>

              {/* Hero search */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 relative" ref={searchRef}>
                <div className="search-wrap flex-1 shadow-md rounded-full transition-shadow hover:shadow-lg bg-white">
                  <svg className="search-icon w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    className="search-input py-4 text-base pl-12 bg-transparent shadow-none w-full"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search FAQs — e.g. NOC, offer letter, stipend…"
                    style={{ background: "transparent", boxShadow: "none" }}
                  />
                </div>
                <button type="submit" className="btn-primary py-4 px-8 text-base shadow-md hover:shadow-lg rounded-full shrink-0">Search</button>

                {/* Search dropdown */}
                {showDropdown && debouncedSearch.trim().length > 1 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border shadow-lg z-50 overflow-hidden animate-scale-in" style={{ borderColor: "#E2E8DE" }}>
                    {searchResults.length > 0 ? (
                      <div className="p-2">
                        <p className="text-xs font-semibold px-3 py-1.5" style={{ color: "#9CA3AF" }}>RELATED QUESTIONS</p>
                        {searchResults.map((faq) => (
                          <Link
                            key={faq._id}
                            to={`/faqs/${faq._id}`}
                            onClick={() => setShowDropdown(false)}
                            className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <svg className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#5E7A5A" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-1" style={{ color: "#1F2937" }}>{faq.question}</p>
                              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{faq.category}</p>
                            </div>
                          </Link>
                        ))}
                        <div className="border-t mt-2 pt-2 px-3" style={{ borderColor: "#E2E8DE" }}>
                          <Link
                            to={`/faqs?q=${encodeURIComponent(search)}`}
                            onClick={() => setShowDropdown(false)}
                            className="text-xs font-medium hover:underline"
                            style={{ color: "#5E7A5A" }}
                          >
                            See all results for "{search}" →
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <svg className="w-8 h-8 mx-auto mb-2" style={{ color: "#D1D5DB" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium mb-1" style={{ color: "#374151" }}>No FAQs found</p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>Try a different search term or</p>
                        <Link
                          to={`/ask?question=${encodeURIComponent(search)}`}
                          onClick={() => setShowDropdown(false)}
                          className="text-xs font-medium hover:underline mt-1 inline-block"
                          style={{ color: "#5E7A5A" }}
                        >
                          ask this as a question →
                        </Link>
                      </div>
                    )}
                  </div>
                )}


              </form>
            </div>

{/* Right — illustration with floating questions */}
            <div className="hidden lg:flex items-center justify-center relative">
              <img
                src={hero}
                alt="Students collaborating"
                className="w-full max-w-sm object-contain"
                style={{ borderRadius: "1rem" }}
              />
              <FloatingBubbles questions={faqList} />
            </div>
          </div>
        </div>
      </section>

        <div className="container-xl py-10 space-y-12" onClick={() => setShowDropdown(false)}>
{/* ── 2. Explore Categories ── */}
        <section>
          <div className="mb-5">
            <h2 className="section-title">Explore Categories</h2>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Browse knowledge by topic.</p>
          </div>
          <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {loadingCats ? (
               [...Array(8)].map((_, i) => (
                <div key={i} className="card p-2 flex flex-col items-center justify-center aspect-square">
                  <div className="skeleton h-5 w-5 rounded-full mb-1" />
                  <div className="skeleton h-2 w-12" />
                </div>
              ))
            ) : categories.length > 0 ? (
              categories.map((cat) => (
                <Link key={cat} to={`/faqs?category=${encodeURIComponent(cat)}`} className="card-hover p-2 text-center flex flex-col items-center justify-center aspect-square">
                  <div className="flex justify-center items-center mb-1 text-brand text-base">{getCategoryIcon(cat)}</div>
                  <h3 className="font-semibold text-[10px] line-clamp-2" style={{ color: "#1F2937" }}>{cat}</h3>
                </Link>
              ))
            ) : (
              <div className="col-span-5 md:col-span-6 lg:col-span-8 card p-8 text-center">
                <p className="text-sm" style={{ color: "#9CA3AF" }}>No categories found.</p>
              </div>
            )}
          </div>
        </section>

        {/* ── 3. Recent Discussions ── */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                Recent Discussions
              </h2>
              <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Community-driven Q&A. Help your peers!</p>
            </div>
            <Link to="/queue" className="text-sm font-medium hover:underline" style={{ color: "#5E7A5A" }}>
              See All →
            </Link>
          </div>

          {loadingQuestions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="skeleton w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <div className="skeleton h-3 w-20 mb-1" />
                      <div className="skeleton h-2 w-12" />
                    </div>
                  </div>
                  <div className="skeleton h-4 w-full mb-2" />
                  <div className="skeleton h-4 w-3/4 mb-3" />
                  <div className="skeleton h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : recentDiscussions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentDiscussions.map((q) => {
                const isBookmarked = bookmarkedQuestions.some((bq) => bq._id === q._id);
                const initial = (q.contributorName || "S")[0].toUpperCase();
                const avatarColors = ["#5E7A5A", "#7C9A6E", "#A4BE8B", "#D4E4C9", "#3D5A3A", "#6B8E6B"];
                const avatarColor = avatarColors[initial.charCodeAt(0) % avatarColors.length];
                return (
                  <div
                    key={q._id}
                    onClick={() => navigate(`/question/${q._id}`)}
                    className="card-hover block cursor-pointer group/discussion"
                    style={{
                      background: "#ffffff",
                      border: "1px solid #E2E8DE",
                      borderRadius: "16px",
                      padding: "20px",
                      transition: "all 0.2s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {/* Header: Avatar + User info */}
                    <div className="flex items-center gap-3 mb-4">
                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                        style={{ background: avatarColor }}
                      >
                        {initial}
                      </div>
                      {/* Name + time */}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate" style={{ color: "#1F2937" }}>
                          {q.contributorName || "Student"}
                        </p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          {timeAgo(q.createdAt)}
                        </p>
                      </div>
                      {/* Bookmark button */}
                      {user && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleBookmark(q._id);
                          }}
                          title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
                          className="p-1.5 rounded-full transition-all cursor-pointer hover:scale-110 flex items-center justify-center"
                          style={
                            isBookmarked
                              ? { background: "#F0FDF4", color: "#059669" }
                              : { background: "#F9FAFB", color: "#9CA3AF" }
                          }
                        >
                          <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Question title */}
                    <h3 className="font-semibold text-sm leading-snug mb-3" style={{ color: "#1F2937" }}>
                      {q.question}
                    </h3>

                    {/* Footer: Category pill + stats */}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{
                          background: "#EEF4EA",
                          color: "#5E7A5A",
                        }}
                      >
                        {q.category}
                      </span>
                      <div className="flex items-center gap-3">
                        {/* Upvotes */}
                        <span className="flex items-center gap-1 text-xs" style={{ color: "#6B7280" }}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          {q.upvotes || 0}
                        </span>
                        {/* Comments / Answers */}
                        <span className="flex items-center gap-1 text-xs" style={{ color: "#6B7280" }}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {q.answers?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-sm" style={{ color: "#9CA3AF" }}>No recent discussions found.</p>
            </div>
          )}
        </section>

        {/* ── Footer CTA ── */}
        {user?.role !== "admin" && (
          <section className="card p-8 text-center bg-white">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: "#f0f4ef" }}>
              <svg className="w-8 h-8" style={{ color: "#5E7A5A" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#1F2937" }}>Can't find what you're looking for?</h2>
            <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
              Ask your question and the community will help!
            </p>
            <Link to="/ask" className="btn-primary">
              Ask a Question
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}