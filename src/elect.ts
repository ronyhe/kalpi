import { maxBy, sum, iterations, sumBy } from './utils.ts'

export interface SerializedElection {
    votes: (Party | Alliance)[]
    seats: number
    threshold: number
}

export interface Party {
    name: string
    votes: number
}

export type Alliance = Party[]

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

function isParty(v: Party | Alliance): v is Party {
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

    toEligibleContender(quota: number): EligibleContender {
        const eligibleParties = this.parties.map(p => new EligibleParty(p.name, p.votes, Math.floor(p.votes / quota)))
        return new EligibleContender(eligibleParties)
    }
}

class EligibleParty {
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

class EligibleContender {
    public readonly parties: EligibleParty[]

    constructor(parties: EligibleParty[]) {
        this.parties = parties
    }

    votes(): number {
        return sumBy(this.parties, p => p.votes)
    }

    seats(): number {
        return sumBy(this.parties, p => p.seats)
    }

    priceForNextSeat() {
        return Math.floor(this.votes() / (this.seats() + 1))
    }

    giveSeatToBestParty(): EligibleContender {
        const bestParty = maxBy(this.parties, p => p.priceForNextSeat())!
        return new EligibleContender(
            this.parties.map(p => {
                if (Object.is(bestParty, p)) {
                    return new EligibleParty(p.name, p.votes, p.seats + 1)
                } else {
                    return p
                }
            })
        )
    }
}

export function runElection(election: Election): Results {
    const eligibleContenders = giveInitialSeats(election)
    const { seats } = election
    const initialAssignedSeats = sumBy(eligibleContenders, c => c.seats())

    const remainingSeats = seats - initialAssignedSeats
    const fullSeating = giveRemainderSeats(eligibleContenders, remainingSeats)

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

function giveRemainderSeats(eligibleContenders: EligibleContender[], remainingSeats: number): EligibleContender[] {
    return iterations(remainingSeats).reduce((prev, _) => giveNextSeat(prev), eligibleContenders)
}

function giveInitialSeats({ contenders, threshold, seats }: Election): EligibleContender[] {
    const totalVotes = sumBy(contenders, c => c.votes())
    const effectiveThreshold = totalVotes * threshold
    const filteredContenders = contenders
        .map(contender => contender.filterPartiesByEffectiveThreshold(effectiveThreshold))
        .filter(c => c !== null)
    const eligibleVotes = sumBy(filteredContenders, c => c.votes())
    const quota = eligibleVotes / seats
    return filteredContenders.map(c => c.toEligibleContender(quota))
}

function giveNextSeat(contenders: EligibleContender[]): EligibleContender[] {
    const bestContender = maxBy(contenders, c => c.priceForNextSeat())!
    return contenders.map(c => {
        if (Object.is(c, bestContender)) {
            return c.giveSeatToBestParty()
        } else {
            return c
        }
    })
}
