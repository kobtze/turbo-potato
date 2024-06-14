export function filterMap<K, V>(map: Map<K, V>, predicate: (key: K, value: V) => boolean): Map<K, V> {
	// Convert the map to an array of [key, value] pairs
	const entries: [K, V][] = Array.from(map.entries());

	// Filter the array based on the predicate
	const filteredEntries: [K, V][] = entries.filter(([key, value]) => predicate(key, value));

	// Convert the filtered array back to a map
	return new Map<K, V>(filteredEntries);
}