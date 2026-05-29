import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState("student");
  const [step, setStep] = useState("form");

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState("");

  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

  const setField = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid @gmail.com address");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.sendOtp(form.email);
      if (!res.success) {
        setError(res.message);
        setIsLoading(false);
        return;
      }
      setEmailForOtp(form.email);
      setOtpSent(true);
      setStep("otp");
      setError("");
    } catch (_) {
      setError("Failed to send OTP. Is the backend running?");
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.trim().length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.verifyOtp(emailForOtp, otp.trim());
      if (!res.success) {
        setError(res.message);
        setIsLoading(false);
        return;
      }

      const signupRes = await authApi.signup({
        email: form.email,
        password: form.password,
        name: form.name,
      });

      if (!signupRes.success) {
        setError(signupRes.message);
        setIsLoading(false);
        return;
      }

      login({ email: form.email, name: form.name, role: "student", token: signupRes.token });
      navigate("/");
    } catch (_) {
      setError("Verification failed. Please try again.");
    }
    setIsLoading(false);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await authApi.login({ email: form.email, password: form.password, role: "admin" });
      if (!res.success) {
        setError(res.message);
        setIsLoading(false);
        return;
      }
      login({ email: form.email, name: res.name || "Admin", role: "admin", token: res.token });
      navigate("/admin");
    } catch (_) {
      setError("Login failed. Please check your connection.");
    }
    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    setError("");
    setIsLoading(true);
    try {
      const res = await authApi.sendOtp(form.email);
      if (!res.success) { setError(res.message); setIsLoading(false); return; }
      setOtpSent(true);
      setOtp("");
    } catch (_) { setError("Failed to resend OTP."); }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: "#F5F7F2" }}>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl" style={{ background: "#dde8db" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl" style={{ background: "#f8f0e0" }} />
      </div>

      <div className="card w-full max-w-md p-8 shadow-2xl relative z-10 border-t-4" style={{ borderTopColor: "#5E7A5A" }}>
        <div className="text-center mb-8">
          <img src="/logo.png" alt="AskSam Logo" className="w-20 h-20 mx-auto mb-4 object-contain rounded-full shadow-sm" />
          <h1 className="text-2xl font-bold" style={{ color: "#1F2937" }}>Welcome to AskSam</h1>
          <p className="text-sm mt-1.5" style={{ color: "#6B7280" }}>Your Samagama knowledge hub.</p>
        </div>

        <div className="flex p-1 mb-8 rounded-lg" style={{ background: "#F5F7F2", border: "1px solid #E2E8DE" }}>
          {[{ id: "student", label: "Student" }, { id: "admin", label: "Admin" }].map(({ id, label }) => (
            <button key={id} type="button"
              onClick={() => { setActiveTab(id); setError(""); setStep("form"); setForm({ name: "", email: "", password: "" }); setOtp(""); }}
              className="flex-1 py-2 text-sm font-semibold rounded-md transition-all"
              style={activeTab === id ? { background: "#fff", color: "#5E7A5A" } : { color: "#6B7280" }}>
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-md text-sm font-medium text-center animate-fade-in"
            style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        {activeTab === "admin" ? (
          <form onSubmit={handleAdminLogin} className="space-y-5 animate-fade-in">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input py-2.5" value={form.email} onChange={setField("email")}
                placeholder="admin@asksam.com" autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input py-2.5" value={form.password} onChange={setField("password")}
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={isLoading || !form.email || !form.password} className="btn-primary w-full py-2.5 justify-center">
              {isLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Logging in...</> : "Login to Dashboard"}
            </button>
          </form>
        ) : step === "otp" ? (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "#f0f4ef" }}>
                <svg className="w-7 h-7" style={{ color: "#5E7A5A" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold mb-1" style={{ color: "#1F2937" }}>Check your email</h2>
              <p className="text-sm" style={{ color: "#6B7280" }}>We sent a 6-digit code to<br /><strong style={{ color: "#374151" }}>{emailForOtp}</strong></p>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="label">Verification Code</label>
                <input type="text" className="input py-3 text-center text-xl tracking-widest font-mono"
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000" maxLength={6} autoFocus />
              </div>
              <button type="submit" disabled={isLoading || otp.trim().length !== 6} className="btn-primary w-full py-2.5 justify-center">
                {isLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</> : "Verify & Create Account"}
              </button>
              <div className="flex items-center justify-between text-xs" style={{ color: "#9CA3AF" }}>
                <button type="button" onClick={handleResendOtp} disabled={isLoading} className="hover:underline" style={{ color: "#5E7A5A" }}>
                  Didn't get the code? Resend
                </button>
                <button type="button" onClick={() => { setStep("form"); setOtp(""); setError(""); }} className="hover:underline">
                  Change email
                </button>
              </div>
            </form>
          </div>
        ) : (
          <form onSubmit={handleSendOtp} className="space-y-5 animate-fade-in">
            <div>
              <label className="label">Full Name</label>
              <input type="text" className="input py-2.5" value={form.name} onChange={setField("name")}
                placeholder="e.g. Arjun Sharma" autoFocus />
            </div>
            <div>
              <label className="label">Gmail Address</label>
              <input type="email" className="input py-2.5" value={form.email} onChange={setField("email")}
                placeholder="you@gmail.com" />
              <p className="input-hint">Only @gmail.com addresses are accepted</p>
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input py-2.5" value={form.password} onChange={setField("password")}
                placeholder="Min. 6 characters" />
            </div>
            <button type="submit" disabled={isLoading || !form.name || !form.email || !form.password} className="btn-primary w-full py-2.5 justify-center">
              {isLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending code...</> : "Continue with Email"}
            </button>
            <p className="text-xs text-center" style={{ color: "#9CA3AF" }}>
              By signing up, you agree to our community guidelines.
            </p>
          </form>
        )}

        {activeTab === "student" && step === "form" && (
          <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: "#E2E8DE" }}>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Already have an account?{" "}
              <button onClick={() => { setActiveTab("student"); setError(""); setStep("loginTab"); }}
                className="font-medium hover:underline" style={{ color: "#5E7A5A" }}>
                Log in here
              </button>
            </p>
          </div>
        )}

        {(activeTab === "student" && step === "loginTab") && (
          <div className="animate-fade-in mt-6 pt-5 border-t" style={{ borderColor: "#E2E8DE" }}>
            <p className="text-sm font-medium mb-1" style={{ color: "#1F2937" }}>Log in to your account</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setIsLoading(true);
              try {
                const res = await authApi.login({ email: form.email, password: form.password, role: "student" });
                if (!res.success) { setError(res.message); setIsLoading(false); return; }
                login({ email: form.email, name: res.name || "Student", role: "student", token: res.token });
                navigate("/");
              } catch (_) { setError("Login failed. Please check your connection."); }
              setIsLoading(false);
            }} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input type="email" className="input py-2.5" value={form.email} onChange={setField("email")}
                  placeholder="you@gmail.com" autoFocus />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input py-2.5" value={form.password} onChange={setField("password")}
                  placeholder="••••••••" />
              </div>
              {error && <p className="text-xs" style={{ color: "#dc2626" }}>{error}</p>}
              <button type="submit" disabled={isLoading || !form.email || !form.password} className="btn-primary w-full py-2.5 justify-center">
                {isLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Logging in...</> : "Login"}
              </button>
            </form>
            <button onClick={() => setStep("form")} className="w-full text-center text-sm mt-3 hover:underline" style={{ color: "#5E7A5A" }}>
              Back to sign up
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
