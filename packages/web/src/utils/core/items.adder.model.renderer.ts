import { McModelRenderer } from '../model-viewer';
import { Asset } from './assets';
import { FolderRenderInfo, FolderRenderer, RenderItem } from './renderer';
import * as THREE from 'three';
import { AssetFolder } from './workspace';
import { previewer } from '../previewer';
import { VNode } from 'vue';

type ModelJson = {
	texture_size?: [number, number];
	textures: Record<string, string>;
	elements: {
		from: number[];
		to: number[];
		rotation?: {
			origin: number[];
			axis: string;
			angle: number;
		};
		shade?: boolean;
		faces: Record<
			string,
			{
				uv: number[];
				texture: string;
				rotation?: number;
			}
		>;
	}[];
	display: {
		thirdperson_righthand: {
			rotation: number[];
			translation: number[];
			scale: number[];
		};
		thirdperson_lefthand: {
			rotation: number[];
			translation: number[];
			scale: number[];
		};
		firstperson_righthand: {
			rotation: number[];
			translation: number[];
			scale: number[];
		};
		firstperson_lefthand: {
			rotation: number[];
			translation: number[];
			scale: number[];
		};
		gui: {
			rotation: number[];
			translation: number[];
			scale: number[];
		};
		head: {
			rotation: number[];
			translation: number[];
			scale: number[];
		};
		ground: {
			rotation: number[];
			translation: number[];
			scale: number[];
		};
		fixed: {
			rotation: number[];
			translation: number[];
			scale: number[];
		};
	};
};
interface ItemsAdderBaseType {
	display_name: string;
}
interface ItemsAdderItemType extends ItemsAdderBaseType {
	enabled: boolean;
	lore: string[];
	resource: {
		material: string;
		generate: boolean;
		textures?: string[];
		model_path?: string;
	};
	behaviours: {
		furniture: {
			light_level: number;
			entity: string;
			fixed_rotation: boolean;
			solid: boolean;
			placeable_on: {
				walls: boolean;
				ceiling: boolean;
				floor: boolean;
			};
			hitbox: {
				length: number;
				width: number;
				height: number;
			};
		};
		furniture_sit: {
			sit_height: number;
		};
	};
	[attr: string]: any;
}

interface ItemsAdderEntityType extends ItemsAdderBaseType {
	type: string;
	model_folder: string;
	silent: boolean;
	can_sun_burn: boolean;
	speed: {
		movement: number;
		flying: number;
	};
	[attr: string]: any;
}

type ConfigsJson = {
	info: { namespace: string };
	items: Record<string, ItemsAdderItemType>;
	entities: Record<string, ItemsAdderEntityType>;
};

export class ItemsAdderFolderRenderer implements FolderRenderer {
	asset_folder: AssetFolder;
	mcModelRenderer: McModelRenderer | undefined;

	constructor(asset_folder: AssetFolder, mcModelRenderer?: McModelRenderer) {
		this.asset_folder = asset_folder;
		this.mcModelRenderer = mcModelRenderer;
	}

	async list(callback: (item: RenderItem) => void | boolean) {
		for (const asset of this.asset_folder.assets) {
			if (asset.extname.endsWith('yaml') || asset.extname.endsWith('yml')) {
				const parts = this.normalPath(asset.filepath).replace(asset.basename, '').split('/').filter(String);

				const parent = parts.at(-1);
				const namespace = parts.at(-2);
				if (parent && namespace && parent === 'configs') {
					const config_json = await asset.yaml<ConfigsJson>();
					if (config_json) {
						const items = await this.parseItemsAdderConfigFile(config_json);
						for (const item of items) {
							item.data.config_filepath = asset.filepath;
						}

						if (items.length) {
							for (const item of items) {
								const pass = callback(item);
								if (pass === false) {
									return;
								}
							}
						}
					}
				}
			}
		}
	}

	async screenshot(render_item: RenderItem): Promise<string> {
		if (render_item.data.model_json) {
			const object = await createMcModel(
				render_item.displayname,
				render_item.data.model_json,
				render_item.data.textures_results
			);
			const dataURL = await previewer.getObject3DDataURL(object, {
				auto_camera: true
			});
			return dataURL;
		} else if (render_item.data.texture) {
			return render_item.data.texture;
		} else {
			return '';
		}
	}

	async render(render_item: RenderItem): Promise<HTMLElement> {
		if (render_item.data.model_json) {
			const object = await createMcModel(
				render_item.displayname,
				render_item.data.model_json,
				render_item.data.textures_results
			);
			const renderer = this.mcModelRenderer || (await previewer.waitForRenderer());

			await renderer.showLight();
			await renderer.add(object);

			await renderer.showGridHelper();
			await renderer.showAxesHelper();

			const box = new THREE.Box3().setFromObject(object);
			const max = Math.max(box.max.x, box.max.y, box.max.z);

			renderer.camera.position.x = -16 - 16 * (max / 16);
			renderer.camera.position.y = 16 + 16 * (max / 16);
			renderer.camera.position.z = -16 - 16 * (max / 16);

			return renderer.renderer.domElement;
		} else if (render_item.data.texture) {
			const img = document.createElement('img');
			img.src = render_item.data.texture;
			return img;
		}

		return document.createElement('div');
	}

