import Link from "next/link";
import { listCompaniesWithStats } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await listCompaniesWithStats();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Companies</h1>
      <p className="mt-2 text-slate-600">
        Each company has a curated native-to-standard level mapping. Stats are
        computed from ingested compensation entries.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <Link
            key={company.id}
            href={`/companies/${company.id}`}
            className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-700"
          >
            <h2 className="text-lg font-semibold">{company.name}</h2>
            <p className="mt-3 text-sm text-slate-600">
              {company.entryCount} entries
            </p>
            <p className="mt-1 text-sm text-slate-900">
              Avg total comp{" "}
              {company.avgTotalComp
                ? formatCurrency(company.avgTotalComp)
                : "—"}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
