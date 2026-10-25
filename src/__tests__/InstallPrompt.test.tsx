import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import InstallPrompt, { detectPlatform } from '../components/InstallPrompt';
import { Capacitor } from '@capacitor/core';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const INSTAGRAM = `${IPHONE} Instagram 350.0.0.0`;
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

describe('detectPlatform', () => {
  it('picks the right install steps for each browser', () => {
    expect(detectPlatform(IPHONE)).toBe('ios');
    expect(detectPlatform(IPAD, 5)).toBe('ios');
    expect(detectPlatform(IPAD, 0)).toBe('other');
    expect(detectPlatform(ANDROID)).toBe('android');
    expect(detectPlatform(INSTAGRAM)).toBe('in-app');
  });
});

describe('InstallPrompt', () => {
  const userAgent = jest.spyOn(window.navigator, 'userAgent', 'get');

  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = jest.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
  });

  it('walks iPhone players through Add to Home Screen instead of a passing toast', () => {
    userAgent.mockReturnValue(IPHONE);
    render(<InstallPrompt />);
    fireEvent.click(screen.getByText('Install App'));
    expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument();
    expect(screen.getByText(/Install before you join a game/)).toBeInTheDocument();
  });

  it('tells in-app browser players to open Safari or Chrome first', () => {
    userAgent.mockReturnValue(INSTAGRAM);
    render(<InstallPrompt />);
    fireEvent.click(screen.getByText('Install App'));
    expect(screen.getByText(/Open in Safari/)).toBeInTheDocument();
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
  });

  it('stays hidden once installed', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    userAgent.mockReturnValue(ANDROID);
    render(<InstallPrompt />);
    expect(screen.queryByText('Install App')).not.toBeInTheDocument();
  });

  it('does not offer web installation inside the iPhone app', () => {
    const native = jest.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    userAgent.mockReturnValue(IPHONE);
    render(<InstallPrompt />);
    expect(screen.queryByText('Install App')).not.toBeInTheDocument();
    native.mockRestore();
  });
});
