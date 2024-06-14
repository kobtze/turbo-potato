export function filterMap<K, V>(map: Map<K, V>, predicate: (key: K, value: V) => boolean): Map<K, V> {
	const entries: [K, V][] = Array.from(map.entries());
	const filteredEntries: [K, V][] = entries.filter(([key, value]) => predicate(key, value));

	return new Map<K, V>(filteredEntries);
}