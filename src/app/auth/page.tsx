"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Shield, User, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { loginAction, signUpAction } from "@/app/auth/actions";

type AuthMode = "USER" | "ADMIN";
type UserView = "SIGN_IN" | "SIGN_UP";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("USER");
  const [userView, setUserView] = useState<UserView>("SIGN_IN");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Admin fields
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");

  function resetState() {
    setError(null);
    setSuccess(null);
    setLoading(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  function switchMode(newMode: AuthMode) {
    resetState();
    setMode(newMode);
  }

  function switchUserView(newView: UserView) {
    resetState();
    setUserView(newView);
  }

  // USER SIGN IN
  async function handleUserSignIn(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await loginAction(formData);
    if (res?.error) {
      // Clean up Supabase error messages
      const msg = res.error;
      if (msg.toLowerCase().includes("invalid login")) {
        setError("Invalid email or password.");
      } else if (msg.toLowerCase().includes("email not confirmed")) {
        setError("Please verify your email before signing in.");
      } else {
        setError(msg);
      }
      setLoading(false);
    }
    // If no error, loginAction redirects
  }

  // USER SIGN UP
  async function handleUserSignUp(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const res = await signUpAction(formData);
    if (res?.error) {
      const msg = res.error;
      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already been registered")) {
        setError("An account with this email already exists.");
      } else if (msg.toLowerCase().includes("email") && msg.toLowerCase().includes("confirm")) {
        setSuccess("Account created. Please verify your email before signing in.");
      } else {
        setError(msg);
      }
      setLoading(false);
    } else if (res?.success) {
      setSuccess(res.success);
      setLoading(false);
    }
    // If redirect happens, no error returned
  }

  // ADMIN SIGN IN
  async function handleAdminSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!adminName.trim() || !adminPassword.trim() || !adminCode.trim()) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adminName.trim(),
          password: adminPassword.trim(),
          securityCode: adminCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid administrator credentials.");
        setLoading(false);
        return;
      }

      // Success — redirect to admin dashboard
      router.push("/admin/dashboard");
    } catch {
      setError("Authentication service unavailable. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen swiss-grid-bg flex items-center justify-center p-6 text-black">
      <div className="w-full max-w-lg">
        {/* REV AI Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-black text-white font-black text-sm flex items-center justify-center sharp-border">
            RA
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase">REV AI</span>
        </div>

        {/* Mode Toggle */}
        <div className="flex mb-0">
          <button
            onClick={() => switchMode("USER")}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border border-black flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              mode === "USER"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-[#F1F2F3]"
            }`}
          >
            <User className="w-4 h-4" /> USER
          </button>
          <button
            onClick={() => switchMode("ADMIN")}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border border-black border-l-0 flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              mode === "ADMIN"
                ? "bg-[#123B2D] text-white"
                : "bg-white text-black hover:bg-[#F1F2F3]"
            }`}
          >
            <Shield className="w-4 h-4" /> ADMIN
          </button>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white sharp-border border-t-0 p-8">
          {/* Accent bar */}
          <div className={`w-full h-2 mb-6 ${mode === "USER" ? "bg-[#12B76A]" : "bg-[#123B2D]"}`} />

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-600 text-xs font-bold uppercase flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="text-red-900">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-600 text-xs font-bold uppercase flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-emerald-900">{success}</span>
            </div>
          )}

          {/* ============ USER MODE ============ */}
          {mode === "USER" && (
            <>
              {/* Sub-toggle: Sign In / Sign Up */}
              <div className="flex gap-0 mb-6">
                <button
                  onClick={() => switchUserView("SIGN_IN")}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider border border-black cursor-pointer ${
                    userView === "SIGN_IN"
                      ? "bg-black text-white"
                      : "bg-[#F1F2F3] text-black"
                  }`}
                >
                  SIGN IN
                </button>
                <button
                  onClick={() => switchUserView("SIGN_UP")}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider border border-black border-l-0 cursor-pointer ${
                    userView === "SIGN_UP"
                      ? "bg-[#12B76A] text-white"
                      : "bg-[#F1F2F3] text-black"
                  }`}
                >
                  CREATE ACCOUNT
                </button>
              </div>

              {userView === "SIGN_IN" ? (
                <>
                  <h1 className="text-2xl font-black uppercase tracking-tight mb-1">
                    WELCOME BACK
                  </h1>
                  <p className="text-xs text-neutral-500 mb-6">
                    Enter your credentials to access your AI Sales Autopilot workspace.
                  </p>

                  <form action={handleUserSignIn} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                        Work Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="alex@company.com"
                        className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          required
                          placeholder="••••••••"
                          className="w-full p-3 pr-10 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-pill-primary justify-center mt-4 text-sm cursor-pointer"
                    >
                      {loading ? "Authenticating..." : "Sign In to Workspace"}{" "}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-black uppercase tracking-tight mb-1">
                    CREATE YOUR WORKSPACE
                  </h1>
                  <p className="text-xs text-neutral-500 mb-6">
                    Set up your multi-tenant organization with OWNER privileges.
                  </p>

                  <form action={handleUserSignUp} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Sarah Connor"
                        className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="sarah@company.com"
                        className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                        Password * <span className="text-neutral-400 font-normal">(min 6 characters)</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          required
                          minLength={6}
                          placeholder="••••••••"
                          className="w-full p-3 pr-10 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          required
                          minLength={6}
                          placeholder="••••••••"
                          className="w-full p-3 pr-10 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                        Organization / Business Name *
                      </label>
                      <input
                        type="text"
                        name="orgName"
                        required
                        placeholder="Acme Automation Corp"
                        className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-pill-primary justify-center mt-4 text-sm cursor-pointer"
                    >
                      {loading ? "Creating Account..." : "Create Account & Workspace"}{" "}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </>
              )}
            </>
          )}

          {/* ============ ADMIN MODE ============ */}
          {mode === "ADMIN" && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-[#123B2D]" />
                <h1 className="text-2xl font-black uppercase tracking-tight">
                  ADMIN ACCESS
                </h1>
              </div>
              <p className="text-xs text-neutral-500 mb-6">
                Secure administrator authentication. Server-verified credentials only.
              </p>

              <form onSubmit={handleAdminSignIn} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                    Administrator Name
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                    placeholder="Full Name"
                    className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full p-3 pr-10 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">
                    Security Code
                  </label>
                  <input
                    type="password"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    required
                    placeholder="••••••"
                    className="w-full p-3 border border-black bg-[#F1F2F3] text-sm focus:outline-none focus:bg-white sharp-border font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#123B2D] text-white font-black text-sm uppercase tracking-wider border border-black flex items-center justify-center gap-2 hover:bg-black transition-colors cursor-pointer"
                  style={{ borderRadius: 0 }}
                >
                  {loading ? "Verifying..." : "Admin Sign In"}{" "}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-4 p-3 bg-[#F1F2F3] border border-neutral-300 text-[10px] font-mono text-neutral-500 uppercase">
                🔒 Credentials verified server-side only. No secrets transmitted to browser.
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-neutral-200 flex items-center gap-2 text-[10px] text-neutral-400 uppercase font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-[#12B76A]" />
            {mode === "USER"
              ? "Multi-Tenant RLS Isolated Environment"
              : "Server-Side Admin Authentication"}
          </div>
        </div>
      </div>
    </div>
  );
}
