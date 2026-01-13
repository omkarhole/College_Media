/**
 * Integration Tests - Authentication Flow
 * Issue #245: Testing Infrastructure
 */

import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../utils/testUtils';
import App from '../../../src/App';

describe('Authentication Flow', () => {
  it('should allow user to login', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to login
    const loginButton = screen.getByText(/login/i);
    await user.click(loginButton);

    // Fill form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Verify logged in
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });

  it('should show error for invalid credentials', async () => {
    const user = userEvent.setup();
    render(<App />);

    const loginButton = screen.getByText(/login/i);
    await user.click(loginButton);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'invalid@example.com');
    await user.type(passwordInput, 'wrong');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should allow user to register', async () => {
    const user = userEvent.setup();
    render(<App />);

    const registerButton = screen.getByText(/register/i);
    await user.click(registerButton);

    // Fill registration form
    await user.type(screen.getByLabelText(/username/i), 'newuser');
    await user.type(screen.getByLabelText(/email/i), 'new@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
