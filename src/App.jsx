import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Smartphone,
  Wifi,
  RefreshCw,
  Terminal,
  Play,
  Link,
  WifiOff,
  Scan,
  Activity,
  Laptop,
  Settings,
  X,
  Globe,
  Moon,
  Sun,
  Download,
  Coffee
} from 'lucide-react';
import { translations } from './i18n';
import { themes } from './themes';

function App() {
  const [activeTab, setActiveTab] = useState('adb');
  const [adbDevices, setAdbDevices] = useState([]);
  const [networkDevices, setNetworkDevices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [scanning, setScanning] = useState(false);

  // Settings
  const [language, setLanguage] = useState('en');
  const [themeMode, setThemeMode] = useState('dark'); // 'dark' | 'light'
  const [showSettings, setShowSettings] = useState(false);

  // Connection Inputs
  const [connectIp, setConnectIp] = useState('');
  const [connectPort, setConnectPort] = useState('5555');

  const t = translations[language];

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
  };

  const fetchAdbDevices = async () => {
    try {
      const devices = await invoke('list_adb_devices');
      setAdbDevices(devices);
    } catch (e) {
      addLog(`ADB Error: ${e}`, 'error');
    }
  };

  const startNetworkScan = async () => {
    setScanning(true);
    addLog('Starting network scan...', 'info');
    try {
      const results = await invoke('scan_network');
      setNetworkDevices(results);
      addLog(`Scan complete. Found ${results.length} devices.`, 'success');
    } catch (e) {
      addLog(`Scan Error: ${e}`, 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleLaunchScrcpy = async (serial) => {
    addLog(`Launching scrcpy for ${serial}...`, 'info');
    try {
      await invoke('launch_scrcpy', { serial });
      addLog(`scrcpy launched for ${serial}`, 'success');
    } catch (e) {
      addLog(`Failed to launch scrcpy: ${e}`, 'error');
    }
  };

  const handleConnect = async (ip, port = '5555') => {
    const target = `${ip}:${port}`;
    addLog(`Connecting to ${target}...`, 'info');
    try {
      const res = await invoke('adb_connect', { ip: target });
      addLog(`Connect result: ${res}`, 'success');
      fetchAdbDevices();
    } catch (e) {
      addLog(`Connect failed: ${e}`, 'error');
    }
  };

  const exportTheme = () => {
    const currentTheme = themes[themeMode];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentTheme, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `orbit_theme_${themeMode}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    addLog(`Theme exported: ${themeMode}`, 'success');
  };

  useEffect(() => {
    fetchAdbDevices();
    const interval = setInterval(fetchAdbDevices, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-app-bg text-app-text font-sans overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-app-surface border-r border-app-border flex flex-col p-4 relative transition-colors duration-300">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-app-primary to-app-accent rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative p-2 bg-app-surface ring-1 ring-app-border rounded-lg">
              <Activity size={24} className="text-app-primary" />
            </div>
          </div>
          <span className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-app-primary to-app-accent">
            {t.appName}
          </span>
        </div>

        <nav className="space-y-1 flex-1">
          <button
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'adb'
              ? 'bg-app-primary/10 text-app-primary ring-1 ring-app-primary/20'
              : 'text-app-text-muted hover:bg-app-bg hover:text-app-text'
              }`}
            onClick={() => setActiveTab('adb')}
          >
            <Smartphone size={18} />
            {t.adbDevices}
          </button>
          <button
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'net'
              ? 'bg-app-primary/10 text-app-primary ring-1 ring-app-primary/20'
              : 'text-app-text-muted hover:bg-app-bg hover:text-app-text'
              }`}
            onClick={() => setActiveTab('net')}
          >
            <Wifi size={18} />
            {t.networkScan}
          </button>
        </nav>

        <div className="mt-auto space-y-2">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-app-text-muted hover:text-app-text hover:bg-app-bg transition-colors"
          >
            <Settings size={16} />
            {t.settings}
          </button>
          <div className="px-2">
            <div className="flex items-center justify-between text-xs text-app-text-muted font-medium bg-app-bg/50 p-2.5 rounded-lg border border-app-border">
              <span>{t.status}</span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {t.statusActive}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-16 border-b border-app-border flex items-center justify-between px-6 bg-app-bg/50 backdrop-blur-sm z-10 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-app-text">
            {activeTab === 'adb' ? t.adbDevices : t.networkScan}
          </h2>
          <div className="flex items-center gap-2">
            {activeTab === 'adb' ? (
              <button
                onClick={fetchAdbDevices}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-app-text-muted hover:text-app-text hover:bg-app-surface rounded-md transition-colors"
              >
                <RefreshCw size={16} /> {t.refresh}
              </button>
            ) : (
              <button
                onClick={startNetworkScan}
                disabled={scanning}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white transition-all shadow-lg shadow-app-primary/20 ${scanning
                  ? 'bg-app-primary/50 cursor-not-allowed'
                  : 'bg-app-primary hover:bg-app-primary-hover hover:shadow-app-primary/20'
                  }`}
              >
                {scanning ? <RefreshCw className="animate-spin" size={16} /> : <Scan size={16} />}
                {scanning ? t.scanning : t.scanNetwork}
              </button>
            )}
          </div>
        </header>

        {/* Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'adb' && (
            <>
              {adbDevices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-app-text-muted border border-dashed border-app-border rounded-xl bg-app-surface/30">
                  <Smartphone size={48} className="mb-4 opacity-50" />
                  <p className="text-sm">{t.noDevices}</p>
                  <span className="text-xs text-app-text-muted mt-1">{t.plugInHint}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adbDevices.map(device => (
                    <div key={device.serial} className="bg-app-surface border border-app-border rounded-xl p-4 hover:border-app-primary/50 transition-all group shadow-sm hover:shadow-app-primary/10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-app-bg rounded-lg text-app-text-muted group-hover:text-app-primary transition-colors">
                          <Smartphone size={24} />
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${device.state === 'device'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-zinc-700/50 text-zinc-400 border border-zinc-700'
                          }`}>
                          {device.state}
                        </span>
                      </div>

                      <div className="mb-4">
                        <h3 className="font-medium text-app-text truncate">{device.model || 'Unknown Device'}</h3>
                        <p className="text-xs text-app-text-muted font-mono truncate">{device.serial}</p>
                      </div>

                      <button
                        onClick={() => handleLaunchScrcpy(device.serial)}
                        className="w-full flex items-center justify-center gap-2 bg-app-bg hover:bg-zinc-700 text-app-text py-2 rounded-lg text-sm font-medium transition-colors hover:text-white"
                      >
                        <Play size={16} className="fill-current" /> {t.mirror}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 border-t border-app-border pt-8 max-w-2xl">
                <h3 className="text-sm font-medium text-app-text-muted mb-4 flex items-center gap-2">
                  <Link size={16} /> {t.manualConnection}
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder={t.ipAddress}
                    className="flex-1 bg-app-surface border border-app-border rounded-lg px-4 py-2.5 text-sm text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-app-primary/50 focus:ring-1 focus:ring-app-primary/50 transition-all"
                    value={connectIp}
                    onChange={e => setConnectIp(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder={t.port}
                    className="w-24 bg-app-surface border border-app-border rounded-lg px-4 py-2.5 text-sm text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-app-primary/50 focus:ring-1 focus:ring-app-primary/50 transition-all"
                    value={connectPort}
                    onChange={e => setConnectPort(e.target.value)}
                  />
                  <button
                    onClick={() => handleConnect(connectIp, connectPort)}
                    disabled={!connectIp}
                    className="bg-app-surface hover:bg-app-bg text-app-text px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-app-border"
                  >
                    {t.connect}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'net' && (
            <>
              {networkDevices.length === 0 && !scanning ? (
                <div className="flex flex-col items-center justify-center py-20 text-app-text-muted border border-dashed border-app-border rounded-xl bg-app-surface/30">
                  <WifiOff size={48} className="mb-4 opacity-50" />
                  <p className="text-sm">{t.noNetworkDevices}</p>
                  <span className="text-xs text-app-text-muted mt-1">{t.scanHint}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {networkDevices.map((dev, idx) => (
                    <div key={idx} className="bg-app-surface border border-app-border rounded-lg p-4 flex items-center justify-between hover:border-app-border/80 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-app-bg rounded-lg text-app-text-muted group-hover:text-app-primary transition-colors">
                          <Laptop size={20} />
                        </div>
                        <div>
                          <div className="font-mono text-sm text-app-text">{dev.ip}</div>
                          <div className="text-xs text-app-text-muted">{dev.vendor || 'Unknown Vendor'} • {dev.mac}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConnect(dev.ip, '5555')}
                        className="px-4 py-2 bg-app-bg border border-app-border hover:border-app-text-muted text-app-text-muted hover:text-app-text rounded-md text-xs font-medium transition-all"
                      >
                        {t.connect}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Console Log */}
        <div className="h-48 bg-black border-t border-app-border flex flex-col font-mono text-xs">
          <div className="flex items-center px-4 py-2 bg-app-bg/50 border-b border-app-border text-app-text-muted uppercase tracking-wider text-[10px] font-bold">
            <Terminal size={12} className="mr-2" /> {t.activityLog}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {logs.length === 0 && <span className="text-zinc-700 italic">{t.ready}</span>}
            {logs.map((log, i) => (
              <div key={i} className={`flex gap-3 ${log.includes('Error') ? 'text-red-400' :
                log.includes('success') ? 'text-emerald-400' : 'text-zinc-400'
                }`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-app-surface border border-app-border rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-app-text flex items-center gap-2">
                <Settings size={20} /> {t.settings}
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-app-text-muted hover:text-app-text transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Theme Toggle */}
              <div>
                <label className="block text-sm font-medium text-app-text-muted mb-2 flex items-center gap-2">
                  {themeMode === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  Theme
                </label>
                <div className="flex bg-app-bg rounded-lg p-1 border border-app-border">
                  <button
                    onClick={() => setThemeMode('dark')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${themeMode === 'dark'
                      ? 'bg-app-surface text-app-text shadow-sm'
                      : 'text-app-text-muted hover:text-app-text'
                      }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setThemeMode('light')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${themeMode === 'light'
                      ? 'bg-app-surface text-app-text shadow-sm'
                      : 'text-app-text-muted hover:text-app-text'
                      }`}
                  >
                    Light
                  </button>
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-app-text-muted mb-2 flex items-center gap-2">
                  <Globe size={16} /> {t.language}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'pt-BR', label: 'Português (BR)' },
                    { code: 'ru', label: 'Русский' },
                    { code: 'zh-CN', label: '简体中文' }
                  ].map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`px-4 py-3 rounded-lg text-sm text-left border transition-all ${language === lang.code
                        ? 'bg-app-primary/10 border-app-primary/50 text-app-primary'
                        : 'bg-app-bg border-app-border text-app-text-muted hover:border-app-text-muted/50 hover:text-app-text'
                        }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Theme */}
              <div>
                <label className="block text-sm font-medium text-app-text-muted mb-2">Advanced</label>
                <button
                  onClick={exportTheme}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-app-border rounded-lg text-sm bg-app-bg hover:bg-app-surface text-app-text transition-colors"
                >
                  <Download size={16} /> Export Theme JSON
                </button>
                <div className="pt-2 border-t border-app-border">
                  <a
                    href="https://www.buymeacoffee.com/maktheus" // Replace with your actual username
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black font-bold rounded-lg transition-colors"
                  >
                    <Coffee size={20} />
                    Buy me a coffee
                  </a>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-app-bg hover:bg-app-border text-app-text rounded-lg text-sm font-medium transition-colors"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
