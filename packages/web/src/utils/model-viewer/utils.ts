import * as THREE from 'three';
import { createMcModel } from '.';
import { ParsedItemAdderItemModelData } from '../interface';
import { McModelRenderer } from './index';

export function waitForAdded(...objs: THREE.Object3D[]) {
	return Promise.all(
		objs.map((obj) => {
			return new Promise<void>((resolve) => {
				const listener = () => {
					obj.removeEventListener('added', listener);
					resolve();
				};
				obj.addEventListener('added', listener);
			});
		})
	);
}

export async function renderParsedModel(
	renderer: McModelRenderer,
	parsed_model: ParsedItemAdderItemModelData,
	options?: {
		/** 自动将相机调整至可以看到整个模型的位置 */
		auto_camera?: boolean;
		/** 显示辅助平台网格 */
		show_grid?: boolean;
		/** 显示坐标系 */
		show_axes?: boolean;
	}
) {
	const model = await createMcModel(
		parsed_model.name,
		JSON.parse(parsed_model.content),
		parsed_model.resolved_textures
	);
	await renderer.showLight();
	await renderer.add(model);

	if (options?.show_grid) {
		await renderer.showGridHelper();
	}

	if (options?.show_axes) {
		await renderer.showAxesHelper();
	}

	if (options?.auto_camera) {
		const box = new THREE.Box3().setFromObject(model);
		const max = Math.max(box.max.x, box.max.y, box.max.z);

		renderer.camera.position.x = -16 - 16 * (max / 16);
		renderer.camera.position.y = 16 + 16 * (max / 16);
		renderer.camera.position.z = -16 - 16 * (max / 16);
	}
	return model;
}
