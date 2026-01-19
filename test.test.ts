import { expect, test } from 'vitest'
import { runElection, type Inputs } from './elect.js'
import data24 from './knesset24.json' with { type: 'json' }
import data25 from './knesset25.json' with { type: 'json' }

test('24th Knesset', () => {
    const results = runElection(data24 as unknown as Inputs)
    expect(results.seats).toEqual(data24.expected)
})

test('25th Knesset', () => {
    const results = runElection(data25 as unknown as Inputs)
    expect(results.seats).toEqual(data25.expected)
})
