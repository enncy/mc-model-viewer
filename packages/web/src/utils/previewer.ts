import { McModelRenderer } from './model-viewer';
import { sleep } from './index';
import * as THREE from 'three';

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

	dispose() {
		for (const renderer of this.renderer) {
			renderer.renderer.dispose();
		}
	}

	getObject3DDataURL(
		object: THREE.Object3D,
		options?: {
			/** 自动将相机调整至可以看到整个模型的位置 */
			auto_camera?: boolean;
			/** 显示辅助平台网格 */
			show_grid?: boolean;
			/** 显示坐标系 */
			show_axes?: boolean;
		}
	) {
		return new Promise<string>((resolve, reject) => {
			this.waitForRenderer()
				.then(async (renderer) => {
					await renderer.showLight();
					await renderer.add(object);

					if (options?.show_grid) {
						await renderer.showGridHelper();
					}

					if (options?.show_axes) {
						await renderer.showAxesHelper();
					}

					if (options?.auto_camera) {
						const box = new THREE.Box3().setFromObject(object);
						const max = Math.max(box.max.x, box.max.y, box.max.z);

						renderer.camera.position.x = -16 - 16 * (max / 16);
						renderer.camera.position.y = 16 + 16 * (max / 16);
						renderer.camera.position.z = -16 - 16 * (max / 16);
					}
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

export const previewer = new Previewer();
