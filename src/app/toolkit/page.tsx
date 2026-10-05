import Link from "next/link";
import { PublicToolkit } from "@/components/landing/public-toolkit";
import { BRAND } from "@/lib/brand";
import { withBasePath } from "@/lib/base-path";

export default function ToolkitPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-5 py-4 sm:px-6 lg:px-10">
          <img
            src={withBasePath("/brand/agp-mark.svg")}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
          />
          <span className="truncate whitespace-nowrap font-serif text-[1.0625rem] sm:text-[1.125rem]">
            {BRAND.name}
          </span>
          <nav className="ml-auto flex shrink-0 items-center gap-4 whitespace-nowrap text-[0.875rem]">
            <Link href="/">Home</Link>
            <Link href="/help">Help</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1180px] px-5 pb-16 pt-12 sm:px-6 lg:px-10">
        <PublicToolkit />
      </main>
    </div>
  );
}
