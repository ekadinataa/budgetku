import { createContext, useContext, useEffect } from 'react';
import { DARK_VARS, LIGHT_VARS } from '../utils/constants';

const ThemeContext = createContext();

/**
 * ThemeProvider — wraps children and applies CSS custom properties
 * to document.documentElement based on the current darkMode value.
 *
 * @param {Object} props
 * @param {boolean} props.darkMode - whether dark theme is active
 * @param {Function} props.setDarkMode - state setter for toggling theme
 * @param {React.ReactNode} props.children
 */
export function ThemeProvider({ darkMode, setDarkMode, children }) {
  useEffect(() => {
    const vars = darkMode ? DARK_VARS : LIGHT_VARS;
    const root = document.documentElement;

    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    if (darkMode) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme — convenience hook for consuming ThemeContext.
 * @returns {{ darkMode: boolean, setDarkMode: Function }}
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

export default ThemeContext;
