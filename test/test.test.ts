import assert from 'node:assert/strict'
import { test } from 'node:test'

import { deserializeElection, runElection, type SerializedElection } from '../src/elect.ts'
import data24 from './knesset24.json' with { type: 'json' }
import data25 from './knesset25.json' with { type: 'json' }

interface Fixture extends SerializedElection {
    expected: Record<string, number>
}

test('24th Knesset', () => {
    testElection(data24)
})

test('25th Knesset', () => {
    testElection(data25)
})

function testElection(fixture: Fixture) {
    const election = deserializeElection(fixture)
    const results = runElection(election)
    assert.deepEqual(results.seats, fixture.expected)
}
