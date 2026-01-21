import { filterObject, mapObject, sum, sumValues, type Pair } from './utils.ts'
import { distributeSeats } from './remainder-seats.ts'

const ISRAEL_RULES = {
    totalSeats: 120,
    threshold: 0.0325 // 3.25%
}

export interface Inputs {
    votes: {
        [party: string]: number
    }
    threshold: number // Achuz HaChasima
    remainderPacts: Pair<string>[] // Heskemei Odafim
    totalSeats: number
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

export interface Results {
    seats: {
        [party: string]: number
    }
}

export function runElection(inputs: Inputs): Results {
    const initialSeats = getInitialSeating(inputs)
    const seatsAlreadyAssigned = sumValues(initialSeats)
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

    validateFinalSeats(finalSeats, inputs.totalSeats)

    return {
        seats: finalSeats
    }
}

function createGroups(inputs: Inputs, initialSeats: Record<string, number>): Group[] {
    const remainderPactMembers = new Set<string>(inputs.remainderPacts.flat())
    const isMember = (party: string) => remainderPactMembers.has(party)
    const grouped = Object.keys(inputs.votes)
        .filter(party => !isMember(party))
        .map(party => [party])
        .concat(inputs.remainderPacts)
    return grouped.map(members => ({
        extraSeats: 0,
        members: Object.fromEntries(
            members
                .filter(party => party in initialSeats)
                .map(party => [
                    party,
                    {
                        votes: inputs.votes[party]!,
                        seats: initialSeats[party]!
                    }
                ])
        )
    }))
}

function giveRemainingSeatsInsideGroup(group: Group) {
    const distribution = distributeSeats(group.members, group.extraSeats)
    for (const [memberName, seatsToAdd] of Object.entries(distribution)) {
        group.members[memberName]!.seats += seatsToAdd
    }
}

function giveRemainingSeats(groups: Group[], remainingSeats: number) {
    const distributionParticipants = Object.fromEntries(
        groups.map((group, i) => [
            i.toString(),
            {
                votes: sum(Object.values(group.members).map(m => m.votes)),
                seats: sum(Object.values(group.members).map(m => m.seats))
            }
        ])
    )
    const distribution = distributeSeats(distributionParticipants, remainingSeats)
    for (const [groupIndex, seatsToAdd] of Object.entries(distribution)) {
        groups[parseInt(groupIndex)]!.extraSeats += seatsToAdd
    }
}

function getInitialSeating(options: Inputs): Record<string, number> {
    const { votes, threshold, totalSeats } = options
    const totalVotes = sumValues(votes)
    const effectiveThreshold = Math.floor(totalVotes * threshold)

    const eligibleVotes = filterObject(votes, v => v >= effectiveThreshold)
    const eligibleTotalVotes = sumValues(eligibleVotes)

    const pricePerSeat = Math.floor(eligibleTotalVotes / totalSeats) // HaModed

    return mapObject(eligibleVotes, v => Math.floor(v / pricePerSeat))
}

function validateFinalSeats(finalSeats: Record<string, number>, totalSeats: number) {
    const assignedSeats = sumValues(finalSeats)
    if (assignedSeats !== totalSeats) {
        throw new Error(`Final seats assigned (${assignedSeats}) does not equal total seats (${totalSeats})`)
    }
}
