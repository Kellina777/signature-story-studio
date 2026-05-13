// the finished signature story blueprint — readable by share link.
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { palette, baseStyle } from "@/lib/theme";

type Section = { key: string; title: string; body: string };
type BP = {
  id: string;
  share_slug: string;
  title: string;
  sections: Section[];
  created_at: string;
};

const Blueprint = () => {
  const { slug } = useParams<{ slug: string }>();
  const [bp, setBp] = useState<BP | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("blueprints")
        .select("*")
        .eq("share_slug", slug!)
        .maybeSingle();
      setLoading(false);
      if (error) return toast.error(error.message);
      if (!data) return;
      setBp(data as unknown as BP);
    })();
  }, [slug]);

  const copySection = async (s: Section) => {
    await navigator.clipboard.writeText(`${s.title}\n\n${s.body}`);
    toast.success("copied");
  };

  const copyAll = async () => {
    if (!bp) return;
    const all = `${bp.title}\n\n${bp.sections
      .map((s) => `${s.title}\n\n${s.body}`)
      .join("\n\n— — —\n\n")}`;
    await navigator.clipboard.writeText(all);
    toast.success("full blueprint copied");
  };

  const copyShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("share link copied");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center lowercase" style={baseStyle}>
        <span className="text-[12px] tracking-[0.22em]" style={{ color: palette.inkSoft }}>loading...</span>
      </div>
    );
  }

  if (!bp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center lowercase gap-4" style={baseStyle}>
        <h1 className="font-black text-[3rem]" style={{ color: palette.ink }}>not found.</h1>
        <Link to="/" className="text-[12px] tracking-[0.22em] underline underline-offset-4" style={{ color: palette.inkSoft }}>
          back home
        </Link>
      </div>
    );
  }

  const downloadPdf = () => window.print();

  return (
    <div className="min-h-screen lowercase blueprint-page" style={baseStyle}>
      {/* nav */}
      <header className="px-6 sm:px-10 md:px-14 pt-6 pb-4 flex items-center justify-between gap-3 no-print">
        <Link to="/" className="text-[12px] tracking-[0.22em]" style={{ color: palette.inkSoft }}>
          &larr; signature
        </Link>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <button
            onClick={copyShare}
            className="h-10 px-5 rounded-full text-[11px] tracking-[0.2em] font-medium"
            style={{ backgroundColor: palette.cream, color: palette.ink }}
          >
            copy share link
          </button>
          <button
            onClick={downloadPdf}
            className="h-10 px-5 rounded-full text-[11px] tracking-[0.2em] font-medium"
            style={{ backgroundColor: palette.cream, color: palette.ink }}
          >
            download pdf
          </button>
          <button
            onClick={copyAll}
            className="h-10 px-5 rounded-full text-[11px] tracking-[0.2em] font-bold"
            style={{ backgroundColor: palette.orange, color: palette.bg }}
          >
            copy all
          </button>
        </div>
      </header>

      {/* hero */}
      <section className="px-6 sm:px-10 md:px-14 pt-12 md:pt-20 pb-16 max-w-[1400px] mx-auto">
        <div className="text-[11px] tracking-[0.28em] mb-6" style={{ color: "rgba(87,83,73,0.55)" }}>
          &mdash; the signature story blueprint
        </div>
        <h1
          className="font-black tracking-[-0.04em] leading-[0.88] max-w-[20ch]"
          style={{ color: palette.ink, fontSize: "clamp(2.75rem, 8vw, 7rem)" }}
        >
          {bp.title}
        </h1>
        <p className="mt-6 text-[14px]" style={{ color: "rgba(87,83,73,0.6)" }}>
          {new Date(bp.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          {!isOwner && me === null ? " · viewing a shared blueprint" : ""}
        </p>
      </section>

      {/* sections */}
      <section className="px-6 sm:px-10 md:px-14 pb-32 max-w-[1400px] mx-auto">
        <div className="flex flex-col gap-12 md:gap-16">
          {bp.sections.map((s, i) => (
            <article
              key={s.key}
              className="grid md:grid-cols-12 gap-6 md:gap-10 pt-10 border-t"
              style={{ borderColor: "rgba(87,83,73,0.12)" }}
            >
              <header className="md:col-span-4">
                <div className="text-[11px] tracking-[0.28em] mb-3" style={{ color: palette.orange }}>
                  {String(i + 1).padStart(2, "0")} &middot; {s.key}
                </div>
                <h2
                  className="font-black tracking-[-0.03em] leading-[0.95]"
                  style={{ color: palette.ink, fontSize: "clamp(1.75rem, 3.4vw, 2.6rem)" }}
                >
                  {s.title}
                </h2>
                <button
                  onClick={() => copySection(s)}
                  className="mt-5 text-[10.5px] tracking-[0.22em] underline underline-offset-4"
                  style={{ color: palette.inkSoft }}
                >
                  copy section
                </button>
              </header>
              <div className="md:col-span-8">
                <p
                  className="text-[17px] md:text-[18px] leading-[1.75] whitespace-pre-wrap"
                  style={{ color: "rgba(87,83,73,0.92)" }}
                >
                  {s.body}
                </p>
              </div>
            </article>
          ))}
        </div>

        {isOwner && (
          <div className="mt-20 flex flex-wrap items-center gap-3">
            <Link
              to="/interview"
              className="h-12 px-6 inline-flex items-center rounded-full text-[11px] tracking-[0.22em] font-bold"
              style={{ backgroundColor: palette.dark, color: palette.cream }}
            >
              start a new interview
            </Link>
            <button
              onClick={copyShare}
              className="h-12 px-6 rounded-full text-[11px] tracking-[0.22em] font-medium"
              style={{ backgroundColor: palette.cream, color: palette.ink }}
            >
              copy share link
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Blueprint;
