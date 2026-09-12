"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils/format";

type Preset = {
  id: string;
  label: string;
  companyName: string;
  roleName: string;
  standardLevel: string;
  sampleCount: number;
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

export function CompareClient({ presets }: { presets: Preset[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<CompareRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const available = useMemo(
    () => presets.filter((preset) => !selected.includes(preset.id)),
    [presets, selected]
  );

  function addPreset(id: string) {
    if (!id || selected.length >= 3) return;
    setSelected((current) => [...current, id]);
    setResults(null);
  }

  function removePreset(id: string) {
    setSelected((current) => current.filter((item) => item !== id));
    setResults(null);
  }

  async function runCompare() {
    if (selected.length < 2 || selected.length > 3) {
      setError("Select 2 or 3 presets to compare.");
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

  const selectedPresets = selected
    .map((id) => presets.find((preset) => preset.id === id))
    .filter((preset): preset is Preset => Boolean(preset));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="block text-sm font-medium text-slate-700">
          Add a preset
        </label>
        <select
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          defaultValue=""
          onChange={(event) => {
            addPreset(event.target.value);
            event.target.value = "";
          }}
          disabled={selected.length >= 3}
        >
          <option value="">
            {selected.length >= 3
              ? "Maximum of 3 selected"
              : "Choose company · role · standard level"}
          </option>
          {available.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label} ({preset.sampleCount} entries)
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-500">
          Presets are grouped from real CompensationEntry rows. Pick 2–3.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {selectedPresets.map((preset) => (
            <li
              key={preset.id}
              className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-900"
            >
              {preset.label}
              <button
                type="button"
                onClick={() => removePreset(preset.id)}
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
