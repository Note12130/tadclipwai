import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Shell', () => {
  it('renders application brand and privacy badge', () => {
    render(<App />);
    expect(screen.getByText('ตัดคลิปไว')).toBeDefined();
    expect(screen.getAllByText('ปลอดภัย 100%').length).toBeGreaterThanOrEqual(1);
  });
});
