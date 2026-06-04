import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { questionApi, faqApi, bookmarkApi } from "../services/api";
import { socket } from "../services/socket";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-hot-toast";
import Fuse from "fuse.js";
import HighlightText from "../components/HighlightText";

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

function QuestionRow({ question, isBookmarked, onToggleBookmark }) {
  const [expanded, setExpanded] = useState(false);
  const [userVotes, setUserVotes] = useState({});
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isOwnQuestion = user?._id && question?.contributorId && user._id === (question.contributorId._id || question.contributorId);
  const displayName = isOwnQuestion ? "You" : (question.contributorName || question.contributorId?.name || "Student");

  const handleVote = async (e, answerId, dir) => {
    e.stopPropagation();
    // Optimistically highlight button
    setUserVotes((prev) => {
      const cur = prev[answerId] || 0;
      if (cur === dir) {
        const next = { ...prev }; delete next[answerId]; return next;
      }
      return { ...prev, [answerId]: dir };
    });
    try {
      // Send clicked direction — backend handles toggle/switch/new vote per user
      await questionApi.vote(question._id, answerId, dir);
      queryClient.invalidateQueries({ queryKey: ["questions-open"] });
      queryClient.invalidateQueries({ queryKey: ["my-questions"] });
    } catch (err) {
      console.error("Vote failed:", err);
      toast.error("Failed to record vote");
    }
  };

  // Initialise vote highlights from voters array when expanded
  useEffect(() => {
    if (!expanded || !question?.answers || !user?._id) return;
    const votes = {};
    question.answers.forEach((ans) => {
      if (!ans.voters) return;
      const myVote = ans.voters.find((v) => v.userId === user._id || v.userId === String(user._id));
      if (myVote) votes[ans._id] = myVote.direction;
    });
    setUserVotes(votes);
  }, [expanded, question?.answers, user?._id]);



  return (
    <div className={`card-hover overflow-hidden ${expanded ? "ring-2" : ""}`}
      style={expanded ? { ringColor: "#5E7A5A", borderColor: "#bdd4ba" } : {}}>
      <div
        onClick={() => setExpanded((o) => !o)}
        className="p-4 flex gap-3 cursor-pointer group"
        role="button"
        aria-expanded={expanded}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "#5E7A5A" }}>
          {isOwnQuestion ? "Y" : (question.contributorName?.charAt(0) || "U")}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold" style={{ color: "#1F2937", lineHeight: 1.2 }}>
            {isOwnQuestion ? "You" : (question.contributorName || "Student")}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mb-1 mt-1">
            <span className="tag tag-brand">{question.category}</span>
            {question.status === "reopened" && <span className="badge badge-orange">Reopened</span>}
            <PriorityBadge priority={question.priority} />
          </div>
          <p className="text-sm font-medium leading-snug" style={{ color: "#1F2937" }}>
            <HighlightText text={question.question} matches={question.matches?.find(m => m.key === 'question')?.indices} />
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs" style={{ color: "#9CA3AF" }}>
            <span>Asked by <span style={{ color: "#6B7280", fontWeight: 500 }}>{displayName}</span></span>
            <span>·</span>
            <span>{timeAgo(question.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {user && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleBookmark(question._id);
              }}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark Question"}
              className={`p-1.5 rounded-full border transition-all cursor-pointer hover:scale-110 flex items-center justify-center animate-fade-in z-10 relative ${
                isBookmarked
                  ? "bg-green-50 text-green-600 border-green-300"
                  : "bg-white text-gray-400 border-gray-200 hover:text-green-600 hover:border-green-300 hover:bg-green-50"
              }`}
            >
              <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          )}
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
      </div>

      {expanded && (
        <div className="px-4 pb-4 animate-fade-in" style={{ borderTop: "1px solid #F5F7F2" }}>
          {question.status === "reopened" && question.reopenReason && (
            <div className="mt-3 mb-3 px-3 py-2 rounded-lg text-xs" style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
              <strong>Reopened reason:</strong> {question.reopenReason}
            </div>
          )}
          
          <div className="mt-3 w-full">
            {(!question.answers || question.answers.length === 0) ? (
              <p className="text-sm italic mb-4" style={{ color: "#6B7280" }}>No answers available.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {question.answers.map((ans) => {
                  const isOwnAnswer = user?._id && ans.contributorId && user._id === (ans.contributorId._id || ans.contributorId);
                  const ansDisplayName = isOwnAnswer ? "You" : (ans.contributorName || "Student");
                  const vote = userVotes[ans._id] || 0;
                  const upvotes = ans.upvotes || 0;
                  const downvotes = ans.downvotes || 0;
                  return (
                    <div key={ans._id} className="p-3 rounded-lg" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "#4B5563" }}>
                        {ansDisplayName} answered:
                      </p>
                      <p className="text-sm whitespace-pre-line mb-3" style={{ color: "#1F2937" }}>
                        {ans.content}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleVote(e, ans._id, 1)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
                          style={vote > 0 ? { background: "#5E7A5A", color: "#fff" } : { background: "#F3F4F6", color: "#6B7280" }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514" />
                          </svg>
                          {upvotes > 0 ? upvotes : ""}
                        </button>
                        <button
                          onClick={(e) => handleVote(e, ans._id, -1)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
                          style={vote < 0 ? { background: "#5E7A5A", color: "#fff" } : { background: "#F3F4F6", color: "#6B7280" }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.514" />
                          </svg>
                          {downvotes > 0 ? downvotes : ""}
                        </button>
                        {upvotes > 0 && (
                          <span className="text-xs" style={{ color: "#6B7280" }}>{upvotes} found helpful</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {question.contributorId === user?._id ? (
                <>
                  <Link to={`/ask?edit=${question._id}`} className="btn-secondary btn-sm">
                    Edit Question
                  </Link>
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      if(window.confirm("Are you sure you want to delete this question?")) {
                        try {
                          const { questionApi } = await import("../services/api");
                          await questionApi.delete(question._id);
                          window.location.reload();
                        } catch (err) {
                          alert("Failed to delete question");
                        }
                      }
                    }} 
                    className="btn-sm border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer rounded"
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", fontWeight: 500 }}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <Link to={`/questions/${question._id}`} className="btn-primary btn-sm">
                  Answer this question
                </Link>
              )}
            </div>
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
  const { user } = useAuth();
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

  const handleToggleBookmark = async (qId) => {
    if (!user?._id) return;
    const isBookmarked = bookmarkedQuestions.some((bq) => bq._id === qId);

    // Optimistic update — flip immediately in cache
    queryClient.setQueryData(["bookmarked-questions", user._id], (old) => {
      const list = Array.isArray(old) ? old : Array.isArray(old?.data) ? old.data : [];
      if (isBookmarked) {
        return list.filter((bq) => bq._id !== qId);
      } else {
        return [...list, { _id: qId }];
      }
    });

    try {
      await bookmarkApi.toggle(user._id, qId);
      refetchBookmarks();
      queryClient.invalidateQueries({ queryKey: ["user-profile-bookmarks", user._id] });
      toast.success(isBookmarked ? "Bookmark removed" : "Question bookmarked! ✓");
    } catch (err) {
      // Rollback on failure
      refetchBookmarks();
      console.error("Failed to toggle bookmark:", err);
      toast.error("Failed to update bookmark");
    }
  };

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

  const { data: categoriesData = [], isLoading: areCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => faqApi.listCategories(),
    staleTime: 1000 * 60 * 5,
  });
  const categories = useMemo(() => {
    return Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);
  }, [categoriesData]);

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
    if (activeCategory !== "All Categories") r = r.filter((x) => x.category === activeCategory);
    if (priority !== "All") r = r.filter((x) => (x.priority || "Medium") === priority);
    if (status === "Unanswered") r = r.filter((x) => !x.answers?.length);
    if (status === "Answered")   r = r.filter((x) => x.answers?.length > 0);

    if (search.trim()) {
      const q = search.trim();
      const fuse = new Fuse(r, {
        keys: ['question', 'category'],
        includeMatches: true,
        threshold: 0.4,
        ignoreLocation: true,
      });
      r = fuse.search(q).map(res => ({
        ...res.item,
        matches: res.matches
      }));
    }
    r.sort((a, b) =>
      sortBy === "oldest"
        ? new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        : new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
    return r;
  }, [questions, search, activeCategory, priority, status, sortBy]);

  const myQuestions = filtered.filter((q) => {
    const cId = q.contributorId?._id || q.contributorId;
    return cId === user?._id;
  });
  const othersReopened = filtered.filter((q) => {
    const cId = q.contributorId?._id || q.contributorId;
    return cId !== user?._id && q.status === "reopened";
  });
  const othersOpen = filtered.filter((q) => {
    const cId = q.contributorId?._id || q.contributorId;
    return cId !== user?._id && q.status === "open";
  });
  return (
    <div style={{ background: "#F5F7F2" }}>
      <div className="container-xl py-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="page-title">Community Queue</h1>
            <p className="page-subtitle">Browse and help answer open questions from fellow students.</p>
          </div>
          {user?.role !== "admin" && (
            <Link to="/ask" className="btn-primary self-start">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ask a Question
            </Link>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full min-w-0">
              <div className="search-wrap w-full sm:max-w-xs shrink-0">
                <svg className="search-icon w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  className="search-input w-full text-sm pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by question title, keyword…"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none w-full sm:w-auto" ref={filterRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!filterOpen) {
                        setPendingCategory(activeCategory);
                        setPendingPriority(priority);
                        setPendingStatus(status);
                      }
                      setFilterOpen(!filterOpen);
                    }}
                    className="btn-secondary gap-2 flex items-center justify-center min-h-[44px] w-full sm:w-auto px-4"
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
                    <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl border shadow-xl z-50 p-4 animate-scale-in" style={{ borderColor: "#E2E8DE" }}>
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
                              ['All Categories', ...categories].map((cat) => {
                                const catName = typeof cat === 'string' ? cat : cat.name;
                                return (
                                  <button key={catName}
                                    onClick={() => setPendingCategory(catName)}
                                    className="w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors"
                                    style={pendingCategory === catName
                                      ? { background: "#dde8db", color: "#3a4f38", fontWeight: 600 }
                                      : { color: "#6B7280" }}>
                                    {catName}
                                  </button>
                                );
                              })
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

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveCategory(pendingCategory);
                          setPriority(pendingPriority);
                          setStatus(pendingStatus);
                          setFilterOpen(false);
                        }}
                        className="btn-primary w-full mt-4 text-sm justify-center"
                      >
                        Apply Filters
                      </button>
                    </div>
                  )}
                </div>

                <select className="input text-sm py-2 cursor-pointer shrink-0 min-h-[44px] flex-1 sm:flex-none"
                  style={{ width: "auto", minWidth: "140px" }}
                  value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
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

          {!isLoading && myQuestions.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold" style={{ color: "#6B7280" }}>Your Questions</h2>
                <span className="badge badge-brand">{myQuestions.length}</span>
              </div>
              <div className="space-y-2">
                {myQuestions.map((q) => (
                  <QuestionRow 
                    key={q._id} 
                    question={q} 
                    isBookmarked={bookmarkedQuestions.some((bq) => bq._id === q._id)}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ))}
              </div>
            </div>
          )}

          {!isLoading && othersReopened.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold" style={{ color: "#6B7280" }}>Reopened</h2>
                <span className="badge badge-orange">{othersReopened.length}</span>
              </div>
              <div className="space-y-2">
                {othersReopened.map((q) => (
                  <QuestionRow 
                    key={q._id} 
                    question={q} 
                    isBookmarked={bookmarkedQuestions.some((bq) => bq._id === q._id)}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ))}
              </div>
            </div>
          )}

          {!isLoading && othersOpen.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold" style={{ color: "#6B7280" }}>Open Questions</h2>
                <span className="badge badge-brand">{othersOpen.length}</span>
              </div>
              <div className="space-y-2">
                {othersOpen.map((q) => (
                  <QuestionRow 
                    key={q._id} 
                    question={q} 
                    isBookmarked={bookmarkedQuestions.some((bq) => bq._id === q._id)}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
