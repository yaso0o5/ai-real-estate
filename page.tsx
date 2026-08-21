"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Field, Input, Spinner } from "@/components/ui";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Something went wrong.");
      return;
    }
    setSent(true);
    if (json.resetUrl) setResetUrl(`${window.location.origin}${json.resetUrl}`);
  };

  return (
    <div className="anim-rise w-full max-w-sm">
      <h1 className="font-display text-[30px] tracking-[-0.02em]">Reset your password</h1>
      <p className="mt-2 text-[13.5px] text-ink-2">Enter your account email and we'll create a reset link.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="Email">
          <Input type="email" required autoComplete="email" placeholder="you@agency.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {error ? <p className="anim-pop rounded-md border border-rust/30 bg-rust-tint px-3 py-2 text-[12.5px] text-rust">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <Spinner /> : "Send reset link"}
        </Button>
      </form>

      {sent ? (
        <div className="anim-pop mt-6 rounded-lg border border-pine/25 bg-pine-wash p-4">
          <p className="text-[13px] font-medium text-pine-deep">Request received.</p>
          {resetUrl ? (
            <>
              <p className="mt-2 text-[12px] leading-relaxed text-ink-2">
                This demo environment has no email server, so here is your reset link:
              </p>
              <a href={resetUrl} className="mt-2 block break-all text-[12.5px] font-semibold text-pine underline underline-offset-2">
                {resetUrl}
              </a>
            </>
          ) : (
            <p className="mt-2 text-[12.5px] text-ink-2">
              If an account exists for this email, a reset link was created. (No account found for unknown emails — for security we don't reveal which.)
            </p>
          )}
        </div>
      ) : null}

      <p className="mt-5 text-[12.5px] text-ink-3">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-ink hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
