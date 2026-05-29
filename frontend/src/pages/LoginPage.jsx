import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("student");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      if (activeTab === "student") {
        if (!studentId || studentId.length < 3) {
          setError("Please enter a valid Student ID or Name");
          setIsLoading(false);
          return;
        }
        localStorage.setItem("userRole", "student");
        localStorage.setItem("userName", studentId);
        navigate("/");
      } else {
        if (email === "admin" && password === "asksam2024") {
          localStorage.setItem("userRole", "admin");
          localStorage.setItem("userName", "Admin");
          navigate("/admin");
        } else {
          setError("Invalid admin credentials. Try admin / asksam2024");
          setIsLoading(false);
        }
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: "#F5F7F2" }}>
      
      {/* Premium Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl" style={{ background: "#dde8db" }}></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl" style={{ background: "#f8f0e0" }}></div>
      </div>

      <div className="card w-full max-w-md p-8 shadow-2xl relative z-10 border-t-4" style={{ borderTopColor: "#5E7A5A" }}>
        
        <div className="text-center mb-6">
          <img src="/logo.png" alt="AskSam Logo" className="w-20 h-20 mx-auto mb-4 object-contain rounded-full shadow-sm" />
          <h1 className="text-2xl font-bold" style={{ color: "#1F2937" }}>Welcome to AskSam</h1>
          <p className="text-sm mt-1.5" style={{ color: "#6B7280" }}>Your Samagama knowledge hub.</p>
        </div>

        {/* Custom Tabs */}
        <div className="flex p-1 mb-8 rounded-lg" style={{ background: "#F5F7F2", border: "1px solid #E2E8DE" }}>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === "student" ? "shadow-sm" : ""}`}
            style={activeTab === "student" ? { background: "#fff", color: "#5E7A5A" } : { color: "#6B7280" }}
            onClick={() => { setActiveTab("student"); setError(""); }}
          >
            Student
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === "admin" ? "shadow-sm" : ""}`}
            style={activeTab === "admin" ? { background: "#fff", color: "#5E7A5A" } : { color: "#6B7280" }}
            onClick={() => { setActiveTab("admin"); setError(""); }}
          >
            Admin
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-md text-sm font-medium text-center" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {activeTab === "student" ? (
            <div className="animate-fade-in">
              <label className="label">Student ID or Name</label>
              <input
                type="text"
                className="input py-2.5"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. 2024-SAM-001"
                autoFocus
              />
            </div>
          ) : (
            <div className="animate-fade-in space-y-5">
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  className="input py-2.5"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input py-2.5"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading || (activeTab === "student" ? !studentId : (!email || !password))}
            className="btn-primary w-full py-2.5 mt-2 justify-center"
          >
            {isLoading ? (
               <div className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                 Authenticating...
               </div>
            ) : (
              activeTab === "student" ? "Enter Knowledge Hub" : "Login to Dashboard"
            )}
          </button>
        </form>
        
      </div>
    </div>
  );
}
