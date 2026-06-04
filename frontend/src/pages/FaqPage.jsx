import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { faqApi } from "../services/api";

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
  } catch {
    return "";
  }
}

export default function FaqPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: faq, isLoading, isError } = useQuery({
    queryKey: ["faq", id],
    queryFn: () => faqApi.getById(id),
    enabled: !!id,
  });

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
          <article>
            <div className="flex flex-wrap items-center gap-2 mb-4">
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

            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-2">
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