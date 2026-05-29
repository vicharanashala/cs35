import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState("student");
  const [isRegister, setIsRegister] = useState(true);

  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "", confirmPassword: "" });
  const [forgotForm, setForgotForm] = useState({ username: "", newPassword: "", confirmNewPassword: "" });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const setField = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const setForgotField = (k) => (e) => setForgotForm((p) => ({ ...p, [k]: e.target.value }));

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isRegister) {
      if (!form.fullName.trim()) {
        setError("Please enter your full name");
        return;
      }
      if (!form.username.trim() || form.username.trim().length < 3) {
        setError("Username must be at least 3 characters");
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
        setError("Username can only contain letters, numbers, and underscores");
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      setIsLoading(true);
      try {
        const res = await authApi.signup({
          fullName: form.fullName,
          username: form.username,
          password: form.password,
        });
        if (!res.success) {
          setError(res.message);
          setIsLoading(false);
          return;
        }
        login({ email: form.username, name: form.fullName, role: "student", token: res.token });
        navigate("/");
      } catch (_) {
        setError("Signup failed. Please try again.");
      }
      setIsLoading(false);
    } else {
      if (!form.username.trim()) {
        setError("Please enter your username");
        return;
      }
      if (!form.password) {
        setError("Please enter your password");
        return;
      }

      setIsLoading(true);
      try {
        const res = await authApi.login({ username: form.username, password: form.password, role: "student" });
        if (!res.success) {
          setError(res.message);
          setIsLoading(false);
          return;
        }
        login({ username: form.username, name: res.name || "Student", role: "student", token: res.token });
        navigate("/");
      } catch (_) {
        setError("Login failed. Please check your connection.");
      }
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("Please enter email and password");
      return;
    }

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!forgotForm.username.trim()) {
      setError("Please enter your username");
      return;
    }
    if (!forgotForm.newPassword || forgotForm.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (forgotForm.newPassword !== forgotForm.confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword({
        username: forgotForm.username,
        newPassword: forgotForm.newPassword,
        confirmNewPassword: forgotForm.confirmNewPassword,
      });
      if (!res.success) {
        setError(res.message);
        setIsLoading(false);
        return;
      }
      setForgotSuccess(true);
      setForgotForm({ username: "", newPassword: "", confirmNewPassword: "" });
      setIsLoading(false);
    } catch (_) {
      setError("Password reset failed. Please try again.");
    }
    setIsLoading(false);
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError("");
    setForm({ fullName: "", username: "", email: "", password: "", confirmPassword: "" });
    setForgotForm({ username: "", newPassword: "", confirmNewPassword: "" });
    setShowForgotPassword(false);
    setForgotSuccess(false);
    setIsRegister(true);
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
              onClick={() => handleTabSwitch(id)}
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
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5 justify-center">
              {isLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Logging in...</> : "Login to Dashboard"}
            </button>
          </form>
        ) : (
          <div className="animate-fade-in">
            {isRegister ? (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input type="text" className="input py-2.5" value={form.fullName} onChange={setField("fullName")}
                    placeholder="e.g. Arjun Sharma" autoFocus />
                </div>
                <div>
                  <label className="label">Username</label>
                  <input type="text" className="input py-2.5" value={form.username} onChange={setField("username")}
                    placeholder="e.g. arjun_sharma" />
                  <p className="input-hint">Letters, numbers, and underscores only</p>
                </div>
                <div>
                  <label className="label">Password</label>
                  <input type="password" className="input py-2.5" value={form.password} onChange={setField("password")}
                    placeholder="Min. 6 characters" />
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input type="password" className="input py-2.5" value={form.confirmPassword} onChange={setField("confirmPassword")}
                    placeholder="Repeat password" />
                </div>
                <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5 justify-center">
                  {isLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating account...</> : "Create Account"}
                </button>
              </form>
            ) : (
              <div>
                {showForgotPassword ? (
                  forgotSuccess ? (
                    <div className="text-center py-4 animate-fade-in">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "#f0f4ef" }}>
                        <svg className="w-7 h-7" style={{ color: "#5E7A5A" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: "#1F2937" }}>Password Reset!</h3>
                      <p className="text-sm mb-4" style={{ color: "#6B7280" }}>Your password has been changed successfully.</p>
                      <button onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); setForgotForm({ username: "", newPassword: "", confirmNewPassword: "" }); setError(""); }}
                        className="btn-primary w-full py-2.5 justify-center">
                        Back to Login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4 animate-fade-in">
                      <div className="text-center mb-4">
                        <h3 className="text-base font-bold" style={{ color: "#1F2937" }}>Reset Password</h3>
                        <p className="text-xs mt-1" style={{ color: "#6B7280" }}>Enter your username and new password</p>
                      </div>
                      <div>
                        <label className="label">Username</label>
                        <input type="text" className="input py-2.5" value={forgotForm.username} onChange={setForgotField("username")}
                          placeholder="your username" autoFocus />
                      </div>
                      <div>
                        <label className="label">New Password</label>
                        <input type="password" className="input py-2.5" value={forgotForm.newPassword} onChange={setForgotField("newPassword")}
                          placeholder="Min. 6 characters" />
                      </div>
                      <div>
                        <label className="label">Confirm New Password</label>
                        <input type="password" className="input py-2.5" value={forgotForm.confirmNewPassword} onChange={setForgotField("confirmNewPassword")}
                          placeholder="Repeat new password" />
                      </div>
                      <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5 justify-center">
                        {isLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting...</> : "Reset Password"}
                      </button>
                      <div className="text-center">
                        <button type="button" onClick={() => { setShowForgotPassword(false); setError(""); }}
                          className="text-sm hover:underline" style={{ color: "#5E7A5A" }}>
                          Back to Login
                        </button>
                      </div>
                    </form>
                  )
                ) : (
                  <form onSubmit={handleStudentSubmit} className="space-y-4">
                    <div>
                      <label className="label">Username</label>
                      <input type="text" className="input py-2.5" value={form.username} onChange={setField("username")}
                        placeholder="your username" autoFocus />
                    </div>
                    <div>
                      <label className="label">Password</label>
                      <input type="password" className="input py-2.5" value={form.password} onChange={setField("password")}
                        placeholder="••••••••" />
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5 justify-center">
                      {isLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Logging in...</> : "Login"}
                    </button>
                    <div className="text-center">
                      <button type="button" onClick={() => setShowForgotPassword(true)}
                        className="text-sm hover:underline" style={{ color: "#5E7A5A" }}>
                        Forgot Password?
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <div className="mt-5 pt-4 border-t text-center" style={{ borderColor: "#E2E8DE" }}>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                {isRegister ? "Already have an account? " : "Don't have an account? "}
                <button onClick={() => setIsRegister(!isRegister)}
                  className="font-medium hover:underline" style={{ color: "#5E7A5A" }}>
                  {isRegister ? "Login" : "Sign up"}
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
