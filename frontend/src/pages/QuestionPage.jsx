import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { questionApi } from "../services/api";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AnswerContent({ content }) {
  const parts = content.split("\n\n");
  return (
    <div className="space-y-3">
      {parts.map((para, i) => {
        if (/^\d+\./.test(para.trim())) {
          const lines = para.split("\n").filter((l) => /^\d+\./.test(l.trim()));
          return (
            <ol key={i} className="list-decimal list-inside space-y-1 text-sm leading-relaxed" style={{ color: "#374151" }}>
              {lines.map((line, j) => <li key={j}>{line.replace(/^\d+\.\s*/, "")}</li>)}
            </ol>
          );
        }
        return <p key={i} className="text-sm leading-relaxed" style={{ color: "#374151" }}>{para}</p>;
      })}
    </div>
  );
}

function VoteBtn({ count, active, onClick, direction }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
        active
          ? "bg-brand text-white shadow-sm"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
      style={active ? { background: "#5E7A5A", color: "#fff" } : { background: "#F5F7F2", color: "#6B7280" }}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d={direction === "up" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
      </svg>
      {count}
    </button>
  );
}

function AnswerCard({ answer, onVote, userVotes }) {
  const vote = userVotes[answer._id] || 0;
  const votes = (answer.upvotes || 0) + vote;

  return (
    <article className={`card p-5 ${answer.isVerified ? "verified-banner" : ""}`}>
      {answer.isVerified && (
        <div className="flex items-center gap-1.5 mb-4">
          <span className="badge badge-green">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified Official Answer
          </span>
        </div>
      )}

      <AnswerContent content={answer.content} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5 pt-4 border-t" style={{ borderColor: "#E2E8DE" }}>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: answer.isVerified ? "#5E7A5A" : "#D8C7A1" }}>
            {answer.contributorName?.charAt(0) || "?"}
          </div>
          <span className="font-medium" style={{ color: "#1F2937" }}>
            {answer.contributorName || "Student"}
          </span>
          <span style={{ color: "#D1D5DB" }}>·</span>
          <time className="text-xs" style={{ color: "#9CA3AF" }}>{timeAgo(answer.createdAt)}</time>
        </div>

        <div className="flex items-center gap-1.5">
          <VoteBtn count={votes} active={vote > 0} onClick={() => onVote(answer._id, 1)} direction="up" />
          <VoteBtn count={0} active={vote < 0} onClick={() => onVote(answer._id, -1)} direction="down" />
        </div>
      </div>
    </article>
  );
}

