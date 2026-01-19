const ISRAEL_RULES = {
    totalSeats: 120,
    threshold: 0.0325 // 3.25%
}

interface Options {
    votes: {
        [party: string]: number
    }
    threshold: number // Achuz HaChasima
    remainderPacts: string[][] // Heskemei Odafim
    totalSeats: number // 120 seats in Knesset
}

interface Results {
    seats: {
        [party: string]: number
    }
}

async function main() {
    console.log('Election process started.')
}

await main()
