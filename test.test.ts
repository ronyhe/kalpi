import { expect, test } from 'vitest'
import { runElection, type Inputs } from './elect.js'
import data from './knesset25.json' with { type: 'json' }

test('25th Knesset', () => {
    const results = runElection(data as unknown as Inputs)
    expect(results.seats).toEqual(data.expected)
})
