import Link from "next/link";
import { notFound } from "next/navigation";
import { LevelChart } from "@/components/companies/LevelChart";
import { getCompanyDetail } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompanyDetail(id);
  if (!company) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/companies" className="text-sm text-teal-800 hover:underline">
        ← All companies
      </Link>
      <h1 className="mt-3 text-3xl font-semibold">{company.name}</h1>
      <p className="mt-2 text-slate-600">
        {company.entryCount} compensation entries. Native levels below are the
        seed-only mapping rubric.
      </p>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Average total comp by standard level</h2>
        <div className="mt-4">
          <LevelChart data={company.statsByLevel} />
        </div>
      </section>

      <section className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Standard</th>
              <th className="px-3 py-2 font-medium">Entries</th>
              <th className="px-3 py-2 font-medium">Avg total</th>
              <th className="px-3 py-2 font-medium">Median total</th>
            </tr>
          </thead>
          <tbody>
            {company.statsByLevel.map((row) => (
              <tr key={row.standardLevel} className="border-t border-slate-100">
                <td className="px-3 py-2">{row.standardLevel}</td>
                <td className="px-3 py-2">{row.entryCount}</td>
                <td className="px-3 py-2">
                  {row.avgTotalComp ? formatCurrency(row.avgTotalComp) : "—"}
                </td>
                <td className="px-3 py-2">
                  {row.medianTotalComp
                    ? formatCurrency(row.medianTotalComp)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <h2 className="px-3 py-3 text-sm font-semibold">Native level mapping</h2>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Native</th>
              <th className="px-3 py-2 font-medium">Standard</th>
              <th className="px-3 py-2 font-medium">YoE</th>
              <th className="px-3 py-2 font-medium">Scope</th>
              <th className="px-3 py-2 font-medium">Ladder</th>
              <th className="px-3 py-2 font-medium">Level score</th>
            </tr>
          </thead>
          <tbody>
            {company.levelMappings.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{row.nativeLevel}</td>
                <td className="px-3 py-2">{row.standardLevel}</td>
                <td className="px-3 py-2">
                  {row.yoeMin}–{row.yoeMax}
                </td>
                <td className="px-3 py-2">{row.scopeWeight}/5</td>
                <td className="px-3 py-2">
                  {row.levelIndex}/{row.totalLevels}
                </td>
                <td className="px-3 py-2">{row.levelScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
