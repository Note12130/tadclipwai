import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CookiePolicy } from './CookiePolicy';

describe('CookiePolicy Component', () => {
  it('renders all required cookie policy sections', () => {
    render(<CookiePolicy />);

    expect(screen.getByText(/นโยบายการใช้คุกกี้ \(Cookie Policy\)/i)).toBeDefined();
    expect(screen.getByText(/1\. การเก็บคุกกี้คืออะไร \?/i)).toBeDefined();
    expect(screen.getByText(/2\. ประโยชน์ของคุกกี้/i)).toBeDefined();
    expect(screen.getByText(/3\. คุกกี้ที่เราใช้งาน/i)).toBeDefined();
    expect(screen.getByText(/1\. คุกกี้ที่มีความจำเป็นอย่างยิ่ง \(Necessary Cookies\)/i)).toBeDefined();
    expect(screen.getByText(/2\. คุกกี้เพื่อการทำงานของเว็บไซต์ \(Functionality Cookies\)/i)).toBeDefined();
    expect(screen.getByText(/3\. คุกกี้เพื่อการวิเคราะห์\/เพื่อประสิทธิภาพ \(Analytical Cookies\)/i)).toBeDefined();
    expect(screen.getByText(/4\. วิธีปิดการทำงานของคุกกี้ \(How to Disable Cookies\)/i)).toBeDefined();
  });
});
