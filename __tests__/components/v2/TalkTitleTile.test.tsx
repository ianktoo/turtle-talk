import React from 'react';
import { render, screen } from '@testing-library/react';
import TalkTitleTile from '@/app/v2/components/TalkTitleTile';

describe('TalkTitleTile', () => {
  it('renders Talking with shelly text', () => {
    render(<TalkTitleTile />);
    expect(screen.getByText(/Talking with shelly/i)).toBeInTheDocument();
  });
});
