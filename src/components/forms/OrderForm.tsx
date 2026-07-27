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
import { orderSchema, type OrderInput } from "@/lib/validators";
import { getAllPackages, SUBSCRIPTION_PLANS } from "@/data/packages";
import { formatPrice } from "@/lib/utils";

interface OrderFormProps {
  defaultPackageId?: string;
  onSuccess?: () => void;
}

export function OrderForm({ defaultPackageId, onSuccess }: OrderFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      packageId: defaultPackageId || "",
      privacyConsent: false as unknown as true,
    },
  });

  const onSubmit = async (data: OrderInput) => {
    setStatus("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        throw new Error(body.error || "Failed to submit");
      }
      setStatus("success");
      reset();
      onSuccess?.();
    } catch (e: unknown) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Unknown error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-600" />
        <h3 className="font-serif text-2xl font-semibold text-brand-navy">
          Order received!
        </h3>
        <p className="text-slate-600">
          Thank you! Our team will contact you within 2 hours (during business hours) with
          payment details and publication confirmation.
        </p>
        <Button variant="outline" onClick={() => setStatus("idle")}>
          Send another order
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <input type="text" {...register("website")} className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name *" error={errors.name?.message}>
          <Input {...register("name")} placeholder="John Smith" />
        </Field>
        <Field label="Email *" error={errors.email?.message}>
          <Input type="email" {...register("email")} placeholder="john@company.com" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone *" error={errors.phone?.message}>
          <Input type="tel" {...register("phone")} placeholder="+1 (555) 123-4567" />
        </Field>
        <Field label="Company" error={errors.company?.message}>
          <Input {...register("company")} placeholder="optional" />
        </Field>
      </div>

      <Field label="Choose a package *" error={errors.packageId?.message}>
        <select
          {...register("packageId")}
          className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-brand-navy focus:border-brand-navy"
        >
          <option value="">— choose a package —</option>
          <optgroup label="Standard">
            {getAllPackages()
              .filter((p) => p.category === "standard")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${formatPrice(p.price)}
                </option>
              ))}
          </optgroup>
          <optgroup label="Casino / iGaming">
            {getAllPackages()
              .filter((p) => p.category === "casino")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${formatPrice(p.price)}
                </option>
              ))}
          </optgroup>
          <optgroup label="Monthly subscriptions">
            {SUBSCRIPTION_PLANS.map((p) => (
              <option key={`sub-${p.id}`} value={`sub-${p.id}`}>
                {p.name} subscription — from ${formatPrice(p.priceStandard)}/month
              </option>
            ))}
          </optgroup>
        </select>
      </Field>

      <Field label="Article title *" error={errors.articleTitle?.message}>
        <Input {...register("articleTitle")} placeholder="Proposed title for the article" />
      </Field>

      <Field
        label="Article text"
        error={errors.articleBody?.message}
        hint="You can fill this in now or send it later by email"
      >
        <Textarea {...register("articleBody")} rows={6} placeholder="The article paragraphs..." />
      </Field>

      <Field
        label="Existing article URL"
        error={errors.articleUrl?.message}
        hint="If the article is already online, drop the link here"
      >
        <Input type="url" {...register("articleUrl")} placeholder="https://..." />
      </Field>

      <Field label="Notes" error={errors.notes?.message}>
        <Textarea {...register("notes")} rows={3} placeholder="Preferences, preferred date, etc." />
      </Field>

      <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
        <Checkbox {...register("privacyConsent")} />
        <span>
          I agree to the{" "}
          <a href="/legal/privacy" className="text-brand-red font-medium hover:underline">
            processing of my personal data
          </a>{" "}
          as described in the privacy policy. *
        </span>
      </label>
      {errors.privacyConsent && (
        <p className="text-sm text-red-600">{errors.privacyConsent.message}</p>
      )}

      {status === "error" && errorMsg && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="w-full"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending...
          </>
        ) : (
          "Submit order"
        )}
      </Button>
      <p className="text-xs text-slate-500 text-center">
        We never store card details — we contact you for invoicing and payment.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
