"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Spinner } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Sign up failed.");
      return;
    }
    router.push("/app");
    router.refresh();
  };

  return (
    <div className="anim-rise w-full max-w-sm">
      <h1 className="font-display text-[30px] tracking-[-0.02em]">Create your workspace</h1>
      <p className="mt-2 text-[13.5px] text-ink-2">Free to start. Your property data is isolated to your account.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="Full name">
          <Input required autoComplete="name" placeholder="Sara Mostafa" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" required autoComplete="email" placeholder="you@agency.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" hint="min. 8 characters">
          <Input type="password" required autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error ? <p className="anim-pop rounded-md border border-rust/30 bg-rust-tint px-3 py-2 text-[12.5px] text-rust">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <Spinner /> : "Create account"}
        </Button>
      </form>
      <p className="mt-5 text-[12.5px] text-ink-3">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-8 rounded-md border border-line bg-cream px-3.5 py-3 text-[12px] leading-relaxed text-ink-2">
        <span className="font-semibold text-ink">Tip:</span> once signed in, head to <span className="font-medium">Upload</span> and hit “Load demo dataset” to see the full platform with fictional Greater Cairo market data.
      </p>
    </div>
  );
}
