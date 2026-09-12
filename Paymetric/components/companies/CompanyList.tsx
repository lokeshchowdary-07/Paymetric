"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Company = { id: string; name: string; entryCount: number; averageTotalComp: number | null };
const money = (value: number | null) => value === null ? "—" : `$${value.toLocaleString()}`;

export function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  useEffect(() => { fetch("/api/companies").then((response) => response.json()).then((payload) => setCompanies(payload.data ?? [])); }, []);
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{companies.map((company) => (
    <Link key={company.id} href={`/companies/${company.id}`} className="group border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-teal-400 hover:shadow-xl hover:shadow-teal-950/5">
      <div className="mb-12 flex items-start justify-between"><span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Comp index</span><span className="text-slate-300 transition group-hover:text-teal-600">↗</span></div>
      <h2 className="text-2xl font-bold text-slate-950">{company.name}</h2>
      <div className="mt-5 flex gap-8 text-sm"><div><p className="text-slate-500">Records</p><p className="mt-1 font-mono font-bold text-slate-900">{company.entryCount}</p></div><div><p className="text-slate-500">Average total</p><p className="mt-1 font-mono font-bold text-slate-900">{money(company.averageTotalComp)}</p></div></div>
    </Link>
  ))}</div>;
}
