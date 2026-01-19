import fs from 'node:fs/promises'
import process from 'node:process'
import { runElection } from './elect.js'

await (async function main() {
    const firstArg = process.argv[2]
    const inputs = await getInputsFromFile(firstArg!)
    const results = runElection(inputs)
    const sorted = Object.entries(results.seats).sort((a, b) => b[1] - a[1])
    console.table(sorted)
})()

async function getInputsFromFile(filePath: string): Promise<any> {
    try {
        const fileContents = await fs.readFile(filePath, 'utf-8')
        return JSON.parse(fileContents)
    } catch (e) {
        throw new Error(`Could not parse JSON file: ${filePath}`, { cause: e })
    }
}
