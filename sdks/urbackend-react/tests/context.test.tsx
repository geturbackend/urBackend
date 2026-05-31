import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UrProvider, useUrContext } from '../src/context';
import { AuthModule } from '@urbackend/sdk';

// Mock the SDK modules
vi.mock('@urbackend/sdk', () => {
  const MockAuthModule = vi.fn().mockImplementation(() => ({
    setToken: vi.fn(),
    refreshToken: vi.fn().mockResolvedValue(undefined),
    me: vi.fn().mockResolvedValue({ id: 'user123', email: 'test@example.com' }),
  }));

  return {
    UrBackendClient: vi.fn(),
    AuthModule: MockAuthModule,
    DatabaseModule: vi.fn(),
    StorageModule: vi.fn(),
  };
});

describe('UrProvider & useUrContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws an error if useUrContext is used outside UrProvider', () => {
    const TestComponent = () => {
      useUrContext();
      return <div>Test</div>;
    };

    // React Error Boundary catch
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => render(<TestComponent />)).toThrow('useUrContext must be used within an UrProvider');
    
    consoleError.mockRestore();
  });

  it('initializes context and fetches user', async () => {
    const TestComponent = () => {
      const { user, isInitializing } = useUrContext();
      if (isInitializing) return <div>Loading...</div>;
      return <div>User: {user?.email}</div>;
    };

    render(
      <UrProvider apiKey="test-key" baseUrl="http://localhost:3000">
        <TestComponent />
      </UrProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
    });
  });
});
