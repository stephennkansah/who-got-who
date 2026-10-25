import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { invitePath, isNativeApp } from '../services/appPlatform';

export default function NativeLifecycle() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isNativeApp()) return;
    let stopped = false;
    const listeners: PluginListenerHandle[] = [];
    const openInvite = (url?: string) => {
      const path = url && invitePath(url);
      if (path && !stopped) navigate(path);
    };
    const keep = (listener: PluginListenerHandle) => {
      if (stopped) void listener.remove();
      else listeners.push(listener);
    };
    void App.addListener('appUrlOpen', ({ url }) => openInvite(url)).then(keep).catch(console.warn);
    void App.addListener('appStateChange', ({ isActive }) => {
      // Reuse the game's normal reconnect path after iOS suspends the WebView.
      if (isActive) document.dispatchEvent(new Event('visibilitychange'));
    }).then(keep).catch(console.warn);
    void App.getLaunchUrl().then((launch) => openInvite(launch?.url)).catch(console.warn);
    return () => {
      stopped = true;
      listeners.forEach((listener) => void listener.remove());
    };
  }, [navigate]);
  return null;
}
