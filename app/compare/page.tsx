import { CompareClient } from "@/components/comparison/CompareClient";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Compare</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Choose 2 to 4 entries by company, role, level, and location.
        Comparison score is computed on the fly: 50% same-level compensation
        percentile, 30% stored level score, 20% cash stability (base / total).
      </p>
      <div className="mt-8">
        <CompareClient />
      </div>
    </main>
  );
}
