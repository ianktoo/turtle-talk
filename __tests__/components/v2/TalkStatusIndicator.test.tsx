import React from 'react';
import { render } from '@testing-library/react';
import TalkStatusIndicator from '@/app/v2/components/TalkStatusIndicator';

describe('TalkStatusIndicator', () => {
  it('renders with ok status by default', () => {
    const { container } = render(<TalkStatusIndicator />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with error status when hasError is true', () => {
    const { container } = render(<TalkStatusIndicator hasError />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with explicit status', () => {
    const { container } = render(<TalkStatusIndicator status="warning" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
