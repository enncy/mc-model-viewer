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
