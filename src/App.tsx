import { useState } from 'react'

import { LoginPage } from './app/AuthFlow'
import { GameBootstrap } from './app/GameBootstrap'
import {
  createTestKitSession,
  loadLocalSession,
  saveLocalSession,
  type LocalSession,
} from './app/session'

export function App() {
  const [session, setSession] = useState<LocalSession | null>(() =>
    isTestKitMode() ? createTestKitSession() : loadLocalSession()
  )

  if (!session) {
    return <LoginPage onLogin={(name) => setSession(saveLocalSession(name))} />
  }

  return <GameBootstrap session={session} skipOnboarding={isTestKitMode()} />
}

function isTestKitMode(): boolean {
  return import.meta.env.DEV && window.location.search.includes('testkit=1')
}
