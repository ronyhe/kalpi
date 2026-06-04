import { knesset24, knesset25 } from '@kalpi/data'
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { deserializeElection, runElection, type Breakdown, type SerializedElection } from '../src/index.ts'

interface Fixture extends SerializedElection {
    results: {
        seats: Record<string, number>
        breakdown: Breakdown
    }
}

test('24th Knesset', () => {
    testElection(knesset24 as Fixture)
})

test('25th Knesset', () => {
    testElection(knesset25 as Fixture)
})

function testElection(fixture: Fixture) {
    const election = deserializeElection(fixture)
    const results = runElection(election)
    assert.deepEqual(results, fixture.results)
}
