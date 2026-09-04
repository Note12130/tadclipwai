import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdConsentModal } from './AdConsentModal';

describe('AdConsentModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <AdConsentModal
        isOpen={false}
        onAccept={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders compact message with "เพิ่มเติม" link and triggers onAccept on clicking "รับทราบ"', () => {
    const handleAccept = vi.fn();
    const handleClose = vi.fn();

    render(
      <AdConsentModal
        isOpen={true}
        onAccept={handleAccept}
        onClose={handleClose}
      />
    );

    expect(
      screen.getByText(/เว็บไซต์นี้ใช้คุกกี้เพื่อสร้างประสบการณ์ที่ดีมีประสิทธิภาพยิ่งขึ้น/i)
    ).toBeDefined();

    const link = screen.getByRole('link', { name: 'เพิ่มเติม' });
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('/cookie-policy.html');
    expect(link.getAttribute('target')).toBe('_blank');

    const acceptBtn = screen.getByRole('button', { name: 'รับทราบ' });
    fireEvent.click(acceptBtn);
    expect(handleAccept).toHaveBeenCalledTimes(1);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('triggers onClose when close button (X) is clicked', () => {
    const handleAccept = vi.fn();
    const handleClose = vi.fn();

    render(
      <AdConsentModal
        isOpen={true}
        onAccept={handleAccept}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: 'ปิด' });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleAccept).not.toHaveBeenCalled();
  });
});
