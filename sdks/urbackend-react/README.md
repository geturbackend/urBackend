# @urbackend/react

The official React SDK for [urBackend](https://urbackend.com) — a MongoDB-native Backend as a Service. 

This SDK provides a `<UrProvider>`, authentication UI components, protected routing, and React hooks (`useUser`, `useAuth`, `useDb`, `useStorage`) to seamlessly integrate urBackend into your React applications.

## Installation

Install the React SDK alongside the core SDK:

```bash
npm install @urbackend/react @urbackend/sdk
```

## Quick Start

Wrap your application with `<UrProvider>`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UrProvider } from '@urbackend/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UrProvider apiKey="pk_live_your_publishable_key">
      <App />
    </UrProvider>
  </React.StrictMode>
);
```

### Pre-built Auth UI

Use the `<UrAuth>` component to instantly drop in a beautiful authentication screen that handles Email, Password, and Social Providers (Google/GitHub).

```tsx
import { UrAuth, GuestRoute } from '@urbackend/react';

export default function LoginPage() {
  return (
    <GuestRoute fallback={<div>Loading...</div>} onRedirect={() => window.location.href = '/dashboard'}>
      <UrAuth providers={['google', 'github']} theme="light" />
    </GuestRoute>
  );
}
```

### Using Hooks & Data

Use our hooks to read the session state or fetch data with built-in RLS (Row-Level Security):

```tsx
import { useUser, useDb } from '@urbackend/react';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { user, logout } = useUser();
  const db = useDb();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function fetchProducts() {
      const data = await db.getAll('products', { limit: 10 });
      setProducts(data);
    }
    fetchProducts();
  }, [db]);

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <button onClick={logout}>Sign Out</button>

      <h2>Products</h2>
      <ul>
        {products.map(p => (
          <li key={p._id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Documentation

For full documentation and advanced usage, visit [docs.ub.bitbros.in](https://docs.ub.bitbros.in).

## License

MIT
