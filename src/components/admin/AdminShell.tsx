import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/app/admin/newspapers/LogoutButton";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/sources", label: "Where buyers come from" },
  { href: "/admin/newspapers", label: "Newspapers" },
];

/** Shared chrome for the admin pages. Each page still checks the session itself. */
export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="container flex items-center justify-between py-4">
          <Link href="/admin">
            <Logo />
          </Link>
          <LogoutButton />
        </div>
        <div className="container flex gap-6 overflow-x-auto pb-3 text-sm font-medium">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap text-brand-navy hover:text-brand-red">
              {n.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="container py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-navy">{title}</h1>
        {description && <p className="mt-2 text-slate-600">{description}</p>}
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
