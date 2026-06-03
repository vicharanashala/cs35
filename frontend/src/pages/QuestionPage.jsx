import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { questionApi, faqApi, answerApi, bookmarkApi } from "../services/api";
import { socket } from "../services/socket";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import { useAchievements } from "../hooks/useAchievements";


// Removed broken getContributorId

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
  return (
    <div className="quill-content text-sm leading-relaxed space-y-3" style={{ color: "#374151" }} dangerouslySetInnerHTML={{ __html: content }} />
  );
}

function VoteBtn({ count, active, onClick, direction }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer`}
      style={active ? { background: "#5E7A5A", color: "#fff" } : { background: "#F5F7F2", color: "#6B7280" }}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {direction === "up" ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.514" />
        )}
      </svg>
      {direction === "up" ? (count || "") : (Math.abs(count) || "")}
    </button>
  );
}

function AnswerCard({ answer, onVote, userVotes, currentUser }) {
  const vote = userVotes[answer._id] || 0;
  // Use real DB upvotes as base — don't add local offset so all users see same count
  const upvotes = answer.upvotes || 0;
  const downvotes = answer.downvotes || 0;

  const isOwnAnswer = currentUser?._id && answer?.contributorId && currentUser._id === (answer.contributorId._id || answer.contributorId);
  const displayName = isOwnAnswer ? "You" : (answer.contributorName || "Student");

  return (
    <article id={`answer-${answer._id}`} className={`card p-5`}>
      <AnswerContent content={answer.content} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5 pt-4 border-t" style={{ borderColor: "#E2E8DE" }}>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: answer.isVerified ? "#5E7A5A" : "#D8C7A1" }}>
            {displayName.charAt(0)}
          </div>
          <span className="font-medium" style={{ color: "#1F2937" }}>
            {displayName}
          </span>
          {answer.isVerified && (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: "#ECFDF5", color: "#059669" }}>
              ✓ Verified
            </span>
          )}
          <span style={{ color: "#D1D5DB" }}>·</span>
          <time className="text-xs" style={{ color: "#9CA3AF" }}>{timeAgo(answer.createdAt)}</time>
        </div>

        <div className="flex items-center gap-2">
          {upvotes > 0 && (
            <span className="text-xs px-2 py-1 rounded" style={{ background: "#F0FDF4", color: "#15803D" }}>
              {upvotes} found helpful
            </span>
          )}
          <VoteBtn count={upvotes} active={vote > 0} onClick={() => onVote(answer._id, 1)} direction="up" />
          <VoteBtn count={downvotes} active={vote < 0} onClick={() => onVote(answer._id, -1)} direction="down" />
        </div>
      </div>
    </article>
  );
}

function VerifiedHero({ answer, onVote, userVotes, currentUser }) {
  const vote = userVotes[answer._id] || 0;
  const upvotes = answer.upvotes || 0;
  const downvotes = answer.downvotes || 0;

  const isOwnAnswer = currentUser?._id && answer?.contributorId && currentUser._id === (answer.contributorId._id || answer.contributorId);
  const displayName = isOwnAnswer ? "You" : (answer.contributorName || "Admin");

  return (
    <div id={`answer-${answer._id}`} className="rounded-xl border-2 p-6 mb-6 animate-fade-in" style={{ background: "#F0FDF4", borderColor: "#6EE7B7" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#059669" }}>
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold" style={{ color: "#065F46" }}>Official Verified Answer</h3>
          <p className="text-xs" style={{ color: "#6EE7B7" }}>Curated and approved by the admin team</p>
        </div>
      </div>

      <AnswerContent content={answer.content} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5 pt-4 border-t" style={{ borderColor: "#A7F3D0" }}>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "#059669" }}>
            {displayName.charAt(0)}
          </div>
          <span className="font-semibold" style={{ color: "#065F46" }}>
            {displayName}
          </span>
          <span style={{ color: "#A7F3D0" }}>·</span>
          <time className="text-xs" style={{ color: "#6EE7B7" }}>{timeAgo(answer.createdAt)}</time>
          {upvotes > 0 && (
            <>
              <span style={{ color: "#A7F3D0" }}>·</span>
              <span className="text-xs font-medium" style={{ color: "#6EE7B7" }}>{upvotes} found this helpful</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <VoteBtn count={upvotes} active={vote > 0} onClick={() => onVote(answer._id, 1)} direction="up" />
          <VoteBtn count={downvotes} active={vote < 0} onClick={() => onVote(answer._id, -1)} direction="down" />
        </div>
      </div>
    </div>
  );
}



export default function QuestionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toasts, checkAchievements, dismissToast } = useAchievements();

  const { data: bookmarkedQuestions = [], refetch: refetchBookmarks } = useQuery({
    queryKey: ["bookmarked-questions", user?._id],
    queryFn: () => bookmarkApi.list(user?._id),
    enabled: !!user?._id,
  });

  const isBookmarked = useMemo(() => {
    return bookmarkedQuestions.some((bq) => bq._id === id);
  }, [bookmarkedQuestions, id]);

  const handleToggleBookmark = async () => {
    if (!user?._id) return;
    try {
      await bookmarkApi.toggle(user._id, id);
      refetchBookmarks();
      queryClient.invalidateQueries({ queryKey: ["bookmarked-questions", user._id] });
      queryClient.invalidateQueries({ queryKey: ["my-questions", user._id] });
      toast.success(isBookmarked ? "Bookmark removed" : "Question bookmarked!");
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
      toast.error("Failed to update bookmark");
    }
  };

  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  const handleUpdate = useCallback((data) => {
    if (data?.questionId === id || data?.id === id || data?.questionId === undefined) {
      queryClient.invalidateQueries({ queryKey: ["question", id] });
    }
  }, [id, queryClient]);

  // Listen for FAQ conversion so the page knows if the question was converted
  useEffect(() => {
    if (!socket?.connected) return;
    const handleFaqCreated = (data) => {
      if (data?.questionId === id) {
        // Question was converted to FAQ — refresh to show updated status
        queryClient.invalidateQueries({ queryKey: ["question", id] });
      }
    };
    socket.on("faqCreated", handleFaqCreated);
    return () => { socket.off("faqCreated", handleFaqCreated); };
  }, [id, queryClient]);

  useEffect(() => {
    if (!socket?.connected) return;
    socket.on("answerAdded", handleUpdate);
    socket.on("statusUpdated", handleUpdate);
    socket.on("voteUpdated", handleUpdate);
    socket.on("answerAccepted", handleUpdate);
    return () => {
      socket.off("answerAdded", handleUpdate);
      socket.off("statusUpdated", handleUpdate);
      socket.off("voteUpdated", handleUpdate);
      socket.off("answerAccepted", handleUpdate);
    };
  }, [handleUpdate]);

  // Accept answer handler removed

  const [localAnswers, setLocalAnswers] = useState([]);
  const [userVotes, setUserVotes]       = useState({});
  const [sortBy, setSortBy]             = useState("verified");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerContent, setAnswerContent] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [voteError, setVoteError] = useState("");

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAnswerContent((prev) => prev + (prev ? " " : "") + transcript);
    };
    recognition.onerror = (e) => {
      console.error("Speech error:", e);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const { data: question, isLoading, isError } = useQuery({
    queryKey: ["question", id],
    queryFn: () => questionApi.getById(id),
    enabled: !!id,
    refetchInterval: 15000,
  });

  const { data: relatedQuestions = [] } = useQuery({
    queryKey: ["faqs-related", question?.category],
    queryFn: () => faqApi.list({ category: question?.category }).then((r) => r.data || r),
    enabled: !!question?.category,
    staleTime: 1000 * 60 * 5,
  });

  const verifiedAnswer = useMemo(() => {
    if (!question?.answers) return null;
    return question.answers.find((a) => a.isVerified) || null;
  }, [question?.answers]);

  const communityAnswers = useMemo(() => {
    const all = [...(question?.answers || []), ...localAnswers];
    if (verifiedAnswer) {
      return all.filter((a) => a._id !== verifiedAnswer._id);
    }
    return all;
  }, [question?.answers, localAnswers, verifiedAnswer]);

  const sorted = useMemo(() => {
    const list = [...communityAnswers];
    if (sortBy === "verified") {
      list.sort((a, b) => (b.isVerified ? 1 : 0) - (a.isVerified ? 1 : 0));
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else {
      list.sort((a, b) => ((b.upvotes || 0) + (userVotes[b._id] || 0)) - ((a.upvotes || 0) + (userVotes[a._id] || 0)));
    }
    return list;
  }, [communityAnswers, sortBy, userVotes]);

  // Deep linking scroll
  useEffect(() => {
    if (!isLoading && question && window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.substring(1);
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-brand-500", "ring-offset-2");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-brand-500", "ring-offset-2");
          }, 3000);
        }
      }, 300); // small delay to ensure DOM paint
    }
  }, [isLoading, question]);

  const handleVote = async (answerId, dir) => {
    const cur = userVotes[answerId] || 0;
    const newDir = cur === dir ? 0 : dir;
    // Optimistically mark button as active
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
      // Refetch so the real DB count (from all users) is shown
      queryClient.invalidateQueries({ queryKey: ["question", id] });
      setVoteError("");
    } catch (err) {
      console.error("Failed to vote:", err);
      setVoteError("Vote could not be recorded — backend unavailable.");
      setTimeout(() => setVoteError(""), 4000);
    }
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    if (!answerContent.trim()) return;
    setIsSubmitting(true);
    setSubmitError("");

    const currentUserName = user?.name || user?.username || "Student";
    const newAnswer = {
      _id: `local-${Date.now()}`,
      content: answerContent,
      contributorName: currentUserName,
      contributorId: user?._id,
      isVerified: false,
      isAccepted: false,
      createdAt: new Date().toISOString(),
      upvotes: 0,
    };

    try {
      await questionApi.addAnswer(id, { contributorName: currentUserName, content: answerContent, contributorId: user?._id });
      setLocalAnswers((prev) => [newAnswer, ...prev]);
      setAnswerContent("");
      setSubmitSuccess(true); setTimeout(() => { setSubmitSuccess(false); navigate("/queue"); }, 2000);
      queryClient.invalidateQueries({ queryKey: ["question", id] });
      queryClient.invalidateQueries({ queryKey: ["questions-open"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      checkAchievements({ bookmarkCount: 0 });
    } catch (err) {
      console.error("Failed to post answer:", err);
      setSubmitError("Failed to post answer. Please try again.");
    }
    setIsSubmitting(false);
  };

  const relatedFiltered = useMemo(() => {
    return relatedQuestions.filter((fq) => fq.question !== question?.question).slice(0, 4);
  }, [relatedQuestions, question?.question]);

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
          <div className="max-w-3xl mx-auto">

            {/* Main Thread */}
            <div className="space-y-8 min-w-0">

              {/* Question */}
              <article className="relative">
                {user && (
                  <button
                    onClick={handleToggleBookmark}
                    title={isBookmarked ? "Remove Bookmark" : "Bookmark Question"}
                    className="absolute top-0 right-0 p-2 rounded-full border transition-all cursor-pointer shadow-sm hover:scale-110 flex items-center justify-center bookmark-btn-top"
                    style={
                      isBookmarked
                        ? { background: "#F0FDF4", color: "#059669", borderColor: "#6EE7B7" }
                        : { background: "#ffffff", color: "#9CA3AF", borderColor: "#E2E8DE" }
                    }
                  >
                    <svg className="w-5.5 h-5.5" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                )}
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
                    style={{ background: "#EEF4EA", color: "#5E7A5A" }}>
                    {question.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#5E7A5A" }}>
                      {(user?._id && question?.contributorId && user._id === (question.contributorId._id || question.contributorId) ? "You" : (question.contributorName || "Student")).charAt(0)}
                    </div>
                    <span className="text-sm font-medium" style={{ color: "#374151" }}>
                      Asked by <span style={{ color: "#5E7A5A" }}>{user?._id && question?.contributorId && user._id === (question.contributorId._id || question.contributorId) ? "You" : (question.contributorName || "Student")}</span>
                    </span>
                    <span style={{ color: "#D1D5DB" }}>·</span>
                    <time className="text-sm" style={{ color: "#9CA3AF" }}>{timeAgo(question.createdAt)}</time>
                    <span style={{ color: "#D1D5DB" }}>·</span>
                    <span className="text-sm" style={{ color: "#9CA3AF" }}>{question.views || 0} views</span>
                  </div>
                </div>
                <h1 className="text-2xl font-bold leading-snug mb-3 pr-12" style={{ color: "#1F2937" }}>
                  {question.question}
                </h1>
                {question.details && (
                  <div className="text-sm mb-4 leading-relaxed quill-content pr-12" style={{ color: "#4B5563" }} dangerouslySetInnerHTML={{ __html: question.details }} />
                )}
                {question.screenshotUrl && (
                  <img
                    src={question.screenshotUrl}
                    alt="Question screenshot"
                    className="rounded-lg max-h-64 object-contain mb-4 border"
                    style={{ borderColor: "#E2E8DE" }}
                  />
                )}

                {question.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {question.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-1 rounded-md" style={{ background: "#F3F4F6", color: "#6B7280" }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>

              <div className="divider" />

              {/* Answers */}
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold" style={{ color: "#1F2937" }}>
                    {sorted.length} Answer{sorted.length !== 1 ? "s" : ""}
                    {verifiedAnswer && <span className="ml-2 text-sm font-normal" style={{ color: "#6B7280" }}>+ 1 verified</span>}
                  </h2>
                  {sorted.length > 1 && (
                    <div className="flex items-center gap-2">
                      <label htmlFor="sort-answers" className="text-xs" style={{ color: "#6B7280" }}>Sort:</label>
                      <select
                        id="sort-answers"
                        className="input w-auto text-xs py-1.5 px-2"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="verified">Verified First</option>
                        <option value="newest">Newest First</option>
                        <option value="helpful">Most Helpful</option>
                      </select>
                    </div>
                  )}
                </div>

                {voteError && (
                  <div className="mb-3 p-2 rounded-md text-xs animate-fade-in" style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}>
                    {voteError}
                  </div>
                )}

                {/* Verified Hero Answer */}
                {verifiedAnswer && (
                  <VerifiedHero answer={verifiedAnswer} onVote={handleVote} userVotes={userVotes} currentUser={user} />
                )}

                {/* Community Answers */}
                <div className="space-y-4 mb-10">
                  {sorted.map((a) => (
                    <AnswerCard
                      key={a._id}
                      answer={a}
                      onVote={handleVote}
                      userVotes={userVotes}
                      currentUser={user}
                    />
                  ))}

                  {sorted.length === 0 && !verifiedAnswer && (
                    <div className="card p-6 text-center max-w-sm mx-auto shadow-sm">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: "#F5F7F2" }}>
                        <svg className="w-5 h-5" style={{ color: "#9CA3AF" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-semibold mb-1" style={{ color: "#1F2937" }}>No answers yet</h3>
                      {user?._id && question?.contributorId && user?._id === (question?.contributorId?._id || question?.contributorId) ? (
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>Community members will answer your question soon!</p>
                      ) : (
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>Be the first to help your fellow student!</p>
                      )}
                    </div>
                  )}

                  {sorted.length === 0 && verifiedAnswer && (
                    <div className="card p-6 text-center max-w-sm mx-auto shadow-sm">
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>Community answers appear here — be the first to contribute!</p>
                    </div>
                  )}
                </div>

                {/* Reply Form — hidden if user is the question owner */}
                {!(user?._id && question?.contributorId && user?._id === (question?.contributorId?._id || question?.contributorId)) && (
                <div id="answer-form" className="card p-5">
                  <h3 className="text-sm font-semibold mb-4" style={{ color: "#1F2937" }}>Add your Answer</h3>
                  {submitError && (
                    <div className="mb-4 p-3 rounded-md text-sm" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                      {submitError}
                    </div>
                  )}
                  {submitSuccess && (
                    <div className="mb-4 p-3 rounded-md text-sm animate-fade-in" style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                      Your answer has been posted!
                    </div>
                  )}
                  <form onSubmit={submitAnswer} className="space-y-4">
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          {/* Speech to Text */}
                          <button type="button" onClick={toggleListen} title="Dictate (Speech to Text)"
                            className="w-8 h-8 rounded transition-colors flex items-center justify-center relative border"
                            style={{ color: isListening ? "#fff" : "#374151", background: isListening ? "#ef4444" : "transparent", borderColor: "#E2E8DE" }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                              <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                            </svg>
                            {isListening && (
                              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                              </span>
                            )}
                          </button>
                          <span className="text-xs" style={{ color: "#6B7280" }}>Click to dictate</span>
                        </div>
                      </div>
                      <textarea
                        ref={textareaRef}
                        className="input min-h-[150px] w-full font-mono text-sm p-3 border rounded-lg bg-white"
                        placeholder="Write your answer..."
                        value={answerContent}
                        onChange={(e) => setAnswerContent(e.target.value)}
                        style={{ color: "#374151", borderColor: "#E2E8DE" }}
                      />
                      <div className="flex justify-end mt-1">
                        <span className="text-xs" style={{ color: answerContent.length > 1800 ? "#DC2626" : "#9CA3AF" }}>
                          {answerContent.length}/2000
                        </span>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting || !answerContent.trim() || answerContent.length > 2000}
                      className="btn-primary w-full sm:w-auto"
                    >
                      {isSubmitting ? "Posting..." : "Post Answer"}
                    </button>
                  </form>
                </div>
                )}
                {user?._id && question?.contributorId && user?._id === question?.contributorId && (
                  <div className="card p-5 text-center text-sm" style={{ color: "#9CA3AF" }}>
                    You cannot answer your own question.
                  </div>
                )}
              </section>
            </div>


          </div>
        )}
      </div>

      {/* Achievement Toast Layer */}
      {toasts.map((achievement) => (
        <div
          key={achievement.id}
          className="achievement-toast"
          onClick={() => dismissToast(achievement.id)}
        >
          <span className="achievement-icon">{achievement.icon}</span>
          <div className="achievement-text">
            <span className="achievement-label">Achievement Unlocked!</span>
            <span>{achievement.label}</span>
          </div>
          <button
            onClick={() => dismissToast(achievement.id)}
            className="ml-2 text-white opacity-60 hover:opacity-100 cursor-pointer"
            style={{ background: "none", border: "none", fontSize: "1rem", lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      ))}

      {/* Floating Answer Button — desktop only */}
      {!isLoading && !isError && question && (
        <div className="hidden lg:block fixed bottom-6 right-6 z-40">
          <button
            onClick={() => document.getElementById('answer-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 cursor-pointer"
            style={{ background: "#5E7A5A" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Answer this Question
          </button>
        </div>
      )}
    </div>
  );
}
