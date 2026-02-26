import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MuteButton from '@/app/components/talk/MuteButton';

describe('MuteButton', () => {
  it('renders the microphone emoji when not muted', () => {
    render(<MuteButton isMuted={false} onToggle={() => {}} />);
    expect(screen.getByLabelText('Mute microphone')).toBeTruthy();
    expect(screen.getByText('🎤')).toBeTruthy();
  });

  it('renders the muted emoji when muted', () => {
    render(<MuteButton isMuted={true} onToggle={() => {}} />);
    expect(screen.getByLabelText('Unmute microphone')).toBeTruthy();
    expect(screen.getByText('🔇')).toBeTruthy();
  });

  it('calls onToggle when clicked', async () => {
    const onToggle = jest.fn();
    render(<MuteButton isMuted={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('sets aria-pressed correctly when not muted', () => {
    render(<MuteButton isMuted={false} onToggle={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('sets aria-pressed correctly when muted', () => {
    render(<MuteButton isMuted={true} onToggle={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('has minimum touch target size of 56px', () => {
    render(<MuteButton isMuted={false} onToggle={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveStyle({ width: '56px', height: '56px' });
  });
});
