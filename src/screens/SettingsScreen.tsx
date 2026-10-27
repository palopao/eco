import { UniversalHeader } from "../components/ui/UniversalHeader";
import { Icon } from "../components/ui/Icon";

export function SettingsScreen({ close, onLogout }: { close: () => void; onLogout: () => void }) {
  return <main className="account-screen settings-screen">
    <UniversalHeader onLogo={close} action={<button className="header-text-action" onClick={close}>Done</button>} />
    <div className="screen-heading"><span>YOUR ECO</span><h1>Settings</h1></div>
    <section className="settings-group"><h2>Account & Sync</h2><div className="settings-card">
      <div className="setting-row"><span><strong>Spotify Live Sync</strong><small>Not connected — backend integration required</small></span></div>
      <div className="setting-row"><span><strong>Last.fm Auto-Scrobble</strong><small>Username can be saved in Edit Profile; sync requires backend integration</small></span></div>
      <div className="setting-row"><span><strong>Account email</strong><small>{""}</small></span></div>
    </div></section>
    <section className="settings-group"><h2>Preferences</h2><div className="settings-card">
      <button className="setting-link"><span><strong>Default Rating Scale</strong><small>0.5 – 5.0 Stars</small></span><Icon name="chevron" size={19} /></button>
      <button className="setting-link"><span><strong>Notification Settings</strong><small>Push, email, and activity alerts</small></span><Icon name="chevron" size={19} /></button>
    </div></section>
    <section className="settings-group account-actions"><h2>Account Actions</h2><div className="settings-card"><button onClick={onLogout}>Log Out</button></div></section>
    <p className="settings-version"> Version 1.0.0</p>
  </main>;
}
