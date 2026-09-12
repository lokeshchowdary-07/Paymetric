"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils/format";

type Company = {
  id: string;
  name: string;
};

type RoleOption = {
  id: string;
  name: string;
};

type LocationOption = {
  location: string;
  entryId: string;
};

type CompareRow = {
  id: string;
  nativeLevel: string;
  standardLevel: string;
  location: string;
  baseSalary: number;
  bonus: number;
  stock: number;
  totalComp: number;
  levelScore: number;
  comparisonScore: number;
  scoreBreakdown: {
    compPercentile: number;
    levelScoreNormalized: number;
    stabilityScore: number;
  };
  company: { name: string };
  role: { name: string };
};

export function CompareClient() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [standardLevel, setStandardLevel] = useState("");
  const [location, setLocation] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({});
  const [results, setResults] = useState<CompareRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/companies")
      .then((response) => response.json())
      .then((payload) => setCompanies(payload.data ?? []))
      .catch(() => setError("Could not load companies."));
  }, []);

  useEffect(() => {
    if (!companyId) {
      setRoles([]);
      return;
    }
    fetch(`/api/compare/options?step=role&companyId=${companyId}`)
      .then((response) => response.json())
      .then((payload) => setRoles(payload.data ?? []))
      .catch(() => setError("Could not load roles."));
  }, [companyId]);

  useEffect(() => {
    if (!companyId || !roleId) {
      setLevels([]);
      return;
    }
    fetch(`/api/compare/options?step=level&companyId=${companyId}&roleId=${roleId}`)
      .then((response) => response.json())
      .then((payload) => setLevels(payload.data ?? []))
      .catch(() => setError("Could not load levels."));
  }, [companyId, roleId]);

  useEffect(() => {
    if (!companyId || !roleId || !standardLevel) {
      setLocations([]);
      return;
    }
    const query = new URLSearchParams({
      step: "location",
      companyId,
      roleId,
      standardLevel,
    });
    fetch(`/api/compare/options?${query}`)
      .then((response) => response.json())
      .then((payload) => setLocations(payload.data ?? []))
      .catch(() => setError("Could not load locations."));
  }, [companyId, roleId, standardLevel]);

  function resetFromCompany(value: string) {
    setCompanyId(value);
    setRoleId("");
    setStandardLevel("");
    setLocation("");
  }

  function resetFromRole(value: string) {
    setRoleId(value);
    setStandardLevel("");
    setLocation("");
  }

  function resetFromLevel(value: string) {
    setStandardLevel(value);
    setLocation("");
  }

  function addLocation() {
    const option = locations.find((item) => item.location === location);
    if (!option || selected.length >= 4 || selected.includes(option.entryId)) return;
    const company = companies.find((item) => item.id === companyId);
    const role = roles.find((item) => item.id === roleId);
    setSelected((current) => [...current, option.entryId]);
    setSelectedLabels((current) => ({
      ...current,
      [option.entryId]: `${company?.name} · ${role?.name} · ${standardLevel} · ${location}`,
    }));
    setCompanyId("");
    setRoleId("");
    setStandardLevel("");
    setLocation("");
    setResults(null);
  }

  function removeEntry(id: string) {
    setSelected((current) => current.filter((item) => item !== id));
    setSelectedLabels((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setResults(null);
  }

  async function runCompare() {
    if (selected.length < 2 || selected.length > 4) {
      setError("Select 2 to 4 entries to compare.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/compare?entryIds=${selected.join(",")}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Compare failed.");
        setResults(null);
        return;
      }
      setResults(payload.data);
    } catch {
      setError("Compare request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            Company
            <select value={companyId} onChange={(event) => resetFromCompany(event.target.value)} disabled={selected.length >= 4} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
              <option value="">Choose a company</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </label>
          <label className="text-sm">
            Role
            <select value={roleId} onChange={(event) => resetFromRole(event.target.value)} disabled={!companyId || selected.length >= 4} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
              <option value="">Choose a role</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </label>
          <label className="text-sm">
            Level
            <select value={standardLevel} onChange={(event) => resetFromLevel(event.target.value)} disabled={!roleId || selected.length >= 4} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
              <option value="">Choose a level</option>
              {levels.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </label>
          <label className="text-sm">
            Location
            <select value={location} onChange={(event) => setLocation(event.target.value)} disabled={!standardLevel || selected.length >= 4} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2">
              <option value="">Choose a location</option>
              {locations.map((item) => <option key={item.location} value={item.location}>{item.location}</option>)}
            </select>
          </label>
        </div>
        <button type="button" onClick={addLocation} disabled={!location || selected.length >= 4} className="mt-4 rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          Add entry
        </button>
        <p className="mt-2 text-xs text-slate-500">
          Pick 2–4 entries from real compensation data.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {selected.map((id) => (
            <li
              key={id}
              className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-900"
            >
              {selectedLabels[id]}
              <button
                type="button"
                onClick={() => removeEntry(id)}
                className="text-teal-700 hover:text-teal-950"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={runCompare}
          disabled={loading || selected.length < 2}
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Comparing…" : "Compare"}
        </button>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      {results ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Field</th>
                {results.map((row) => (
                  <th key={row.id} className="px-3 py-2 font-medium">
                    {row.company.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Role", (row: CompareRow) => row.role.name],
                  ["Native level", (row: CompareRow) => row.nativeLevel],
                  ["Standard level", (row: CompareRow) => row.standardLevel],
                  ["Location", (row: CompareRow) => row.location],
                  ["Base", (row: CompareRow) => formatCurrency(row.baseSalary)],
                  ["Bonus", (row: CompareRow) => formatCurrency(row.bonus)],
                  ["Stock", (row: CompareRow) => formatCurrency(row.stock)],
                  ["Total comp", (row: CompareRow) => formatCurrency(row.totalComp)],
                  ["Level score", (row: CompareRow) => String(row.levelScore)],
                  [
                    "Comp percentile",
                    (row: CompareRow) => `${row.scoreBreakdown.compPercentile}`,
                  ],
                  [
                    "Stability",
                    (row: CompareRow) => `${row.scoreBreakdown.stabilityScore}`,
                  ],
                  ["Comparison score", (row: CompareRow) => String(row.comparisonScore)],
                ] as const
              ).map(([label, getter]) => (
                <tr key={label} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-600">{label}</td>
                  {results.map((row) => (
                    <td
                      key={row.id}
                      className={
                        label === "Comparison score"
                          ? "px-3 py-2 font-semibold text-teal-800"
                          : "px-3 py-2"
                      }
                    >
                      {getter(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
