"use client";

import { useState } from "react";
import { Button } from "@/common/atoms/ui/button";
import { Input } from "@/common/atoms/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/atoms/ui/card";
import {
  saveIntegrationConfig,
  resyncAllConnectors,
  syncGoogleDriveFile,
  syncNotionPage,
} from "@/common/api/client";
import { DepartmentPresetPicker } from "@/knowledge/molecules/DepartmentPresetPicker";
import { useFeatureFlag } from "@/common/hooks/useFeatureFlag";

export function IntegrationsPanel({ onSynced }: { onSynced?: () => void }) {
  const connectors = useFeatureFlag("CONNECTOR_SYNC_ENABLED");
  const settings = useFeatureFlag("INTEGRATIONS_SETTINGS_ENABLED");
  const [notionToken, setNotionToken] = useState("");
  const [driveToken, setDriveToken] = useState("");
  const [jiraSite, setJiraSite] = useState("");
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraToken, setJiraToken] = useState("");
  const [jiraProject, setJiraProject] = useState("OPS");
  const [notionPageId, setNotionPageId] = useState("");
  const [driveFileId, setDriveFileId] = useState("");
  const [deptScope, setDeptScope] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!connectors && !settings) return null;

  const deptList = deptScope
    ? deptScope.split(",").map((d) => d.trim()).filter(Boolean)
    : undefined;

  const saveConfigs = async () => {
    setBusy(true);
    setMessage(null);
    try {
      if (notionToken) {
        await saveIntegrationConfig("notion", { api_token: notionToken });
      }
      if (driveToken) {
        await saveIntegrationConfig("google_drive", { access_token: driveToken });
      }
      if (jiraSite && jiraEmail && jiraToken) {
        await saveIntegrationConfig("jira", {
          site_url: jiraSite,
          email: jiraEmail,
          api_token: jiraToken,
          project_key: jiraProject,
        });
      }
      setMessage("Integration credentials saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const runNotionSync = async () => {
    if (!notionPageId) return;
    setBusy(true);
    setMessage(null);
    try {
      await syncNotionPage(notionPageId, { allowedDepartments: deptList });
      setMessage("Notion page queued for indexing.");
      onSynced?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Notion sync failed");
    } finally {
      setBusy(false);
    }
  };

  const runResyncAll = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await resyncAllConnectors();
      setMessage("All connectors queued for re-sync.");
      onSynced?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Re-sync failed");
    } finally {
      setBusy(false);
    }
  };

  const runDriveSync = async () => {
    if (!driveFileId) return;
    setBusy(true);
    setMessage(null);
    try {
      await syncGoogleDriveFile(driveFileId, { allowedDepartments: deptList });
      setMessage("Google Drive file queued for indexing.");
      onSynced?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Drive sync failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Connectors & integrations</CardTitle>
        <p className="text-sm text-muted-foreground">
          Sync Notion / Google Drive and configure Jira for approved tickets
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Department scope for synced docs (optional)
          </p>
          <DepartmentPresetPicker value={deptScope} onChange={setDeptScope} />
        </div>
        <Input
          label="Custom departments (comma-separated)"
          value={deptScope}
          onChange={(e) => setDeptScope(e.target.value)}
          placeholder="hr, engineering"
        />
        {settings ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Notion API token"
              type="password"
              value={notionToken}
              onChange={(e) => setNotionToken(e.target.value)}
            />
            <Input
              label="Google Drive access token"
              type="password"
              value={driveToken}
              onChange={(e) => setDriveToken(e.target.value)}
            />
            <Input
              label="Jira site URL"
              value={jiraSite}
              onChange={(e) => setJiraSite(e.target.value)}
              placeholder="https://yourorg.atlassian.net"
            />
            <Input
              label="Jira email"
              value={jiraEmail}
              onChange={(e) => setJiraEmail(e.target.value)}
            />
            <Input
              label="Jira API token"
              type="password"
              value={jiraToken}
              onChange={(e) => setJiraToken(e.target.value)}
            />
            <Input
              label="Jira project key"
              value={jiraProject}
              onChange={(e) => setJiraProject(e.target.value)}
            />
          </div>
        ) : null}
        {connectors ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Notion page ID"
              value={notionPageId}
              onChange={(e) => setNotionPageId(e.target.value)}
            />
            <Input
              label="Google Drive file ID"
              value={driveFileId}
              onChange={(e) => setDriveFileId(e.target.value)}
            />
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {settings ? (
            <Button disabled={busy} onClick={() => void saveConfigs()}>
              Save credentials
            </Button>
          ) : null}
          {connectors ? (
            <>
              <Button variant="secondary" disabled={busy} onClick={() => void runNotionSync()}>
                Sync Notion
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => void runDriveSync()}>
                Sync Drive
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => void runResyncAll()}>
                Re-sync all
              </Button>
            </>
          ) : null}
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
