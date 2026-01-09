/**
 * Component Tests - Navbar Component
 * Issue #245: Testing Infrastructure
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../utils/testUtils';
import Navbar from '../../../src/components/Navbar';

describe('Navbar Component', () => {
  it('should render navbar with logo', () => {
    render(<Navbar />);
    expect(screen.getByText(/InstaClone/i)).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<Navbar />);
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should handle search input change', () => {
    const setSearchQuery = vi.fn();
    render(<Navbar searchQuery="" setSearchQuery={setSearchQuery} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    expect(setSearchQuery).toHaveBeenCalledWith('test');
  });

  it('should render navigation icons', () => {
    render(<Navbar />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should toggle theme on click', () => {
    render(<Navbar />);
    const themeToggle = screen.getByLabelText(/theme/i);
    fireEvent.click(themeToggle);
    // Theme should toggle
  });
});
