import { expect, test, vi, beforeEach } from 'vitest';
import urBackend from '../src/index';

const mockApiKey = 'pk_live_test';
let client: ReturnType<typeof urBackend>;

beforeEach(() => {
  vi.resetAllMocks();
  client = urBackend({ apiKey: mockApiKey });
});

test('signUp returns user object on success', async () => {
  const mockUser = { _id: '123', email: 'test@example.com' };
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: mockUser }),
    }),
  );

  const user = await client.auth.signUp({ email: 'test@example.com', password: 'password' });
  expect(user).toEqual(mockUser);
});

test('login stores accessToken', async () => {
  const mockAccessToken = 'mock-access-token';
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () =>
        Promise.resolve({
          success: true,
          data: { accessToken: mockAccessToken, user: { _id: '123', email: 'test@example.com' } },
        }),
    }),
  );

  const response = await client.auth.login({ email: 'test@example.com', password: 'password' });
  expect(response.accessToken).toBe(mockAccessToken);
  expect(client.auth.getToken()).toBe(mockAccessToken);
});

test('me() uses stored token from login', async () => {
  const mockToken = 'mock-token';
  const mockUser = { _id: '123', email: 'test@example.com' };

  // First mock login
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () =>
        Promise.resolve({
          success: true,
          data: { accessToken: mockToken, user: mockUser },
        }),
    }),
  );
  await client.auth.login({ email: 'test@example.com', password: 'password' });

  // Then mock me call
  const meFetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({ success: true, data: mockUser }),
  });
  vi.stubGlobal('fetch', meFetchMock);

  await client.auth.me();

  expect(meFetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/userAuth/me'),
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: `Bearer ${mockToken}`,
      }),
    }),
  );
});

test('logout() calls server and clears local token', async () => {
  client.auth.setToken('test-token');
  const logoutFetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({ success: true, message: 'Logged out' }),
  });
  vi.stubGlobal('fetch', logoutFetchMock);

  await client.auth.logout();

  expect(logoutFetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/userAuth/logout'),
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer test-token',
      }),
    }),
  );
  expect(client.auth.getToken()).toBeUndefined();
});

test('refreshToken() uses credentials: include by default', async () => {
  const refreshFetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({ success: true, data: { accessToken: 'new-token' } }),
  });
  vi.stubGlobal('fetch', refreshFetchMock);

  await client.auth.refreshToken();

  expect(refreshFetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/userAuth/refresh-token'),
    expect.objectContaining({
      method: 'POST',
      credentials: 'include',
    }),
  );
});

test('refreshToken(token) uses header mode', async () => {
  const refreshFetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({ success: true, data: { accessToken: 'new-token' } }),
  });
  vi.stubGlobal('fetch', refreshFetchMock);

  await client.auth.refreshToken('manual-refresh-token');

  expect(refreshFetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/userAuth/refresh-token'),
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'x-refresh-token': 'manual-refresh-token',
        'x-refresh-token-mode': 'header',
      }),
    }),
  );
});

test('socialStart returns correct URL', () => {
  const url = client.auth.socialStart('github');
  expect(url).toBe('https://api.ub.bitbros.in/api/userAuth/social/github/start?key=pk_live_test');
});

test('publicProfile calls correct endpoint', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({ success: true, data: { username: 'yash' } }),
  });
  vi.stubGlobal('fetch', fetchMock);

  await client.auth.publicProfile('yash');

  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/userAuth/public/yash'),
    expect.any(Object),
  );
});