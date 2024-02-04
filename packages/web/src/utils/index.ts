export async function getFileContent(file: File) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsText(file, 'utf-8');
		reader.onload = () => {
			resolve(reader.result?.toString() || '');
		};
		reader.onerror = () => {
			reject(reader.error);
		};
	});
}

export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
