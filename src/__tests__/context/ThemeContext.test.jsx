import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { DARK_VARS, LIGHT_VARS } from '../../utils/constants';

/** Helper component that consumes the theme context */
function ThemeConsumer() {
  const { darkMode, setDarkMode } = useTheme();
  return (
    <div>
      <span data-testid="mode">{darkMode ? 'dark' : 'light'}</span>
      <button onClick={() => setDarkMode((prev) => !prev)}>toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  it('provides darkMode value to consumers', () => {
    render(
      <ThemeProvider darkMode={false} setDarkMode={vi.fn()}>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('provides darkMode=true to consumers', () => {
    render(
      <ThemeProvider darkMode={true} setDarkMode={vi.fn()}>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });

  it('applies light CSS custom properties when darkMode is false', () => {
    render(
      <ThemeProvider darkMode={false} setDarkMode={vi.fn()}>
        <div>child</div>
      </ThemeProvider>
    );
    const root = document.documentElement;
    Object.entries(LIGHT_VARS).forEach(([key, value]) => {
      expect(root.style.getPropertyValue(key)).toBe(value);
    });
  });

  it('applies dark CSS custom properties when darkMode is true', () => {
    render(
      <ThemeProvider darkMode={true} setDarkMode={vi.fn()}>
        <div>child</div>
      </ThemeProvider>
    );
    const root = document.documentElement;
    Object.entries(DARK_VARS).forEach(([key, value]) => {
      expect(root.style.getPropertyValue(key)).toBe(value);
    });
  });

  it('sets data-theme="dark" when darkMode is true', () => {
    render(
      <ThemeProvider darkMode={true} setDarkMode={vi.fn()}>
        <div>child</div>
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('removes data-theme attribute when darkMode is false', () => {
    // First set dark to add the attribute
    const { rerender } = render(
      <ThemeProvider darkMode={true} setDarkMode={vi.fn()}>
        <div>child</div>
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    // Then switch to light
    rerender(
      <ThemeProvider darkMode={false} setDarkMode={vi.fn()}>
        <div>child</div>
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('calls setDarkMode when consumer triggers toggle', () => {
    const setDarkMode = vi.fn();
    render(
      <ThemeProvider darkMode={false} setDarkMode={setDarkMode}>
        <ThemeConsumer />
      </ThemeProvider>
    );
    fireEvent.click(screen.getByText('toggle'));
    expect(setDarkMode).toHaveBeenCalledTimes(1);
  });

  it('throws when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error for the expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeConsumer />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    );
    spy.mockRestore();
  });
});
