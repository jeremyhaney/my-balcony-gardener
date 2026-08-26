import assert from 'node:assert/strict'
import test from 'node:test'
import {
  constrainPublicDemoHistoryWindow,
  getHistoryWindowOption,
  isPublicDemoHistoryWindowAvailable,
} from '../src/historyControls.ts'

test('public live example permits no history window beyond 24 hours', () => {
  for (const key of ['3h', '6h', '12h', '24h'] as const) {
    assert.equal(isPublicDemoHistoryWindowAvailable(key), true)
    assert.equal(constrainPublicDemoHistoryWindow(getHistoryWindowOption(key)!).key, key)
  }

  for (const key of ['7d', '1m', '3m', '6m', '1y', 'all'] as const) {
    assert.equal(isPublicDemoHistoryWindowAvailable(key), false)
    assert.equal(constrainPublicDemoHistoryWindow(getHistoryWindowOption(key)!).key, '24h')
  }
})
