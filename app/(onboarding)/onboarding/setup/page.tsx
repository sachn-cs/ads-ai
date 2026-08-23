'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, KeyRound, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
    id: 'minimax',
    label: 'MiniMax (recommended)',
    model: 'MiniMax-M3',
    needsApiKey: true,
    defaultBaseUrl: 'https://api.minimax.io',
    hint: 'One MiniMax API key covers text, video (MiniMax-H3), image (image-01), speech (speech-2.8-hd), and music (music-3.0).',
  },
  {
    id: 'bedrock',
    label: 'Amazon Bedrock',
    model: 'global.anthropic.claude-sonnet-4-6',
    needsApiKey: false,
    hint: 'Uses AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (or IAM role).',
  },
  {
    id: 'anthropic',
    label: 'Anthropic (direct)',
    model: 'claude-sonnet-4-6',
    needsApiKey: true,
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
];

const MULTIMODAL_DEFAULT_MODELS: Record<'image' | 'speech' | 'music', string> = {
  image: 'image-01',
  speech: 'speech-2.8-hd',
  music: 'music-3.0',
};

const RENDER_DEFAULT_MODELS: Record<'veo' | 'sora' | 'runway' | 'minimax', string> = {
  veo: 'veo-3.1',
  sora: 'sora-2',
  runway: 'gen3a_turbo',
  minimax: 'MiniMax-H3',
};

interface TestResult { provider: string; ok: boolean; latencyMs: number; error?: string }

