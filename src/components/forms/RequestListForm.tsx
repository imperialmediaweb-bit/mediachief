"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, AlertCircle, Mail, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { requestListSchema, type RequestListInput } from "@/lib/validators";

interface RequestListFormProps {
  successHref?: string;
  successCtaLabel?: string;
}

export function RequestListForm({ successHref, successCtaLabel }: RequestListFormProps = {}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RequestListInput>({
    resolver: zodResolver(requestListSchema),
    defaultValues: { privacyConsent: false as unknown as true },
  });

  const onSubmit = async (data: RequestListInput) => {
    setStatus("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/request-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error || "Something went wrong");
      setStatus("success");
      reset();
    } catch (e: unknown) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="rounded-full bg-green-50 p-3">
          <Mail className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="font-serif text-2xl font-semibold text-brand-navy">
          The list is on its way!
        </h3>
        <p className="text-slate-600">
          Check your inbox in the next 2 minutes. If nothing arrives, check your spam folder or
          write to us directly.
        </p>
        {successHref && (
          <Button variant="accent" size="lg" asChild className="mt-2">
            <Link href={successHref}>
              {successCtaLabel || "See pricing now"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="text" {...register("website")} className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="space-y-1.5">
        <Label>Full name *</Label>
        <Input {...register("name")} placeholder="John Smith" />
        {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Email *</Label>
        <Input type="email" {...register("email")} placeholder="john@company.com" />
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input type="tel" {...register("phone")} placeholder="optional" />
        </div>
        <div className="space-y-1.5">
          <Label>Company</Label>
          <Input {...register("company")} placeholder="optional" />
        </div>
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
        <Checkbox {...register("privacyConsent")} />
        <span>
          I accept the processing of my data under the{" "}
          <a href="/legal/privacy" className="text-brand-red font-medium hover:underline">
            privacy policy
          </a>
          . *
        </span>
      </label>
      {errors.privacyConsent && (
        <p className="text-xs text-red-600">{errors.privacyConsent.message}</p>
      )}

      {status === "error" && errorMsg && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={status === "submitting"}>
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending...
          </>
        ) : (
          "Send me the full list"
        )}
      </Button>
      <p className="text-xs text-slate-500 text-center">
        You get the PDF by email, free, with no obligation.
      </p>
    </form>
  );
}
