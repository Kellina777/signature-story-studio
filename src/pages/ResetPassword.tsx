// password reset landing page.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { palette, baseStyle } from "@/lib/theme";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("min 6 characters");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("password updated");
    navigate("/interview", { replace: true });
  };

  return (
    <div className="min-h-screen lowercase flex items-center justify-center px-6" style={baseStyle}>
      <form onSubmit={submit} className="w-full max-w-md">
        <h1 className="font-black tracking-[-0.04em] leading-[0.9] text-[3rem]" style={{ color: palette.ink }}>
          set a new<br /><span style={{ color: "rgba(87,83,73,0.55)" }}>password.</span>
        </h1>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-8 w-full rounded-2xl px-5 py-4 text-[15px] outline-none"
          style={{ backgroundColor: palette.cream, color: palette.ink }}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-3 w-full h-14 rounded-full font-bold tracking-[0.16em] text-[12px] disabled:opacity-60"
          style={{ backgroundColor: palette.orange, color: palette.bg }}
        >
          {loading ? "..." : "save password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
