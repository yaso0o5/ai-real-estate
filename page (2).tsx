"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button, Field, Input, Spinner } from "@/components/ui";

export default function ResetPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Reset failed.");
      return;
    }
    router.push("/login?reset=1");
    router.refresh();
  };

  return (
    <div className="anim-rise w-full max-w-sm">
      <h1 className="font-display text-[30px] tracking-[-0.02em]">Choose a new password</h1>
      <p className="mt-2 text-[13.5px] text-ink-2">The reset link is single-use and expires after an hour.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="New password" hint="min. 8 characters">
          <Input type="password" required autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Confirm password">
          <Input type="password" required autoComplete="new-password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        {error ? <p className="anim-pop rounded-md border border-rust/30 bg-rust-tint px-3 py-2 text-[12.5px] text-rust">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <Spinner /> : "Update password"}
        </Button>
      </form>
      <p className="mt-5 text-[12.5px] text-ink-3">
        <Link href="/login" className="font-medium text-ink hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
