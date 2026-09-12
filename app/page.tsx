import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
        Compensation intelligence
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Paymetric</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Compare tech compensation across companies using a researched leveling
        rubric. Native titles (SDE III, E5, Senior SDE) map to a shared L1–L6
        scale with a stored level score, then total compensation can be filtered,
        sorted, and scored side by side.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/companies"
          className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-700"
        >
          <h2 className="font-semibold">Companies</h2>
          <p className="mt-2 text-sm text-slate-600">
            Ladders of different lengths, with avg total comp and entry counts.
          </p>
        </Link>
        <Link
          href="/compensation"
          className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-700"
        >
          <h2 className="font-semibold">Compensation table</h2>
          <p className="mt-2 text-sm text-slate-600">
            Server-side filters, sort, and pagination over submitted offers.
          </p>
        </Link>
        <Link
          href="/compare"
          className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-700"
        >
          <h2 className="font-semibold">Compare</h2>
          <p className="mt-2 text-sm text-slate-600">
            Pick 2–4 real presets and rank them with a comparison score.
          </p>
        </Link>
      </div>
    </main>
  );
}
