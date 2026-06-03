import { knesset24, knesset25 } from '@kalpi/data'
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { deserializeElection, runElection, type SerializedElection } from '../src/index.ts'

interface Fixture extends SerializedElection {
    expected: Record<string, number>
}

test('24th Knesset', () => {
    testElection(knesset24)
})

test('25th Knesset', () => {
    testElection(knesset25)
})

function testElection(fixture: Fixture) {
    const election = deserializeElection(fixture)
    const results = runElection(election)
    assert.deepEqual(results.seats, fixture.expected)
}
