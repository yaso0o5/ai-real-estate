"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Spinner } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Sign in failed.");
      return;
    }
    router.push("/app");
    router.refresh();
  };

  return (
    <div className="anim-rise w-full max-w-sm">
      <h1 className="font-display text-[30px] tracking-[-0.02em]">Welcome back</h1>
      <p className="mt-2 text-[13.5px] text-ink-2">Sign in to your workspace. Your datasets stay yours.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="Email">
          <Input type="email" required autoComplete="email" placeholder="you@agency.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <Input type="password" required autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error ? <p className="anim-pop rounded-md border border-rust/30 bg-rust-tint px-3 py-2 text-[12.5px] text-rust">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <Spinner /> : "Sign in"}
        </Button>
      </form>
      <div className="mt-5 flex items-center justify-between text-[12.5px]">
        <a href="/forgot-password" className="font-medium text-pine hover:text-pine-deep">
          Forgot password?
        </a>
        <span className="text-ink-3">
          New here?{" "}
          <Link href="/signup" className="font-medium text-ink hover:underline">
            Create an account
          </Link>
        </span>
      </div>
      <p className="mt-8 rounded-md border border-line bg-cream px-3.5 py-3 text-[12px] leading-relaxed text-ink-2">
        <span className="font-semibold text-ink">New to PropertyIQ?</span> Create an account, then load the demo dataset to explore every feature with fictional market data in seconds.
      </p>
    </div>
  );
}
