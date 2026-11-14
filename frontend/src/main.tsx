import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Load global styles and the main HALO application.
import './index.css'
import App from './App.tsx'

// Initialize React and render HALO inside the root HTML element.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
