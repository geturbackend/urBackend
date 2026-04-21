import { expect, test, vi, beforeEach } from 'vitest';
import urBackend from '../src/index';

const mockApiKey = 'sk_live_test';
const client = urBackend({ apiKey: mockApiKey });

beforeEach(() => {
  vi.resetAllMocks();
});

test('send() sends POST request to mail endpoint', async () => {
  const payload = {
    to: 'user@example.com',
    templateName: 'welcome',
    variables: { name: 'Test', projectName: 'Acme', appUrl: 'https://acme.com' },
  };
  
  const mockResponse = {
    success: true,
    data: { id: 'msg_1', provider: 'default', monthlyUsage: 1, monthlyLimit: 100 },
    message: 'Sent'
  };

  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(mockResponse),
  });
  vi.stubGlobal('fetch', fetchMock);

  const result = await client.mail.send(payload);
  
  expect(result).toEqual(mockResponse.data);
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/mail/send'),
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  );
});

test('send() supports direct-send payloads', async () => {
  const payload = {
    to: 'user@example.com',
    subject: 'Hello',
    text: 'Direct send body',
  };

  const mockResponse = {
    success: true,
    data: { id: 'msg_2', provider: 'default', monthlyUsage: 2, monthlyLimit: 100 },
    message: 'Sent',
  };

  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(mockResponse),
  });
  vi.stubGlobal('fetch', fetchMock);

  const result = await client.mail.send(payload);

  expect(result).toEqual(mockResponse.data);
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/mail/send'),
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  );
});
