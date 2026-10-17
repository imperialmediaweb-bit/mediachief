"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RequestListForm } from "@/components/forms/RequestListForm";

const STORAGE_KEY = "mc_exit_intent_shown";
const MOBILE_DELAY_MS = 30000;

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return;

    const trigger = () => {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
      sessionStorage.setItem(STORAGE_KEY, "1");
      setOpen(true);
    };

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10) trigger();
    };
    document.addEventListener("mouseleave", onMouseLeave);

    const timerId = window.setTimeout(trigger, MOBILE_DELAY_MS);

    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      window.clearTimeout(timerId);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Wait — get the full offer for free</DialogTitle>
          <DialogDescription>
            The list of all 50 newspapers + detailed pricing, by email in 2 minutes.
            No obligation, no spam.
          </DialogDescription>
        </DialogHeader>
        <RequestListForm
          successHref="/packages"
          successCtaLabel="See pricing now"
        />
      </DialogContent>
    </Dialog>
  );
}
