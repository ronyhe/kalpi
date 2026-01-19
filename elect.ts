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

interface Group {
    members: {
        [party: string]: {
            votes: number
            seats: number
        }
    }
    extraSeats: number
}

interface Results {
    seats: {
        [party: string]: number
    }
}

function runElection(inputs: Inputs): Results {
    const initialSeats = getInitialSeating(inputs)
    const seatsAlreadyAssigned = sum(Object.values(initialSeats))
    const seatsLeft = inputs.totalSeats - seatsAlreadyAssigned

    const groups = createGroups(inputs, initialSeats)
    giveRemainingSeats(groups, seatsLeft)
    for (const group of groups) {
        giveRemainingSeatsInsideGroup(group)
    }

    const finalSeats: Record<string, number> = {}
    for (const group of groups) {
        for (const [memberName, member] of Object.entries(group.members)) {
            finalSeats[memberName] = member.seats
        }
    }

    return {
        seats: finalSeats
    }
}

function createGroups(inputs: Inputs, initialSeats: Record<string, number>): Group[] {
    const groups: Group[] = []

    for (const [party, seats] of Object.entries(initialSeats)) {
        const hasBuddy = inputs.remainderPacts.some(([partyA, partyB]) => partyA === party || partyB === party)
        if (!hasBuddy) {
            groups.push({
                members: {
                    [party]: {
                        votes: inputs.votes[party]!,
                        seats: seats
                    }
                },
                extraSeats: 0
            })
        }
    }

    for (const [partyA, partyB] of inputs.remainderPacts) {
        groups.push({
            members: {
                [partyA]: {
                    votes: inputs.votes[partyA]!,
                    seats: initialSeats[partyA]!
                },
                [partyB]: {
                    votes: inputs.votes[partyB]!,
                    seats: initialSeats[partyB]!
                }
            },
            extraSeats: 0
        })
    }

    return groups
}

function giveRemainingSeatsInsideGroup(group: Group) {
    for (let i = 0; i < group.extraSeats; i++) {
        const memberThatWouldGiveHighestPriceForNextSeat = Object.entries(group.members).reduce(
            (bestMemberEntry, currentMemberEntry) => {
                const [currentMemberName, currentMember] = currentMemberEntry
                const currentPriceForNextSeat = currentMember.votes / (currentMember.seats + 1) // Round? Up? Down?

                const [bestMemberName, bestMember] = bestMemberEntry
                const bestPriceForNextSeat = bestMember.votes / (bestMember.seats + 1) // Round? Up? Down?

                return currentPriceForNextSeat > bestPriceForNextSeat ? currentMemberEntry : bestMemberEntry
            }
        )
        memberThatWouldGiveHighestPriceForNextSeat[1].seats += 1
    }
}

function giveRemainingSeats(groups: Group[], remainingSeats: number) {
    for (let i = 0; i < remainingSeats; i++) {
        const groupThatWouldGiveHighestPriceForNextSeat = groups.reduce((bestGroup, currentGroup) => {
            const currentGroupVotes = sum(Object.values(currentGroup.members).map(m => m.votes))
            const currentGroupSeats =
                sum(Object.values(currentGroup.members).map(m => m.seats)) + currentGroup.extraSeats
            const currentPriceForNextSeat = currentGroupVotes / (currentGroupSeats + 1) // Round? Up? Down?

            const bestGroupVotes = sum(Object.values(bestGroup.members).map(m => m.votes))
            const bestGroupSeats = sum(Object.values(bestGroup.members).map(m => m.seats)) + bestGroup.extraSeats
            const bestPriceForNextSeat = bestGroupVotes / (bestGroupSeats + 1) // Round? Up? Down?

            return currentPriceForNextSeat > bestPriceForNextSeat ? currentGroup : bestGroup
        })
        groupThatWouldGiveHighestPriceForNextSeat.extraSeats += 1
    }
}

function getInitialSeating(options: Inputs): Record<string, number> {
    const { votes, threshold, totalSeats } = options
    const totalVotes = sum(Object.values(votes))
    const effectiveThreshold = Math.floor(totalVotes * threshold) // Round? Up? Down?

    const eligibleVotes = filterObject(votes, v => v >= effectiveThreshold)
    const eligibleTotalVotes = sum(Object.values(eligibleVotes))

    const pricePerSeat = Math.floor(eligibleTotalVotes / totalSeats) // Round? Up? Down? // HaModed

    // Round? Up? Down?
    return mapObject(eligibleVotes, v => Math.floor(v / pricePerSeat))
}

function unifyPacts(votes: { [party: string]: number }, pacts: Pair<string>[]): { [party: string]: number } {
    const unifiedVotes: { [party: string]: number } = { ...votes }
    for (const [partyA, partyB] of pacts) {
        const votesA = unifiedVotes[partyA]!
        const votesB = unifiedVotes[partyB]!
        unifiedVotes[`${partyA}$$${partyB}`] = votesA + votesB
        delete unifiedVotes[partyA]
        delete unifiedVotes[partyB]
    }
    return unifiedVotes
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
