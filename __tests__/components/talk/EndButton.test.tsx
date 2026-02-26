import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EndButton from '@/app/components/talk/EndButton';

describe('EndButton', () => {
  it('renders the button', () => {
    render(<EndButton onEnd={() => {}} />);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('has correct aria-label', () => {
    render(<EndButton onEnd={() => {}} />);
    expect(screen.getByLabelText('End conversation')).toBeTruthy();
  });

  it('calls onEnd when clicked', async () => {
    const onEnd = jest.fn();
    render(<EndButton onEnd={onEnd} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('has minimum touch target size of 56px', () => {
    render(<EndButton onEnd={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveStyle({ width: '56px', height: '56px' });
  });

  it('displays ✕ symbol', () => {
    render(<EndButton onEnd={() => {}} />);
    expect(screen.getByText('✕')).toBeTruthy();
  });
});
