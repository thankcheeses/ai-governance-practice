import Link from "next/link";
import { HowToOperateButton } from "@/components/landing/first-visit-tour";
import { BRAND } from "@/lib/brand";
import { withBasePath } from "@/lib/base-path";

export const metadata = {
  title: `How this works \u00b7 ${BRAND.name}`,
};

export default function HelpPage() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-card/80">
        <div className="mx-auto flex max-w-[720px] items-center justify-between px-5 py-4">
          <Link href="/" className="font-serif text-[1.125rem] no-underline">
            {BRAND.name}
          </Link>
          <HowToOperateButton />
        </div>
      </header>
      <main className="mx-auto max-w-[720px] px-5 py-10 sm:py-14">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent-foreground">
          Help
        </p>
        <h1 className="mt-2 font-serif text-[2rem] leading-tight">How to operate this app</h1>
        <p className="mt-3 text-[1rem] leading-relaxed text-muted-foreground">
          Read a situation. Decide what you would do. Progress stays on this device unless you sign in to sync.
        </p>
        <section className="mt-10">
          <h2 className="font-serif text-[1.5rem]">Four passes</h2>
          <img
            src={withBasePath("/brand/agp-four-pass.svg")}
            alt="Facts, Obligations, Risks, Action"
            className="mt-5 w-full rounded-2xl border border-border"
            width={1200}
            height={560}
          />
          <ol className="mt-6 space-y-4 text-[0.9375rem] leading-relaxed">
            <li><strong>Facts.</strong> What is actually described.</li>
            <li><strong>Obligations.</strong> What is required, and by whom.</li>
            <li><strong>Risks.</strong> What could go wrong for the people on the receiving end.</li>
            <li><strong>Action.</strong> The narrowest step that addresses that risk.</li>
          </ol>
        </section>
        <section className="mt-12">
          <h2 className="font-serif text-[1.5rem]">Study and Exam</h2>
          <img
            src={withBasePath("/brand/agp-study-exam.svg")}
            alt="Study versus Exam"
            className="mt-5 w-full rounded-2xl border border-border"
            width={1200}
            height={480}
          />
        </section>
        <section className="mt-12">
          <h2 className="font-serif text-[1.5rem]">Keys in Practice</h2>
          <p className="mt-3 text-[0.9375rem] text-muted-foreground">
            A–D or 1–4 to choose. Enter to submit or continue. N for next after feedback.
          </p>
        </section>
        <p className="mt-12">
          <Link href="/">Back to the start</Link>
        </p>
      </main>
    </div>
  );
}
