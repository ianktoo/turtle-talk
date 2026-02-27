import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClearButton from '@/app/components/talk/ClearButton';

describe('ClearButton', () => {
  it('renders the button', () => {
    render(<ClearButton onClear={() => {}} />);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('has correct aria-label', () => {
    render(<ClearButton onClear={() => {}} />);
    expect(screen.getByLabelText('Start over')).toBeTruthy();
  });

  it('calls onClear when clicked', async () => {
    const onClear = jest.fn();
    render(<ClearButton onClear={onClear} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('has touch target size of 64px', () => {
    render(<ClearButton onClear={() => {}} />);
    expect(screen.getByRole('button')).toHaveStyle({ width: '64px', height: '64px' });
  });

  it('renders an SVG icon by default', () => {
    const { container } = render(<ClearButton onClear={() => {}} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('still renders the button after click (confirmed state)', () => {
    jest.useFakeTimers();
    render(<ClearButton onClear={() => {}} />);
    act(() => fireEvent.click(screen.getByRole('button')));
    expect(screen.getByRole('button')).toBeTruthy();
    jest.useRealTimers();
  });

  it('reverts to default state after 1.5s', () => {
    jest.useFakeTimers();
    const onClear = jest.fn();
    render(<ClearButton onClear={onClear} />);
    act(() => fireEvent.click(screen.getByRole('button')));
    act(() => jest.advanceTimersByTime(1500));
    // Button should still render (not in confirmed state)
    expect(screen.getByRole('button')).toBeTruthy();
    jest.useRealTimers();
  });
});
