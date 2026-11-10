import React, { useSyncExternalStore } from 'react';
import { playSound, setSoundsOn, soundsOn, subscribeToSounds } from '../../services/sounds';

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" />
      {on ? (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      ) : (
        <>
          <path d="m16 9 6 6" />
          <path d="m22 9-6 6" />
        </>
      )}
    </svg>
  );
}

/** Game sounds on or off for this phone. Turning them on plays a sample. */
export default function SoundToggle() {
  const on = useSyncExternalStore(subscribeToSounds, soundsOn, soundsOn);
  const toggle = () => {
    setSoundsOn(!on);
    if (!on) playSound('alert');
  };
  return (
    <button className="btn btn-ghost" onClick={toggle}>
      <SpeakerIcon on={on} />
      {on ? 'Sounds on' : 'Sounds off'}
    </button>
  );
}
