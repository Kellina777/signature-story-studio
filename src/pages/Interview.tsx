// the interview — hybrid flow.
// 8 fixed core questions; after each answer, the AI asks one tailored follow-up;
// the user answers the follow-up; then we move to the next core question.
// at the end we generate the 7-section blueprint and route to /blueprint/:slug.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CORE_QUESTIONS } from "@/lib/interviewQuestions";
import { palette, baseStyle } from "@/lib/theme";

type Turn = {
  role: "assistant" | "user";
  kind: "core" | "followup" | "answer";
  step: number;
  content: string;
};

const Interview = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [step, setStep] = useState(0); // 0..7
  const [awaiting, setAwaiting] = useState<"core" | "followup">("core");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // auth gate + load/create interview
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      if (cancelled) return;
      setUserId(session.user.id);

      // resume the most recent in_progress interview, or create one
      const { data: existing } = await supabase
        .from("interviews")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let iv = existing;
      if (!iv) {
        const { data: created, error } = await supabase
          .from("interviews")
          .insert({ user_id: session.user.id })
          .select()
          .single();
        if (error) {
          toast.error(error.message);
          return;
        }
        iv = created;
        // seed first core question
        await supabase.from("interview_messages").insert({
          interview_id: iv.id,
          user_id: session.user.id,
          role: "assistant",
          kind: "core",
          step: 0,
          content: CORE_QUESTIONS[0].prompt,
        });
      }

      setInterviewId(iv.id);
      setStep(iv.current_step ?? 0);
      setAwaiting((iv.awaiting as "core" | "followup") ?? "core");

      const { data: msgs } = await supabase
        .from("interview_messages")
        .select("*")
        .eq("interview_id", iv.id)
        .order("created_at", { ascending: true });

      setTurns(
        (msgs || []).map((m) => ({
          role: m.role as "assistant" | "user",
          kind: m.kind as "core" | "followup" | "answer",
          step: m.step,
          content: m.content,
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, generating, busy]);

  // autosize textarea
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 260) + "px";
  }, [draft]);

  const progress = useMemo(() => {
    const total = CORE_QUESTIONS.length * 2; // each step = core + followup
    const done = step * 2 + (awaiting === "followup" ? 1 : 0);
    return Math.min(100, Math.round((done / total) * 100));
  }, [step, awaiting]);

  const summarizePrior = (allTurns: Turn[]) =>
    allTurns
      .filter((t) => t.role === "user")
      .slice(-6)
      .map((t, i) => `(${i + 1}) ${t.content.slice(0, 240)}`)
      .join("\n");

  const submit = async () => {
    if (!interviewId || !userId) return;
    const text = draft.trim();
    if (!text) return;
    if (text.length > 4000) {
      return toast.error("keep answers under 4000 characters");
    }

    setBusy(true);
    setDraft("");

    const isFollowup = awaiting === "followup";
    const userTurn: Turn = { role: "user", kind: "answer", step, content: text };
    setTurns((t) => [...t, userTurn]);

    // persist user answer
    const { error: insErr } = await supabase.from("interview_messages").insert({
      interview_id: interviewId,
      user_id: userId,
      role: "user",
      kind: "answer",
      step,
      content: text,
    });
    if (insErr) {
      toast.error(insErr.message);
      setBusy(false);
      return;
    }

    if (!isFollowup) {
      // user answered the CORE question -> get one AI follow-up
      const coreQuestion = CORE_QUESTIONS[step].prompt;
      const priorContext = summarizePrior([...turns, userTurn]);
      try {
        const { data, error } = await supabase.functions.invoke("interview-followup", {
          body: { coreQuestion, answer: text, priorContext },
        });
        if (error) throw error;
        const followup: string = data?.followup || "tell me a little more about that.";
        const fTurn: Turn = { role: "assistant", kind: "followup", step, content: followup };
        setTurns((t) => [...t, fTurn]);
        await supabase.from("interview_messages").insert({
          interview_id: interviewId,
          user_id: userId,
          role: "assistant",
          kind: "followup",
          step,
          content: followup,
        });
        await supabase
          .from("interviews")
          .update({ awaiting: "followup", current_step: step })
          .eq("id", interviewId);
        setAwaiting("followup");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "ai error";
        toast.error(msg.includes("402") ? "ai credits exhausted." : msg.includes("429") ? "rate limited, try again." : msg);
      }
      setBusy(false);
      return;
    }

    // user answered the FOLLOWUP -> advance to next core question (or finish)
    const nextStep = step + 1;
    if (nextStep >= CORE_QUESTIONS.length) {
      // finish: generate blueprint
      setBusy(false);
      setGenerating(true);
      try {
        await supabase
          .from("interviews")
          .update({ awaiting: "core", current_step: nextStep, status: "complete" })
          .eq("id", interviewId);

        const transcript = [...turns, userTurn].map((t) => ({
          role: t.role,
          content: t.content,
        }));
        const { data, error } = await supabase.functions.invoke("generate-blueprint", {
          body: { transcript },
        });
        if (error) throw error;

        const { data: bp, error: bErr } = await supabase
          .from("blueprints")
          .insert({
            interview_id: interviewId,
            user_id: userId,
            title: data.title || "your signature story",
            sections: data.sections,
          })
          .select()
          .single();
        if (bErr) throw bErr;
        navigate(`/blueprint/${bp.share_slug}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "could not generate blueprint";
        toast.error(msg);
        setGenerating(false);
      }
      return;
    }

    // ask next core question
    const nextCore = CORE_QUESTIONS[nextStep].prompt;
    const cTurn: Turn = { role: "assistant", kind: "core", step: nextStep, content: nextCore };
    setTurns((t) => [...t, cTurn]);
    await supabase.from("interview_messages").insert({
      interview_id: interviewId,
      user_id: userId,
      role: "assistant",
      kind: "core",
      step: nextStep,
      content: nextCore,
    });
    await supabase
      .from("interviews")
      .update({ awaiting: "core", current_step: nextStep })
      .eq("id", interviewId);
    setStep(nextStep);
    setAwaiting("core");
    setBusy(false);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  const restart = async () => {
    if (!userId) return;
    if (!confirm("start over? your current answers will be deleted.")) return;
    if (interviewId) {
      await supabase.from("interviews").delete().eq("id", interviewId);
    }
    setInterviewId(null);
    setTurns([]);
    setStep(0);
    setAwaiting("core");
    // re-run the init effect by reloading
    window.location.reload();
  };

  const lastAssistant = [...turns].reverse().find((t) => t.role === "assistant");
  const stepLabel =
    awaiting === "followup"
      ? `${step + 1}/${CORE_QUESTIONS.length} · a deeper look`
      : `${step + 1}/${CORE_QUESTIONS.length} · the question`;

  return (
    <div className="min-h-screen lowercase flex flex-col" style={baseStyle}>
      {/* top bar */}
      <header className="px-6 sm:px-10 md:px-14 pt-6 pb-4 flex items-center justify-between gap-3">
        <a href="/" className="text-[12px] tracking-[0.22em]" style={{ color: palette.inkSoft }}>
          &larr; signature
        </a>
        <div className="flex items-center gap-4 text-[11px] tracking-[0.22em]" style={{ color: palette.inkSoft }}>
          <button onClick={restart} className="underline underline-offset-4">restart</button>
          <button onClick={signOut} className="underline underline-offset-4">sign out</button>
        </div>
      </header>

      {/* progress bar */}
      <div className="px-6 sm:px-10 md:px-14">
        <div className="h-[3px] w-full rounded-full overflow-hidden" style={{ backgroundColor: "rgba(87,83,73,0.12)" }}>
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${progress}%`, backgroundColor: palette.orange }}
          />
        </div>
      </div>

      {/* current question — sticky big */}
      <section className="px-6 sm:px-10 md:px-14 pt-10 md:pt-14 pb-6 max-w-[1400px] mx-auto w-full">
        <div className="text-[11px] tracking-[0.28em] mb-5" style={{ color: "rgba(87,83,73,0.55)" }}>
          &mdash; {stepLabel}
        </div>
        <h1
          className="font-black tracking-[-0.035em] leading-[0.95] max-w-[22ch]"
          style={{
            color: palette.ink,
            fontSize: "clamp(2rem, 5.5vw, 4.4rem)",
          }}
        >
          {generating ? "finding your thread..." : lastAssistant?.content || CORE_QUESTIONS[0].prompt}
        </h1>
        {!generating && awaiting === "core" && CORE_QUESTIONS[step]?.hint && (
          <p className="mt-5 text-[14px]" style={{ color: "rgba(87,83,73,0.6)" }}>
            {CORE_QUESTIONS[step].hint}
          </p>
        )}
      </section>

      {/* transcript (older turns) */}
      <section ref={scrollRef} className="flex-1 overflow-y-auto px-6 sm:px-10 md:px-14 max-w-[1400px] mx-auto w-full">
        <div className="grid md:grid-cols-12 gap-x-10">
          <div className="md:col-start-3 md:col-span-8 flex flex-col gap-6 pb-10">
            {turns
              .slice(0, Math.max(0, turns.length - 1)) // hide the most recent assistant (shown above as headline)
              .map((t, i) => (
                <div
                  key={i}
                  className={`rounded-2xl px-5 py-4 text-[15.5px] leading-[1.65] whitespace-pre-wrap`}
                  style={
                    t.role === "user"
                      ? { backgroundColor: palette.cream, color: palette.ink }
                      : t.kind === "followup"
                      ? { backgroundColor: "transparent", color: "rgba(87,83,73,0.7)", paddingLeft: 0 }
                      : { backgroundColor: "transparent", color: "rgba(87,83,73,0.55)", paddingLeft: 0 }
                  }
                >
                  {t.role === "assistant" && (
                    <div className="text-[10px] tracking-[0.22em] mb-2" style={{ color: "rgba(87,83,73,0.5)" }}>
                      {t.kind === "followup" ? "a deeper look" : `question ${t.step + 1}`}
                    </div>
                  )}
                  {t.content}
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* composer */}
      {!generating && (
        <footer
          className="sticky bottom-0 px-6 sm:px-10 md:px-14 py-5"
          style={{
            backgroundColor: palette.bg,
            boxShadow: "0 -10px 30px rgba(242,239,233,0.9)",
          }}
        >
          <div className="max-w-[1100px] mx-auto">
            <div
              className="rounded-3xl p-3 flex items-end gap-3"
              style={{ backgroundColor: palette.cream }}
            >
              <textarea
                ref={taRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKey}
                placeholder={busy ? "thinking..." : "answer in your own words. take your time."}
                disabled={busy}
                rows={1}
                className="flex-1 bg-transparent outline-none resize-none px-4 py-3 text-[15.5px] leading-[1.6] placeholder:opacity-60 lowercase"
                style={{ color: palette.ink, maxHeight: 260 }}
                maxLength={4000}
              />
              <button
                onClick={submit}
                disabled={busy || !draft.trim()}
                className="h-12 px-6 rounded-full font-bold tracking-[0.16em] text-[12px] disabled:opacity-50 shrink-0"
                style={{ backgroundColor: palette.orange, color: palette.bg }}
              >
                {busy ? "..." : awaiting === "followup" && step + 1 === CORE_QUESTIONS.length ? "finish" : "send"}
              </button>
            </div>
            <div className="mt-2 px-2 text-[10.5px] tracking-[0.18em]" style={{ color: "rgba(87,83,73,0.5)" }}>
              {draft.length}/4000 &middot; press &#8984;/ctrl + enter to send
            </div>
          </div>
        </footer>
      )}

      {generating && (
        <div className="px-6 sm:px-10 md:px-14 pb-16 max-w-[1400px] mx-auto w-full">
          <div className="grid md:grid-cols-12 gap-x-10">
            <p className="md:col-start-3 md:col-span-8 text-[15px] leading-[1.7]" style={{ color: "rgba(87,83,73,0.8)" }}>
              reading every answer, listening for the thread that runs through them all.
              this takes about thirty seconds.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interview;
