import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'

import { App } from './App'
import './styles/index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)

if (import.meta.env.DEV && window.location.search.includes('testkit=1')) {
  void import('./devtools/testkit/mount').then(({ mountTestKit }) => {
    mountTestKit()
  })
}
