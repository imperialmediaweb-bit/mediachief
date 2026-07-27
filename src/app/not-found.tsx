import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="section bg-white">
      <div className="container text-center max-w-xl mx-auto">
        <p className="eyebrow">404</p>
        <h1 className="h1 mt-3">Page not found</h1>
        <p className="lead mt-4">
          Sorry, we can&apos;t find the page you were looking for. It was probably moved or deleted.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Back home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/packages">View packages</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
