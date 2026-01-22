import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deserializeElection, runElection } from '../src/elect.ts'
import data24 from './knesset24.json' with { type: 'json' }
import data25 from './knesset25.json' with { type: 'json' }

test('24th Knesset', () => {
    const election = deserializeElection(data24)
    const results = runElection(election)
    assert.deepEqual(results.seats, data24.expected)
})

test('25th Knesset', () => {
    const election = deserializeElection(data25)
    const results = runElection(election)
    assert.deepEqual(results.seats, data25.expected)
})
