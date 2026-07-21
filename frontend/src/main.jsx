import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { DocumentsProvider } from './contexts/DocumentsContext'
import { ChatProvider } from './contexts/ChatContext'
import App from './App'
import './App.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <DocumentsProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </DocumentsProvider>
    </BrowserRouter>
  </StrictMode>,
)

