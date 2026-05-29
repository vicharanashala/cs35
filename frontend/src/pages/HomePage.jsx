import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { faqApi, questionApi } from "../services/api";

function timeAgo(d) {
  if (!d) return "";
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
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
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) window.location.href = `/faqs?q=${encodeURIComponent(search.trim())}`;
  };

  // 1. Verified FAQs (Official Knowledge)
  const { data: faqs = [], isLoading: loadingFaqs } = useQuery({
    queryKey: ["faqs"],
    queryFn: () => faqApi.list(),
    staleTime: 1000 * 60 * 5,
  });

  const topFaqs = useMemo(() =>
    [...faqs].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4),
  [faqs]);

  // 2. Categories
  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ["categories"],
    queryFn: () => faqApi.listCategories(),
    staleTime: 1000 * 60 * 5,
  });

  // 3. Recent Discussions (Community)
  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ["questions-recent"],
    queryFn: () => questionApi.listOpen(), // Just using open ones for recent demo
    staleTime: 1000 * 30,
  });

  const recentDiscussions = useMemo(() =>
    [...questions].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 3),
  [questions]);

  return (
    <div style={{ background: "#F5F7F2" }}>
      {/* ── Hero ── */}
      <section className="bg-white border-b" style={{ borderColor: "#E2E8DE" }}>
        <div className="container-xl py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3" style={{ color: "#1F2937" }}>
                Get Answers.<br />
                <span style={{ color: "#5E7A5A" }}>Share Knowledge.</span>
              </h1>
              <p className="text-base mb-8" style={{ color: "#6B7280" }}>
                Ask questions, help others, and build a smarter student community together.
              </p>

              {/* Hero search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="search-wrap flex-1">
                  <svg className="search-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    className="search-input py-3"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search verified FAQs..."
                  />
                </div>
                <button type="submit" className="btn-primary">Search</button>
              </form>
            </div>

            {/* Right — illustration */}
            <div className="hidden lg:flex items-center justify-center">
              <img
                src="/hero.png"
                alt="Students collaborating"
                className="w-full max-w-sm object-contain"
                style={{ borderRadius: "1rem" }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container-xl py-10 space-y-12">
        {/* ── 1. Verified FAQs ── */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Top Verified FAQs
              </h2>
              <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Official information curated by admins.</p>
            </div>
            <Link to="/faqs" className="text-sm font-medium hover:underline" style={{ color: "#5E7A5A" }}>
              View all FAQs →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingFaqs ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="card p-5">
                  <div className="skeleton h-3 w-20 mb-3" />
                  <div className="skeleton h-4 w-full mb-2" />
                  <div className="skeleton h-4 w-3/4" />
                </div>
              ))
            ) : topFaqs.length > 0 ? (
              topFaqs.map((faq) => (
                <Link key={faq._id} to={`/faq/${faq._id}`} className="card-hover p-5 flex flex-col h-full">
                  <span className="tag tag-brand w-max mb-3">{faq.category}</span>
                  <h3 className="text-base font-semibold leading-snug mb-2" style={{ color: "#1F2937" }}>
                    {faq.question}
                  </h3>
                  <p className="text-sm line-clamp-2 mt-auto" style={{ color: "#6B7280" }}>
                    {faq.answer}
                  </p>
                </Link>
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 card p-8 text-center">
                 <p className="text-sm" style={{ color: "#9CA3AF" }}>No verified FAQs found.</p>
              </div>
            )}
          </div>
        </section>

        {/* ── 2. Explore Categories ── */}
        <section>
          <div className="mb-5">
            <h2 className="section-title">Explore Categories</h2>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Browse knowledge by topic.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {loadingCats ? (
               [...Array(3)].map((_, i) => (
                <div key={i} className="card p-6 flex flex-col items-center">
                  <div className="skeleton h-8 w-8 rounded-full mb-3" />
                  <div className="skeleton h-4 w-24" />
                </div>
              ))
            ) : categories.length > 0 ? (
              categories.map((cat) => (
                <Link key={cat} to={`/faqs?category=${encodeURIComponent(cat)}`} className="card-hover p-6 text-center">
                  <div className="flex justify-center items-center mb-3 text-brand">{getCategoryIcon(cat)}</div>
                  <h3 className="font-semibold text-base mb-1" style={{ color: "#1F2937" }}>{cat}</h3>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>View FAQs →</p>
                </Link>
              ))
            ) : (
              <div className="col-span-2 md:col-span-3 card p-8 text-center">
                <p className="text-sm" style={{ color: "#9CA3AF" }}>No categories found.</p>
              </div>
            )}
          </div>
        </section>

        {/* ── 3. Recent Discussions (Community) ── */}
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
              View Queue →
            </Link>
          </div>

          <div className="space-y-3">
            {loadingQuestions ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="card p-4">
                  <div className="skeleton h-4 w-1/2 mb-2" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              ))
            ) : recentDiscussions.length > 0 ? (
              recentDiscussions.map((q) => (
                <Link key={q._id} to={`/question/${q._id}`} className="card-hover p-5 block">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="tag tag-neutral">{q.category}</span>
                    {q.isReopened && <span className="badge badge-orange">Reopened</span>}
                  </div>
                  <h3 className="font-medium text-base mb-2" style={{ color: "#1F2937" }}>
                    {q.question}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "#9CA3AF" }}>
                    <span>Asked by {q.contributor || "Student"}</span>
                    <span>·</span>
                    <span>{timeAgo(q.createdAt)}</span>
                    <span>·</span>
                    <span className="font-medium" style={{ color: "#5E7A5A" }}>{q.answers?.length || 0} answers</span>
                  </div>
                </Link>
              ))
            ) : (
               <div className="card p-8 text-center">
                 <p className="text-sm" style={{ color: "#9CA3AF" }}>No recent discussions found.</p>
               </div>
            )}
          </div>
        </section>

        {/* ── Footer CTA ── */}
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
      </div>
    </div>
  );
}