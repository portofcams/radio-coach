// Next.js global server-error hook → GlitchTip. Captures unhandled errors in
// server components, route handlers, and middleware (no per-route wiring).
export async function onRequestError(
  err: unknown,
  request: { path?: string; method?: string },
  context: { routerKind?: string; routePath?: string },
): Promise<void> {
  try {
    const { captureException } = await import('@/lib/glitchtip')
    await captureException(err, {
      path: request?.path,
      method: request?.method,
      routerKind: context?.routerKind,
      routePath: context?.routePath,
    })
  } catch {
    /* ignore */
  }
}
