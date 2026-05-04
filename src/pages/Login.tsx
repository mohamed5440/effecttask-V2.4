import { useState } from "react";
import { motion } from "motion/react";
import { ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useStore } from "../store";
import { dbService } from "../services/db";
import { SUPER_ADMIN_EMAILS } from "../constants";

export default function Login() {
  const initialize = useStore((state) => state.initialize);
  const currentUser = useStore((state) => state.currentUser);
  const authError = useStore((state) => state.authError);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("يرجى ملء جميع الحقول");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(cleanEmail.toLowerCase());
      const { data: authData, error: authCheckError } =
        await dbService.checkEmailAuthorized(cleanEmail);

      if (authCheckError) throw new Error(authCheckError);

      if (!authData?.authorized && !isSuperAdmin) {
        throw new Error(
          "هذا البريد الإلكتروني غير مصرح له بالدخول. يرجى التواصل مع مسؤول النظام.",
        );
      }

      // Real Authentication logic: Fetch existing user
      // if (fetchError) throw fetchError; // user variable removed as it is not needed before login

      if (mode === "login") {
        const { data: loginData, error: loginError } = await dbService.login({
          email: cleanEmail,
          password: password,
        });

        if (loginError) throw new Error(loginError);

        localStorage.setItem("app_session", JSON.stringify(loginData));
        await initialize(true);
      } else {
        // Signup mode
        const { data: signupData, error: signupError } = await dbService.signup({
          email: cleanEmail,
          password: password,
          name: cleanEmail.split("@")[0],
          role:
            SUPER_ADMIN_EMAILS.includes(cleanEmail.toLowerCase().trim())
              ? "admin"
              : "user",
        });

        if (signupError) throw new Error(signupError);

        setSuccess("تم إنشاء الحساب بنجاح. يتم الآن تسجيل دخولك...");
        
        // Auto login after signup
        localStorage.setItem("app_session", JSON.stringify(signupData));
        await initialize(true);
      }
    } catch (err: any) {
      const msg = err.message || (typeof err === 'string' ? err : null);
      setError(
        msg && msg.length < 200
          ? msg
          : "البيانات المدخلة غير صحيحة أو حدث خطأ في النظام.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 font-sans overflow-x-hidden">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base p-5 sm:p-8 lg:p-12 space-y-8 sm:space-y-10"
        >
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-6 rotate-3 group hover:rotate-0 transition-transform">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
              {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب الفريق"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 font-bold max-w-xs mx-auto leading-relaxed">
              أهلاً بك في منصة إدارة مهام الفريق. يرجى إدخال بياناتك للمتابعة.
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-1.5 text-start">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pe-1">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                className="w-full text-start bg-zinc-50/50 border border-zinc-100 text-black px-4 py-3 rounded-xl focus:outline-none focus:border-black/20 transition-all font-medium text-sm"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5 text-start">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pe-1">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  className="w-full text-start bg-zinc-50/50 border border-zinc-100 text-black px-4 py-3 rounded-xl focus:outline-none focus:border-black/20 transition-all font-medium text-sm"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {(error || authError) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl text-xs font-bold border border-red-100"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="flex-1 text-start">{error || authError}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl text-xs font-bold border border-green-100"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <p className="flex-1 text-start">{success}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
            >
              {mode === "login" ? "دخول" : "إنشاء حساب"}
            </button>
          </form>

          <div className="text-center space-y-3 pt-2">
            {mode === "login" ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setSuccess("");
                  }}
                  className="text-xs font-bold text-zinc-500 hover:text-black transition-colors"
                >
                  هل تم دعوتك؟ أكمل إنشاء حسابك
                </button>
                <p className="text-[10px] text-zinc-400 font-medium">
                  يجب أن يتم إدراج بريدك الإلكتروني من قبل مدير النظام أولاً
                </p>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccess("");
                }}
                className="text-xs font-bold text-zinc-500 hover:text-black transition-colors"
              >
                لديك حساب بالفعل؟ سجل دخولك
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
