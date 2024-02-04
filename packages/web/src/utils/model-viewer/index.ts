import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MinecraftModelType } from '../interface';
import { waitForAdded } from './utils';

interface McModelRendererOptions {
	height: number;
	width: number;
	controls?: {
		/**
		 * 是否开启自动旋转
		 */
		autoRotate?: boolean;
	};
}

/**
 *
 * 创建一个 由 blockbench 创建的 MC 模型的渲染器
 *
 * 修改优化自 https://github.com/vberlier/json-model-viewer 的代码
 *
 * @see https://github.com/vberlier/json-model-viewer
 */
export class McModelRenderer {
	options: { height: number; width: number };
	renderer: THREE.WebGLRenderer;
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	controls: OrbitControls;
	// 渲染时的默认偏移位置
	public static COMMON_POSITION_OFFSET = -8;

	constructor(options: McModelRendererOptions) {
		this.options = options;

		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
		this.renderer.setSize(options.width, options.height);

		/**
		 * 场景
		 */
		this.scene = new THREE.Scene();

		/**
		 * 相机
		 */
		this.camera = new THREE.PerspectiveCamera(45, options.width / options.height, 1, 1000);
		this.camera.position.x = -16;
		this.camera.position.y = 16;
		this.camera.position.z = -16;

		/**
		 * 轨道控制器
		 */
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.2;
		this.controls.zoomSpeed = 1.4;
		this.controls.rotateSpeed = 0.6;
		// 是否开启自动旋转
		this.controls.autoRotate = options.controls?.autoRotate || false;
		this.controls.autoRotateSpeed = 1;

		const render = async () => {
			window.requestAnimationFrame(render);
			this.controls.update();
			await this.draw();
		};
		render();
	}

	public dispose() {
		this.renderer.dispose();
	}

	private async draw() {
		this.renderer.render(this.scene, this.camera);
		return this;
	}

	resize() {
		this.camera.aspect = this.options.width / this.options.height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(this.options.width, this.options.height);

		return this;
	}

	/**
	 * 添加模型，如果已添加了则不再添加
	 * @param model
	 */
	async add(model: THREE.Object3D) {
		if (this.scene.getObjectByProperty('uuid', model.uuid) === undefined) {
			await Promise.all([waitForAdded(model), this.scene.add(model)]);
		}
		return this;
	}

	removeAll() {
		this.scene.remove(...this.scene.children);
		return this;
	}

	async setBackGroundColor(color: 'transparent' | 'white') {
		this.renderer.setClearColor(color === 'transparent' ? 0x000000 : 0xffffff, color === 'transparent' ? 0 : 1);
		return this;
	}

	/**
	 * 添加辅助网格线
	 */
	async showGridHelper() {
		const _grid = this.scene.getObjectByName('grid');
		const _biggerGrid = this.scene.getObjectByName('bigger-grid');
		const _arrow = this.scene.getObjectByName('arrow');
		if (_grid && _biggerGrid && _arrow) {
			_grid.visible = true;
			_biggerGrid.visible = true;
			_arrow.visible = true;
			return;
		}

		// 网格辅助
		const gridHelper = new THREE.GridHelper(16);
		gridHelper.name = 'grid';
		gridHelper.material.opacity = 0.2;
		gridHelper.material.transparent = true;
		gridHelper.position.y = McModelRenderer.COMMON_POSITION_OFFSET;
		await this.add(gridHelper);

		// 网格辅助
		const biggerGridHelper = new THREE.GridHelper(16 * 3, 3);
		biggerGridHelper.name = 'bigger-grid';
		biggerGridHelper.material.opacity = 0.2;
		biggerGridHelper.material.transparent = true;
		biggerGridHelper.position.y = McModelRenderer.COMMON_POSITION_OFFSET;
		await this.add(biggerGridHelper);

		// 箭头
		const arrow = new THREE.BufferGeometry();
		const positions = new Float32Array(
			[
				[-1, McModelRenderer.COMMON_POSITION_OFFSET, -9],
				[1, McModelRenderer.COMMON_POSITION_OFFSET, -9],
				[1, McModelRenderer.COMMON_POSITION_OFFSET, -9],
				[0, McModelRenderer.COMMON_POSITION_OFFSET, -10],
				[0, McModelRenderer.COMMON_POSITION_OFFSET, -10],
				[-1, McModelRenderer.COMMON_POSITION_OFFSET, -9]
			].flat()
		);
		arrow.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		const arrowLine = new THREE.LineSegments(arrow, new THREE.MeshBasicMaterial({ color: 0xafafaf }));
		arrowLine.name = 'arrow';
		this.add(arrowLine);

		return this;
	}

	hideGridHelper() {
		const grid = this.scene.getObjectByName('grid');
		const biggerGrid = this.scene.getObjectByName('bigger-grid');
		const arrow = this.scene.getObjectByName('arrow');
		if (grid && biggerGrid && arrow) {
			grid.visible = false;
			biggerGrid.visible = false;
			arrow.visible = false;
		}
		return this;
	}

	async showAxesHelper() {
		const axes = this.scene.getObjectByName('axes');
		if (axes) {
			axes.visible = true;
			return;
		}
		// 坐标轴辅助
		const axesHelper = new THREE.AxesHelper(100);
		axesHelper.name = 'axes';
		axesHelper.position.x = McModelRenderer.COMMON_POSITION_OFFSET;
		axesHelper.position.y = McModelRenderer.COMMON_POSITION_OFFSET;
		axesHelper.position.z = McModelRenderer.COMMON_POSITION_OFFSET;
		await this.add(axesHelper);
		return this;
	}

