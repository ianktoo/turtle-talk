import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MicPermissionV2 from '@/app/v2/components/MicPermissionV2';

describe('MicPermissionV2', () => {
  it('renders the heading text', () => {
    render(<MicPermissionV2 onGranted={() => {}} onDenied={() => {}} />);
    expect(screen.getByText(/Hi! I need to hear you!/i)).toBeInTheDocument();
  });

  it('renders microphone prompt text', () => {
    render(<MicPermissionV2 onGranted={() => {}} onDenied={() => {}} />);
    expect(screen.getByText(/Can I use your microphone/i)).toBeInTheDocument();
  });

  it('renders Allow Microphone button', () => {
    render(<MicPermissionV2 onGranted={() => {}} onDenied={() => {}} />);
    expect(screen.getByRole('button', { name: /Allow Microphone/i })).toBeInTheDocument();
  });

  it('renders Go Back button', () => {
    render(<MicPermissionV2 onGranted={() => {}} onDenied={() => {}} />);
    expect(screen.getByRole('button', { name: /Go Back/i })).toBeInTheDocument();
  });

  it('calls onGranted when Allow Microphone is clicked', async () => {
    const onGranted = jest.fn();
    render(<MicPermissionV2 onGranted={onGranted} onDenied={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /Allow Microphone/i }));
    expect(onGranted).toHaveBeenCalledTimes(1);
  });

  it('calls onDenied when Go Back is clicked', async () => {
    const onDenied = jest.fn();
    render(<MicPermissionV2 onGranted={() => {}} onDenied={onDenied} />);
    await userEvent.click(screen.getByRole('button', { name: /Go Back/i }));
    expect(onDenied).toHaveBeenCalledTimes(1);
  });
});
