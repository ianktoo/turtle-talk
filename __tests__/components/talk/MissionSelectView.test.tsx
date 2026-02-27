import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MissionSelectView from '@/app/components/talk/MissionSelectView';
import type { MissionSuggestion } from '@/lib/speech/types';

const choices: MissionSuggestion[] = [
  { title: 'Help a friend smile', description: 'Do one kind thing for someone today', theme: 'kind', difficulty: 'easy' },
  { title: 'Stand up for someone', description: 'Speak up when something is unfair', theme: 'brave', difficulty: 'medium' },
  { title: 'Lead a group game', description: 'Take charge and organise a game with others', theme: 'confident', difficulty: 'stretch' },
];

describe('MissionSelectView', () => {
  it('renders the heading', () => {
    render(<MissionSelectView choices={choices} onSelect={jest.fn()} onDismiss={jest.fn()} />);
    expect(screen.getByText(/Choose your mission/i)).toBeInTheDocument();
  });

  it('renders all three mission cards', () => {
    render(<MissionSelectView choices={choices} onSelect={jest.fn()} onDismiss={jest.fn()} />);
    expect(screen.getByText('Help a friend smile')).toBeInTheDocument();
    expect(screen.getByText('Stand up for someone')).toBeInTheDocument();
    expect(screen.getByText('Lead a group game')).toBeInTheDocument();
  });

  it('renders difficulty badges', () => {
    render(<MissionSelectView choices={choices} onSelect={jest.fn()} onDismiss={jest.fn()} />);
    expect(screen.getByText('easy')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('stretch')).toBeInTheDocument();
  });

  it('calls onSelect with the correct choice when a card is clicked', () => {
    const onSelect = jest.fn();
    render(<MissionSelectView choices={choices} onSelect={onSelect} onDismiss={jest.fn()} />);
    fireEvent.click(screen.getByText('Stand up for someone'));
    expect(onSelect).toHaveBeenCalledWith(choices[1]);
  });

  it('calls onDismiss when "Maybe later" is clicked', () => {
    const onDismiss = jest.fn();
    render(<MissionSelectView choices={choices} onSelect={jest.fn()} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText(/Maybe later/i));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not call onSelect when dismiss is clicked', () => {
    const onSelect = jest.fn();
    render(<MissionSelectView choices={choices} onSelect={onSelect} onDismiss={jest.fn()} />);
    fireEvent.click(screen.getByText(/Maybe later/i));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
