import { deserializeElection, runElection } from '@kalpi/core'
import { knesset25 } from '@kalpi/data'

const results = runElection(deserializeElection(knesset25))

export const packageConnectionCheck = {
    electionSeats: knesset25.seats,
    resultPartyCount: Object.keys(results.seats).length
}
