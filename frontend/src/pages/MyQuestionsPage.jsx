import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { questionApi } from "../services/api";
import { useAuth } from "../hooks/useAuth";

function timeAgo(d) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusBadge({ status }) {
  const map = {
    open: { label: "Open", className: "badge badge-orange" },
    answered: { label: "Answered", className: "badge badge-blue" },
    verified: { label: "Verified", className: "badge badge-green" },
    reopened: { label: "Reopened", className: "badge badge-orange" },
    closed: { label: "Closed", className: "badge badge-gray" },
  };
  const b = map[status] || map.open;
  return <span className={b.className}>{b.label}</span>;
}

function QuestionRow({ question, onDelete }) {
  return (
    <div className="card-hover overflow-hidden animate-fade-in">
      <div className="p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
          style={{ background: "#5E7A5A" }}>
          {question.contributorName?.charAt(0)?.toUpperCase() || "S"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="tag tag-brand">{question.category}</span>
            <StatusBadge status={question.status} />
            {question.isReopened && <span className="badge badge-orange">Reopened</span>}
          </div>
          <p className="text-sm font-medium leading-snug mb-1" style={{ color: "#1F2937" }}>
            {question.question}
          </p>
          {question.details && (
            <p className="text-xs mb-2 line-clamp-2" style={{ color: "#6B7280" }}>
              {question.details}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs" style={{ color: "#9CA3AF" }}>
            <span>{timeAgo(question.createdAt)}</span>
            <span>·</span>
            <span>{question.answers?.length ?? 0} answer{question.answers?.length !== 1 ? "s" : ""}</span>
            {question.views > 0 && <><span>·</span><span>{question.views} views</span></>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/question/${question._id}`}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            style={{ background: "#f0f4ef", color: "#5E7A5A" }}
          >
            View
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(question._id)}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              style={{ background: "#fef2f2", color: "#dc2626" }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full skeleton" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key: "open", label: "Open" },
  { key: "answered", label: "Answered" },
  { key: "verified", label: "Verified" },
  { key: "closed", label: "Closed" },
];

export default function MyQuestionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("open");
  const [search, setSearch] = useState("");

  const { data: allQuestions = [], isLoading } = useQuery({
    queryKey: ["my-questions", user?.name],
    queryFn: () => questionApi.list({ contributorId: user?._id }),
    enabled: !!user?.name,
    staleTime: 1000 * 30,
  });

  const filtered = useMemo(() => {
    let list = [...allQuestions];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((qs) =>
        qs.question?.toLowerCase().includes(q) ||
        qs.category?.toLowerCase().includes(q)
      );
    }
    if (activeTab === "verified") {
      return list.filter((qs) => qs.status === "answered" && qs.answers?.some((a) => a.isVerified));
    }
    if (activeTab === "closed") {
      return list.filter((qs) => qs.status === "closed");
    }
    return list.filter((qs) => qs.status === activeTab);
  }, [allQuestions, activeTab, search]);

  const tabCounts = useMemo(() => {
    const counts = { open: 0, answered: 0, verified: 0, closed: 0 };
    allQuestions.forEach((qs) => {
      if (qs.status === "closed") counts.closed++;
      else if (qs.status === "answered" && qs.answers?.some((a) => a.isVerified)) counts.verified++;
      else if (qs.status === "answered") counts.answered++;
      else if (qs.status === "open" || qs.status === "reopened") counts.open++;
    });
    return counts;
  }, [allQuestions]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this question? This cannot be undone.")) return;
    try {
      await questionApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ["my-questions"] });
    } catch (err) {
      console.error("Failed to delete question:", err);
    }
  };

  return (
    <div style={{ background: "#F5F7F2", minHeight: "100vh" }}>
      <div className="container-md py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1F2937" }}>My Questions</h1>
            <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
              {allQuestions.length} question{allQuestions.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/ask" className="btn-primary text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ask New
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="card p-4 mb-6">
          <input
            type="text"
            className="input w-full"
            placeholder="Search your questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all"
              style={
                activeTab === key
                  ? { background: "#5E7A5A", color: "#fff" }
                  : { background: "#fff", color: "#6B7280", border: "1px solid #E2E8DE" }
              }
            >
              {label}
              <span
                className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full"
                style={
                  activeTab === key
                    ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
                    : { background: "#F5F7F2", color: "#9CA3AF" }
                }
              >
                {tabCounts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {isLoading && [...Array(4)].map((_, i) => <SkeletonRow key={i} />)}

          {!isLoading && filtered.length === 0 && (
            <div className="card p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: "#f8f0e0" }}>
                <svg className="w-6 h-6" style={{ color: "#8B6914" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-lg mb-1" style={{ color: "#1F2937" }}>No {activeTab} questions</p>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                {activeTab === "open"
                  ? "You haven't asked any open questions yet."
                  : `You have no ${activeTab} questions.`}
              </p>
              {activeTab === "open" && (
                <Link to="/ask" className="btn-primary">Ask a Question</Link>
              )}
            </div>
          )}

          {!isLoading && filtered.map((qs) => (
            <QuestionRow key={qs._id} question={qs} onDelete={handleDelete} />
          ))}
        </div>
      </div>
    </div>
  );
}
