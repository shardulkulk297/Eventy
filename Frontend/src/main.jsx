import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './shared/themes/ThemeProvider'

createRoot(document.getElementById('root')).render(

    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <BrowserRouter>
            <App />
        </BrowserRouter>

    </ThemeProvider>


)
