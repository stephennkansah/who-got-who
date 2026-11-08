import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useBackToClose } from '../hooks/useBackToClose';

// The one-minute explainer (vertical, captions burned in). Bundled with the
// site and the iPhone app; the full-size cuts live with the other films in
// ai-notes-advert/src/who-got-who.
const publicUrl = process.env.PUBLIC_URL || '';
export const HOW_TO_PLAY_VIDEO = `${publicUrl}/videos/how-to-play.mp4`;
export const HOW_TO_PLAY_POSTER = `${publicUrl}/videos/how-to-play-poster.jpg`;

/** play() returns a promise in modern browsers, nothing in older ones. */
const startPlaying = (element: HTMLVideoElement): Promise<void> => {
  try {
    const attempt = element.play() as Promise<void> | undefined;
    return attempt && typeof attempt.then === 'function' ? attempt : Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

/** Full-screen player. Starts with sound; if the browser refuses, it plays muted (the captions carry it). */
function VideoOverlay({ onClose }: { onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  useBackToClose(true, onClose);

  useEffect(() => {
    const element = video.current;
    if (!element) return undefined;
    startPlaying(element).catch(() => {
      element.muted = true;
      setMuted(true);
      startPlaying(element).catch(() => undefined);
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className="video-overlay" role="dialog" aria-modal="true" aria-label="How Who Got Who works, in one minute">
      <video
        ref={video}
        className="video-overlay-player"
        src={HOW_TO_PLAY_VIDEO}
        poster={HOW_TO_PLAY_POSTER}
        playsInline
        controls
        preload="auto"
        onEnded={onClose}
      />
      {muted && (
        <button
          className="video-unmute"
          onClick={() => {
            if (video.current) video.current.muted = false;
            setMuted(false);
          }}
        >
          Tap for sound
        </button>
      )}
      <button className="video-close" onClick={onClose} aria-label="Close the video">
        ✕
      </button>
    </div>,
    document.body,
  );
}

/** "Watch how it works": a small poster card that opens the explainer full screen. */
export default function HowToPlayVideo({ style }: { style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="htp-video-card" onClick={() => setOpen(true)} style={style}>
        <span className="htp-video-thumb" aria-hidden="true">
          <img src={HOW_TO_PLAY_POSTER} alt="" />
          <span className="htp-video-play" />
        </span>
        <span className="htp-video-text">
          <strong>Watch how it works</strong>
          <span>1 minute · the whole game, start to finish</span>
        </span>
      </button>
      {open && <VideoOverlay onClose={() => setOpen(false)} />}
    </>
  );
}
