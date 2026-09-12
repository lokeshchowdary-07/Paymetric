import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listCompensation } from "@/lib/queries";
import { compensationQuerySchema } from "@/lib/validations/compensation";
import { formatCurrency } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

function hrefWith(
  current: Record<string, string | undefined>,
  patch: Record<string, string | number | undefined>
) {
  const params = new URLSearchParams();
  const merged = { ...current, ...patch };
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `/compensation?${qs}` : "/compensation";
}

export default async function CompensationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") flat[key] = value;
  }

  const parsedResult = compensationQuerySchema.safeParse(flat);
  const parsed = parsedResult.success
    ? parsedResult.data
    : compensationQuerySchema.parse({});
  const result = await listCompensation(parsed);

  const [companies, roles, locations] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.role.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    prisma.compensationEntry.findMany({
      distinct: ["location"],
      select: { location: true },
      orderBy: { location: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / parsed.limit));
  const query = {
    companyId: parsed.companyId,
    standardLevel: parsed.standardLevel,
    location: parsed.location,
    role: parsed.role,
    sortBy: parsed.sortBy,
    sortOrder: parsed.sortOrder,
    limit: String(parsed.limit),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Compensation</h1>
      <p className="mt-2 text-slate-600">
        Filters, sort, and pagination run in the database query.
      </p>

      <form method="get" className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <label className="text-sm">
          Company
          <select name="companyId" defaultValue={parsed.companyId ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2">
            <option value="">All</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Level
          <select name="standardLevel" defaultValue={parsed.standardLevel ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2">
            <option value="">All</option>
            {["L1", "L2", "L3", "L4", "L5", "L6"].map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Location
          <select name="location" defaultValue={parsed.location ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2">
            <option value="">All</option>
            {locations.map((row) => (
              <option key={row.location} value={row.location}>
                {row.location}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Role
          <select name="role" defaultValue={parsed.role ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2">
            <option value="">All</option>
            {roles.map((role) => (
              <option key={role.name} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Sort by
          <select name="sortBy" defaultValue={parsed.sortBy} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2">
            <option value="totalComp">Total comp</option>
            <option value="createdAt">Created</option>
          </select>
        </label>
        <label className="text-sm">
          Order
          <select name="sortOrder" defaultValue={parsed.sortOrder} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2">
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </label>
        <div className="sm:col-span-2 lg:col-span-6">
          <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Apply
          </button>
        </div>
      </form>

      <p className="mt-4 text-sm text-slate-500">{result.total} rows</p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Company</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Level</th>
              <th className="px-3 py-2 font-medium">Location</th>
              <th className="px-3 py-2 font-medium">Base</th>
              <th className="px-3 py-2 font-medium">Bonus</th>
              <th className="px-3 py-2 font-medium">Stock</th>
              <th className="px-3 py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{row.company.name}</td>
                <td className="px-3 py-2">{row.role.name}</td>
                <td className="px-3 py-2">{row.standardLevel}</td>
                <td className="px-3 py-2">{row.location}</td>
                <td className="px-3 py-2">{formatCurrency(row.baseSalary)}</td>
                <td className="px-3 py-2">{formatCurrency(row.bonus)}</td>
                <td className="px-3 py-2">{formatCurrency(row.stock)}</td>
                <td className="px-3 py-2 font-medium">{formatCurrency(row.totalComp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm">
        {parsed.page > 1 ? (
          <Link href={hrefWith(query, { page: parsed.page - 1 })} className="text-teal-800 hover:underline">
            Previous
          </Link>
        ) : (
          <span className="text-slate-400">Previous</span>
        )}
        <span>
          Page {parsed.page} of {totalPages}
        </span>
        {parsed.page < totalPages ? (
          <Link href={hrefWith(query, { page: parsed.page + 1 })} className="text-teal-800 hover:underline">
            Next
          </Link>
        ) : (
          <span className="text-slate-400">Next</span>
        )}
      </div>
    </main>
  );
}
