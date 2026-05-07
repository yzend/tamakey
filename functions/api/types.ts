export type CloudflareBindings = {
  ENVIRONMENT?: string
  API_VERSION?: string

  // V2 bindings: keep optional until D1/KV are created in Cloudflare.
  USER_DB?: D1Database
  REMOTE_CONFIG?: KVNamespace
}

export type ApiEnv = {
  Bindings: CloudflareBindings
}
