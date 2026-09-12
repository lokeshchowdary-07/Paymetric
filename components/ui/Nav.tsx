import Link from "next/link";

const links = [
  { href: "/companies", label: "Companies" },
  { href: "/compensation", label: "Compensation" },
  { href: "/compare", label: "Compare" },
];

export function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Paymetric
        </Link>
        <nav className="flex gap-4 text-sm text-slate-600">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
