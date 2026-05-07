import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'

import { TestKitPanel } from './TestKitPanel'
import './testkit.css'

const TESTKIT_ROOT_ID = 'tamakey-testkit-root'

export function mountTestKit() {
  if (typeof document === 'undefined') return
  if (document.getElementById(TESTKIT_ROOT_ID)) return

  const rootElement = document.createElement('div')
  rootElement.id = TESTKIT_ROOT_ID
  document.body.append(rootElement)

  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <TestKitPanel />
    </StrictMode>
  )
}
