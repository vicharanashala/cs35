import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { faqApi, bookmarkApi } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-hot-toast";

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch (err) {
    console.error("Invalid date string:", dateStr, err);
    return "";
  }
}

export default function FaqPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: faq, isLoading, isError } = useQuery({
    queryKey: ["faq", id],
    queryFn: () => faqApi.getById(id),
    enabled: !!id,
  });

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
      queryClient.invalidateQueries({ queryKey: ["user-profile-bookmarks", user._id] });
      toast.success(isBookmarked ? "Bookmark removed" : "FAQ bookmarked!");
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
      toast.error("Failed to update bookmark");
    }
  };

  useEffect(() => {
    if (id) {
      faqApi.incrementView(id).catch(() => {});
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-white">
      <div className="container-md py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {isLoading && (
          <div className="space-y-4">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-6 w-3/4" />
            <div className="skeleton h-3 w-40" />
            <div className="mt-8 skeleton h-40 w-full" />
          </div>
        )}

        {isError && (
          <div className="text-center py-16 border border-gray-100 rounded-xl">
            <p className="text-gray-500 text-sm">Failed to load this FAQ.</p>
          </div>
        )}

        {!isLoading && !isError && !faq && (
          <div className="text-center py-16 border border-gray-100 rounded-xl">
            <p className="text-gray-500 text-sm">FAQ not found.</p>
          </div>
        )}

        {!isLoading && !isError && faq && (
          <article className="relative">
            {user && (
              <button
                onClick={handleToggleBookmark}
                title={isBookmarked ? "Remove Bookmark" : "Bookmark FAQ"}
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
            <div className="flex flex-wrap items-center gap-2 mb-4 pr-12">
              <span className="tag bg-gray-100 text-gray-600 text-xs">
                {faq.category}
              </span>
              {faq.isAnswered && (
                <span className="badge badge-green">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Answered
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-2 pr-12">
              {faq.question}
            </h1>
            <p className="text-xs text-gray-400 mb-8">
              {faq.createdAt ? `Added ${formatDate(faq.createdAt)}` : ""}
              {faq.views > 0 ? ` · ${faq.views} views` : ""}
            </p>

            <div className="divider mb-8" />

            {faq.answer ? (
              <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Answer
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {faq.answer}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No answer available yet.</p>
            )}

            {faq.tags && faq.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
                {faq.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-500"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  );
}
