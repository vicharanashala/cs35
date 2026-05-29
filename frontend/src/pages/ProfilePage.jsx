import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { userApi, questionApi } from "../services/api";
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

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: userApi.me,
    staleTime: 30000,
  });

  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['user-profile-questions'],
    queryFn: () => questionApi.list({ contributor: profileData?.user?.username }),
    enabled: !!profileData?.user?.username,
  });

  const questions = questionsData || [];
  const profile = profileData?.user;

  const stats = [
    {
      label: "Questions Asked",
      value: profile?.questionsCount ?? 0,
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
      value: profile?.answersCount ?? 0,
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
  ];

  return (
    <div className="min-h-screen" style={{ background: "#FAFAF5" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  @{profile?.username || user?.email}
                </p>
                <span
                  className="mt-3 inline-block text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: "#EEF2FF", color: "#5E7A5A" }}
                >
                  {user?.role}
                </span>
                {profile?.studentId && (
                  <p className="mt-2 text-xs" style={{ color: "#9CA3AF" }}>
                    ID: {profile.studentId}
                  </p>
                )}
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
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition-all"
                  style={{ background: "#3B82F6" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ask a Question
                </Link>
                <Link
                  to="/"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all border"
                  style={{ borderColor: "#E5E7EB", color: "#374151" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Browse FAQs
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            <div className="card">
              <div className="px-5 py-4 border-b" style={{ borderColor: "#F5F7F2" }}>
                <h2 className="font-semibold" style={{ color: "#1F2937" }}>
                  My Questions
                </h2>
              </div>
              <div className="divide-y" style={{ borderColor: "#F5F7F2" }}>
                {questionsLoading ? (
                  <div className="p-8 text-center">
                    <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: "#5E7A5A", borderTopColor: "transparent" }} />
                  </div>
                ) : questions.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "#F5F7F2" }}>
                      <svg className="w-6 h-6" style={{ color: "#9CA3AF" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium" style={{ color: "#6B7280" }}>
                      No questions yet
                    </p>
                    <Link to="/ask" className="text-sm font-medium mt-2 inline-block" style={{ color: "#3B82F6" }}>
                      Ask your first question →
                    </Link>
                  </div>
                ) : (
                  questions.slice(0, 10).map((q) => (
                    <div key={q._id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                      <Link to={`/question/${q._id}`} className="block">
                        <p className="text-sm font-medium line-clamp-1" style={{ color: "#1F2937" }}>
                          {q.question}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span
                            className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{ background: "#F3F4F6", color: "#6B7280" }}
                          >
                            {q.category}
                          </span>
                          <span
                            className="text-xs font-medium px-1.5 py-0.5 rounded"
                            style={{
                              background: q.status === "answered" ? "#ECFDF5" : q.status === "reopened" ? "#FFF7ED" : "#FEF3C7",
                              color: q.status === "answered" ? "#059669" : q.status === "reopened" ? "#C2410C" : "#D97706",
                            }}
                          >
                            {q.status}
                          </span>
                          <span className="text-xs" style={{ color: "#9CA3AF" }}>
                            {timeAgo(q.createdAt)}
                          </span>
                          {q.answers?.length > 0 && (
                            <span className="text-xs" style={{ color: "#9CA3AF" }}>
                              {q.answers.length} answer{q.answers.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))
                )}
              </div>
              {questions.length > 10 && (
                <div className="px-5 py-3 border-t text-center" style={{ borderColor: "#F5F7F2" }}>
                  <Link to="/my-questions" className="text-sm font-medium" style={{ color: "#3B82F6" }}>
                    View all {questions.length} questions →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
