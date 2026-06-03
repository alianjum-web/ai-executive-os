"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import {
  getIntegrationSettings,
  saveIntegrationSettings,
  type IntegrationSettings,
} from "@/lib/api";

export function IntegrationSettingsForm() {
  const [settings, setSettings] = useState<IntegrationSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [jiraSiteUrl, setJiraSiteUrl] = useState("");
  const [jiraProjectKey, setJiraProjectKey] = useState("");
  const [jiraAccessToken, setJiraAccessToken] = useState("");
  const [sendgridApiKey, setSendgridApiKey] = useState("");
  const [sendgridFromEmail, setSendgridFromEmail] = useState("");
  const [inboundEmail, setInboundEmail] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getIntegrationSettings();
      setSettings(data);
      setJiraSiteUrl(data.jira_site_url ?? "");
      setJiraProjectKey(data.jira_project_key ?? "");
      setSendgridFromEmail(data.sendgrid_from_email ?? "");
      setInboundEmail(data.inbound_email_address ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    try {
      const body: Record<string, string> = {
        jira_site_url: jiraSiteUrl,
        jira_project_key: jiraProjectKey,
        sendgrid_from_email: sendgridFromEmail,
        inbound_email_address: inboundEmail,
      };
      if (jiraAccessToken) body.jira_access_token = jiraAccessToken;
      if (sendgridApiKey) body.sendgrid_api_key = sendgridApiKey;
      const updated = await saveIntegrationSettings(body);
      setSettings(updated);
      setJiraAccessToken("");
      setSendgridApiKey("");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading integration settings…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && (
        <p className="text-sm text-green-700">Settings saved. Secrets are stored encrypted.</p>
      )}

      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Jira</h2>
        <Input
          label="Site URL"
          value={jiraSiteUrl}
          onChange={(e) => setJiraSiteUrl(e.target.value)}
          placeholder="https://your-org.atlassian.net"
        />
        <Input
          label="Project key"
          value={jiraProjectKey}
          onChange={(e) => setJiraProjectKey(e.target.value)}
          placeholder="ENG"
        />
        <Input
          label="OAuth access token"
          type="password"
          value={jiraAccessToken}
          onChange={(e) => setJiraAccessToken(e.target.value)}
          placeholder={
            settings?.has_jira_credentials ? "•••••••• (leave blank to keep)" : "Paste token"
          }
        />
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">SendGrid</h2>
        <Input
          label="API key"
          type="password"
          value={sendgridApiKey}
          onChange={(e) => setSendgridApiKey(e.target.value)}
          placeholder={
            settings?.has_sendgrid_credentials ? "•••••••• (leave blank to keep)" : "SG.xxx"
          }
        />
        <Input
          label="From email"
          value={sendgridFromEmail}
          onChange={(e) => setSendgridFromEmail(e.target.value)}
          placeholder="noreply@company.com"
        />
        <Input
          label="Inbound parse address"
          value={inboundEmail}
          onChange={(e) => setInboundEmail(e.target.value)}
          placeholder="tickets@inbound.yourdomain.com"
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600">
        <p className="font-medium text-zinc-800">Webhook URLs</p>
        <p className="mt-1">Slack: {settings?.webhook_slack_url ?? "/api/v1/webhook/slack"}</p>
        <p>Email: {settings?.webhook_email_url ?? "/api/v1/webhook/email"}</p>
      </section>

      <Button type="submit">Save settings</Button>
    </form>
  );
}
