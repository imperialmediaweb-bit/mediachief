"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { contactSchema, type ContactInput } from "@/lib/validators";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { privacyConsent: false as unknown as true },
  });

  const onSubmit = async (data: ContactInput) => {
    setStatus("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/contact", {
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
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-600" />
        <h3 className="font-serif text-2xl font-semibold text-brand-navy">Message sent!</h3>
        <p className="text-slate-600">We&apos;ll get back to you as soon as possible.</p>
        <Button variant="outline" onClick={() => setStatus("idle")}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <input type="text" {...register("website")} className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input {...register("name")} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Email *</Label>
          <Input type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Subject *</Label>
        <Input {...register("subject")} />
        {errors.subject && <p className="text-xs text-red-600">{errors.subject.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Message *</Label>
        <Textarea rows={6} {...register("message")} />
        {errors.message && <p className="text-xs text-red-600">{errors.message.message}</p>}
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
        <Checkbox {...register("privacyConsent")} />
        <span>
          I accept the processing of my personal data under the{" "}
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

      <Button type="submit" variant="accent" size="lg" disabled={status === "submitting"}>
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending...
          </>
        ) : (
          "Send message"
        )}
      </Button>
    </form>
  );
}
