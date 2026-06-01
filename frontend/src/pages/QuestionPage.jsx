import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { questionApi, faqApi, answerApi } from "../services/api";
import { socket } from "../services/socket";
import { useAuth } from "../hooks/useAuth";
import { useReputation } from "../hooks/useReputation";
import { useAchievements } from "../hooks/useAchievements";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

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
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all`}
      style={active ? { background: "#5E7A5A", color: "#fff" } : { background: "#F5F7F2", color: "#6B7280" }}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d={direction === "up" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
      </svg>
      {direction === "up" ? (count || "") : (Math.abs(count) || "")}
    </button>
  );
}

function AnswerCard({ answer, onVote, userVotes, onAccept, canAccept }) {
  const vote = userVotes[answer._id] || 0;
  const votes = (answer.upvotes || 0) + vote;

  return (
    <article id={`answer-${answer._id}`} className={`card p-5 ${answer.isAccepted ? 'accepted-answer' : ''}`}>
      {answer.isAccepted && (
        <div className="flex items-center gap-1.5 mb-3">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="accepted-badge">Accepted Answer</span>
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
          {answer.isVerified && (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: "#ECFDF5", color: "#059669" }}>
              ✓ Verified
            </span>
          )}
          <span style={{ color: "#D1D5DB" }}>·</span>
          <time className="text-xs" style={{ color: "#9CA3AF" }}>{timeAgo(answer.createdAt)}</time>
        </div>

        <div className="flex items-center gap-2">
          {votes > 0 && (
            <span className="text-xs px-2 py-1 rounded" style={{ background: "#F0FDF4", color: "#15803D" }}>
              {votes} found helpful
            </span>
          )}
          <VoteBtn count={votes} active={vote > 0} onClick={() => onVote(answer._id, 1)} direction="up" />
          <VoteBtn count={Math.abs(votes)} active={vote < 0} onClick={() => onVote(answer._id, -1)} direction="down" />
          {canAccept && !answer.isAccepted && (
            <button
              onClick={() => onAccept(answer._id)}
              className="text-xs px-2 py-1 rounded border cursor-pointer"
              style={{ borderColor: "#E2E8DE", color: "#6B7280", background: "transparent" }}
              title="Mark as accepted answer"
            >
              ✓ Accept
            </button>
          )}
          {answer.isAccepted && (
            <span className="text-xs px-2 py-1 rounded" style={{ background: "#ECFDF5", color: "#059669" }}>
              ✓ Accepted
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function VerifiedHero({ answer, onVote, userVotes }) {
  const vote = userVotes[answer._id] || 0;
  const votes = (answer.upvotes || 0) + vote;

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
            {answer.contributorName?.charAt(0) || "?"}
          </div>
          <span className="font-semibold" style={{ color: "#065F46" }}>
            {answer.contributorName || "Admin"}
          </span>
          <span style={{ color: "#A7F3D0" }}>·</span>
          <time className="text-xs" style={{ color: "#6EE7B7" }}>{timeAgo(answer.createdAt)}</time>
          {votes > 0 && (
            <>
              <span style={{ color: "#A7F3D0" }}>·</span>
              <span className="text-xs font-medium" style={{ color: "#6EE7B7" }}>{votes} found this helpful</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <VoteBtn count={votes} active={vote > 0} onClick={() => onVote(answer._id, 1)} direction="up" />
          <VoteBtn count={Math.abs(votes)} active={vote < 0} onClick={() => onVote(answer._id, -1)} direction="down" />
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
  const { can: canAcceptAnswer } = useReputation();
  const { toasts, checkAchievements, dismissToast } = useAchievements();
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

  // Accept answer handler
  const handleAcceptAnswer = useCallback(
    async (answerId) => {
      if (!canAcceptAnswer("verifiedAnswer")) return;
      try {
        await answerApi.accept(answerId, true, id);
        queryClient.invalidateQueries({ queryKey: ["question", id] });
        checkAchievements();
      } catch (err) {
        console.error("Failed to accept answer:", err);
      }
    },
    [id, canAcceptAnswer, queryClient, checkAchievements]
  );

  const [localAnswers, setLocalAnswers] = useState([]);
  const [userVotes, setUserVotes]       = useState({});
  const [sortBy, setSortBy]             = useState("verified");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerContent, setAnswerContent] = useState("");
  const [answerName, setAnswerName] = useState(user?.name || localStorage.getItem("authUser") ? JSON.parse(localStorage.getItem("authUser") || "{}").name || "Anonymous" : "Anonymous");
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
  }, [question]);

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
      setVoteError("");
    } catch (err) {
      console.error("Failed to vote:", err);
      setVoteError("Vote could not be recorded — backend unavailable.");
      setTimeout(() => setVoteError(""), 4000);
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
      isAccepted: false,
      createdAt: new Date().toISOString(),
      upvotes: 0,
    };

    try {
      await questionApi.addAnswer(id, { contributorName: answerName, content: answerContent, contributorId: user?._id });
      setLocalAnswers((prev) => [newAnswer, ...prev]);
      setAnswerContent("");
      setSubmitSuccess(true); setTimeout(() => { setSubmitSuccess(false); navigate("/queue"); }, 2000);
      queryClient.invalidateQueries({ queryKey: ["question", id] });
      queryClient.invalidateQueries({ queryKey: ["questions-open"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["users-leaderboard"] });
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Thread */}
            <div className="lg:col-span-2 space-y-8 min-w-0">

              {/* Question */}
              <article>
                <h1 className="text-2xl font-bold leading-snug mb-3" style={{ color: "#1F2937" }}>
                  {question.question}
                </h1>
                {question.details && (
                  <div className="text-sm mb-4 leading-relaxed quill-content" style={{ color: "#4B5563" }} dangerouslySetInnerHTML={{ __html: question.details }} />
                )}
                {question.screenshotUrl && (
                  <img
                    src={question.screenshotUrl}
                    alt="Question screenshot"
                    className="rounded-lg max-h-64 object-contain mb-4 border"
                    style={{ borderColor: "#E2E8DE" }}
                  />
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-sm" style={{ color: "#6B7280" }}>
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
                  <VerifiedHero answer={verifiedAnswer} onVote={handleVote} userVotes={userVotes} />
                )}

                {/* Community Answers */}
                <div className="space-y-4 mb-10">
                  {sorted.map((a) => (
                    <AnswerCard
                      key={a._id}
                      answer={a}
                      onVote={handleVote}
                      userVotes={userVotes}
                      onAccept={handleAcceptAnswer}
                      canAccept={canAcceptAnswer("verifiedAnswer") && user?._id === question?.contributorId}
                    />
                  ))}

                  {sorted.length === 0 && !verifiedAnswer && (
                    <div className="card p-10 text-center">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#F5F7F2" }}>
                        <svg className="w-7 h-7" style={{ color: "#9CA3AF" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-base font-semibold mb-2" style={{ color: "#1F2937" }}>No answers yet</h3>
                      <p className="text-sm mb-5" style={{ color: "#9CA3AF" }}>Be the first to help your fellow student!</p>
                      <a href="#answer-form" className="btn-primary">Write an Answer →</a>
                    </div>
                  )}

                  {sorted.length === 0 && verifiedAnswer && (
                    <div className="card p-8 text-center">
                      <p className="text-sm" style={{ color: "#9CA3AF" }}>Community answers appear here — be the first to contribute!</p>
                    </div>
                  )}
                </div>

                {/* Reply Form — hidden if user is the question owner */}
                {user?._id !== question?.contributorId && (
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
                      <input
                        className="input"
                        placeholder="Your Name (e.g. Mentor Arjun)"
                        value={answerName}
                        onChange={(e) => setAnswerName(e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
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
                      <ReactQuill 
                        theme="snow" 
                        value={answerContent} 
                        onChange={setAnswerContent} 
                        placeholder="Write your answer..."
                        className="bg-white rounded-lg overflow-hidden" 
                      />
                      <div className="flex justify-end mt-1">
                        <span className="text-xs" style={{ color: answerContent.length > 1800 ? "#DC2626" : "#9CA3AF" }}>
                          {answerContent.length}/2000
                        </span>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting || !answerName.trim() || !answerContent.trim() || answerContent.length > 2000}
                      className="btn-primary w-full sm:w-auto"
                    >
                      {isSubmitting ? "Posting..." : "Post Answer"}
                    </button>
                  </form>
                </div>
                )}
                {user?._id === question?.contributorId && (
                  <div className="card p-5 text-center text-sm" style={{ color: "#9CA3AF" }}>
                    You cannot answer your own question.
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Question Info — ordered first on mobile via order */}
              <div className="card p-5 order-1 lg:order-2">
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
                  <div className="flex justify-between">
                    <span style={{ color: "#6B7280" }}>Answers</span>
                    <span className="font-medium" style={{ color: "#1F2937" }}>{(question.answers?.length || 0) + localAnswers.length}</span>
                  </div>
                </div>
              </div>

              {/* Related Questions */}
              {relatedFiltered.length > 0 && (
                <div className="card p-5 order-2 lg:order-1">
                  <h3 className="text-sm font-semibold mb-4" style={{ color: "#1F2937" }}>Related FAQs</h3>
                  <div className="space-y-3">
                    {relatedFiltered.map((fq) => (
                      <Link key={fq._id} to={`/faq/${fq._id}`} className="block group">
                        <p className="text-sm font-medium line-clamp-2 group-hover:underline" style={{ color: "#1F2937" }}>
                          {fq.question}
                        </p>
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>{fq.category}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
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
