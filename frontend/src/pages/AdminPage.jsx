import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { questionApi, faqApi } from "../services/api";

const SIDEBAR_NAV = [
  { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "open",      label: "Open Questions", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { id: "answered",  label: "Answered", icon: "M5 13l4 4L19 7" },
  { id: "categories",label: "Categories", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { id: "users",     label: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
];

function StatCard({ value, label, icon }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-brand" style={{ background: "#f0f4ef", color: "#5E7A5A" }}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
        </svg>
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "#1F2937" }}>{value}</p>
        <p className="text-sm font-medium" style={{ color: "#6B7280" }}>{label}</p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedQ, setSelectedQ] = useState(null);
  const [answerDraft, setAnswerDraft] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["admin-questions"],
    queryFn: () => questionApi.listOpen(), // Using existing endpoint for demo
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => faqApi.listCategories(),
  });

  const stats = useMemo(() => {
    const open = questions.filter(q => q.status === "open").length;
    const answered = questions.filter(q => q.status === "answered").length;
    return { total: questions.length, open, answered, categories: categories.length };
  }, [questions, categories]);

  return (
    <div className="min-h-screen flex" style={{ background: "#F5F7F2" }}>
      
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white border-r flex flex-col hidden md:flex" style={{ borderColor: "#E2E8DE" }}>
        <div className="h-16 flex items-center px-6 border-b" style={{ borderColor: "#E2E8DE" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold" style={{ background: "#5E7A5A" }}>
              AS
            </div>
            <span className="font-bold text-lg" style={{ color: "#1F2937" }}>AskSam Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {SIDEBAR_NAV.map((nav) => (
            <button
              key={nav.id}
              onClick={() => setActiveTab(nav.id)}
              className={`w-full text-left flex items-center justify-between ${
                activeTab === nav.id ? "admin-nav-link-active" : "admin-nav-link"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={nav.icon} />
                </svg>
                {nav.label}
              </div>
              {nav.id === "open" && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" 
                  style={activeTab === nav.id ? { background: "#5E7A5A", color: "#fff" } : { background: "#f0f4ef", color: "#5E7A5A" }}>
                  {stats.open}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: "#E2E8DE" }}>
          <button onClick={handleLogout} className="admin-nav-link w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0" style={{ borderColor: "#E2E8DE" }}>
          <h1 className="font-semibold text-lg" style={{ color: "#1F2937" }}>
            {SIDEBAR_NAV.find(n => n.id === activeTab)?.label || "Dashboard"}
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#5E7A5A" }}>
              A
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard value={stats.total} label="Total Questions" icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <StatCard value={stats.open} label="Open Questions" icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            <StatCard value={stats.answered} label="Answered" icon="M5 13l4 4L19 7" />
            <StatCard value={stats.categories} label="Categories" icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </div>

          {/* Split Panel */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
            
            {/* List */}
            <div className="xl:col-span-5 flex flex-col card overflow-hidden">
              <div className="p-4 border-b" style={{ borderColor: "#E2E8DE" }}>
                <h2 className="font-semibold" style={{ color: "#1F2937" }}>Open Questions</h2>
                <div className="mt-3 relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#9CA3AF" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input className="input pl-9 text-sm" placeholder="Search questions..." />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[1,2,3].map(i => <div key={i} className="skeleton h-16 w-full" />)}
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "#E2E8DE" }}>
                    {questions.map((q) => (
                      <button
                        key={q._id}
                        onClick={() => { setSelectedQ(q); setAnswerDraft(""); }}
                        className={`w-full text-left p-4 transition-colors hover:bg-gray-50 ${selectedQ?._id === q._id ? "bg-gray-50" : ""}`}
                        style={selectedQ?._id === q._id ? { background: "#f0f4ef" } : {}}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm line-clamp-1 pr-4" style={{ color: "#1F2937" }}>{q.question}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 border ${
                            q.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' : 
                            q.priority === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                            'bg-green-50 text-green-700 border-green-200'
                          }`}>
                            {q.priority || "Med"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs" style={{ color: "#9CA3AF" }}>
                          <span className="tag tag-brand">{q.category}</span>
                          <span>· {q.contributor || "Student"}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Detail */}
            <div className="xl:col-span-7 flex flex-col card overflow-hidden">
              {selectedQ ? (
                <>
                  <div className="p-6 border-b overflow-y-auto max-h-64" style={{ borderColor: "#E2E8DE", background: "#F5F7F2" }}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-lg font-bold mb-2" style={{ color: "#1F2937" }}>{selectedQ.question}</h2>
                        <div className="flex gap-2 text-sm" style={{ color: "#6B7280" }}>
                          <span>Asked by <strong style={{ color: "#374151" }}>{selectedQ.contributor || "Student"}</strong></span>
                          <span>· 2 hours ago</span>
                        </div>
                      </div>
                      <span className="tag tag-brand">{selectedQ.category}</span>
                    </div>
                    {selectedQ.reopenReason && (
                      <div className="mt-2 p-3 bg-white rounded border text-sm" style={{ borderColor: "#E2E8DE" }}>
                        <strong className="text-orange-600 block mb-1">Reopened:</strong>
                        {selectedQ.reopenReason}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-semibold text-sm mb-3" style={{ color: "#1F2937" }}>Your Answer</h3>
                    
                    {/* Fake Editor */}
                    <div className="flex-1 flex flex-col border rounded-lg overflow-hidden mb-4" style={{ borderColor: "#E2E8DE" }}>
                      <div className="flex items-center gap-1 p-2 border-b bg-gray-50" style={{ borderColor: "#E2E8DE" }}>
                        {['B', 'I', 'U'].map(btn => (
                          <button key={btn} className="w-8 h-8 rounded text-gray-600 hover:bg-gray-200 font-bold text-sm">{btn}</button>
                        ))}
                      </div>
                      <textarea 
                        className="flex-1 p-4 text-sm focus:outline-none resize-none"
                        placeholder="Write your official answer here..."
                        value={answerDraft}
                        onChange={e => setAnswerDraft(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t" style={{ borderColor: "#E2E8DE" }}>
                      <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "#374151" }}>
                        <input type="checkbox" className="rounded text-brand focus:ring-brand" style={{ accentColor: "#5E7A5A" }} defaultChecked />
                        Mark as Verified Answer
                      </label>
                      <div className="flex gap-2">
                        <button className="btn-secondary">Save Draft</button>
                        <button className="btn-primary" disabled={!answerDraft.trim()}>Submit Answer</button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "#f0f4ef" }}>
                    <svg className="w-8 h-8" style={{ color: "#9CA3AF" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg" style={{ color: "#1F2937" }}>No question selected</h3>
                  <p className="text-sm mt-1 max-w-sm" style={{ color: "#6B7280" }}>Select a question from the list to review it and write an official answer.</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}