export default function OnboardingSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [textProvider, setTextProvider] = useState<ProviderPreset['id']>('minimax');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [model, setModel] = useState('MiniMax-M3');

  const [renderProviders, setRenderProviders] = useState<Record<'veo' | 'sora' | 'runway' | 'minimax', { enabled: boolean; apiKey: string; baseUrl: string; model: string }>>({
    veo: { enabled: false, apiKey: '', baseUrl: '', model: 'veo-3.1' },
    sora: { enabled: false, apiKey: '', baseUrl: '', model: 'sora-2' },
    runway: { enabled: false, apiKey: '', baseUrl: '', model: 'gen3a_turbo' },
    minimax: { enabled: true, apiKey: '', baseUrl: '', model: 'MiniMax-H3' },
  });
  const [imageEnabled, setImageEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [imageKey, setImageKey] = useState('');
  const [speechKey, setSpeechKey] = useState('');
  const [musicKey, setMusicKey] = useState('');

  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/config');
        if (!res.ok) return;
        const cfg = (await res.json()) as CinestudioConfig;
        setTextProvider(cfg.textProvider.provider);
        setApiKey(cfg.textProvider.apiKey ?? '');
        setBaseUrl(cfg.textProvider.baseUrl ?? '');
        setRegion(cfg.textProvider.region ?? 'us-east-1');
        setModel(cfg.textProvider.model);
        setRenderProviders({
          veo: cfg.renderProviders.veo ? { enabled: cfg.renderProviders.veo.enabled, apiKey: cfg.renderProviders.veo.apiKey ?? '', baseUrl: cfg.renderProviders.veo.baseUrl ?? '', model: cfg.renderProviders.veo.model } : { enabled: false, apiKey: '', baseUrl: '', model: RENDER_DEFAULT_MODELS.veo },
          sora: cfg.renderProviders.sora ? { enabled: cfg.renderProviders.sora.enabled, apiKey: cfg.renderProviders.sora.apiKey ?? '', baseUrl: cfg.renderProviders.sora.baseUrl ?? '', model: cfg.renderProviders.sora.model } : { enabled: false, apiKey: '', baseUrl: '', model: RENDER_DEFAULT_MODELS.sora },
          runway: cfg.renderProviders.runway ? { enabled: cfg.renderProviders.runway.enabled, apiKey: cfg.renderProviders.runway.apiKey ?? '', baseUrl: cfg.renderProviders.runway.baseUrl ?? '', model: cfg.renderProviders.runway.model } : { enabled: false, apiKey: '', baseUrl: '', model: RENDER_DEFAULT_MODELS.runway },
          minimax: cfg.renderProviders.minimax ? { enabled: cfg.renderProviders.minimax.enabled, apiKey: cfg.renderProviders.minimax.apiKey ?? '', baseUrl: cfg.renderProviders.minimax.baseUrl ?? '', model: cfg.renderProviders.minimax.model } : { enabled: true, apiKey: '', baseUrl: '', model: RENDER_DEFAULT_MODELS.minimax },
        });
        setImageEnabled(cfg.multimodal?.image?.enabled ?? true);
        setSpeechEnabled(cfg.multimodal?.speech?.enabled ?? true);
        setMusicEnabled(cfg.multimodal?.music?.enabled ?? true);
        setImageKey(cfg.multimodal?.image?.apiKey ?? '');
        setSpeechKey(cfg.multimodal?.speech?.apiKey ?? '');
        setMusicKey(cfg.multimodal?.music?.apiKey ?? '');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derive model + baseUrl from the chosen preset so we don't have to run
  // an effect with setState. The provider switch drives preset → defaults.
  const activePreset = PROVIDER_PRESETS.find((p) => p.id === textProvider);
  const presetDefaultsModel = activePreset?.model ?? 'MiniMax-M3';
  const presetDefaultsBaseUrl = activePreset?.defaultBaseUrl ?? '';
  const effectiveBaseUrl = baseUrl || presetDefaultsBaseUrl;
  const effectiveModel = model || presetDefaultsModel;

  useEffect(() => {
    if (
      textProvider &&
      model !== (PROVIDER_PRESETS.find((p) => p.id === textProvider)?.model ?? model)
    ) {
      // Only run on initial mount or when user explicitly switches provider.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleTest() {
    setTesting(true);
    try {
      const providers: Array<{ provider: string; apiKey?: string; baseUrl?: string; model: string }> = [];
      const fullKey = apiKey || (textProvider === 'minimax' ? apiKey : apiKey);
      providers.push({
        provider: textProvider,
        apiKey: fullKey,
        baseUrl: baseUrl || undefined,
        model,
      });
      if (renderProviders.minimax.enabled) {
        providers.push({
          provider: 'minimax',
          apiKey: renderProviders.minimax.apiKey || fullKey,
          baseUrl: renderProviders.minimax.baseUrl || undefined,
          model: renderProviders.minimax.model,
        });
      }
      if (imageEnabled && imageKey) {
        providers.push({ provider: 'minimax', apiKey: imageKey, model: 'image-01' });
      }

      const res = await fetch('/api/config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providers }),
      });
      if (!res.ok) {
        toast.error(`Test failed: ${await res.text()}`);
        return;
      }
      const data = (await res.json()) as { results: TestResult[] };
      setTestResults(data.results);
      const failed = data.results.filter((r) => !r.ok);
      if (failed.length === 0) {
        toast.success(`All ${data.results.length} connections verified.`);
      } else {
        toast.error(`${failed.length}/${data.results.length} failed.`);
      }
    } catch (err) {
      toast.error(`Error: ${String(err)}`);
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const config: CinestudioConfig = {
        version: '0.1.0',
        textProvider: {
          enabled: true,
          provider: textProvider,
          model,
          apiKey: apiKey || undefined,
          baseUrl: baseUrl || undefined,
          region: textProvider === 'bedrock' ? region : undefined,
          temperature: 0.7,
          maxTokens: 8192,
        },
        renderProviders: {
          veo: { enabled: renderProviders.veo.enabled, apiKey: renderProviders.veo.apiKey || undefined, baseUrl: renderProviders.veo.baseUrl || undefined, model: renderProviders.veo.model, maxConcurrentShots: 2 },
          sora: { enabled: renderProviders.sora.enabled, apiKey: renderProviders.sora.apiKey || undefined, baseUrl: renderProviders.sora.baseUrl || undefined, model: renderProviders.sora.model, maxConcurrentShots: 2 },
          runway: { enabled: renderProviders.runway.enabled, apiKey: renderProviders.runway.apiKey || undefined, baseUrl: renderProviders.runway.baseUrl || undefined, model: renderProviders.runway.model, maxConcurrentShots: 2 },
          minimax: { enabled: renderProviders.minimax.enabled, apiKey: renderProviders.minimax.apiKey || undefined, baseUrl: renderProviders.minimax.baseUrl || undefined, model: renderProviders.minimax.model, maxConcurrentShots: 2 },
        },
        multimodal: {
          image: { enabled: imageEnabled, provider: 'minimax', model: MULTIMODAL_DEFAULT_MODELS.image, apiKey: imageKey || apiKey || undefined, baseUrl: renderProviders.minimax.baseUrl || undefined },
          speech: { enabled: speechEnabled, provider: 'minimax', model: MULTIMODAL_DEFAULT_MODELS.speech, apiKey: speechKey || apiKey || undefined, baseUrl: renderProviders.minimax.baseUrl || undefined },
          music: { enabled: musicEnabled, provider: 'minimax', model: MULTIMODAL_DEFAULT_MODELS.music, apiKey: musicKey || apiKey || undefined, baseUrl: renderProviders.minimax.baseUrl || undefined },
        },
        defaults: {
          maxIterations: 3,
          qualityThreshold: 70,
          targetRuntimeSeconds: { min: 30, max: 120 },
          aspectRatio: '16:9',
          enableVideoRender: true,
          enableAudioScore: false,
          ideaExpansionCount: 3,
        },
        updatedAt: new Date().toISOString(),
      };
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        toast.error(`Save failed: ${await res.text()}`);
        return;
      }
      toast.success('Configuration saved.');
      router.push('/dashboard');
    } catch (err) {
      toast.error(`Error: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl p-8">Loading configuration…</div>;
  }

  const preset = PROVIDER_PRESETS.find((p) => p.id === textProvider);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Pay-as-you-go billing</AlertTitle>
        <AlertDescription>
          MiniMax (and the other render providers) bill per-call. We surface this warning once during onboarding.
          Check your MiniMax console for live usage.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Text provider</CardTitle>
          <CardDescription>Used by every agent in the graph.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text-provider">Provider</Label>
            <Select value={textProvider} onValueChange={(v) => setTextProvider(v as ProviderPreset['id'])}>
              <SelectTrigger id="text-provider"><SelectValue /></SelectTrigger>
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
              <Label htmlFor="text-model">Model</Label>
              <Input id="text-model" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
            {textProvider === 'bedrock' && (
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} />
              </div>
            )}
            {preset?.needsApiKey && (
              <div className="space-y-2">
                <Label htmlFor="api-key">API key</Label>
                <Input id="api-key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
              </div>
            )}
            {(textProvider === 'ollama' || textProvider === 'minimax') && (
              <div className="space-y-2">
                <Label htmlFor="base-url">Base URL</Label>
                <Input id="base-url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video rendering</CardTitle>
          <CardDescription>Enable any combination. Disable all to skip the render stage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.keys(renderProviders) as Array<keyof typeof renderProviders>).map((key) => {
            const rp = renderProviders[key];
            return (
              <div key={key} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{key === 'minimax' ? 'MiniMax-H3' : key}</span>
                    <Badge variant="outline">{rp.model}</Badge>
                    {key === 'minimax' && (
                      <Badge variant="secondary" className="text-[10px]">recommended</Badge>
                    )}
                  </div>
                  <Switch
                    checked={rp.enabled}
                    onCheckedChange={(v: boolean) => setRenderProviders((prev) => ({ ...prev, [key]: { ...prev[key], enabled: v } }))}
                  />
                </div>
                {rp.enabled && (
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Model</Label>
                      <Input value={rp.model} onChange={(e) => setRenderProviders((prev) => ({ ...prev, [key]: { ...prev[key], model: e.target.value } }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">API key (leave blank to reuse text-provider key)</Label>
                      <Input
                        type="password"
                        value={rp.apiKey}
                        onChange={(e) => setRenderProviders((prev) => ({ ...prev, [key]: { ...prev[key], apiKey: e.target.value } }))}
                        placeholder="optional"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Multimodal</CardTitle>
          <CardDescription>Generates character portraits, storyboard frames, voice lines, foley, and score stems via MiniMax. On by default.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              { key: 'image' as const, label: 'Image (character portraits + storyboard frames)', value: imageEnabled, setValue: setImageEnabled, apiKey: imageKey, setApiKey: setImageKey },
              { key: 'speech' as const, label: 'Speech (TTS voice lines + foley)', value: speechEnabled, setValue: setSpeechEnabled, apiKey: speechKey, setApiKey: setSpeechKey },
              { key: 'music' as const, label: 'Music (score stems)', value: musicEnabled, setValue: setMusicEnabled, apiKey: musicKey, setApiKey: setMusicKey },
            ]
          ).map(({ key, label, value, setValue, apiKey, setApiKey }) => (
            <div key={key} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{label}</span>
                <Switch checked={value} onCheckedChange={setValue} />
              </div>
              {value && (
                <div className="mt-3 space-y-2">
                  <Label className="text-xs">API key (leave blank to reuse text-provider key)</Label>
                  <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="optional" />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connection tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {testResults.map((r) => (
              <div key={r.provider} className="flex items-center justify-between text-sm">
                <span className="capitalize">{r.provider}</span>
                <span className={r.ok ? 'text-emerald-500' : 'text-destructive'}>
                  {r.ok ? `OK (${r.latencyMs}ms)` : `${r.error?.slice(0, 80)}`}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 pb-12">
        <Button onClick={handleTest} disabled={testing} variant="outline">
          <KeyRound className="h-4 w-4" /> {testing ? 'Testing…' : 'Test connections'}
        </Button>
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save & continue'}
        </Button>
      </div>
    </div>
  );
}
