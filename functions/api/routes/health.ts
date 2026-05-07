import type { Hono } from 'hono'

import type { ApiEnv } from '../types'

export function registerHealthRoutes(app: Hono<ApiEnv>) {
  app.get('/health', (context) => {
    context.header('Cache-Control', 'no-store')

    return context.json({
      ok: true,
      service: 'tamakey-api',
      version: context.env.API_VERSION ?? 'v1.1',
      environment: context.env.ENVIRONMENT ?? 'local',
      persistence: {
        primary: 'indexeddb',
        cloudSync: false,
      },
    })
  })
}
