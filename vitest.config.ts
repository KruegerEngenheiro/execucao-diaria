import { defineConfig } from 'vitest/config'

// Testes rodam em Node. Os testes de persistencia usam fake-indexeddb.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['testes/**/*.test.ts']
  }
})
