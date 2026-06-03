export function sumBy<T>(arr: T[], fn: (item: T) => number): number {
    return sum(arr.map(fn))
}

export function sum(nums: number[]): number {
    return nums.reduce((a, b) => a + b, 0)
}

export function maxBy<T>(arr: T[], fn: (item: T) => number): T | undefined {
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

export function iterations(n: number): undefined[] {
    return Array.from({ length: n })
}
