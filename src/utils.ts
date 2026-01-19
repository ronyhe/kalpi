export function sum(nums: number[]): number {
    return nums.reduce((a, b) => a + b, 0)
}

export function filterObject<K extends string | number | symbol, V>(
    obj: Record<K, V>,
    pred: (v: V, k: K) => boolean
): Record<K, V> {
    const pairs = Object.entries(obj) as [K, V][]
    const filteredPairs = pairs.filter(([k, v]) => pred(v, k))
    return Object.fromEntries(filteredPairs) as Record<K, V>
}

export function mapObject<K extends string | number | symbol, A, B>(
    obj: Record<K, A>,
    fn: (v: A, k: K) => B
): Record<K, B> {
    const pairs = Object.entries(obj) as [K, A][]
    const mappedPairs = pairs.map(([k, v]) => [k, fn(v, k)] as [K, B])
    return Object.fromEntries(mappedPairs) as Record<K, B>
}

export type Pair<T> = [T, T]
