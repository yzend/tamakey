import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'

import { registerHealthRoutes } from './routes/health'
import type { ApiEnv } from './types'

const app = new Hono<ApiEnv>().basePath('/api')

registerHealthRoutes(app)

app.get('/v1/meta', (context) => {
  context.header('Cache-Control', 'no-store')

  return context.json({
    api: 'tamakey',
    stage: 'v1.1',
    features: {
      auth: false,
      cloudSaves: false,
      localSaves: true,
      remoteConfig: false,
    },
  })
})

app.notFound((context) =>
  context.json(
    {
      error: 'not_found',
      message: 'API route not found.',
    },
    404
  )
)

export const onRequest = handle(app)
