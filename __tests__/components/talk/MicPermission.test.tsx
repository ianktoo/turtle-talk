import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MicPermission from '@/app/components/talk/MicPermission';

describe('MicPermission', () => {
  it('renders the heading text', () => {
    render(<MicPermission onGranted={() => {}} onDenied={() => {}} />);
    expect(screen.getByText(/Hi! I need to hear you!/i)).toBeTruthy();
  });

  it('renders microphone prompt text', () => {
    render(<MicPermission onGranted={() => {}} onDenied={() => {}} />);
    expect(screen.getByText(/Can I use your microphone/i)).toBeTruthy();
  });

  it('renders Allow Microphone button', () => {
    render(<MicPermission onGranted={() => {}} onDenied={() => {}} />);
    expect(screen.getByText(/Allow Microphone/i)).toBeTruthy();
  });

  it('renders Go Back button', () => {
    render(<MicPermission onGranted={() => {}} onDenied={() => {}} />);
    expect(screen.getByText(/Go Back/i)).toBeTruthy();
  });

  it('calls onGranted when Allow Microphone is clicked', async () => {
    const onGranted = jest.fn();
    render(<MicPermission onGranted={onGranted} onDenied={() => {}} />);
    await userEvent.click(screen.getByText(/Allow Microphone/i));
    expect(onGranted).toHaveBeenCalledTimes(1);
  });

  it('calls onDenied when Go Back is clicked', async () => {
    const onDenied = jest.fn();
    render(<MicPermission onGranted={() => {}} onDenied={onDenied} />);
    await userEvent.click(screen.getByText(/Go Back/i));
    expect(onDenied).toHaveBeenCalledTimes(1);
  });

  it('renders a TurtleCharacter SVG', () => {
    const { container } = render(<MicPermission onGranted={() => {}} onDenied={() => {}} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