	dispose(): void {
		throw new Error('Method not implemented.');
	}

	getAsset(filename: string) {
		return this.asset_folder.assets.find((a) => this.isPathEndWith(a.filepath, filename));
	}

	/**
	 * 解析ItemsAdder配置文件，并生成文件夹预览信息
	 * @param config_asset
	 */
	public async parseItemsAdderConfigFile(config_json: ConfigsJson): Promise<RenderItem[]> {
		const items: RenderItem[] = [];

		for (const key in config_json.items) {
			if (Object.prototype.hasOwnProperty.call(config_json.items, key)) {
				const item_json = config_json.items[key];
				if (item_json.resource.model_path) {
					const model_asset = this.getModelAsset(config_json.info.namespace, item_json.resource.model_path);

					if (model_asset === undefined) {
						continue;
					}
					const model_json = await model_asset.json<ModelJson>();
					if (model_json === undefined) {
						continue;
					}
					const textures: Record<string, string> = model_json.textures;

					const textures_results: Record<string, string> = {};
					const textures_assets: Record<string, Asset> = {};

					for (const [name, texture_relative_path] of Object.entries(textures)) {
						const texture_file = this.getModelTextureAsset(config_json.info.namespace, texture_relative_path);

						if (texture_file) {
							textures_results[name] = texture_file.content;
							textures_assets[name] = texture_file;
						}
					}

					const object = await createMcModel(item_json.display_name, model_json, textures_results);
					const dataURL = await previewer.getObject3DDataURL(object, {
						auto_camera: true
					});

					items.push({
						screenshot: dataURL,
						filename: model_asset.filepath,
						displayname: item_json.display_name,
						parents: [config_json.info.namespace, 'models'],
						data: { model_filepath: model_asset.filepath, model_json, config_json, item_json, textures_results }
					});
				} else if (item_json.resource.textures?.length) {
					// 一般 config.items[key].resource.textures 为一个数组，里面的元素为图片相对路径，但是没有名字
					for (const texture_relative_path of item_json.resource.textures) {
						const texture_asset = this.getItemTextureAsset(config_json.info.namespace, texture_relative_path);
						if (texture_asset) {
							items.push({
								screenshot: texture_asset.content,
								filename: texture_asset.filepath,
								displayname: item_json.display_name,
								parents: [config_json.info.namespace, 'textures'],
								data: { config_json, item_json, texture: texture_asset.content }
							});
						}
					}
				}
			}
		}

		return items;
	}

	/**
	 * 获取模型图片文件
	 * @param texture_relative_path 图片相对路径
	 */
	public getModelTextureAsset(namespace: string, texture_relative_path: string) {
		// blockbench导出的模型图片格式的一般为： 命名空间:图片相对路径，并且去除了后缀名
		const [_, relative_path] = texture_relative_path.split(':');

		return this.asset_folder.assets.find((asset) => {
			// eslint-disable-next-line max-len
			const texture_path_without_extname = `/${namespace}/textures/${relative_path}`;

			if (
				this.isPathEndWith(asset.filepath, texture_path_without_extname + '.png') ||
				this.isPathEndWith(asset.filepath, texture_path_without_extname + '.jpg')
			) {
				return asset;
			}
			return undefined;
		});
	}

	/**
	 * 获取物品图片文件
	 * @param texture_relative_path 图片相对路径
	 */
	public getItemTextureAsset(namespace: string, texture_relative_path: string) {
		return this.asset_folder.assets.find((asset) => {
			// eslint-disable-next-line max-len
			const texture_path_without_extname = `/${namespace}/textures/${texture_relative_path}`;

			if (
				this.isPathEndWith(asset.filepath, texture_path_without_extname + '.png') ||
				this.isPathEndWith(asset.filepath, texture_path_without_extname + '.jpg')
			) {
				return asset;
			}
			return undefined;
		});
	}

	/**
	 * 获取模型文件
	 * @param model_relative_path  模型相对路径
	 */
	public getModelAsset(namespace: string, model_relative_path: string) {
		return this.asset_folder.assets.find((a) =>
			this.isPathEndWith(a.filepath, `/${namespace}/models/${model_relative_path}.json`)
		);
	}

	private normalPath(path: string) {
		return path.replace(/\\/g, '/');
	}

	private isPathEndWith(full_path: string, path_part: string) {
		full_path = full_path.replace(/\\/g, '/');
		path_part = path_part.replace(/\\/g, '/');
		return full_path.endsWith(path_part);
	}
}

async function createMcModel(name: string, model_data: ModelJson, parsed_textures: Record<string, string>) {
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
