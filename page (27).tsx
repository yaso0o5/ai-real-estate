"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFetch } from "@/lib/hooks";
import { Badge, Button, Card, Field, Icon, Input, paths, Select, Spinner } from "@/components/ui";

interface MeResp {
  ok: boolean;
  user: { id: string; email: string; name: string; displayName: string | null; company: string | null; role: string | null; createdAt: string };
}

export default function SettingsPage() {
  const { data, reload } = useFetch<MeResp>("/api/auth/me");
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [company, setCompany] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);

  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  if (!data) return <div className="space-y-4"><div className="skeleton h-24 rounded-lg" /><div className="skeleton h-40 rounded-lg" /></div>;
  const u = data.user;

  const saveProfile = async () => {
    setProfileBusy(true);
    setProfileMsg(null);
    const res = await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: displayName ?? u.displayName ?? u.name, company: company ?? u.company ?? "", role: role ?? u.role ?? "" }),
    });
    setProfileBusy(false);
    if (res.ok) {
      setProfileMsg("Profile updated.");
      reload();
    } else {
      const j = await res.json().catch(() => ({}));
      setProfileMsg(j.error ?? "Update failed.");
    }
  };

  const savePassword = async () => {
    setPwBusy(true);
    setPwMsg(null);
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: cur, next }),
    });
    const j = await res.json().catch(() => ({}));
    setPwBusy(false);
    if (res.ok) {
      setPwMsg({ ok: true, text: "Password changed." });
      setCur("");
      setNext("");
    } else {
      setPwMsg({ ok: false, text: j.error ?? "Change failed." });
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-[26px] tracking-[-0.02em]">Profile & settings</h1>
        <p className="text-[13px] text-ink-2">Account, profile details and workspace preferences.</p>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pine font-display text-[22px] text-cream">
            {(displayName ?? u.displayName ?? u.name).trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="font-display text-[18px]">{displayName ?? u.displayName ?? u.name}</div>
            <div className="truncate text-[12.5px] text-ink-3">{u.email}</div>
            <div className="mt-1 flex gap-2">
              <Badge tone="outline">Member since {new Date(u.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</Badge>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Display name">
            <Input value={displayName ?? u.displayName ?? u.name} onChange={(e) => setDisplayName(e.target.value)} />
          </Field>
          <Field label="Company">
            <Input value={company ?? u.company ?? ""} placeholder="Agency or portfolio name" onChange={(e) => setCompany(e.target.value)} />
          </Field>
          <Field label="Role">
            <Select value={role ?? u.role ?? ""} onChange={(e) => setRole(e.target.value)}>
              <option value="">Prefer not to say</option>
              <option>Broker / Agent</option>
              <option>Property analyst</option>
              <option>Investor</option>
              <option>Developer</option>
              <option>Appraiser</option>
              <option>Other</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={saveProfile} disabled={profileBusy}>
            {profileBusy ? <Spinner /> : "Save profile"}
          </Button>
          {profileMsg ? <span className={`text-[12.5px] ${profileMsg === "Profile updated." ? "text-pine" : "text-rust"}`}>{profileMsg}</span> : null}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-[16.5px]">Change password</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Current password">
            <Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
          </Field>
          <Field label="New password" hint="min. 8 characters">
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" onClick={savePassword} disabled={pwBusy || !cur || !next}>
            {pwBusy ? <Spinner /> : "Update password"}
          </Button>
          {pwMsg ? <span className={`text-[12.5px] ${pwMsg.ok ? "text-pine" : "text-rust"}`}>{pwMsg.text}</span> : null}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-[16.5px]">Data & privacy</h3>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">
          Your datasets, properties and insights are isolated to this account. Manage, inspect or permanently remove them from the import history.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link href="/app/imports">
            <Button variant="outline">
              <Icon d={paths.layers} size={14} /> Manage datasets
            </Button>
          </Link>
          <Link href="/app/saved">
            <Button variant="outline">
              <Icon d={paths.bookmark} size={14} /> Saved properties
            </Button>
          </Link>
          <Button variant="danger" onClick={logout}>
            <Icon d={paths.logout} size={14} /> Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}
