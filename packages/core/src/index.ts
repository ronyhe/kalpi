import { iterations, maxBy, sum, sumBy } from './utils.ts'

export interface SerializedElection {
    votes: (Party | SurplusAgreement)[]
    seats: number
    threshold: number
}

export interface Party {
    name: string
    votes: number
}

export type SurplusAgreement = Party[]

export interface Election {
    contenders: Contender[]
    seats: number
    threshold: number
}

export interface Results {
    seats: SeatAllocation
    breakdown: Breakdown
}

export type SeatAllocation = Record<string, number>

export interface Breakdown {
    totalVotes: number
    threshold: ThresholdBreakdown
    quota: QuotaBreakdown
    initialAllocation: SeatAllocation
    remainderSeats: RemainderSeatBreakdown[]
}

export interface ThresholdBreakdown {
    ratio: number
    thresholdVotes: number
    eliminatedParties: string[]
}

export interface QuotaBreakdown {
    qualifiedVotes: number
    totalSeats: number
    value: number
}

export interface RemainderSeatBreakdown {
    round: number
    winningContender: string[]
    winningParty: string
    allocations: SeatAllocation
    bids: RemainderSeatBid[]
}

export interface RemainderSeatBid {
    contender: string[]
    votes: number
    currentSeats: number
    bid: number
}

interface AllocationState {
    seatedContenders: SeatedContender[]
    breakdown: Breakdown
}

export function deserializeElection({ votes, threshold, seats }: SerializedElection): Election {
    const contenders = votes.map(v => {
        if (isParty(v)) {
            return new Contender([v])
        } else {
            return new Contender(v)
        }
    })
    return {
        contenders,
        seats,
        threshold
    }
}

function isParty(v: Party | SurplusAgreement): v is Party {
    return (v as Party).name !== undefined
}

class Contender {
    public readonly parties: Party[]

    constructor(parties: Party[]) {
        this.parties = parties
    }

    votes(): number {
        return sumBy(this.parties, p => p.votes)
    }

    filterPartiesByThresholdVotes(thresholdVotes: number): Contender | null {
        const passedParties = this.parties.filter(p => p.votes >= thresholdVotes)
        if (passedParties.length === 0) {
            return null
        }
        return new Contender(passedParties)
    }

    toSeated(quota: number): SeatedContender {
        const eligibleParties = this.parties.map(p => new SeatedParty(p.name, p.votes, Math.floor(p.votes / quota)))
        return new SeatedContender(eligibleParties)
    }
}

class SeatedParty {
    public readonly name: string
    public readonly votes: number
    public readonly seats: number

    constructor(name: string, votes: number, seats: number) {
        this.name = name
        this.votes = votes
        this.seats = seats
    }

    priceForNextSeat(): number {
        return Math.floor(this.votes / (this.seats + 1))
    }
}

class SeatedContender {
    public readonly parties: SeatedParty[]

    constructor(parties: SeatedParty[]) {
        this.parties = parties
    }

    votes(): number {
        return sumBy(this.parties, p => p.votes)
    }

    seats(): number {
        return sumBy(this.parties, p => p.seats)
    }

    bidForNextSeat() {
        return Math.floor(this.votes() / (this.seats() + 1))
    }

    partyNames(): string[] {
        return this.parties.map(p => p.name)
    }

    allocateSeatToHighestBidder(): SeatedContender {
        // If a surplus agreement wins a remainder seat, the seat goes to the party
        // inside the agreement with the highest individual price for the next seat.
        const bestParty = maxBy(this.parties, p => p.priceForNextSeat())!
        return new SeatedContender(
            this.parties.map(p => {
                if (Object.is(bestParty, p)) {
                    return new SeatedParty(p.name, p.votes, p.seats + 1)
                } else {
                    return p
                }
            })
        )
    }

    winningPartyForNextSeat(): string {
        return maxBy(this.parties, p => p.priceForNextSeat())!.name
    }
}

export function runElection(election: Election): Results {
    const initialState = allocateInitialSeats(election)
    const { seats } = election
    const initialAssignedSeats = sumBy(initialState.seatedContenders, c => c.seats())

    const remainderSeats = seats - initialAssignedSeats
    const finalState = allocateRemainderSeats(initialState, remainderSeats)

    const results = {
        seats: allocationsByParty(finalState.seatedContenders),
        breakdown: finalState.breakdown
    }
    const totalAssignedSeats = sum(Object.values(results.seats))
    if (totalAssignedSeats !== seats) {
        throw new Error(
            `Internal error: total assigned seats ${totalAssignedSeats} does not equal total seats ${seats}`
        )
    }

    return results
}

function allocateInitialSeats({ contenders, threshold, seats }: Election): AllocationState {
    const totalVotes = sumBy(contenders, c => c.votes())
    const thresholdVotes = totalVotes * threshold
    const qualifiedContenders = contenders
        .map(contender => contender.filterPartiesByThresholdVotes(thresholdVotes))
        .filter(c => c !== null)
    const qualifiedVotes = sumBy(qualifiedContenders, c => c.votes())
    const quota = qualifiedVotes / seats
    const seatedContenders = qualifiedContenders.map(c => c.toSeated(quota))
    return {
        seatedContenders,
        breakdown: {
            totalVotes,
            threshold: {
                ratio: threshold,
                thresholdVotes,
                eliminatedParties: contenders
                    .flatMap(contender => contender.parties)
                    .filter(party => party.votes < thresholdVotes)
                    .map(party => party.name)
            },
            quota: {
                qualifiedVotes,
                totalSeats: seats,
                value: quota
            },
            initialAllocation: allocationsByParty(seatedContenders),
            remainderSeats: []
        }
    }
}

function allocateRemainderSeats(state: AllocationState, remainingSeats: number): AllocationState {
    return iterations(remainingSeats)
        .map((_, i) => i + 1)
        .reduce(allocateNextRemainderSeat, state)
}

function allocateNextRemainderSeat(state: AllocationState, round: number): AllocationState {
    const { seatedContenders, breakdown } = state
    const bids = seatedContenders.map(contender => ({
        contender: contender.partyNames(),
        votes: contender.votes(),
        currentSeats: contender.seats(),
        bid: contender.bidForNextSeat()
    }))
    const bestContender = maxBy(seatedContenders, c => c.bidForNextSeat())!
    const winningParty = bestContender.winningPartyForNextSeat()
    const nextSeatedContenders = seatedContenders.map(c => {
        if (Object.is(c, bestContender)) {
            return c.allocateSeatToHighestBidder()
        } else {
            return c
        }
    })
    return {
        seatedContenders: nextSeatedContenders,
        breakdown: {
            ...breakdown,
            remainderSeats: [
                ...breakdown.remainderSeats,
                {
                    round,
                    winningContender: bestContender.partyNames(),
                    winningParty,
                    allocations: allocationsByParty(nextSeatedContenders),
                    bids
                }
            ]
        }
    }
}

function allocationsByParty(contenders: SeatedContender[]): SeatAllocation {
    return Object.fromEntries(contenders.flatMap(c => c.parties.map(p => [p.name, p.seats])))
}
