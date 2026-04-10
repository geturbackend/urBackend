import { expect, test, vi, beforeEach } from 'vitest';
import urBackend from '../src/index';

const mockApiKey = 'pk_live_test';
const client = urBackend({ apiKey: mockApiKey });

beforeEach(() => {
  vi.resetAllMocks();
});

test('getAll returns array of typed documents', async () => {
  const mockData = [
    { _id: '1', name: 'Product 1' },
    { _id: '2', name: 'Product 2' },
  ];
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: mockData }),
    }),
  );

  const items = await client.db.getAll<{ _id: string; name: string }>('products');
  expect(items).toEqual(mockData);
});

test('getAll with query params builds correct query string', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({ success: true, data: [] }),
  });
  vi.stubGlobal('fetch', fetchMock);

  await client.db.getAll('products', {
    page: 2,
    limit: 10,
    sort: 'price:asc',
    populate: 'category',
    filter: { price_gt: 100 }
  });

  const url = fetchMock.mock.calls[0][0] as string;
  const searchParams = new URL(url).searchParams;
  
  expect(searchParams.get('page')).toBe('2');
  expect(searchParams.get('limit')).toBe('10');
  expect(searchParams.get('sort')).toBe('price:asc');
  expect(searchParams.get('populate')).toBe('category');
  expect(searchParams.get('price_gt')).toBe('100');
});

test('insert returns created document and handles optional token', async () => {
  const payload = { name: 'New Item' };
  const mockCreated = { _id: 'new-id', ...payload };
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({ success: true, data: mockCreated }),
  });
  vi.stubGlobal('fetch', fetchMock);

  const result = await client.db.insert<{ _id: string; name: string }>('products', payload, 'user-token');
  
  expect(result._id).toBe('new-id');
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/data/products'),
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer user-token',
      }),
    }),
  );
});

test('patch sends PATCH request', async () => {
  const payload = { price: 50 };
  const mockUpdated = { _id: '1', name: 'Original', price: 50 };
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({ success: true, data: mockUpdated }),
  });
  vi.stubGlobal('fetch', fetchMock);

  await client.db.patch('products', '1', payload);

  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/data/products/1'),
    expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  );
});

test('getOne with populate builds correct query string', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({ success: true, data: { _id: '1' } }),
  });
  vi.stubGlobal('fetch', fetchMock);

  await client.db.getOne('products', '1', { populate: 'category' });

  const url = fetchMock.mock.calls[0][0] as string;
  expect(url).toContain('?populate=category');
});

test('delete returns { deleted: true } and handles token', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({ success: true, data: { message: 'Deleted' } }),
  });
  vi.stubGlobal('fetch', fetchMock);

  const result = await client.db.delete('products', 'id-1', 'admin-token');
  
  expect(result.deleted).toBe(true);
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/data/products/id-1'),
    expect.objectContaining({
      method: 'DELETE',
      headers: expect.objectContaining({
        Authorization: 'Bearer admin-token',
      }),
    }),
  );
});
