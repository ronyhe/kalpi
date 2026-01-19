import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runElection, type Inputs } from '../src/elect.ts'
import data24 from './knesset24.json' with { type: 'json' }
import data25 from './knesset25.json' with { type: 'json' }

test('24th Knesset', () => {
    const results = runElection(data24 as unknown as Inputs)
    assert.deepEqual(results.seats, data24.expected)
})

test('25th Knesset', () => {
    const results = runElection(data25 as unknown as Inputs)
    assert.deepEqual(results.seats, data25.expected)
})
