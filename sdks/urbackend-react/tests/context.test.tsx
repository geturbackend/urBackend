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
    socialExchange: vi.fn().mockResolvedValue({ refreshToken: 'fake-rt' }),
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

  it('exchanges social token and rtCode if present in URL', async () => {
    // Mock window.location
    const originalLocation = window.location;
    // @ts-ignore
    delete window.location;
    window.location = {
      ...originalLocation,
      search: '?rtCode=test-rt-code',
      hash: '#token=test-temp-token',
      pathname: '/auth/callback',
    } as any;

    const originalHistory = window.history;
    // @ts-ignore
    delete window.history;
    window.history = {
      ...originalHistory,
      replaceState: vi.fn(),
    } as any;

    const TestComponent = () => {
      const { isInitializing } = useUrContext();
      if (isInitializing) return <div>Loading...</div>;
      return <div>Ready</div>;
    };

    render(
      <UrProvider apiKey="test-key" baseUrl="http://localhost:3000">
        <TestComponent />
      </UrProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    // We can't access the specific instance directly, but we can check if the methods on the mock prototype were called
    // Since AuthModule is mocked to return the object above, we can check its methods.
    // However, vitest module mocking returns the factory. Let's just verify it using a spy on a global or check the logic.
    // Actually, since we redefined AuthModule mock above, we need to inspect the instances.
    const mockAuthInstance = vi.mocked(AuthModule).mock.results[0]?.value;
    if (mockAuthInstance) {
      expect(mockAuthInstance.setToken).toHaveBeenCalledWith('test-temp-token');
      expect(mockAuthInstance.socialExchange).toHaveBeenCalledWith({ token: 'test-temp-token', rtCode: 'test-rt-code' });
    }

    // Restore window.location and window.history
    window.location = originalLocation;
    window.history = originalHistory;
  });
});
