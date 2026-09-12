import Link from "next/link";
import { listCompaniesWithStats } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string | string[] }>;
}) {
  const rawSearch = (await searchParams).search;
  const search = typeof rawSearch === "string" ? rawSearch : "";
  const companies = await listCompaniesWithStats(search);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Companies</h1>
      <p className="mt-2 text-slate-600">
        Each company has a curated native-to-standard level mapping. Stats are
        computed from ingested compensation entries.
      </p>
      <form method="get" className="mt-6 flex max-w-xl gap-3">
        <label className="sr-only" htmlFor="company-search">
          Search companies
        </label>
        <input
          id="company-search"
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Search companies"
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Search
        </button>
      </form>
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
