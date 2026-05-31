import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { questionApi, faqApi } from "../services/api";
import { socket } from "../services/socket";

const PRIORITIES  = ["All", "High", "Medium", "Low"];
const STATUSES    = ["All", "Unanswered", "Answered"];

function timeAgo(d) {
  if (!d) return "";
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initials(name = "?") { return name.charAt(0).toUpperCase(); }

function PriorityBadge({ priority }) {
  if (!priority) return null;
  const cls = priority === "High" ? "priority-high" : priority === "Medium" ? "priority-medium" : "priority-low";
  return <span className={cls}>{priority}</span>;
}

function QuestionRow({ question }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`card-hover overflow-hidden ${expanded ? "ring-2" : ""}`}
      style={expanded ? { ringColor: "#5E7A5A", borderColor: "#bdd4ba" } : {}}>
      <button
        onClick={() => setExpanded((o) => !o)}
        className="w-full text-left p-4 flex items-start gap-3"
        aria-expanded={expanded}
      >
        <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
          style={{ background: "#5E7A5A" }}>
          {initials(question.contributorName)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="tag tag-brand">{question.category}</span>
            {question.status === "reopened" && <span className="badge badge-orange">Reopened</span>}
            <PriorityBadge priority={question.priority} />
          </div>
          <p className="text-sm font-medium leading-snug" style={{ color: "#1F2937" }}>
            {question.question}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs" style={{ color: "#9CA3AF" }}>
            <span>Asked by <span style={{ color: "#6B7280", fontWeight: 500 }}>{question.contributorName || "Student"}</span></span>
            <span>·</span>
            <span>{timeAgo(question.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-lg font-bold leading-none" style={{ color: "#5E7A5A" }}>
              {question.answers?.length ?? 0}
            </p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>answers</p>
          </div>
          <svg
            className="w-4 h-4 transition-transform duration-200"
            style={{ color: "#9CA3AF", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 animate-fade-in" style={{ borderTop: "1px solid #F5F7F2" }}>
          {question.status === "reopened" && question.reopenReason && (
            <div className="mt-3 mb-3 px-3 py-2 rounded-lg text-xs" style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
              <strong>Reopened reason:</strong> {question.reopenReason}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Link to={`/questions/${question._id}`} className="btn-primary btn-sm">
              Answer this question
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="card p-4 flex gap-3">
      <div className="skeleton w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1">
        <div className="skeleton h-3 w-16 mb-2" />
        <div className="skeleton h-4 w-full mb-2" />
        <div className="skeleton h-3 w-40" />
      </div>
    </div>
  );
}

export default function QueuePage() {
  const queryClient = useQueryClient();
  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [priority, setPriority]           = useState("All");
  const [status, setStatus]               = useState("All");
  
  const [pendingCategory, setPendingCategory] = useState("All Categories");
  const [pendingPriority, setPendingPriority] = useState("All");
  const [pendingStatus, setPendingStatus]     = useState("All");

  const [sortBy, setSortBy]               = useState("newest");
  const [filterOpen, setFilterOpen]       = useState(false);
  const filterRef = useRef(null);

  // Close filter panel on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["questions-open"] });
  }, [queryClient]);

  useEffect(() => {
    if (!socket?.connected) return;

    socket.on("questionAdded", handleUpdate);
    socket.on("statusUpdated", handleUpdate);
    return () => {
      socket.off("questionAdded", handleUpdate);
      socket.off("statusUpdated", handleUpdate);
    };
  }, [handleUpdate]);

  const activeFilterCount = [
    activeCategory !== "All Categories",
    priority !== "All",
    status !== "All",
  ].filter(Boolean).length;

  const { data: categories = [], isLoading: areCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => faqApi.listCategories(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: questions = [], isLoading, isError } = useQuery({
    queryKey: ["questions-open"],
    queryFn: () => questionApi.listOpen(),
    staleTime: 1000 * 30,
    refetchInterval: 30000,
  });

  const filtered = useMemo(() => {
    let r = [...questions];
    // Always exclude closed questions from the queue
    r = r.filter((x) => x.status !== 'closed');
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((x) => (x.question || "").toLowerCase().includes(q));
    }
    if (activeCategory !== "All Categories") r = r.filter((x) => x.category === activeCategory);
    if (priority !== "All") r = r.filter((x) => (x.priority || "Medium") === priority);
    if (status === "Unanswered") r = r.filter((x) => !x.answers?.length);
    if (status === "Answered")   r = r.filter((x) => x.answers?.length > 0);
    r.sort((a, b) =>
      sortBy === "oldest"
        ? new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        : new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
    return r;
  }, [questions, search, activeCategory, priority, status, sortBy]);

  const reopened = filtered.filter((q) => q.status === "reopened");
  const open     = filtered.filter((q) => q.status === "open");

  return (
    <div style={{ background: "#F5F7F2" }}>
      <div className="container-xl py-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="page-title">Community Queue</h1>
            <p className="page-subtitle">Browse and help answer open questions from fellow students.</p>
          </div>
          <Link to="/ask" className="btn-primary self-start">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ask a Question
          </Link>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center w-full min-w-0">
              <div className="search-wrap flex-1 min-w-0 w-full">
                <svg className="search-icon w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  className="search-input w-full text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by question title, keyword…"
                />
              </div>

              <div className="relative shrink-0" ref={filterRef}>
                <button
                  onClick={() => {
                    if (!filterOpen) {
                      setPendingCategory(activeCategory);
                      setPendingPriority(priority);
                      setPendingStatus(status);
                    }
                    setFilterOpen(!filterOpen);
                  }}
                  className="btn-secondary gap-2 flex items-center min-h-[44px]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white" style={{ background: "#5E7A5A" }}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {filterOpen && (
                  <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 w-72 bg-white rounded-xl border shadow-xl z-50 p-4 animate-scale-in" style={{ borderColor: "#E2E8DE" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold" style={{ color: "#1F2937" }}>Filters</h3>
                    {activeFilterCount > 0 && (
                      <button onClick={() => {
                        setPendingCategory("All Categories");
                        setPendingPriority("All");
                        setPendingStatus("All");
                      }} className="text-xs font-medium hover:underline" style={{ color: "#5E7A5A" }}>
                        Reset all
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: "#9CA3AF" }}>CATEGORY</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                      {areCategoriesLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Loading categories…</div>
                      ) : (
                        ['All Categories', ...categories].map((cat) => (
                          <button key={cat}
                            onClick={() => setPendingCategory(cat)}
                            className="w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors"
                            style={pendingCategory === cat
                              ? { background: "#dde8db", color: "#3a4f38", fontWeight: 600 }
                              : { color: "#6B7280" }}>
                            {cat}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                    <div className="divider" />

                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: "#9CA3AF" }}>PRIORITY</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PRIORITIES.map((p) => (
                          <button key={p}
                            onClick={() => setPendingPriority(p)}
                            className="px-3 py-1.5 text-xs rounded-full transition-colors min-h-[32px]"
                            style={pendingPriority === p
                              ? { background: "#5E7A5A", color: "#fff" }
                              : { background: "#F5F7F2", color: "#6B7280" }}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="divider" />

                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: "#9CA3AF" }}>STATUS</p>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUSES.map((s) => (
                          <button key={s}
                            onClick={() => setPendingStatus(s)}
                            className="px-3 py-1.5 text-xs rounded-full transition-colors min-h-[32px]"
                            style={pendingStatus === s
                              ? { background: "#5E7A5A", color: "#fff" }
                              : { background: "#F5F7F2", color: "#6B7280" }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button onClick={() => {
                    setActiveCategory(pendingCategory);
                    setPriority(pendingPriority);
                    setStatus(pendingStatus);
                    setFilterOpen(false);
                  }} className="btn-primary w-full mt-4 text-sm justify-center">
                    Apply Filters
                  </button>
                </div>
              )}
            </div>

            <select className="input w-auto text-sm py-2 cursor-pointer shrink-0"
              value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            </div>
          </div>

          {isLoading && <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} />)}</div>}

          {isError && !isLoading && (
            <div className="card p-8 text-center">
              <p className="font-medium" style={{ color: "#1F2937" }}>Failed to load queue</p>
              <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>Backend may be unavailable</p>
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="card p-12 text-center">
              <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full opacity-60 blur-xl" style={{ background: "#dde8db" }}></div>
                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border" style={{ background: "#F5F7F2", borderColor: "#E2E8DE" }}>
                  <svg className="w-8 h-8" style={{ color: "#5E7A5A" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xl font-bold mb-2" style={{ color: "#1F2937" }}>
                {search ? `No results for "${search}"` : "Queue is clear!"}
              </p>
              <p className="text-base" style={{ color: "#6B7280" }}>
                {search ? "Try a different search term or clear your filters." : "All questions have been answered. You guys are awesome!"}
              </p>
            </div>
          )}

          {!isLoading && reopened.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold" style={{ color: "#6B7280" }}>Reopened</h2>
                <span className="badge badge-orange">{reopened.length}</span>
              </div>
              <div className="space-y-2">
                {reopened.map((q) => <QuestionRow key={q._id} question={q} />)}
              </div>
            </div>
          )}

          {!isLoading && open.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold" style={{ color: "#6B7280" }}>Open Questions</h2>
                <span className="badge badge-brand">{open.length}</span>
              </div>
              <div className="space-y-2">
                {open.map((q) => <QuestionRow key={q._id} question={q} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
