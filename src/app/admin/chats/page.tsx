import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ChatInbox } from "./ChatInbox";

export const metadata: Metadata = {
  title: "Admin • Chats",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function ChatsPage({ searchParams }: { searchParams: { id?: string } }) {
  if (!getSession({ allowTeam: true })) redirect("/admin/login?from=/admin/chats");
  return (
    <AdminShell
      title="Chats"
      description="Site chats. Your answer appears in the visitor's chat at once (and by email, if they left one)."
    >
      <ChatInbox initialId={searchParams.id || null} />
    </AdminShell>
  );
}
