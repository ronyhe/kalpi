import { maxBy, sum, range } from './utils.ts'

interface Party {
    name: string
    votes: number
}

type Alliance = Party[]

interface Election {
    contenders: Contender[]
    seats: number
    threshold: number
}

export interface SerializedElection {
    votes: (Party | Alliance)[]
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
        return sum(this.parties.map(p => p.votes))
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
        return sum(this.parties.map(p => p.votes))
    }

    seats(): number {
        return sum(this.parties.map(p => p.seats))
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

export function runElection({ contenders, threshold, seats }: Election): Results {
    const totalVotes = sum(contenders.map(c => c.votes()))
    const effectiveThreshold = Math.floor(totalVotes * threshold)
    const filteredContenders = contenders
        .map(contender => contender.filterPartiesByEffectiveThreshold(effectiveThreshold))
        .filter(c => c !== null)
    const eligibleVotes = sum(filteredContenders.map(c => c.votes()))
    const quota = Math.floor(eligibleVotes / seats)
    const eligibleContenders = filteredContenders.map(c => c.toEligibleContender(quota))
    const remainingSeats = seats - sum(eligibleContenders.map(c => c.seats()))
    const fullSeating = range(remainingSeats).reduce((prev, _) => giveNextSeat(prev), eligibleContenders)
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