	hideAxesHelper() {
		const axes = this.scene.getObjectByName('axes');
		if (axes) {
			axes.visible = false;
		}
		return this;
	}

	async showLight() {
		/**
		 * 添加光线
		 */

		await this.add(new THREE.AmbientLight(0xffffff, 1));
		const light = new THREE.DirectionalLight(0xffffff, 2);
		light.position.set(-1, 20, -1);
		await this.add(light);
	}

	mount(node: Node) {
		node.appendChild(this.renderer.domElement);

		return this;
	}
}

export async function createMcModel(
	name: string,
	model_data: MinecraftModelType,
	parsed_textures: Record<string, string>
) {
	const model = new THREE.Object3D();
	model.name = name;

	const loader = new THREE.TextureLoader();

	const materials: THREE.Material[] = [];

	for (const key in parsed_textures) {
		if (Object.prototype.hasOwnProperty.call(parsed_textures, key)) {
			const texture = await loader.loadAsync(parsed_textures[key]);
			// sharp pixels and smooth edges
			texture.magFilter = THREE.NearestFilter;
			texture.minFilter = THREE.LinearFilter;
			const mat = new THREE.MeshLambertMaterial({ map: texture, transparent: true, alphaTest: 0.5 });
			materials.push(mat);
		}
	}

	// extra transparent material for hidden faces
	const transparentMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, alphaTest: 0.5 });

	materials.push(transparentMaterial);

	const elements = model_data.elements;
	const group = new THREE.Group();

	for (const element of elements) {
		const width = element.to[0] - element.from[0];
		const height = element.to[1] - element.from[1];
		const length = element.to[2] - element.from[2];

		const origin = {
			x: (element.to[0] + element.from[0]) / 2 + McModelRenderer.COMMON_POSITION_OFFSET,
			y: (element.to[1] + element.from[1]) / 2 + McModelRenderer.COMMON_POSITION_OFFSET,
			z: (element.to[2] + element.from[2]) / 2 + McModelRenderer.COMMON_POSITION_OFFSET
		};

		// if a value happens to be 0, the geometry becomes a plane and will have 4 vertices instead of 12.
		const fix = 0.001;

		const geometry = new THREE.BoxGeometry(width + fix, height + fix, length + fix);

		if (Object.keys(element.faces).length > 0) {
			//  设置UV贴图
			const specified_faces = ['east', 'west', 'up', 'down', 'south', 'north'];
			const uvs = [];
			for (let i = 0; i < 6; i++) {
				const face = specified_faces[i];
				const uv = element.faces[face].uv;

				const [u0, v0, u1, v1] = normalizedUVs(uv);

				/**
				 * 因为新版的threejs的uv坐标是一个数组
				 * UV坐标顺序必须为：左上角，右上角，左下角，右下角
				 */

				uvs.push(
					[u0, v0],
					[u1, v0],
					[u0, v1],
					[u1, v1]
					// 以下是正常顺序，但是上面的旋转角度符合 Blockbench 预览时的角度 （每旋转90度则代表每两个坐标往下移动，上方的坐标代表下方的坐标旋转180度）
					// [u0, v1], // 0 1 左上角
					// [u1, v1], // 1 1 右上角
					// [u0, v0], // 0 0 左下角
					// [u1, v0] // 1 0 右下脚
				);

				const textureIndex = Object.keys(parsed_textures).indexOf(element.faces[face].texture.replace('#', ''));
				// 设置材质索引，默认是乱的
				geometry.groups[i].materialIndex = textureIndex;
			}

			geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs.flat(), 2));
		}

		const mesh = new THREE.Mesh(geometry, materials);
		mesh.position.x = origin.x;
		mesh.position.y = origin.y;
		mesh.position.z = origin.z;

		if (element.rotation) {
			// get origin, axis and angle

			const rotationOrigin = {
				x: element.rotation.origin[0] - 8,
				y: element.rotation.origin[1] - 8,
				z: element.rotation.origin[2] - 8
			};

			const axis = element.rotation.axis;
			const angle = element.rotation.angle;

			// create pivot

			const pivot = new THREE.Group();
			pivot.position.x = rotationOrigin.x;
			pivot.position.y = rotationOrigin.y;
			pivot.position.z = rotationOrigin.z;

			pivot.add(mesh);

			// adjust mesh coordinates

			mesh.position.x -= rotationOrigin.x;
			mesh.position.y -= rotationOrigin.y;
			mesh.position.z -= rotationOrigin.z;

			// rotate pivot

			if (axis === 'x') pivot.rotateX((angle * Math.PI) / 180);
			else if (axis === 'y') pivot.rotateY((angle * Math.PI) / 180);
			else if (axis === 'z') pivot.rotateZ((angle * Math.PI) / 180);

			// add pivot
			group.add(pivot);
		} else {
			const pivot = new THREE.Group();
			pivot.add(mesh);
			// add pivot
			group.add(pivot);
		}
	}

	// add group

	model.add(group);

	return model;
}

/**
 * 归一化UV数据
 */
function normalizedUVs(uvs: number[]): number[] {
	return uvs.map((coord, i) => (i % 2 ? 16 - coord : coord) / 16);
}
