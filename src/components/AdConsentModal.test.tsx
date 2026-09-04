import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdConsentModal } from './AdConsentModal';

describe('AdConsentModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <AdConsentModal
        isOpen={false}
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when isOpen is true and triggers onAccept', () => {
    const handleAccept = vi.fn();
    const handleDecline = vi.fn();

    render(
      <AdConsentModal
        isOpen={true}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    );

    expect(screen.getByText(/การยินยอมการแสดงโฆษณาและความเป็นส่วนตัว/i)).toBeDefined();
    expect(screen.getAllByText(/Google AdSense/i).length).toBeGreaterThanOrEqual(1);

    const acceptBtn = screen.getByRole('button', { name: /ยินยอมและใช้งานต่อ/i });
    fireEvent.click(acceptBtn);
    expect(handleAccept).toHaveBeenCalledTimes(1);
    expect(handleDecline).not.toHaveBeenCalled();
  });

  it('triggers onDecline when decline button is clicked', () => {
    const handleAccept = vi.fn();
    const handleDecline = vi.fn();

    render(
      <AdConsentModal
        isOpen={true}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    );

    const declineBtn = screen.getByRole('button', { name: /ปฏิเสธ \/ แสดงเฉพาะโฆษณาทั่วไป/i });
    fireEvent.click(declineBtn);
    expect(handleDecline).toHaveBeenCalledTimes(1);
    expect(handleAccept).not.toHaveBeenCalled();
  });
});
