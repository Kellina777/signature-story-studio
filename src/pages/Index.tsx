// "find your signature story" — landing page
// Palette is locked: #f2efe9 / #3c4235 / #d7d1c6 / #fb7339 / #575349
// DM Sans, lowercase, heavy. No black, no white, no blue, no cool grey.
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import heroTedTalk from "@/assets/hero-tedtalk.jpg";

const Index = () => {
  const stageRef = useRef<HTMLElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const softRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-parallax]")
    );

    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const stage = stageRef.current;
      const headline = headlineRef.current;
      const soft = softRef.current;
      if (stage && headline) {
        const rect = stage.getBoundingClientRect();
        const total = rect.height + vh;
        const p = Math.min(1, Math.max(0, (vh - rect.top) / total));
        const yHead = (0.5 - p) * 220;
        const ySoft = (p - 0.5) * 140;
        const opSoft = 0.55 + p * 0.45;
        headline.style.transform = `translate3d(0, ${yHead}px, 0)`;
        if (soft) {
          soft.style.transform = `translate3d(0, ${ySoft}px, 0)`;
          soft.style.opacity = String(Math.min(1, opSoft));
        }
      }
      for (const el of els) {
        const speed = parseFloat(el.dataset.parallax || "0.15");
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const delta = center - vh / 2;
        const y = -delta * speed;
        el.style.transform = `translate3d(0, ${y}px, 0)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="min-h-screen lowercase"
      style={{
        backgroundColor: "#f2efe9",
        color: "#575349",
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}
    >
      <style>{`
        .display { font-weight: 900; letter-spacing: -0.04em; line-height: 0.88; }
        .hero-h  { font-size: clamp(3.75rem, 12.5vw, 11rem); }
        .mega    { font-size: clamp(2.75rem, 8vw, 7.5rem); }
        .frosted {
          background: rgba(87,83,73,0.45);
          backdrop-filter: blur(22px) saturate(120%);
          -webkit-backdrop-filter: blur(22px) saturate(120%);
        }
        .grain {
          background-image: radial-gradient(rgba(87,83,73,.06) 1px, transparent 1px);
          background-size: 3px 3px;
        }
        .vignette {
          background: radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(60,66,53,0.55) 100%);
        }
        .hero-bg {
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          filter: saturate(0.9) sepia(0.12) brightness(0.82) contrast(1.05);
        }
        @media (max-width: 768px) { .hero-bg { background-attachment: scroll; } }
        ::selection { background: #fb7339; color: #f2efe9; }

        /* parallax section 2 — sticky heading + scroll-driven drift */
        .parallax-stage { position: relative; }
        .parallax-sticky {
          position: sticky;
          top: 18vh;
          will-change: transform;
        }
        @supports (animation-timeline: view()) {
          .parallax-headline {
            animation: drift-up linear both;
            animation-timeline: view();
            animation-range: cover 0% cover 100%;
          }
          .parallax-soft {
            animation: drift-down linear both;
            animation-timeline: view();
            animation-range: cover 0% cover 100%;
          }
          @keyframes drift-up {
            from { transform: translate3d(0, 12vh, 0); }
            to   { transform: translate3d(0, -14vh, 0); }
          }
          @keyframes drift-down {
            from { transform: translate3d(0, -4vh, 0); opacity: .6; }
            to   { transform: translate3d(0, 8vh, 0); opacity: 1; }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .parallax-headline, .parallax-soft { animation: none !important; }
          .parallax-sticky { position: static; }
        }
      `}</style>

      {/* NAVBAR — floating pill, doesn't touch edges */}
      <header className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between gap-3 pointer-events-none">
        <div
          className="pointer-events-auto flex items-center gap-3 rounded-full pl-2 pr-5 py-2"
          style={{ backgroundColor: "#f2efe9", boxShadow: "0 1px 0 rgba(87,83,73,0.06)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#3c4235" }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#d7d1c6" aria-hidden>
              <path d="M12 3c2.5 2 3.8 4.2 3.8 6.4 0 2.1-1.7 3.8-3.8 3.8s-3.8-1.7-3.8-3.8C8.2 7.2 9.5 5 12 3z" />
              <path d="M5.2 14.2c2.7-1 5.2-1 7 0 1.8 1 2.4 3.3 1.4 5.1-1 1.8-3.3 2.4-5.1 1.4-1.8-1-2.7-3.7-3.3-6.5z" />
              <path d="M18.8 14.2c-2.7-1-5.2-1-7 0-1.8 1-2.4 3.3-1.4 5.1 1 1.8 3.3 2.4 5.1 1.4 1.8-1 2.7-3.7 3.3-6.5z" />
            </svg>
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-[10px] tracking-[0.2em]" style={{ color: "rgba(87,83,73,0.6)" }}>signature</span>
            <span className="text-[11px] tracking-[0.18em] font-medium" style={{ color: "#575349" }}>a story coach</span>
          </div>
        </div>

        <div
          className="pointer-events-auto flex items-center rounded-full p-1"
          style={{ backgroundColor: "#f2efe9", boxShadow: "0 1px 0 rgba(87,83,73,0.06)" }}
        >
          <button
            aria-label="menu"
            className="w-12 h-12 rounded-full flex items-center justify-center transition"
            style={{ color: "#575349" }}
          >
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
              <path d="M0 1h18M0 11h18" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
          <Link
            to="/interview"
            className="px-6 sm:px-8 h-12 rounded-full inline-flex items-center font-bold tracking-[0.16em] text-[12px]"
            style={{ backgroundColor: "#fb7339", color: "#f2efe9" }}
          >
            begin
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section
        className="relative w-full overflow-hidden"
        style={{ backgroundColor: "#3c4235", height: "100svh", minHeight: 680 }}
      >
        <div className="absolute inset-0 hero-bg" style={{ backgroundImage: `url(${heroTedTalk})` }} />
        <div className="absolute inset-0 vignette" />

        {/* Headline */}
        <div className="absolute inset-0 flex">
          <div className="self-center w-full px-6 sm:px-10 md:px-14 -mt-10 md:-mt-16 z-10">
            <h1 className="display hero-h max-w-[18ch]" style={{ color: "#d7d1c6" }}>
              find your<br />signature<br />
              <span style={{ color: "rgba(215,209,198,0.65)" }}>story.</span>
            </h1>
            <p
              className="mt-6 md:mt-8 max-w-md text-[15px] leading-relaxed"
              style={{ color: "rgba(215,209,198,0.7)" }}
            >
              a personal ai story coach that asks you the questions
              you&rsquo;ve been waiting your whole life for someone to ask.
            </p>
          </div>
        </div>

        {/* Frosted info card */}
        <div className="absolute right-4 md:right-8 bottom-6 md:bottom-10 z-30 frosted rounded-2xl p-4 pr-6 flex items-center gap-3 max-w-[88%]">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(215,209,198,0.85)" }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#3c4235" aria-hidden>
              <circle cx="12" cy="8" r="3.2" />
              <path
                d="M5 20c1.4-3.4 4-5 7-5s5.6 1.6 7 5"
                stroke="#3c4235"
                strokeWidth="1.4"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="text-[10px] tracking-[0.22em]" style={{ color: "rgba(215,209,198,0.8)" }}>
              1/5 &middot; the interview
            </div>
            <div className="text-[13px] font-medium tracking-[0.02em]" style={{ color: "#d7d1c6" }}>
              eight questions. one thread. your story.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — what it is (parallax) */}
      <section
        ref={stageRef}
        className="grain px-6 sm:px-10 md:px-14 parallax-stage"
        style={{ backgroundColor: "#f2efe9", minHeight: "180vh", paddingTop: "12vh", paddingBottom: "20vh" }}
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="text-[11px] tracking-[0.28em] mb-8" style={{ color: "rgba(87,83,73,0.55)" }}>
            &mdash; what it is
          </div>
          <div className="parallax-sticky">
            <h2
              ref={headlineRef}
              className="display mega max-w-[20ch] parallax-headline"
              style={{ color: "#575349", willChange: "transform" }}
            >
              teaching<br />storytellers the way<br />
              <span
                ref={softRef}
                className="parallax-soft inline-block"
                style={{ color: "rgba(87,83,73,0.55)", willChange: "transform, opacity" }}
              >
                coaches teach coaches.
              </span>
            </h2>
          </div>
          <div className="mt-[55vh] md:mt-[60vh] grid md:grid-cols-12 gap-10">
            <p
              className="md:col-start-7 md:col-span-5 text-[17px] leading-[1.7]"
              style={{ color: "rgba(87,83,73,0.85)" }}
            >
              you open it. instead of staring at a blank page trying to decode your own brand,
              you&rsquo;re interviewed by something that already knows the right questions.
              it listens. it finds the thread. and it hands you back the one thing
              you&rsquo;ve never quite been able to write yourself &mdash; clarity.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — three steps */}
      <section className="px-6 sm:px-10 md:px-14 py-28 md:py-40" style={{ backgroundColor: "#3c4235", color: "#d7d1c6" }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="text-[11px] tracking-[0.28em] mb-10" style={{ color: "rgba(215,209,198,0.6)" }}>
            &mdash; how it works
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 items-start">
            <article
              data-parallax="0.18"
              className="rounded-[28px] p-8 md:p-10 min-h-[360px] flex flex-col justify-between will-change-transform"
              style={{ backgroundColor: "#d7d1c6", color: "#575349" }}
            >
              <div className="text-[12px] tracking-[0.28em]" style={{ color: "rgba(87,83,73,0.55)" }}>01</div>
              <div>
                <h3 className="display text-[2.6rem] md:text-[3.2rem] leading-[0.9]">it interviews<br />you.</h3>
                <p className="mt-5 text-[15px] leading-[1.65] max-w-[28ch]" style={{ color: "rgba(87,83,73,0.8)" }}>
                  eight to ten deep but simple questions about your turning points,
                  your beliefs, your people, your why.
                </p>
              </div>
            </article>
            <article
              data-parallax="0.08"
              className="rounded-[28px] p-8 md:p-10 min-h-[360px] flex flex-col justify-between will-change-transform"
              style={{ backgroundColor: "#d7d1c6", color: "#575349" }}
            >
              <div className="text-[12px] tracking-[0.28em]" style={{ color: "rgba(87,83,73,0.55)" }}>02</div>
              <div>
                <h3 className="display text-[2.6rem] md:text-[3.2rem] leading-[0.9]">it finds<br />the thread.</h3>
                <p className="mt-5 text-[15px] leading-[1.65] max-w-[28ch]" style={{ color: "rgba(87,83,73,0.8)" }}>
                  it absorbs your language, your emotion, your unique experiences &mdash;
                  and the line that quietly connects them all.
                </p>
              </div>
            </article>
            <article
              data-parallax="0.22"
              className="rounded-[28px] p-8 md:p-10 min-h-[360px] flex flex-col justify-between will-change-transform"
              style={{ backgroundColor: "#fb7339", color: "#f2efe9" }}
            >
              <div className="text-[12px] tracking-[0.28em]" style={{ color: "rgba(242,239,233,0.75)" }}>03</div>
              <div>
                <h3 className="display text-[2.6rem] md:text-[3.2rem] leading-[0.9]">it builds<br />your blueprint.</h3>
                <p className="mt-5 text-[15px] leading-[1.65] max-w-[28ch]" style={{ color: "rgba(242,239,233,0.9)" }}>
                  a personalized signature story document &mdash;
                  yours, in your own words, ready to use anywhere.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* SECTION 3.5 — features */}
      <section className="grain px-6 sm:px-10 md:px-14 py-28 md:py-40" style={{ backgroundColor: "#f2efe9" }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-end justify-between flex-wrap gap-8 mb-14">
            <h2 className="display mega max-w-[16ch]" style={{ color: "#575349" }}>
              what it actually<br />
              <span style={{ color: "rgba(87,83,73,0.55)" }}>does for you.</span>
            </h2>
            <div className="text-[11px] tracking-[0.28em] mb-3" style={{ color: "rgba(87,83,73,0.55)" }}>&mdash; the features</div>
          </div>

          <div className="grid md:grid-cols-6 gap-5">
            {/* big tile — guided interview */}
            <article
              className="md:col-span-4 rounded-[28px] p-8 md:p-12 flex flex-col justify-between min-h-[340px]"
              style={{ backgroundColor: "#3c4235", color: "#d7d1c6" }}
            >
              <div className="text-[11px] tracking-[0.28em]" style={{ color: "rgba(215,209,198,0.6)" }}>01 &middot; the guided interview</div>
              <div>
                <h3 className="display text-[2.4rem] md:text-[3.4rem] leading-[0.92]" style={{ color: "#d7d1c6" }}>
                  the questions you&rsquo;ve<br />
                  <span style={{ color: "rgba(215,209,198,0.6)" }}>been waiting for.</span>
                </h3>
                <p className="mt-6 text-[15px] md:text-[16px] leading-[1.7] max-w-[44ch]" style={{ color: "rgba(215,209,198,0.78)" }}>
                  a calm, conversational interview that pulls turning points,
                  beliefs and the why behind your work &mdash; one question at a time, your pace.
                </p>
              </div>
            </article>

            {/* voice capture */}
            <article
              className="md:col-span-2 rounded-[28px] p-8 flex flex-col justify-between min-h-[340px]"
              style={{ backgroundColor: "#fb7339", color: "#f2efe9" }}
            >
              <div className="text-[11px] tracking-[0.28em]" style={{ color: "rgba(242,239,233,0.8)" }}>02 &middot; your voice</div>
              <div>
                <h3 className="display text-[2rem] md:text-[2.4rem] leading-[0.95]">
                  it learns<br />how you talk.
                </h3>
                <p className="mt-4 text-[14.5px] leading-[1.65]" style={{ color: "rgba(242,239,233,0.92)" }}>
                  rhythm, slang, the phrases only you use &mdash; preserved, not polished out.
                </p>
              </div>
            </article>

            {/* thread finder */}
            <article className="md:col-span-2 rounded-2xl p-7 min-h-[260px] flex flex-col justify-between" style={{ backgroundColor: "#d7d1c6" }}>
              <div className="text-[11px] tracking-[0.24em]" style={{ color: "#fb7339" }}>03 &middot; the thread</div>
              <div>
                <h4 className="display text-[1.8rem] leading-[0.95]" style={{ color: "#575349" }}>
                  finds the line<br />you couldn&rsquo;t see.
                </h4>
                <p className="mt-3 text-[14px] leading-[1.6]" style={{ color: "rgba(87,83,73,0.8)" }}>
                  connects scattered moments into one through-line that runs across everything you do.
                </p>
              </div>
            </article>

            {/* blueprint document */}
            <article className="md:col-span-2 rounded-2xl p-7 min-h-[260px] flex flex-col justify-between" style={{ backgroundColor: "#d7d1c6" }}>
              <div className="text-[11px] tracking-[0.24em]" style={{ color: "#fb7339" }}>04 &middot; the blueprint</div>
              <div>
                <h4 className="display text-[1.8rem] leading-[0.95]" style={{ color: "#575349" }}>
                  a 7-part<br />story document.
                </h4>
                <p className="mt-3 text-[14px] leading-[1.6]" style={{ color: "rgba(87,83,73,0.8)" }}>
                  origin, message, value, client, pillars, offer, bio &mdash; one place, ready to use.
                </p>
              </div>
            </article>

            {/* ready-to-paste bio */}
            <article className="md:col-span-2 rounded-2xl p-7 min-h-[260px] flex flex-col justify-between" style={{ backgroundColor: "#d7d1c6" }}>
              <div className="text-[11px] tracking-[0.24em]" style={{ color: "#fb7339" }}>05 &middot; ready to paste</div>
              <div>
                <h4 className="display text-[1.8rem] leading-[0.95]" style={{ color: "#575349" }}>
                  a bio &amp; one-liner<br />you&rsquo;d actually use.
                </h4>
                <p className="mt-3 text-[14px] leading-[1.6]" style={{ color: "rgba(87,83,73,0.8)" }}>
                  drop into linkedin, instagram, sales pages, intro emails &mdash; today.
                </p>
              </div>
            </article>

            {/* content pillars */}
            <article className="md:col-span-3 rounded-2xl p-7 min-h-[220px] flex flex-col justify-between" style={{ backgroundColor: "#d7d1c6" }}>
              <div className="text-[11px] tracking-[0.24em]" style={{ color: "#fb7339" }}>06 &middot; content pillars</div>
              <div>
                <h4 className="display text-[1.8rem] leading-[0.95]" style={{ color: "#575349" }}>
                  never wonder<br />what to post about again.
                </h4>
                <p className="mt-3 text-[14px] leading-[1.6]" style={{ color: "rgba(87,83,73,0.8)" }}>
                  3&ndash;5 themes pulled from your story that fuel months of on-brand content.
                </p>
              </div>
            </article>

            {/* re-interview */}
            <article className="md:col-span-3 rounded-2xl p-7 min-h-[220px] flex flex-col justify-between" style={{ backgroundColor: "#d7d1c6" }}>
              <div className="text-[11px] tracking-[0.24em]" style={{ color: "#fb7339" }}>07 &middot; you, evolving</div>
              <div>
                <h4 className="display text-[1.8rem] leading-[0.95]" style={{ color: "#575349" }}>
                  re-interview as<br />you grow.
                </h4>
                <p className="mt-3 text-[14px] leading-[1.6]" style={{ color: "rgba(87,83,73,0.8)" }}>
                  your story isn&rsquo;t static. come back, add chapters, and the blueprint updates with you.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* SECTION 4 — who it's for */}
      <section className="grain px-6 sm:px-10 md:px-14 py-28 md:py-40" style={{ backgroundColor: "#f2efe9" }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-end justify-between flex-wrap gap-8 mb-14">
            <h2 className="display mega max-w-[16ch]" style={{ color: "#575349" }}>
              for anyone whose<br />
              <span style={{ color: "rgba(87,83,73,0.55)" }}>work is the message.</span>
            </h2>
            <div className="text-[11px] tracking-[0.28em] mb-3" style={{ color: "rgba(87,83,73,0.55)" }}>&mdash; built for</div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { tag: "the coach", h: ["stop sounding", "like the other 50,000."], p: "say something only you could say — the line that makes your ideal client stop scrolling." },
              { tag: "the realtor", h: ["the story", "sells the house."], p: "not the credentials, not the market report. the why behind your work." },
              { tag: "the chiropractor", h: ["trust before", "treatment."], p: "share why you got into the field and patients connect before they ever book." },
              { tag: "the speaker", h: ["the opener", "that earns the room."], p: "the signature story behind the signature talk — the one they remember on the drive home." },
              { tag: "the business owner", h: ["people don\u2019t buy", "products. they buy you."], p: "turn scattered life experiences into a focused brand narrative customers evangelize." },
            ].map((c) => (
              <div key={c.tag} className="rounded-2xl p-7" style={{ backgroundColor: "#d7d1c6" }}>
                <div className="text-[11px] tracking-[0.24em] mb-4" style={{ color: "#fb7339" }}>{c.tag}</div>
                <h4 className="display text-[1.9rem] leading-[0.95]" style={{ color: "#575349" }}>
                  {c.h[0]}<br />{c.h[1]}
                </h4>
                <p className="mt-4 text-[14.5px] leading-[1.65]" style={{ color: "rgba(87,83,73,0.8)" }}>{c.p}</p>
              </div>
            ))}
            <div
              className="rounded-2xl p-7 flex items-end"
              style={{ border: "1px solid rgba(87,83,73,0.15)" }}
            >
              <p className="display text-[1.5rem] leading-[1.05]" style={{ color: "rgba(87,83,73,0.7)" }}>
                and anyone tired of<br />sounding like everyone<br />else in their feed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — blueprint deliverables */}
      <section className="px-6 sm:px-10 md:px-14 py-28 md:py-40" style={{ backgroundColor: "#3c4235", color: "#d7d1c6" }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-5">
              <div className="text-[11px] tracking-[0.28em] mb-6" style={{ color: "rgba(215,209,198,0.6)" }}>&mdash; the deliverable</div>
              <h2 className="display mega" style={{ color: "#d7d1c6" }}>
                your<br />signature<br />
                <span style={{ color: "rgba(215,209,198,0.55)" }}>story<br />blueprint.</span>
              </h2>
              <p className="mt-8 text-[15.5px] leading-[1.7] max-w-md" style={{ color: "rgba(215,209,198,0.75)" }}>
                a single, deeply personal document. seven pieces. one voice. yours.
              </p>
            </div>
            <ol
              className="md:col-span-7 md:pl-10"
              style={{ borderTop: "1px solid rgba(215,209,198,0.15)", borderBottom: "1px solid rgba(215,209,198,0.15)" }}
            >
              {[
                "your origin story.",
                "your core message.",
                "your unique value.",
                "your ideal client.",
                "your content pillars.",
                "your offer alignment.",
                "your bio — ready to paste.",
              ].map((label, i) => (
                <li
                  key={label}
                  className="py-5 flex items-baseline gap-6"
                  style={i > 0 ? { borderTop: "1px solid rgba(215,209,198,0.15)" } : undefined}
                >
                  <span className="text-[12px] tracking-[0.28em] w-8" style={{ color: "rgba(215,209,198,0.5)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="display text-[1.7rem] md:text-[2rem]"
                    style={{ color: i === 6 ? "#fb7339" : "#d7d1c6" }}
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section id="begin" className="grain px-6 sm:px-10 md:px-14 py-32 md:py-44" style={{ backgroundColor: "#f2efe9" }}>
        <div className="max-w-[1400px] mx-auto">
          <h2 className="display hero-h max-w-[16ch]" style={{ color: "#575349" }}>
            you go in<br />not knowing.<br />
            <span style={{ color: "rgba(87,83,73,0.55)" }}>you come out</span><br />
            knowing exactly<br />who you are.
          </h2>

          <div className="mt-14 flex flex-wrap items-center gap-4">
            <Link
              to="/interview"
              className="rounded-full px-8 h-14 inline-flex items-center font-bold tracking-[0.18em] text-[13px]"
              style={{ backgroundColor: "#fb7339", color: "#f2efe9" }}
            >
              begin your interview &nbsp;&rarr;
            </Link>
            <span className="text-[12px] tracking-[0.22em]" style={{ color: "rgba(87,83,73,0.55)" }}>
              ~ 12 minutes &middot; one sitting &middot; entirely yours
            </span>
          </div>
        </div>
      </section>

      <footer
        className="px-6 sm:px-10 md:px-14 py-10 flex flex-wrap items-center justify-between gap-4 text-[12px] tracking-[0.2em]"
        style={{ backgroundColor: "#3c4235", color: "rgba(215,209,198,0.7)" }}
      >
        <span>&copy; signature &mdash; a story coach</span>
        <span style={{ color: "rgba(215,209,198,0.45)" }}>made slowly. on purpose.</span>
      </footer>
    </div>
  );
};

export default Index;
