import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { faqApi } from "../services/api";

function FAQCard({ faq }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`card-hover overflow-hidden ${open ? "ring-2" : ""}`} style={open ? { ringColor: "#5E7A5A", borderColor: "#bdd4ba" } : {}}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left p-5 flex items-start gap-4"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="tag tag-brand">{faq.category}</span>
            <span className="badge badge-green flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Verified
            </span>
          </div>
          <h3 className="text-base font-semibold leading-snug" style={{ color: "#1F2937" }}>
            {faq.question}
          </h3>
        </div>
        <svg
          className="w-5 h-5 shrink-0 mt-1 transition-transform duration-200"
          style={{ color: "#9CA3AF", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 animate-fade-in" style={{ borderTop: "1px solid #F5F7F2" }}>
          <div className="pt-4 flex flex-col gap-3">
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#6B7280" }}>
              {faq.answer}
            </p>
            <div className="flex justify-end pt-2">
              <Link to={`/faq/${faq._id}`} className="text-xs font-medium hover:underline" style={{ color: "#5E7A5A" }}>
                View full details →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="skeleton h-4 w-24 mb-3" />
      <div className="skeleton h-5 w-3/4 mb-2" />
      <div className="skeleton h-4 w-1/2" />
    </div>
  );
}

export default function FaqsPage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "All Categories";

  const [search, setSearch] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const { data: faqs = [], isLoading, isError } = useQuery({
    queryKey: ["faqs"],
    queryFn: () => faqApi.list(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => faqApi.listCategories(),
    staleTime: 1000 * 60 * 5,
  });

  const filtered = useMemo(() => {
    let r = [...faqs];
    if (activeCategory !== "All Categories") {
      r = r.filter((f) => f.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((f) => f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q));
    }
    return r;
  }, [faqs, search, activeCategory]);

  return (
    <div style={{ background: "#F5F7F2", minHeight: "100vh" }}>
      {/* Header */}
      <div className="bg-white border-b py-8" style={{ borderColor: "#E2E8DE" }}>
        <div className="container-md text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: "#f0fdf4" }}>
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: "#1F2937" }}>Verified FAQs</h1>
          <p className="text-base mx-auto max-w-lg" style={{ color: "#6B7280" }}>
            Official knowledge base curated by the admin team. Search here before asking a new question.
          </p>
        </div>
      </div>

      <div className="container-md py-8">
        {/* Controls */}
        <div className="card p-4 mb-6">
          <select
            className="input w-full text-sm py-2 cursor-pointer"
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
          >
            <option>All Categories</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* List */}
        <div className="space-y-4">
          {isLoading && [...Array(5)].map((_, i) => <SkeletonCard key={i} />)}

          {isError && (
             <div className="card p-8 text-center">
               <p className="font-medium" style={{ color: "#1F2937" }}>Failed to load FAQs</p>
               <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>The backend might be down.</p>
             </div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-end mb-2 px-1">
                <span className="text-sm font-semibold" style={{ color: "#6B7280" }}>{filtered.length} FAQs</span>
              </div>
              {filtered.map((faq) => <FAQCard key={faq._id} faq={faq} />)}
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="card p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: "#f8f0e0" }}>
                <svg className="w-6 h-6" style={{ color: "#8B6914" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="font-semibold text-lg mb-1" style={{ color: "#1F2937" }}>No FAQs Found</p>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                We couldn't find any official answers matching your search.
              </p>
              <Link to="/ask" className="btn-primary">
                Ask the Community
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
