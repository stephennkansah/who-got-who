import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BustModal from '../components/BustModal';
import { Bust, TaskInstance } from '../types';

const bust: Bust = {
  id: 'bust-1',
  catcherId: 'jordan',
  playerId: 'me',
  openedAt: new Date(),
  closesAt: new Date(Date.now() + 300000),
  result: 'pending',
};

const missions: TaskInstance[] = [
  { id: 't1', gameId: 'G', playerId: 'me', text: 'Get a player to hum a tune', status: 'pending' },
  { id: 't2', gameId: 'G', playerId: 'me', text: 'Get a player to high-five you', status: 'pending' },
];

describe('BustModal', () => {
  it('asks which mission, and only confirms once one is picked', async () => {
    const onAnswer = jest.fn().mockResolvedValue(undefined);
    render(<BustModal bust={bust} catcherName="Jordan" missions={missions} onAnswer={onAnswer} />);
    expect(screen.getByText('Jordan')).toBeInTheDocument();
    const confirm = screen.getByRole('button', { name: 'Yes, They Caught Me' });
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: 'Get a player to high-five you' }));
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith('t2'));
  });

  it('lets the player say they were not caught', async () => {
    const onAnswer = jest.fn().mockResolvedValue(undefined);
    render(<BustModal bust={bust} catcherName="Jordan" missions={missions} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByRole('button', { name: "They didn't catch me" }));
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith(null));
  });

  it('disappears once the time to answer has run out', () => {
    const { container } = render(
      <BustModal bust={{ ...bust, closesAt: new Date(Date.now() - 1000) }} catcherName="Jordan" missions={missions} onAnswer={jest.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Busted?')).not.toBeInTheDocument();
  });
});
