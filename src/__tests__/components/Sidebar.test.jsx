import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import Sidebar from '../../components/Sidebar/Sidebar';

describe('Sidebar', () => {
  const defaultProps = {
    page: 'dashboard',
    setPage: vi.fn(),
    darkMode: false,
    setDarkMode: vi.fn(),
  };

  it('renders BudgetKu branding with logo mark and subtitle', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('BudgetKu')).toBeInTheDocument();
    expect(screen.getByText('Money Tracker')).toBeInTheDocument();
  });

  it('renders all 5 navigation items', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Dompet')).toBeInTheDocument();
    expect(screen.getByText('Transaksi')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Laporan')).toBeInTheDocument();
  });

  it('highlights the active navigation item', () => {
    render(<Sidebar {...defaultProps} page="wallet" />);
    const walletBtn = screen.getByText('Dompet').closest('button');
    expect(walletBtn.className).toContain('navItemActive');
  });

  it('calls setPage when a navigation item is clicked', () => {
    const setPage = vi.fn();
    render(<Sidebar {...defaultProps} setPage={setPage} />);
    fireEvent.click(screen.getByText('Transaksi'));
    expect(setPage).toHaveBeenCalledWith('tx');
  });

  it('shows "Light Mode" label and sun icon when darkMode is false', () => {
    render(<Sidebar {...defaultProps} darkMode={false} />);
    expect(screen.getByText('Light Mode')).toBeInTheDocument();
  });

  it('shows "Dark Mode" label and moon icon when darkMode is true', () => {
    render(<Sidebar {...defaultProps} darkMode={true} />);
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  });

  it('calls setDarkMode toggler when theme button is clicked', () => {
    const setDarkMode = vi.fn();
    render(<Sidebar {...defaultProps} setDarkMode={setDarkMode} />);
    fireEvent.click(screen.getByText('Light Mode'));
    expect(setDarkMode).toHaveBeenCalledTimes(1);
    // The callback should be a toggler function
    const toggleFn = setDarkMode.mock.calls[0][0];
    expect(typeof toggleFn).toBe('function');
    expect(toggleFn(false)).toBe(true);
    expect(toggleFn(true)).toBe(false);
  });

  it('displays the active period label', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Periode Aktif')).toBeInTheDocument();
    // The period value should contain the current month and year in Indonesian locale
    const now = new Date();
    const expected = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('navigates through each page correctly', () => {
    const setPage = vi.fn();
    render(<Sidebar {...defaultProps} setPage={setPage} />);

    fireEvent.click(screen.getByText('Dashboard'));
    expect(setPage).toHaveBeenCalledWith('dashboard');

    fireEvent.click(screen.getByText('Dompet'));
    expect(setPage).toHaveBeenCalledWith('wallet');

    fireEvent.click(screen.getByText('Budget'));
    expect(setPage).toHaveBeenCalledWith('budget');

    fireEvent.click(screen.getByText('Laporan'));
    expect(setPage).toHaveBeenCalledWith('report');
  });
});
