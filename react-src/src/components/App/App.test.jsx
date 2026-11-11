import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

vi.mock('axios', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: [] }) }
}));

vi.mock('socket.io-client', () => ({
  default: () => ({
    on: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn()
  })
}));

it('renders the user directory heading', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'MERN CRUD — Version 2' })).toBeTruthy();
});
