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

export async function renderParsedModel(renderer: McModelRenderer, parsed_model: ParsedItemAdderItemModelData) {
	const model = await createMcModel(
		parsed_model.name,
		JSON.parse(parsed_model.content),
		parsed_model.resolved_textures
	);
	await renderer.showLight();
	await renderer.showGrid();
	await renderer.add(model);
	return model;
}
