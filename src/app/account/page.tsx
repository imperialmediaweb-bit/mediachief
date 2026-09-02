import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  Repeat,
  FileText,
  Download,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/account/login");

  const first = (session.user.name || session.user.email || "").split(" ")[0];

  return (
    <section className="container py-12">
      <div className="max-w-5xl">
        <p className="eyebrow">My account</p>
        <h1 className="h1 mt-2">Hi, {first}</h1>
        <p className="lead mt-3 text-slate-600">
          From here you manage your orders, subscription, articles and images. Access to the
          newspaper list and content upload unlocks after your first payment.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card
            icon={ShoppingBag}
            title="Orders"
            description="History of your payments and published articles."
            href="/account/orders"
          />
          <Card
            icon={Repeat}
            title="Subscription"
            description="Subscription status, upcoming payments, articles left this month."
            href="/account/subscription"
          />
          <Card
            icon={FileText}
            title="My articles"
            description="Drafts, submitted articles and published articles."
            href="/account/articles"
          />
          <Card
            icon={ImageIcon}
            title="Article images"
            description="Up to 3 images per article. Attached automatically."
            href="/account/articles"
          />
          <Card
            icon={Sparkles}
            title="AI article generation"
            description="Only have an idea? We generate the text in line with our policies."
            href="/account/articles/new"
          />
          <Card
            icon={Download}
            title="Newspaper list (PDF)"
            description="Available after your first payment. Download straight from your account."
            href="/account/list"
          />
        </div>

        <div className="mt-12 rounded-2xl border border-dashed border-slate-300 p-8">
          <h2 className="h2">First order?</h2>
          <p className="lead mt-3 text-slate-600">
            Pick a package and pay by card. As soon as the payment clears, we unlock access to
            the list, image upload and AI generation.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="accent" size="lg" asChild>
              <Link href="/packages">View packages</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/offer">Read the offer</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-white p-6 transition hover:border-brand-red hover:shadow-md"
    >
      <Icon className="h-8 w-8 text-brand-red" />
      <h3 className="mt-4 font-serif text-lg font-bold text-brand-navy group-hover:text-brand-red">
        {title}
      </h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </Link>
  );
}
