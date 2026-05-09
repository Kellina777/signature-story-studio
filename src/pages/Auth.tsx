// sign in / sign up — minimal milanese styling, matches landing page palette.
import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { palette, baseStyle } from "@/lib/theme";

const schema = z.object({
  email: z.string().trim().email({ message: "enter a valid email" }).max(255),
  password: z.string().min(6, { message: "min 6 characters" }).max(128),
});

const Auth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "signin" ? "signin" : "signup";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    // if already signed in, jump to interview
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/interview", { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/interview", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgot) {
      const parsed = z.string().email().safeParse(email);
      if (!parsed.success) return toast.error("enter a valid email");
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("password reset email sent");
      setForgot(false);
      return;
    }
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      return toast.error(parsed.error.issues[0].message);
    }
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/interview` },
      });
      setLoading(false);
      if (error) {
        if (error.message.toLowerCase().includes("already")) {
          return toast.error("this email is already registered. try signing in.");
        }
        return toast.error(error.message);
      }
      toast.success("check your email to confirm your account");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        if (error.message.toLowerCase().includes("invalid")) {
          return toast.error("wrong email or password");
        }
        return toast.error(error.message);
      }
    }
  };

  return (
    <div className="min-h-screen lowercase flex flex-col" style={baseStyle}>
      <header className="px-6 sm:px-10 md:px-14 py-8">
        <Link to="/" className="text-[12px] tracking-[0.22em]" style={{ color: palette.inkSoft }}>
          &larr; signature
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <h1 className="font-black tracking-[-0.04em] leading-[0.9] text-[3rem] md:text-[3.6rem]" style={{ color: palette.ink }}>
            {forgot ? (
              <>reset your<br /><span style={{ color: "rgba(87,83,73,0.55)" }}>password.</span></>
            ) : mode === "signup" ? (
              <>begin your<br /><span style={{ color: "rgba(87,83,73,0.55)" }}>interview.</span></>
            ) : (
              <>welcome<br /><span style={{ color: "rgba(87,83,73,0.55)" }}>back.</span></>
            )}
          </h1>
          <p className="mt-5 text-[14px] leading-relaxed max-w-sm" style={{ color: "rgba(87,83,73,0.75)" }}>
            {forgot
              ? "we'll email you a link to set a new password."
              : mode === "signup"
              ? "create an account to save your interview and your blueprint."
              : "pick up where you left off."}
          </p>

          <form onSubmit={submit} className="mt-10 flex flex-col gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-[10px] tracking-[0.22em]" style={{ color: palette.inkSoft }}>email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-2xl px-5 py-4 text-[15px] outline-none lowercase"
                style={{ backgroundColor: palette.cream, color: palette.ink }}
                autoComplete="email"
              />
            </label>
            {!forgot && (
              <label className="flex flex-col gap-2">
                <span className="text-[10px] tracking-[0.22em]" style={{ color: palette.inkSoft }}>password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-2xl px-5 py-4 text-[15px] outline-none"
                  style={{ backgroundColor: palette.cream, color: palette.ink }}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={6}
                />
              </label>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-3 h-14 rounded-full font-bold tracking-[0.16em] text-[12px] disabled:opacity-60"
              style={{ backgroundColor: palette.orange, color: palette.bg }}
            >
              {loading ? "..." : forgot ? "send reset link" : mode === "signup" ? "create account" : "sign in"}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-between text-[12px] tracking-[0.04em]" style={{ color: palette.inkSoft }}>
            {forgot ? (
              <button onClick={() => setForgot(false)} className="underline underline-offset-4">
                back to sign in
              </button>
            ) : (
              <>
                <button
                  onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                  className="underline underline-offset-4"
                >
                  {mode === "signup" ? "have an account? sign in" : "new here? create an account"}
                </button>
                {mode === "signin" && (
                  <button onClick={() => setForgot(true)} className="underline underline-offset-4">
                    forgot password
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
