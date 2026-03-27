import { vi } from 'vitest'

export type QueryResult = { data: unknown; error: { message: string } | null }

/**
 * Creates a fluent mock query builder for InsForge database calls.
 * All chainable methods return `this`.
 * - `single()` resolves with `result`
 * - Direct `await builder` resolves with `result` (thenable)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeBuilder(result: QueryResult = { data: [], error: null }): any {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then(
      onFulfilled: (v: QueryResult) => unknown,
      onRejected?: (e: unknown) => unknown
    ) {
      return Promise.resolve(result).then(onFulfilled, onRejected)
    },
  }
  return builder
}