export default function QuestionPage() {
  const { id } = useParams();
  const [localAnswers, setLocalAnswers] = useState([]);
  const [userVotes, setUserVotes]       = useState({});
  const [sortBy, setSortBy]             = useState("verified");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerContent, setAnswerContent] = useState("");
  const [answerName, setAnswerName] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { data: question, isLoading, isError } = useQuery({
    queryKey: ["question", id],
    queryFn: () => questionApi.getById(id),
    enabled: !!id,
  });

  const sorted = useMemo(() => {
    const answers = [...(question?.answers || []), ...localAnswers];
    const list = [...answers];
    if (sortBy === "verified")
      list.sort((a, b) => (b.isVerified ? 1 : 0) - (a.isVerified ? 1 : 0));
    else if (sortBy === "newest")
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    else
      list.sort((a, b) => ((b.upvotes || 0) + (userVotes[b._id] || 0)) - ((a.upvotes || 0) + (userVotes[a._id] || 0)));
    return list;
  }, [question?.answers, localAnswers, sortBy, userVotes]);

  const handleVote = async (answerId, dir) => {
    const cur = userVotes[answerId] || 0;
    const newDir = cur === dir ? 0 : dir;
    setUserVotes((prev) => {
      if (newDir === 0) {
        const next = { ...prev };
        delete next[answerId];
        return next;
      }
      return { ...prev, [answerId]: newDir };
    });
    try {
      await questionApi.vote(id, answerId, newDir);
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    if (!answerContent.trim() || !answerName.trim()) return;
    setIsSubmitting(true);
    setSubmitError("");

    const newAnswer = {
      _id: `local-${Date.now()}`,
      content: answerContent,
      contributorName: answerName,
      isVerified: false,
      createdAt: new Date().toISOString(),
      upvotes: 0,
    };

    try {
      await questionApi.addAnswer(id, { contributorName: answerName, content: answerContent });
      setLocalAnswers((prev) => [newAnswer, ...prev]);
      setAnswerContent("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to post answer:", err);
      setSubmitError("Failed to post answer. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ background: "#F5F7F2", minHeight: "100vh" }}>
      <div className="container-md py-8">
        <Link to="/queue" className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors" style={{ color: "#6B7280" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to all questions
        </Link>

        {isLoading && (
          <div className="space-y-4">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-32 w-full mt-6" />
          </div>
        )}

        {isError && (
          <div className="card p-12 text-center">
            <p className="font-semibold text-lg" style={{ color: "#1F2937" }}>Question not found</p>
            <p className="text-sm mt-1 mb-6" style={{ color: "#9CA3AF" }}>It may have been removed.</p>
            <Link to="/queue" className="btn-secondary">Go to Queue</Link>
          </div>
        )}

        {!isLoading && !isError && question && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Thread */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Question */}
              <article>
                <h1 className="text-2xl font-bold leading-snug mb-3" style={{ color: "#1F2937" }}>
                  {question.question}
                </h1>
                {question.details && (
                  <p className="text-sm mb-4 leading-relaxed" style={{ color: "#4B5563" }}>
                    {question.details}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6 text-sm" style={{ color: "#6B7280" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#5E7A5A" }}>
                      {question.contributor?.charAt(0) || "S"}
                    </div>
                    <span>Asked by <span className="font-medium" style={{ color: "#1F2937" }}>{question.contributor || "Student"}</span></span>
                  </div>
                  <span style={{ color: "#D1D5DB" }}>·</span>
                  <span>{timeAgo(question.createdAt)}</span>
                  <span style={{ color: "#D1D5DB" }}>·</span>
                  <span>{question.views || 0} views</span>
                  <span className="tag tag-neutral">{question.category}</span>
                </div>
              </article>

              <div className="divider" />

              {/* Answers */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold" style={{ color: "#1F2937" }}>
                    {sorted.length} Answer{sorted.length !== 1 ? "s" : ""}
                  </h2>
                  {sorted.length > 1 && (
                    <select
                      className="input w-auto text-xs py-1.5 px-2"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="verified">Verified First</option>
                      <option value="newest">Newest First</option>
                      <option value="helpful">Most Helpful</option>
                    </select>
                  )}
                </div>

                <div className="space-y-4 mb-10">
                  {sorted.map((a) => <AnswerCard key={a._id} answer={a} onVote={handleVote} userVotes={userVotes} />)}
                  {sorted.length === 0 && (
                    <div className="card p-8 text-center text-sm" style={{ color: "#9CA3AF" }}>
                      No answers yet. Be the first to help!
                    </div>
                  )}
                </div>

                {/* Reply Form */}
                <div className="card p-5">
                  <h3 className="text-sm font-semibold mb-4" style={{ color: "#1F2937" }}>Add an Answer</h3>
                  {submitError && (
                    <div className="mb-4 p-3 rounded-md text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                      {submitError}
                    </div>
                  )}
                  {submitSuccess && (
                    <div className="mb-4 p-3 rounded-md text-sm animate-fade-in" style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                      Your answer has been posted!
                    </div>
                  )}
                  <form onSubmit={submitAnswer} className="space-y-4">
                    <div>
                      <input
                        className="input"
                        placeholder="Your Name (e.g. Mentor Arjun)"
                        value={answerName}
                        onChange={(e) => setAnswerName(e.target.value)}
                      />
                    </div>
                    <div>
                      <textarea
                        className="input resize-none"
                        rows={4}
                        placeholder="Write your answer..."
                        value={answerContent}
                        onChange={(e) => setAnswerContent(e.target.value)}
                      />
                    </div>
                    <button type="submit" disabled={isSubmitting || !answerName.trim() || !answerContent.trim()} className="btn-primary w-full sm:w-auto">
                      {isSubmitting ? "Posting..." : "Post Answer"}
                    </button>
                  </form>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="card p-5">
                <h3 className="text-sm font-semibold mb-4" style={{ color: "#1F2937" }}>Question Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: "#6B7280" }}>Category</span>
                    <span className="font-medium" style={{ color: "#1F2937" }}>{question.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#6B7280" }}>Priority</span>
                    <span className="font-medium" style={{ color: "#1F2937" }}>{question.priority || "Medium"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#6B7280" }}>Status</span>
                    <span className="badge badge-brand">{question.status === "open" ? "Unanswered" : question.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#6B7280" }}>Asked</span>
                    <span className="font-medium" style={{ color: "#1F2937" }}>{timeAgo(question.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
