const ISRAEL_RULES = {
    totalSeats: 120,
    threshold: 0.0325 // 3.25%
}

type Pair<T> = [T, T]

interface Inputs {
    votes: {
        [party: string]: number
    }
    threshold: number // Achuz HaChasima
    remainderPacts: Pair<string>[] // Heskemei Odafim
    totalSeats: number // 120 seats in Knesset
}

interface Results {
    seats: {
        [party: string]: number
    }
}

function runElection(options: Inputs): Results {
    const { votes, threshold, remainderPacts, totalSeats } = options
    const totalVotes = sum(Object.values(votes))
    const effectiveThreshold = Math.floor(totalVotes * threshold) // Round? Up? Down?

    const eligibleVotes = filterObject(votes, v => v >= effectiveThreshold)
    const eligibleTotalVotes = sum(Object.values(eligibleVotes))

    const pricePerSeat = Math.floor(eligibleTotalVotes / totalSeats) // Round? Up? Down? // HaModed

    const initialSeats = mapObject(eligibleVotes, v => Math.floor(v / pricePerSeat)) // Round? Up? Down?
    const totalInitialSeats = sum(Object.values(initialSeats))

    const seatsLeft = totalSeats - totalInitialSeats

    return { seats: {} }
}

function sum(nums: number[]): number {
    return nums.reduce((a, b) => a + b, 0)
}

function filterObject<K extends string | number | symbol, V>(
    obj: Record<K, V>,
    pred: (v: V, k: K) => boolean
): Record<K, V> {
    const pairs = Object.entries(obj) as [K, V][]
    const filteredPairs = pairs.filter(([k, v]) => pred(v, k))
    return Object.fromEntries(filteredPairs) as Record<K, V>
}

function mapObject<K extends string | number | symbol, A, B>(obj: Record<K, A>, fn: (v: A, k: K) => B): Record<K, B> {
    const pairs = Object.entries(obj) as [K, A][]
    const mappedPairs = pairs.map(([k, v]) => [k, fn(v, k)] as [K, B])
    return Object.fromEntries(mappedPairs) as Record<K, B>
}

await (async function main() {
    console.log('running')
})()
