import { ParsedItemAdderItemData } from './interface';
import { McModelRenderer } from './model-viewer';
import { renderParsedModel } from './model-viewer/utils';
import { sleep } from './index';

/**
 * 预览器
 */
export class Previewer {
	renderer: McModelRenderer[] = [];

	constructor() {
		/**
		 * 开启10个线程渲染，预留6个webGL渲染器给其他地方调用
		 */
		for (let index = 0; index < 10; index++) {
			const renderer = new McModelRenderer({ width: 200, height: 200 });
			this.renderer.push(renderer);
		}
	}

	getDataURL(parsed_data: ParsedItemAdderItemData) {
		const parsed_model = parsed_data.model;
		if (parsed_model?.content) {
			return new Promise<string>((resolve, reject) => {
				this.waitForRenderer()
					.then(async (renderer) => {
						await renderParsedModel(renderer, parsed_model);
						const canvas = renderer.renderer.domElement;
						await sleep(10);
						if (canvas) {
							// 保存截图
							resolve(canvas.toDataURL());
						}
						renderer.removeAll();
						this.renderer.push(renderer);
					})
					.catch(reject);
			});
		} else if (parsed_data.textures?.length) {
			return parsed_data.textures[0].base64;
		} else {
			return undefined;
		}
	}

	waitForRenderer() {
		return new Promise<McModelRenderer>((resolve, reject) => {
			const timer = setInterval(() => {
				const renderer = this.renderer.shift();
				if (renderer) {
					clearInterval(timer);
					clearTimeout(timeout);
					resolve(renderer);
				}
			}, 1);

			const timeout = setTimeout(() => {
				clearInterval(timer);
				reject(new Error('get viewer timeout'));
			}, 60 * 1000);
		});
	}
}
