import { PixelData } from './interface';

/**
 * 获取图片像素数据
 * @param textures
 */
export function getPixelData(texture: string) {
	return new Promise<PixelData>((resolve, reject) => {
		const canvas = document.createElement('canvas');
		const img = new Image();

		img.src = texture;
		img.onload = async () => {
			try {
				canvas.getContext('2d')?.drawImage(img, 0, 0, img.width, img.height);

				// 遍历获取像素点
				const imageData = canvas.getContext('2d')?.getImageData(0, 0, img.width, img.height)?.data;
				if (imageData) {
					const colors = [];

					for (let i = 0; i < imageData.length; i += 4) {
						const r = imageData[i];
						const g = imageData[i + 1];
						const b = imageData[i + 2];
						const a = imageData[i + 3];
						if (r === 0 && g === 0 && b === 0 && a === 0) {
							colors.push('transparent');
						} else {
							colors.push(`rgba(${r}, ${g}, ${b}, ${a})`);
						}
					}

					resolve({ width: img.width, height: img.height, colors: colors });
				}
			} catch (err) {
				console.error(err);
			}
		};
		img.onerror = console.error;
	});
}

/**
 *
 * 获取绘制材质背景板的背景类名
 */
export function getBackgroundBoardClassName(pixel_data: PixelData, board_index: number) {
	// 当前的行数 = 当前像素点索引 / 图片宽度 并取整
	const row = Math.floor(board_index / pixel_data.width);
	// 是否为偶数列
	const is_even_column = board_index % 2 === 0;

	return row % 2 === 0
		? is_even_column
			? 'background-board-1'
			: 'background-board-2'
		: is_even_column
		? 'background-board-2'
		: 'background-board-1';
}

export function size(num: number) {
	const mapping = [
		['GB', Math.pow(1024, 3)],
		['MB', Math.pow(1024, 2)],
		['KB', Math.pow(1024, 1)],
		['B', 1]
	] as [string, number][];

	const index = mapping.map((i) => Math.floor(num / i[1])).findIndex((i) => i > 0);

	return (num / mapping[index][1]).toFixed(2) + ' ' + mapping[index][0];
}

export function max(str: string, len = 5) {
	return str.length > len ? str.substring(0, len) + '...' : str;
}
