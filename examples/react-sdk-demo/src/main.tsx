import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { UrProvider } from '@urbackend/react'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UrProvider 
      apiKey={import.meta.env.VITE_UR_PUBLIC_KEY} 
      baseUrl={import.meta.env.VITE_UR_BASE_URL}
    >
      <App />
    </UrProvider>
  </React.StrictMode>,
)
