'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CinestudioConfig } from '@/src/types';

interface ProviderPreset {
  id: 'bedrock' | 'anthropic' | 'openai' | 'google' | 'ollama' | 'minimax';
  label: string;
  model: string;
  needsApiKey: boolean;
  defaultBaseUrl?: string;
  hint?: string;
}

const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'bedrock',
    label: 'Amazon Bedrock',
    model: 'global.anthropic.claude-sonnet-4-6',
    needsApiKey: false,
    hint: 'Use AWS credentials from your environment (AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY or IAM role).',
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Direct)',
    model: 'claude-sonnet-4-6',
    needsApiKey: true,
    hint: 'Get an API key at console.anthropic.com.',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    model: 'gpt-5',
    needsApiKey: true,
  },
  {
    id: 'google',
    label: 'Google Gemini',
    model: 'gemini-2.5-pro',
    needsApiKey: true,
  },
  {
    id: 'ollama',
    label: 'Ollama (local)',
    model: 'qwen3:32b',
    needsApiKey: false,
    defaultBaseUrl: 'http://localhost:11434',
  },
  {
    id: 'minimax',
    label: 'MiniMax',
    model: 'MiniMax-Text-01',
    needsApiKey: true,
    defaultBaseUrl: 'https://api.minimax.chat/v1',
  },
];

export default function OnboardingSetup() {
  const router = useRouter();
  const [provider, setProvider] = useState<ProviderPreset['id']>('bedrock');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [model, setModel] = useState('global.anthropic.claude-sonnet-4-6');
  const [enableVeo, setEnableVeo] = useState(true);
  const [enableSora, setEnableSora] = useState(false);
  const [enableRunway, setEnableRunway] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const preset = PROVIDER_PRESETS.find((p) => p.id === provider);
    if (preset) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setModel(preset.model);
      if (preset.defaultBaseUrl && !baseUrl) setBaseUrl(preset.defaultBaseUrl);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  useEffect(() => {
    void fetch('/api/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg: CinestudioConfig | null) => {
        if (!cfg) return;
        setProvider(cfg.textProvider.provider);
        if (cfg.textProvider.apiKey) setApiKey(cfg.textProvider.apiKey);
        if (cfg.textProvider.baseUrl) setBaseUrl(cfg.textProvider.baseUrl);
        if (cfg.textProvider.region) setRegion(cfg.textProvider.region);
        setModel(cfg.textProvider.model);
        setEnableVeo(cfg.renderProviders.veo.enabled);
        setEnableSora(cfg.renderProviders.sora.enabled);
        setEnableRunway(cfg.renderProviders.runway.enabled);
      })
      .catch(() => undefined);
  }, []);

  const preset = PROVIDER_PRESETS.find((p) => p.id === provider);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: apiKey || undefined,
          baseUrl: baseUrl || undefined,
          region,
          model,
          enabled: true,
          renderVeo: enableVeo,
          renderSora: enableSora,
          renderRunway: enableRunway,
        }),
      });
      if (!res.ok) {
        toast.error(`Failed to save config: ${await res.text()}`);
        return;
      }
      toast.success('Configuration saved — entering cinestudio.');
      router.push('/dashboard');
    } catch (err) {
      toast.error(`Error: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Setup</h1>
      <p className="mt-2 text-muted-foreground">
        Configure one text provider and any render providers you have keys for. You can
        edit this any time from the dashboard.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Text provider</CardTitle>
          <CardDescription>Used by every agent in the graph for script, critique, scoring, etc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as ProviderPreset['id'])}>
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_PRESETS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {preset?.hint && <p className="text-xs text-muted-foreground">{preset.hint}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
            {provider === 'bedrock' && (
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} />
              </div>
            )}
            {preset?.needsApiKey && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">API key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
            )}
            {(provider === 'ollama' || provider === 'minimax') && (
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input id="baseUrl" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Render providers</CardTitle>
          <CardDescription>Pluggable. Disable any you do not have API access for; we will skip them gracefully.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium">Veo 3.1</div>
              <div className="text-xs text-muted-foreground">Google. Best for narrative scenes.</div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={enableVeo}
              onChange={(e) => setEnableVeo(e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium">Sora</div>
              <div className="text-xs text-muted-foreground">OpenAI. Photorealistic.</div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={enableSora}
              onChange={(e) => setEnableSora(e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium">Runway</div>
              <div className="text-xs text-muted-foreground">Best for stylized and editing passes.</div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={enableRunway}
              onChange={(e) => setEnableRunway(e.target.checked)}
            />
          </label>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save & continue'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
