"use client";

import { useEffect, useRef } from "react";

/**
 * A form error box that brings itself into view. On a phone the message can
 * render just above the button that was pressed — i.e. off screen — and the
 * buyer sees nothing happen. Every new message that is not fully visible is
 * jumped to the centre, once now and twice after the keyboard settles.
 */
export function FormError({ message, className }: { message: string | null | undefined; className: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!message) return;
    const show = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const visible = r.top >= 0 && r.bottom <= window.innerHeight;
      if (!visible) el.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
    };
    show();
    const t1 = setTimeout(show, 250);
    const t2 = setTimeout(show, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [message]);

  if (!message) return null;
  return (
    <p ref={ref} role="alert" className={className}>
      {message}
    </p>
  );
}
