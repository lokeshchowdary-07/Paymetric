"use client";

import { useEffect, useState } from "react";

type Record = { id: string; company: { name: string }; role: { name: string }; standardLevel: string; location: string; baseSalary: number; bonus: number; stock: number; totalComp: number };
type Company = { id: string; name: string };
const money = (value: number) => `$${value.toLocaleString()}`;

export function CompensationTable() {
  const [rows, setRows] = useState<Record[]>([]); const [companies, setCompanies] = useState<Company[]>([]); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ companyId: "", standardLevel: "", location: "", role: "", sortBy: "totalComp", sortOrder: "desc" });
  useEffect(() => { fetch("/api/companies").then((response) => response.json()).then((payload) => setCompanies(payload.data ?? [])); }, []);
  useEffect(() => { const query = new URLSearchParams({ page: String(page), limit: "12", ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) }); fetch(`/api/compensation?${query}`).then((response) => response.json()).then((payload) => { setRows(payload.data ?? []); setTotal(payload.total ?? 0); }); }, [filters, page]);
  const update = (key: string, value: string) => { setPage(1); setFilters((current) => ({ ...current, [key]: value })); };
  const pages = Math.max(1, Math.ceil(total / 12));
  return <div>
    <div className="mb-6 grid gap-3 md:grid-cols-4"><select value={filters.companyId} onChange={(event) => update("companyId", event.target.value)} className="field"><option value="">All companies</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select><select value={filters.standardLevel} onChange={(event) => update("standardLevel", event.target.value)} className="field"><option value="">All levels</option>{["L1", "L2", "L3", "L4", "L5", "L6"].map((level) => <option key={level}>{level}</option>)}</select><input value={filters.location} onChange={(event) => update("location", event.target.value)} className="field" placeholder="Location" /><input value={filters.role} onChange={(event) => update("role", event.target.value)} className="field" placeholder="Role" /></div>
    <div className="mb-4 flex items-center justify-between text-sm text-slate-500"><span>{total} records</span><select value={`${filters.sortBy}:${filters.sortOrder}`} onChange={(event) => { const [sortBy, sortOrder] = event.target.value.split(":"); setFilters((current) => ({ ...current, sortBy, sortOrder })); }} className="field w-auto"><option value="totalComp:desc">Highest total comp</option><option value="totalComp:asc">Lowest total comp</option><option value="createdAt:desc">Newest</option></select></div>
    <div className="overflow-x-auto border border-slate-200 bg-white"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{["Company", "Role", "Level", "Location", "Base", "Bonus", "Stock", "Total"].map((heading) => <th className="px-4 py-3 font-semibold" key={heading}>{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.id} className="hover:bg-teal-50/40"><td className="px-4 py-4 font-semibold text-slate-900">{row.company.name}</td><td className="px-4 py-4 text-slate-600">{row.role.name}</td><td className="px-4 py-4"><span className="rounded bg-teal-50 px-2 py-1 font-mono text-xs font-bold text-teal-700">{row.standardLevel}</span></td><td className="px-4 py-4 text-slate-600">{row.location}</td><td className="px-4 py-4 font-mono">{money(row.baseSalary)}</td><td className="px-4 py-4 font-mono">{money(row.bonus)}</td><td className="px-4 py-4 font-mono">{money(row.stock)}</td><td className="px-4 py-4 font-mono font-bold text-slate-950">{money(row.totalComp)}</td></tr>)}</tbody></table></div>
    <div className="mt-5 flex items-center justify-between text-sm"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="button">← Previous</button><span className="font-mono text-slate-500">Page {page} / {pages}</span><button disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="button">Next →</button></div>
  </div>;
}
