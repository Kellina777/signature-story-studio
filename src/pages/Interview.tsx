// the interview — hybrid flow, anonymous.
// no login. an unguessable session_id is stored in localStorage and used as the
// row owner. after the final answer, an email gate captures the lead before
// generating the blueprint.
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

type Phase = "interview" | "email" | "generating";

const SESSION_KEY = "signature_session_id";
const INTERVIEW_KEY = "signature_interview_id";

const getSessionId = () => {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

const Interview = () => {
  const navigate = useNavigate();
  const [sessionId] = useState(() => getSessionId());
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [step, setStep] = useState(0);
  const [awaiting, setAwaiting] = useState<"core" | "followup">("core");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>("interview");
  const [email, setEmail] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // load or create interview
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const savedId = localStorage.getItem(INTERVIEW_KEY);
      let iv: any = null;

      if (savedId) {
        const { data } = await supabase
          .from("interviews")
          .select("*")
          .eq("id", savedId)
          .eq("session_id", sessionId)
          .maybeSingle();
        if (data && data.status === "in_progress") iv = data;
      }

      if (!iv) {
        const { data: created, error } = await supabase
          .from("interviews")
          .insert({ session_id: sessionId })
          .select()
          .single();
        if (error) {
          toast.error(error.message);
          return;
        }
        iv = created;
        localStorage.setItem(INTERVIEW_KEY, iv.id);
        await supabase.from("interview_messages").insert({
          interview_id: iv.id,
          session_id: sessionId,
          role: "assistant",
          kind: "core",
          step: 0,
          content: CORE_QUESTIONS[0].prompt,
        });
      }

      if (cancelled) return;
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
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, phase, busy]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 260) + "px";
  }, [draft]);

  const progress = useMemo(() => {
    const total = CORE_QUESTIONS.length * 2;
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
    if (!interviewId) return;
    const text = draft.trim();
    if (!text) return;
    if (text.length > 4000) return toast.error("keep answers under 4000 characters");

    setBusy(true);
    setDraft("");

    const isFollowup = awaiting === "followup";
    const userTurn: Turn = { role: "user", kind: "answer", step, content: text };
    setTurns((t) => [...t, userTurn]);

    const { error: insErr } = await supabase.from("interview_messages").insert({
      interview_id: interviewId,
      session_id: sessionId,
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
          session_id: sessionId,
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

    // followup answered
    const nextStep = step + 1;
    if (nextStep >= CORE_QUESTIONS.length) {
      // done answering — show email gate
      await supabase
        .from("interviews")
        .update({ awaiting: "core", current_step: nextStep })
        .eq("id", interviewId);
      setBusy(false);
      setPhase("email");
      return;
    }

    const nextCore = CORE_QUESTIONS[nextStep].prompt;
    const cTurn: Turn = { role: "assistant", kind: "core", step: nextStep, content: nextCore };
    setTurns((t) => [...t, cTurn]);
    await supabase.from("interview_messages").insert({
      interview_id: interviewId,
      session_id: sessionId,
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

  const submitEmail = async () => {
    if (!interviewId) return;
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      return toast.error("please enter a valid email");
    }
    setPhase("generating");
    try {
      await supabase
        .from("interviews")
        .update({ email: e, status: "complete" })
        .eq("id", interviewId);

      const transcript = turns.map((t) => ({ role: t.role, content: t.content }));
      const { data, error } = await supabase.functions.invoke("generate-blueprint", {
        body: { transcript },
      });
      if (error) throw error;

      const { data: bp, error: bErr } = await supabase
        .from("blueprints")
        .insert({
          interview_id: interviewId,
          email: e,
          title: data.title || "your signature story",
          sections: data.sections,
        })
        .select()
        .single();
      if (bErr) throw bErr;
      localStorage.removeItem(INTERVIEW_KEY);
      navigate(`/blueprint/${bp.share_slug}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "could not generate your story";
      toast.error(msg);
      setPhase("email");
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const restart = async () => {
    if (!confirm("start over? your current answers will be deleted.")) return;
    if (interviewId) {
      await supabase.from("interviews").delete().eq("id", interviewId);
    }
    localStorage.removeItem(INTERVIEW_KEY);
    window.location.reload();
  };

  const lastAssistant = [...turns].reverse().find((t) => t.role === "assistant");
  const stepLabel =
    awaiting === "followup"
      ? `${step + 1}/${CORE_QUESTIONS.length} · a deeper look`
      : `${Math.min(step + 1, CORE_QUESTIONS.length)}/${CORE_QUESTIONS.length} · the question`;

  return (
    <div className="min-h-screen lowercase flex flex-col" style={baseStyle}>
      <header className="px-6 sm:px-10 md:px-14 pt-6 pb-4 flex items-center justify-between gap-3">
        <a href="/" className="text-[12px] tracking-[0.22em]" style={{ color: palette.inkSoft }}>
          &larr; signature
        </a>
        <button onClick={restart} className="text-[11px] tracking-[0.22em] underline underline-offset-4" style={{ color: palette.inkSoft }}>
          restart
        </button>
      </header>

      <div className="px-6 sm:px-10 md:px-14">
        <div className="h-[3px] w-full rounded-full overflow-hidden" style={{ backgroundColor: "rgba(87,83,73,0.12)" }}>
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${phase === "interview" ? progress : 100}%`, backgroundColor: palette.orange }}
          />
        </div>
      </div>

      {phase === "interview" && (
        <>
          <section className="px-6 sm:px-10 md:px-14 pt-10 md:pt-14 pb-6 max-w-[1400px] mx-auto w-full">
            <div className="text-[11px] tracking-[0.28em] mb-5" style={{ color: "rgba(87,83,73,0.55)" }}>
              &mdash; {stepLabel}
            </div>
            <h1
              className="font-black tracking-[-0.035em] leading-[0.95] max-w-[22ch]"
              style={{ color: palette.ink, fontSize: "clamp(2rem, 5.5vw, 4.4rem)" }}
            >
              {lastAssistant?.content || CORE_QUESTIONS[0].prompt}
            </h1>
            {awaiting === "core" && CORE_QUESTIONS[step]?.hint && (
              <p className="mt-5 text-[14px]" style={{ color: "rgba(87,83,73,0.6)" }}>
                {CORE_QUESTIONS[step].hint}
              </p>
            )}
          </section>

          <section ref={scrollRef} className="flex-1 overflow-y-auto px-6 sm:px-10 md:px-14 max-w-[1400px] mx-auto w-full">
            <div className="grid md:grid-cols-12 gap-x-10">
              <div className="md:col-start-3 md:col-span-8 flex flex-col gap-6 pb-10">
                {turns
                  .slice(0, Math.max(0, turns.length - 1))
                  .map((t, i) => (
                    <div
                      key={i}
                      className="rounded-2xl px-5 py-4 text-[15.5px] leading-[1.65] whitespace-pre-wrap"
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

          <footer
            className="sticky bottom-0 px-6 sm:px-10 md:px-14 py-5"
            style={{ backgroundColor: palette.bg, boxShadow: "0 -10px 30px rgba(242,239,233,0.9)" }}
          >
            <div className="max-w-[1100px] mx-auto">
              <div className="rounded-3xl p-3 flex items-end gap-3" style={{ backgroundColor: palette.cream }}>
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
        </>
      )}

      {phase === "email" && (
        <section className="flex-1 px-6 sm:px-10 md:px-14 pt-16 md:pt-24 pb-20 max-w-[1100px] mx-auto w-full">
          <div className="text-[11px] tracking-[0.28em] mb-5" style={{ color: "rgba(87,83,73,0.55)" }}>
            &mdash; one last thing
          </div>
          <h1
            className="font-black tracking-[-0.035em] leading-[0.95] max-w-[20ch]"
            style={{ color: palette.ink, fontSize: "clamp(2.2rem, 6vw, 4.8rem)" }}
          >
            where should we send your signature story?
          </h1>
          <p className="mt-6 text-[15px] max-w-[55ch]" style={{ color: "rgba(87,83,73,0.7)" }}>
            we'll generate it on the next screen — yours to read, copy, and download.
            no account, no spam.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitEmail();
            }}
            className="mt-10 flex flex-col sm:flex-row gap-3 max-w-[640px]"
          >
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourdomain.com"
              className="flex-1 h-14 px-5 rounded-full bg-transparent outline-none text-[16px] lowercase border"
              style={{ borderColor: "rgba(87,83,73,0.25)", color: palette.ink }}
            />
            <button
              type="submit"
              className="h-14 px-8 rounded-full font-bold tracking-[0.16em] text-[12px] shrink-0"
              style={{ backgroundColor: palette.orange, color: palette.bg }}
            >
              show me my story
            </button>
          </form>
        </section>
      )}

      {phase === "generating" && (
        <section className="flex-1 px-6 sm:px-10 md:px-14 pt-16 md:pt-24 pb-20 max-w-[1100px] mx-auto w-full">
          <div className="text-[11px] tracking-[0.28em] mb-5" style={{ color: "rgba(87,83,73,0.55)" }}>
            &mdash; finding your thread
          </div>
          <h1
            className="font-black tracking-[-0.035em] leading-[0.95] max-w-[20ch]"
            style={{ color: palette.ink, fontSize: "clamp(2.2rem, 6vw, 4.8rem)" }}
          >
            reading every answer...
          </h1>
          <p className="mt-6 text-[15px] max-w-[55ch]" style={{ color: "rgba(87,83,73,0.7)" }}>
            listening for the line that runs through them all. about thirty seconds.
          </p>
        </section>
      )}
    </div>
  );
};

export default Interview;
