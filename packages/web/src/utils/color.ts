const color_map = {
	'&0': '000000',
	'&1': '0000AA',
	'&2': '00AA00',
	'&3': '00AAAA',
	'&4': 'AA0000',
	'&5': 'AA00AA',
	'&6': 'FFAA00',
	'&7': 'AAAAAA',
	'&8': '555555',
	'&9': '5555FF',
	'&a': '55FF55',
	'&b': '55FFFF',
	'&c': 'FF5555',
	'&d': 'FF55FF',
	'&e': 'FFFF55',
	'&f': 'FFFFFF'
};

export function colored(text: string) {
	const indexes = text.match(/&[0-9a-f]/g)?.map((m) => text.search(m)) || [];
	const result: string[] = [];
	for (let index = 0; index < indexes.length; index++) {
		const str = text.substring(indexes[index], indexes[index + 1] ? indexes[index + 1] : text.length);

		const m = str.match(/(&[0-9a-f])(.+)/);
		if (m && m.length >= 3) {
			result.push(`<span style="color: #${(color_map as any)[m[1]]}">${m[2]}</span>`);
		} else {
			result.push(str);
		}
	}

	return result.length > 0 ? result.join('') : text;
}
