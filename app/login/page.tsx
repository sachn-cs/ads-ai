'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { KeyRound, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md p-8">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    void fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then((r) => r.json())
      .then((data: { authEnabled?: boolean }) => {
        setAuthEnabled(Boolean(data.authEnabled));
        if (!data.authEnabled) {
          router.replace('/');
        }
      })
      .catch(() => setAuthEnabled(true));
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error('Token required');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? 'Login failed');
        return;
      }
      toast.success('Logged in');
      const target = search.get('from') ?? '/dashboard';
      router.replace(target);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (authEnabled === null) {
    return <div className="mx-auto max-w-md p-8">Checking authentication…</div>;
  }
  if (authEnabled === false) {
    return <div className="mx-auto max-w-md p-8">Auth is not configured. Redirecting…</div>;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4">
      <Card className="w-full">
        <CardHeader>
          <ShieldCheck className="h-6 w-6 text-cinematic-gold" />
          <CardTitle>cinestudio</CardTitle>
          <CardDescription>Enter the access token configured by your operator.</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-3">
            <Alert>
              <KeyRound className="h-4 w-4" />
              <AlertTitle>Single-user mode</AlertTitle>
              <AlertDescription>
                Set <code className="font-mono text-xs">CINESTUDIO_AUTH_TOKEN</code> on the server. The cookie expires in 30 days.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="token">Access token</Label>
              <Input
                id="token"
                type="password"
                autoFocus
                autoComplete="current-password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="paste token"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Signing in…' : (<><ArrowRight className="h-4 w-4" /> Sign in</>)}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
