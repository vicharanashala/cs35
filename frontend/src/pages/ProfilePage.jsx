import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from 'react-hot-toast';
import { Link } from "react-router-dom";
import { userApi, questionApi, bookmarkApi } from "../services/api";
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

export default function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: userApi.me,
    staleTime: 30000,
  });

  const profile = profileData?.user || profileData || null;

  const updateMut = useMutation({
    mutationFn: (data) => userApi.update(profile?._id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success("Settings updated");
    }
  });

  const handleToggle = (key) => {
    if (!profile) return;
    const currentPrefs = profile.notificationPreferences || { notifyOnAnswer: true, notifyOnVerification: true };
    const newPrefs = { ...currentPrefs, [key]: !currentPrefs[key] };
    updateMut.mutate({ notificationPreferences: newPrefs });
  };

  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['user-profile-questions-asked', profile?._id],
    queryFn: () => questionApi.list({ contributorId: profile?._id }),
    enabled: !!profile?._id,
  });

  const { data: answersData, isLoading: answersLoading } = useQuery({
    queryKey: ['user-profile-questions-answered', profile?._id],
    queryFn: () => questionApi.list({ answeredBy: profile?._id }),
    enabled: !!profile?._id,
  });

  const { data: bookmarksData, isLoading: bookmarksLoading } = useQuery({
    queryKey: ['user-profile-bookmarks', profile?._id],
    queryFn: () => bookmarkApi.list(profile?._id),
    enabled: !!profile?._id,
  });

  const questionsAsked = Array.isArray(questionsData) ? questionsData : [];
  const questionsAnswered = Array.isArray(answersData) ? answersData : [];
  const bookmarkedItems = useMemo(() => {
    return Array.isArray(bookmarksData) ? bookmarksData : (bookmarksData?.data || []);
  }, [bookmarksData]);

  const stats = [
    {
      label: "Questions Asked",
      value: questionsAsked.length ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "#3B82F6",
      bg: "#EFF6FF",
    },
    {
      label: "Answers Given",
      value: questionsAnswered.length ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      color: "#5E7A5A",
      bg: "#F5F7F2",
    },
    {
      label: "Verified Answers",
      value: profile?.verifiedCount ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "#059669",
      bg: "#ECFDF5",
    },
    {
      label: "Bookmarked FAQs",
      value: bookmarkedItems.length ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ),
      color: "#4F46E5",
      bg: "#EEF2FF",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#FAFAF5" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ── Sidebar ── */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-6">
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4"
                  style={{ background: "#5E7A5A" }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <h1 className="text-xl font-bold" style={{ color: "#1F2937" }}>
                  {user?.name || "Student"}
                </h1>
                <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
                  {profile?.username ? `@${profile.username}` : (profile?.email || "")}
                </p>
                <div className="mt-3 flex flex-col items-center gap-2">
                  <span
                    className="inline-block text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide"
                    style={{ background: "#EEF2FF", color: "#5E7A5A" }}
                  >
                    {profile?.role || user?.role}
                  </span>
                </div>

                {profile?.createdAt && (
                  <p className="mt-1 text-xs" style={{ color: "#9CA3AF" }}>
                    Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "#374151" }}>
                Quick Actions
              </h2>
              <div className="space-y-2">
                <Link
                  to="/ask"
                  className="btn-primary w-full justify-center py-2.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ask a Question
                </Link>
                <Link
                  to="/faqs"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all border"
                  style={{ borderColor: "#E5E7EB", color: "#374151" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Browse FAQs
                </Link>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "#374151" }}>
                Notification Settings
              </h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium" style={{ color: "#374151" }}>When my question is answered</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-success toggle-sm"
                    checked={profile?.notificationPreferences?.notifyOnAnswer !== false}
                    onChange={() => handleToggle('notifyOnAnswer')}
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium" style={{ color: "#374151" }}>When my answer is verified</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-success toggle-sm"
                    checked={profile?.notificationPreferences?.notifyOnVerification !== false}
                    onChange={() => handleToggle('notifyOnVerification')}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="card p-5 text-center"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
                    style={{ background: stat.bg, color: stat.color }}
                  >
                    {stat.icon}
                  </div>
                  <p className="text-2xl font-bold" style={{ color: "#1F2937" }}>
                    {profileLoading ? "—" : stat.value}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>



            {/* Questions I Asked */}
            <div className="card overflow-hidden">
              <div className="p-5 border-b" style={{ borderColor: "#E2E8DE" }}>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  Questions I Asked
                  {questionsAsked.length > 0 && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#EEF4EA", color: "#5E7A5A" }}>
                      {questionsAsked.length}
                    </span>
                  )}
                </h3>
              </div>
              <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
                {questionsLoading ? (
                  <div className="p-8 text-center text-sm text-gray-500">Loading your questions...</div>
                ) : questionsAsked.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">You haven't asked any questions yet.</div>
                ) : (
                  questionsAsked.slice(0, 10).map((q) => (
                    <div key={q._id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div
                        onClick={() => setExpandedId(expandedId === q._id ? null : q._id)}
                        className="block cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-sm font-medium line-clamp-1 flex-1" style={{ color: "#1F2937" }}>
                            {q.question}
                          </p>
                          <svg
                            className="w-4 h-4 shrink-0 transition-transform duration-200"
                            style={{ color: "#9CA3AF", transform: expandedId === q._id ? "rotate(180deg)" : "rotate(0deg)" }}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "#F3F4F6", color: "#6B7280" }}>{q.category}</span>
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{
                            background: q.status === "answered" ? "#ECFDF5" : q.status === "reopened" ? "#FFF7ED" : "#FEF3C7",
                            color: q.status === "answered" ? "#059669" : q.status === "reopened" ? "#C2410C" : "#D97706"
                          }}>{q.status}</span>
                          <span className="text-xs" style={{ color: "#9CA3AF" }}>{timeAgo(q.createdAt)}</span>
                        </div>
                      </div>

                      {expandedId === q._id && (
                        <div className="mt-4 pt-4 animate-fade-in border-t" style={{ borderColor: "#F3F4F6" }}>
                          {(!q.answers || q.answers.length === 0) ? (
                            <p className="text-sm italic" style={{ color: "#6B7280" }}>No answers available.</p>
                          ) : (
                            <div className="space-y-3 mb-4">
                              {q.answers.map((ans) => {
                                const isOwnAnswer = profile?._id && ans.contributorId && profile._id === (ans.contributorId._id || ans.contributorId);
                                const ansDisplayName = isOwnAnswer ? "You" : (ans.contributorName || "Student");
                                return (
                                  <div key={ans._id} className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-semibold mb-1" style={{ color: "#4B5563" }}>
                                      {ansDisplayName} answered:
                                    </p>
                                    <p className="text-sm whitespace-pre-line" style={{ color: "#1F2937" }}>
                                      {ans.content}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="mt-3 flex items-center gap-2">
                            <Link to={`/ask?edit=${q._id}`} className="btn-secondary btn-sm">
                              Edit Question
                            </Link>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm("Are you sure you want to delete this question?")) {
                                  try {
                                    await questionApi.delete(q._id);
                                    qc.invalidateQueries({ queryKey: ['user-profile-questions-asked'] });
                                    toast.success("Question deleted");
                                  } catch (err) {
                                    toast.error("Failed to delete question");
                                  }
                                }
                              }}
                              className="btn-sm border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer rounded"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", fontWeight: 500 }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Questions I Answered */}
            <div className="card overflow-hidden">
              <div className="p-5 border-b" style={{ borderColor: "#E2E8DE" }}>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  Questions I Answered
                  {questionsAnswered.length > 0 && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#EEF4EA", color: "#5E7A5A" }}>
                      {questionsAnswered.length}
                    </span>
                  )}
                </h3>
              </div>
              <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
                {answersLoading ? (
                  <div className="p-8 text-center text-sm text-gray-500">Loading your answers...</div>
                ) : questionsAnswered.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">You haven't answered any questions yet.</div>
                ) : (
                  questionsAnswered.slice(0, 10).map((q) => (
                    <div key={q._id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div
                        onClick={() => setExpandedId(expandedId === `ans-${q._id}` ? null : `ans-${q._id}`)}
                        className="block cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-sm font-medium line-clamp-1 flex-1" style={{ color: "#1F2937" }}>
                            {q.question}
                          </p>
                          <svg
                            className="w-4 h-4 shrink-0 transition-transform duration-200"
                            style={{ color: "#9CA3AF", transform: expandedId === `ans-${q._id}` ? "rotate(180deg)" : "rotate(0deg)" }}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "#F3F4F6", color: "#6B7280" }}>{q.category}</span>
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{
                            background: q.status === "answered" ? "#ECFDF5" : q.status === "reopened" ? "#FFF7ED" : "#FEF3C7",
                            color: q.status === "answered" ? "#059669" : q.status === "reopened" ? "#C2410C" : "#D97706"
                          }}>{q.status}</span>
                          <span className="text-xs" style={{ color: "#9CA3AF" }}>Asked {timeAgo(q.createdAt)}</span>
                        </div>
                      </div>

                      {expandedId === `ans-${q._id}` && (
                        <div className="mt-4 pt-4 animate-fade-in border-t" style={{ borderColor: "#F3F4F6" }}>
                          <div className="space-y-3 mb-4">
                            {q.answers?.map((ans) => {
                              const isOwnAnswer = profile?._id && ans.contributorId && profile._id === (ans.contributorId._id || ans.contributorId);
                              if (!isOwnAnswer) return null;
                              return (
                                <div key={ans._id} className="p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs font-semibold mb-1" style={{ color: "#4B5563" }}>You answered:</p>
                                  <p className="text-sm whitespace-pre-line" style={{ color: "#1F2937" }}>{ans.content}</p>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <Link to={`/questions/${q._id}`} className="btn-primary btn-sm">
                              View Question
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bookmarked FAQs & Questions */}
            <div className="card overflow-hidden">
              <div className="p-5 border-b" style={{ borderColor: "#E2E8DE" }}>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  Bookmarked FAQs & Questions
                  {bookmarkedItems.length > 0 && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full text-indigo-700 bg-indigo-50">
                      {bookmarkedItems.length}
                    </span>
                  )}
                </h3>
              </div>
              <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
                {bookmarksLoading ? (
                  <div className="p-8 text-center text-sm text-gray-500">Loading bookmarks...</div>
                ) : bookmarkedItems.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">You haven't bookmarked anything yet.</div>
                ) : (
                  bookmarkedItems.map((item) => (
                    <div key={item._id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div
                        onClick={() => setExpandedId(expandedId === `bookmark-${item._id}` ? null : `bookmark-${item._id}`)}
                        className="block cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-sm font-medium line-clamp-1 flex-1" style={{ color: "#1F2937" }}>
                            {item.question}
                          </p>
                          <svg
                            className="w-4 h-4 shrink-0 transition-transform duration-200"
                            style={{ color: "#9CA3AF", transform: expandedId === `bookmark-${item._id}` ? "rotate-180" : "rotate(0deg)" }}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: "#F3F4F6", color: "#6B7280" }}>{item.category}</span>
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{
                            background: item.status === "verified" ? "#ECFDF5" : item.status === "answered" ? "#E0F2FE" : "#FEF3C7",
                            color: item.status === "verified" ? "#047857" : item.status === "answered" ? "#0369a1" : "#b45309"
                          }}>{item.status || "open"}</span>
                          <span className="text-xs" style={{ color: "#9CA3AF" }}>{timeAgo(item.createdAt)}</span>
                        </div>
                      </div>

                      {expandedId === `bookmark-${item._id}` && (
                        <div className="mt-4 pt-4 animate-fade-in border-t" style={{ borderColor: "#F3F4F6" }}>
                          {item.status === "verified" ? (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-gray-400">Verified Answer:</p>
                              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                                {item.details}
                              </p>
                              <div className="mt-4 pt-2">
                                <Link to={`/faqs/${item._id}`} className="text-sm font-semibold hover:underline" style={{ color: "#5E7A5A" }}>
                                  Read full documentation
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {(!item.answers || item.answers.length === 0) ? (
                                <p className="text-sm italic" style={{ color: "#6B7280" }}>No answers available yet.</p>
                              ) : (
                                <div className="space-y-3 mb-4">
                                  {item.answers.map((ans) => (
                                    <div key={ans._id} className="p-3 bg-gray-50 rounded-lg">
                                      <p className="text-xs font-semibold mb-1" style={{ color: "#4B5563" }}>
                                        {ans.contributorName || "Student"} answered:
                                      </p>
                                      <p className="text-sm whitespace-pre-line" style={{ color: "#1F2937" }}>
                                        {ans.content}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="mt-3">
                                <Link to={`/questions/${item._id}`} className="btn-primary btn-sm">
                                  View Question Details
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
