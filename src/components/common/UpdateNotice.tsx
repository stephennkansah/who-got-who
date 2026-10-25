import React, { useEffect, useState } from 'react';

export const UPDATE_READY_EVENT = 'wgw-update-ready';

/** Offers a refresh once a newly deployed version has taken over the service worker. */
export default function UpdateNotice() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onReady = () => setReady(true);
    window.addEventListener(UPDATE_READY_EVENT, onReady);
    return () => window.removeEventListener(UPDATE_READY_EVENT, onReady);
  }, []);

  if (!ready) return null;
  return (
    <div className="update-notice" role="status">
      <span>A new version is ready</span>
      <button className="chip-btn active" onClick={() => window.location.reload()}>
        Refresh
      </button>
    </div>
  );
}
