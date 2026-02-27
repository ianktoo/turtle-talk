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

  it('has primary touch target size of 80px', () => {
    render(<EndButton onEnd={() => {}} />);
    expect(screen.getByRole('button')).toHaveStyle({ width: '80px', height: '80px' });
  });

  it('renders an SVG icon', () => {
    const { container } = render(<EndButton onEnd={() => {}} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
