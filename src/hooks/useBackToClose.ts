import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/*
 * Lets the phone's back button close the top popup (or the rules) instead of
 * leaving the screen. Each open sheet adds a history entry tagged with its id;
 * pressing back removes the entry and the sheet closes. When a sheet is closed
 * any other way, the stale entry is stepped back over so back still works once.
 */

type SheetState = { sheets?: string[] } & Record<string, unknown>;

const openSheets: string[] = [];
let goBack: (() => void) | null = null;
let syncQueued = false;

function sheetsOnTop(): string[] {
  const state = window.history.state as { usr?: SheetState } | null;
  return state?.usr?.sheets ?? [];
}

/** After this tick, step off any history entry that belongs to a sheet that has closed. */
function syncSoon() {
  if (syncQueued) return;
  syncQueued = true;
  window.setTimeout(() => {
    syncQueued = false;
    if (sheetsOnTop().some((id) => !openSheets.includes(id))) goBack?.();
  }, 0);
}

/** Mount once inside the router: keeps history tidy after back presses and reloads. */
export function SheetHistorySync() {
  const navigate = useNavigate();
  const location = useLocation();
  goBack = () => navigate(-1);
  useEffect(() => {
    syncSoon();
  }, [location]);
  return null;
}

export function useBackToClose(active: boolean, onClose: () => void) {
  const navigate = useNavigate();
  const location = useLocation();
  const id = useRef(`sheet-${Math.random().toString(36).slice(2, 10)}`);
  const seen = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return undefined;
    const sheet = id.current;
    openSheets.push(sheet);
    seen.current = false;
    // One entry per opening, even if the effect re-runs (React dev mode runs it twice).
    if (!sheetsOnTop().includes(sheet)) {
      const here = window.location;
      navigate(`${here.pathname}${here.search}`, {
        state: { ...((window.history.state?.usr as SheetState) || {}), sheets: [...openSheets] },
      });
    }
    return () => {
      const index = openSheets.indexOf(sheet);
      if (index >= 0) openSheets.splice(index, 1);
      syncSoon();
    };
    // The push should happen once per opening, not on every navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const sheets = (location.state as SheetState | null)?.sheets ?? [];
    if (sheets.includes(id.current)) {
      seen.current = true;
    } else if (seen.current) {
      // Back took our entry away: close.
      seen.current = false;
      onCloseRef.current();
    }
  }, [location, active]);
}
