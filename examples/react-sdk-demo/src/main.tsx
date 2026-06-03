import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { UrProvider } from '@urbackend/react'

const apiKey = import.meta.env.VITE_UR_PUBLIC_KEY;
const baseUrl = import.meta.env.VITE_UR_BASE_URL;

if (!apiKey) {
  throw new Error("Missing VITE_UR_PUBLIC_KEY environment variable. Check your .env file.");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UrProvider 
      apiKey={apiKey} 
      baseUrl={baseUrl}
    >
      <App />
    </UrProvider>
  </React.StrictMode>,
)
