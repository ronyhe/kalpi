import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import { runElection, type Results, type SerializedElection, deserializeElection } from './elect.ts'

await (async function main() {
    const firstArg = process.argv[2]
    if (!firstArg) {
        console.error('Usage: elect <path-to-input-json-file>\nSee test/knesset24.json for an example input file')
        process.exit(1)
    }
    const pathToFile = path.resolve(process.cwd(), firstArg)
    const inputs = await getInputsFromFile(pathToFile)
    const election = deserializeElection(inputs)
    const results = runElection(election)
    console.log(stringifySeats(results, inputs.seats))
})()

function stringifySeats(results: Results, totalSeats: number): string {
    const longestKey = Object.keys(results.seats).reduce((a, b) => (a.length > b.length ? a : b), '')
    const paddingForKey = longestKey.length
    const paddingForValue = totalSeats.toString().length + 1
    const lines = Object.entries(results.seats)
        .toSorted(([, a], [, b]) => b - a)
        .map(([key, value]) => key.padEnd(paddingForKey, ' ') + value.toString().padStart(paddingForValue, ' '))
    return lines.join('\n')
}

async function getInputsFromFile(filePath: string): Promise<SerializedElection> {
    try {
        const fileContents = await fs.readFile(filePath, 'utf-8')
        return JSON.parse(fileContents)
    } catch (e) {
        throw new Error(`Could not parse JSON file: ${filePath}`, { cause: e })
    }
}
