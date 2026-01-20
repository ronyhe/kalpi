export interface Participant {
    votes: number
    seats: number
}

interface InternalParticipant extends Participant {
    extraSeats: number
    name: string
}

function giveNextSeat(participants: InternalParticipant[]): InternalParticipant | null {
    return maxBy(participants, p => Math.floor(p.votes / (p.seats + p.extraSeats + 1))) ?? null
}

export function distributeSeats(
    participants: Record<string, Participant>,
    seatsToDistribute: number
): Record<string, number> {
    const internals = Object.entries(participants).map(([name, p]) => ({
        ...p,
        name,
        extraSeats: 0
    }))

    for (let i = 0; i < seatsToDistribute; i++) {
        const winner = giveNextSeat(internals)
        if (winner) {
            winner.extraSeats += 1
        }
    }

    return Object.fromEntries(internals.map(({ name, extraSeats }) => [name, extraSeats]))
}

function maxBy<T>(arr: T[], fn: (item: T) => number): T | undefined {
    let maxItem: T | undefined = undefined
    let maxValue = -Infinity
    for (const item of arr) {
        const value = fn(item)
        if (value > maxValue) {
            maxValue = value
            maxItem = item
        }
    }
    return maxItem
}
