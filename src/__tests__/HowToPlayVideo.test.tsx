import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HowToPlayVideo, { HOW_TO_PLAY_VIDEO } from '../components/HowToPlayVideo';

describe('HowToPlayVideo', () => {
  let play: jest.SpyInstance;

  beforeEach(() => {
    play = jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
  });

  afterEach(() => play.mockRestore());

  it('opens the explainer full screen and plays it', () => {
    render(<MemoryRouter><HowToPlayVideo /></MemoryRouter>);
    expect(document.querySelector('video')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Watch how it works/ }));
    const video = document.querySelector('video');
    expect(video).not.toBeNull();
    expect(video?.getAttribute('src')).toBe(HOW_TO_PLAY_VIDEO);
    expect(play).toHaveBeenCalled();
  });

  it('closes with the close button or Escape', () => {
    render(<MemoryRouter><HowToPlayVideo /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Watch how it works/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Close the video' }));
    expect(document.querySelector('video')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Watch how it works/ }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.querySelector('video')).toBeNull();
  });

  it('falls back to muted playback with a sound button when sound is blocked', async () => {
    play.mockImplementationOnce(() => Promise.reject(new Error('NotAllowedError')));
    render(<MemoryRouter><HowToPlayVideo /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Watch how it works/ }));
    const unmute = await screen.findByRole('button', { name: 'Tap for sound' });
    expect((document.querySelector('video') as HTMLVideoElement).muted).toBe(true);
    fireEvent.click(unmute);
    expect((document.querySelector('video') as HTMLVideoElement).muted).toBe(false);
  });
});
