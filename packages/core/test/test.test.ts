import { knesset24, knesset25 } from '@kalpi/data'
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { deserializeElection, runElection, type SerializedElection, type Step } from '../src/index.ts'

interface Fixture extends SerializedElection {
    results: {
        seats: Record<string, number>
        steps: Step[]
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
