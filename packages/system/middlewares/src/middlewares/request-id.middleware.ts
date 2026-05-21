import { AsyncLocalStorage } from 'node:async_hooks'
import { FastifyRequest, FastifyReply } from 'fastify'
import crypto from 'node:crypto'

const asyncLocalStorage = new AsyncLocalStorage<{ requestId: string }>()

export function getRequestId(): string | undefined {
  const store = asyncLocalStorage.getStore()
  return store ? store.requestId : undefined
}

export function RequestIdMiddleware(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
  const requestId = crypto.randomUUID()
  res.setHeader('Request-ID', requestId)
  asyncLocalStorage.run({ requestId }, () => {
    next()
  })
}
