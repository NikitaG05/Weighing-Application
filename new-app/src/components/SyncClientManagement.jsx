import { useCallback, useEffect, useState } from "react";
import { getSites } from "../api/sitesApi";
import {
  listSyncClients,
  createSyncClient,
  changeSyncClientStatus,
  rotateSyncClientSecret,
} from "../api/syncClientsApi";
import "../style/SyncClientManagement.css";

export default function SyncClientManagement({ accessToken }) {
  const [clients, setClients] = useState([]);
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [issued, setIssued] = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [clientData, siteData] = await Promise.all([
        listSyncClients(accessToken),
        getSites(accessToken),
      ]);
      setClients(Array.isArray(clientData) ? clientData : clientData?.content || []);
      setSites(Array.isArray(siteData) ? siteData : []);
    } catch (err) { setError(err.message); }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  async function execute(action) {
    setBusy(true);
    setError("");
    setNotice("");
    setIssued(null);
    try {
      await action();
      await load();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  function reveal(result) {
    if (!result?.clientSecret) {
      throw new Error("Server did not return a new secret. Check the response.");
    }
    setIssued({
      clientCode: result.clientCode,
      clientSecret: result.clientSecret,
      siteId: result.siteId,
    });
  }

  const create = () => execute(async () => {
    if (!siteId) throw new Error("Select a site first.");
    const result = await createSyncClient(accessToken, siteId);
    reveal(result);
    setNotice("Client created. Save the secret securely; it cannot be retrieved later.");
  });

  const toggle = (client) => execute(async () => {
    const next = !client.enabled;
    if (!window.confirm(`${next ? "Enable" : "Disable"} ${client.clientCode}?`)) return;
    await changeSyncClientStatus(accessToken, client.id, next);
    setNotice(`Client ${next ? "enabled" : "disabled"}.`);
  });

  const rotate = (client) => execute(async () => {
    if (!window.confirm(`Rotate secret for ${client.clientCode}? The old secret will stop working.`)) return;
    const result = await rotateSyncClientSecret(accessToken, client.id);
    reveal(result);
    setNotice("Secret rotated. Update the desktop agent's stored secret.");
  });

  return (
    <div className="sync-management">
      <div className="sync-heading">
        <div>
          <h2>Desktop Sync Credentials</h2>
          <p>Admin-only management for TareX desktop connections.</p>
        </div>
        <button type="button" disabled={busy} onClick={load}>Refresh</button>
      </div>

      {error && <p className="sync-error" role="alert">{error}</p>}
      {notice && <p className="sync-notice" role="status">{notice}</p>}

      <section className="sync-panel">
        <h3>Generate API Key & Secret</h3>
        <div className="sync-create">
          <label htmlFor="sync-site">Weighbridge Site</label>
          <select id="sync-site" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
            <option value="">Select site</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>{site.siteName}</option>
            ))}
          </select>
          <button type="button" disabled={busy || !siteId} onClick={create}>
            Generate credentials
          </button>
        </div>
      </section>

      {issued && (
        <section className="sync-panel sync-issued" aria-label="New credentials">
          <div className="sync-heading">
            <h3>New credentials — shown once</h3>
            <button type="button" onClick={() => setIssued(null)}>Hide</button>
          </div>
          <p>Store these securely. Do not commit them to GitHub or share screenshots.</p>
          <label>API Key (Client Code)</label>
          <code>{issued.clientCode}</code>
          <label>Client Secret</label>
          <code>{issued.clientSecret}</code>
          <button type="button" onClick={() => navigator.clipboard.writeText(
            `Client Code: ${issued.clientCode}\nClient Secret: ${issued.clientSecret}\nSite ID: ${issued.siteId}`
          ).then(() => setNotice("Credentials copied.")).catch(() => setError("Copy failed; select the text manually."))}>
            Copy credentials
          </button>
        </section>
      )}

      <section className="sync-panel">
        <h3>Registered desktop clients</h3>
        <div className="sync-table-scroll">
          <table className="sync-table">
            <thead><tr><th>Client Code</th><th>Site</th><th>Status</th><th>Last Sync</th><th>Actions</th></tr></thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td><code>{client.clientCode}</code></td>
                  <td>{sites.find((site) => Number(site.id) === Number(client.siteId))?.siteName || `Site ${client.siteId}`}</td>
                  <td>{client.enabled ? "Enabled" : "Disabled"}</td>
                  <td>{client.lastSyncAt ? new Date(client.lastSyncAt).toLocaleString() : "Never"}</td>
                  <td className="sync-actions">
                    <button type="button" disabled={busy} onClick={() => toggle(client)}>
                      {client.enabled ? "Disable" : "Enable"}
                    </button>
                    <button type="button" disabled={busy} onClick={() => rotate(client)}>
                      Rotate secret
                    </button>
                  </td>
                </tr>
              ))}
              {!clients.length && <tr><td colSpan="5">No clients found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
