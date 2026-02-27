import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MuteButton from '@/app/components/talk/MuteButton';

describe('MuteButton', () => {
  it('renders with correct aria-label when not muted', () => {
    render(<MuteButton isMuted={false} onToggle={() => {}} />);
    expect(screen.getByLabelText('Mute microphone')).toBeTruthy();
  });

  it('renders with correct aria-label when muted', () => {
    render(<MuteButton isMuted={true} onToggle={() => {}} />);
    expect(screen.getByLabelText('Unmute microphone')).toBeTruthy();
  });

  it('calls onToggle when clicked', async () => {
    const onToggle = jest.fn();
    render(<MuteButton isMuted={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('sets aria-pressed correctly when not muted', () => {
    render(<MuteButton isMuted={false} onToggle={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('sets aria-pressed correctly when muted', () => {
    render(<MuteButton isMuted={true} onToggle={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('has touch target size of 64px', () => {
    render(<MuteButton isMuted={false} onToggle={() => {}} />);
    expect(screen.getByRole('button')).toHaveStyle({ width: '64px', height: '64px' });
  });

  it('renders an SVG icon', () => {
    const { container } = render(<MuteButton isMuted={false} onToggle={() => {}} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
