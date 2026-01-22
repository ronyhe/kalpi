import { maxBy, sum, iterations, sumBy } from './utils.ts'

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
    seats: {
        [party: string]: number
    }
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

    filterPartiesByEffectiveThreshold(threshold: number): Contender | null {
        const passedParties = this.parties.filter(p => p.votes >= threshold)
        if (passedParties.length === 0) {
            return null
        }
        return new Contender(passedParties)
    }

    toSeated(quota: number): SeatedContender {
        const eligibleParties = this.parties.map(p => new Seated(p.name, p.votes, Math.floor(p.votes / quota)))
        return new SeatedContender(eligibleParties)
    }
}

class Seated {
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
    public readonly parties: Seated[]

    constructor(parties: Seated[]) {
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

    allocateSeatToHighestBidder(): SeatedContender {
        const bestParty = maxBy(this.parties, p => p.priceForNextSeat())!
        return new SeatedContender(
            this.parties.map(p => {
                if (Object.is(bestParty, p)) {
                    return new Seated(p.name, p.votes, p.seats + 1)
                } else {
                    return p
                }
            })
        )
    }
}

export function runElection(election: Election): Results {
    const seatedContenders = allocateInitialSeats(election)
    const { seats } = election
    const initialAssignedSeats = sumBy(seatedContenders, c => c.seats())

    const remainderSeats = seats - initialAssignedSeats
    const fullSeating = allocateRemainderSeats(seatedContenders, remainderSeats)

    const results = {
        seats: Object.fromEntries(fullSeating.flatMap(c => c.parties.map(p => [p.name, p.seats])))
    }
    const totalAssignedSeats = sum(Object.values(results.seats))
    if (totalAssignedSeats !== seats) {
        throw new Error(
            `Internal error: total assigned seats ${totalAssignedSeats} does not equal total seats ${seats}`
        )
    }

    return results
}

function allocateRemainderSeats(seatedContenders: SeatedContender[], remainingSeats: number): SeatedContender[] {
    return iterations(remainingSeats).reduce((prev, _) => allocateNextRemainderSeat(prev), seatedContenders)
}

function allocateInitialSeats({ contenders, threshold, seats }: Election): SeatedContender[] {
    const totalVotes = sumBy(contenders, c => c.votes())
    const effectiveThreshold = totalVotes * threshold
    const filteredContenders = contenders
        .map(contender => contender.filterPartiesByEffectiveThreshold(effectiveThreshold))
        .filter(c => c !== null)
    const qualifiedVotes = sumBy(filteredContenders, c => c.votes())
    const quota = qualifiedVotes / seats
    return filteredContenders.map(c => c.toSeated(quota))
}

function allocateNextRemainderSeat(contenders: SeatedContender[]): SeatedContender[] {
    const bestContender = maxBy(contenders, c => c.bidForNextSeat())!
    return contenders.map(c => {
        if (Object.is(c, bestContender)) {
            return c.allocateSeatToHighestBidder()
        } else {
            return c
        }
    })
}
