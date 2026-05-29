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
  if (lower.includes("noc")) return "📄";
  if (lower.includes("offer")) return "✉️";
  if (lower.includes("vibe")) return "✨";
  if (lower.includes("samagama")) return "🎓";
  if (lower.includes("stipend")) return "💰";
  if (lower.includes("general")) return "💬";
  if (lower.includes("tech")) return "💻";
  return "📁";
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
                  <div className="text-3xl mb-3">{getCategoryIcon(cat)}</div>
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