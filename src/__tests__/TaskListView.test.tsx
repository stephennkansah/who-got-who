import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import TaskListView from '../components/TaskListView';
import { TaskInstance } from '../types';

const tasks: TaskInstance[] = [
  { id: 't1', gameId: 'G', playerId: 'me', text: 'Get a player to do 10 push-ups', status: 'pending' },
  { id: 't2', gameId: 'G', playerId: 'me', text: 'Get a player to start a conga line', status: 'pending' },
];

const view = (props: Partial<React.ComponentProps<typeof TaskListView>> = {}) =>
  render(
    <TaskListView
      tasks={tasks}
      players={[]}
      onTaskResult={jest.fn()}
      onSwapTask={jest.fn()}
      swapsLeft={2}
      swapsTotal={2}
      activeDisputes={[]}
      currentPlayerId="me"
      filing={null}
      {...props}
    />,
  );

describe('TaskListView', () => {
  beforeEach(() => localStorage.clear());

  it('shows missions straight away, without tapping each one', () => {
    view();
    expect(screen.getByText('Get a player to do 10 push-ups')).toBeInTheDocument();
    expect(screen.getByText('Get a player to start a conga line')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide all missions' })).toBeInTheDocument();
  });

  it('remembers Hide all on this phone, and pocketing does not re-hide shown missions', () => {
    const first = view();
    fireEvent.click(screen.getByRole('button', { name: 'Hide all missions' }));
    expect(screen.queryByText('Get a player to do 10 push-ups')).not.toBeInTheDocument();
    first.unmount();

    const second = view();
    expect(screen.queryByText('Get a player to do 10 push-ups')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reveal all missions' }));
    second.unmount();

    view();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    fireEvent(document, new Event('visibilitychange'));
    expect(screen.getByText('Get a player to do 10 push-ups')).toBeInTheDocument();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  });

  it('offers no claim buttons once you have finished', () => {
    view({ finished: true });
    fireEvent.click(screen.getByText('Get a player to do 10 push-ups'));
    expect(screen.queryByRole('button', { name: 'Got it!' })).not.toBeInTheDocument();
    expect(screen.getByText("You've finished — no more claims")).toBeInTheDocument();
  });

  it('still offers claim buttons while playing', () => {
    view();
    fireEvent.click(screen.getByText('Get a player to do 10 push-ups'));
    expect(screen.getByRole('button', { name: 'Got it!' })).toBeInTheDocument();
  });
});
