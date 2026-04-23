/// <reference types="node" />
import { expect, test, vi } from 'vitest';
import urBackend from '../src/index';

const mockApiKey = 'test-api-key';
const client = urBackend({ apiKey: mockApiKey });

test('upload sends FormData and returns { url, path }', async () => {
  const mockResponse = { url: 'http://cdn.com/file.jpg', path: '/uploads/file.jpg' };
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { signedUrl: 'https://signed.example/upload', filePath: '/uploads/file.jpg' } }),
    })
    .mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: () => Promise.resolve(''),
    })
    .mockResolvedValueOnce({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({ success: true, data: mockResponse }),
    });
  vi.stubGlobal('fetch', fetchMock);

  // In Node.js testing environment, use a Buffer as mock file
  const result = await client.storage.upload(Buffer.from('mock binary data'), 'test.jpg');

  expect(result).toEqual(mockResponse);
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/storage/upload-request'),
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ filename: 'test.jpg', contentType: 'application/octet-stream', size: 16 }),
    }),
  );
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    'https://signed.example/upload',
    expect.objectContaining({
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
    }),
  );
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/storage/upload-confirm'),
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ filePath: '/uploads/file.jpg', size: 16 }),
    }),
  );
});

test('deleteFile sends path in body', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({ success: true, data: { deleted: true } }),
  });
  vi.stubGlobal('fetch', fetchMock);

  const result = await client.storage.deleteFile('/uploads/file.jpg');

  expect(result.deleted).toBe(true);
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/storage/file'),
    expect.objectContaining({
      method: 'DELETE',
      body: JSON.stringify({ path: '/uploads/file.jpg' }),
    }),
  );
});

test('StorageError thrown on failure', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { signedUrl: 'https://signed.example/upload', filePath: '/uploads/file.jpg' } }),
    }).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: () => Promise.resolve(''),
    }).mockResolvedValueOnce({
      ok: false,
      status: 500,
      url: 'https://api.urbackend.bitbros.in/api/storage/upload',
      json: () => Promise.resolve({ success: false, message: 'Upload failed' }),
    }),
  );

  await expect(client.storage.upload(Buffer.from('data'))).rejects.toThrow('Upload failed');
});
