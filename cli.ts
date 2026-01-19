import fs from 'node:fs/promises'
import process from 'node:process'
import { runElection, type Results } from './elect.js'

await (async function main() {
    const firstArg = process.argv[2]
    const inputs = await getInputsFromFile(firstArg!)
    const results = runElection(inputs)
    console.log(stringifySeats(results, inputs.totalSeats))
})()

function stringifySeats(results: Results, totalSeats: number): string {
    const longestKey = Object.keys(results.seats).reduce((a, b) => (a.length > b.length ? a : b), '')
    const paddingForKey = longestKey.length
    const paddingForValue = totalSeats.toString().length + 1
    const lines = Object.entries(results.seats)
        .sort(([, a], [, b]) => b - a)
        .map(([key, value]) => key.padEnd(paddingForKey, ' ') + value.toString().padStart(paddingForValue, ' '))
    return lines.join('\n')
}

async function getInputsFromFile(filePath: string): Promise<any> {
    try {
        const fileContents = await fs.readFile(filePath, 'utf-8')
        return JSON.parse(fileContents)
    } catch (e) {
        throw new Error(`Could not parse JSON file: ${filePath}`, { cause: e })
    }
}
