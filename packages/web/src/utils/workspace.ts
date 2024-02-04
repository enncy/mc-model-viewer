import { ItemsAdderConfigType, ItemsAdderData, WorkspaceFile, ItemsAdderItemType } from './interface';
import yaml from 'yaml';

export interface WorkspaceOptions {
	name: string;
	files: WorkspaceFile[];
}

export class Workspace {
	name: string;
	root: string = '';
	files: WorkspaceFile[];
	CONFIGS_FOLDER_NAME = 'configs';
	MODELS_FOLDER_NAME = 'models';
	TEXTURES_FOLDER_NAME = 'textures';

	constructor(name: string, files: WorkspaceFile[]) {
		this.name = name;
		this.files = files;
		this.root = files[0]?.webkitRelativePath?.split('/')[0] || '';
	}

	public getFolders() {
		let folders: string[] = [];
		for (const file of this.files) {
			folders.push(file.webkitRelativePath?.split('/')[1]);
		}
		folders = Array.from(new Set(folders));
		const folderContents: Folder[] = [];
		for (const folder of folders) {
			const configs: ItemsAdderConfigType[] = [];
			const children = this.getFolderConfigsFile(folder);

			for (const child of children) {
				configs.push(yaml.parse(child.content.toString()));
			}
			folderContents.push(new Folder(folder, configs, this));
		}
		return folderContents;
	}

	private getFolderConfigsFile(folder: string) {
		const children: WorkspaceFile[] = [];
		for (const file of this.files) {
			if (
				file.webkitRelativePath.startsWith(`${this.root}/${folder}/${this.CONFIGS_FOLDER_NAME}`) &&
				(file.name.endsWith('yaml') || file.name.endsWith('yml'))
			) {
				children.push(file);
			}
		}
		return children;
	}
}

export class Folder {
	name: string;
	configs: ItemsAdderConfigType[];
	workspace: Workspace;

	constructor(name: string, configs: ItemsAdderConfigType[], workspace: Workspace) {
		this.name = name;
		this.configs = configs;
		this.workspace = workspace;
	}

	/**
	 * 获取模型的绝对路径
	 * @param model_relative_path  模型相对路径
	 */
	public getModelAbsolutePath(model_relative_path: string) {
		return this.workspace.files.find(
			(f) =>
				f.webkitRelativePath ===
				`${this.workspace.root}/${this.name}/${this.workspace.MODELS_FOLDER_NAME}/${model_relative_path}.json`
		);
	}

	/**
	 * 获取模型图片的绝对路径
	 * @param texture_relative_path 图片相对路径
	 */
	public getModelTextureAbsolutePath(texture_relative_path: string) {
		// blockbench导出的模型图片格式的一般为： 命名空间:图片相对路径，并且去除了后缀名
		const [namespace, relative_path] = texture_relative_path.split(':');

		return this.workspace.files.find((f) => {
			// eslint-disable-next-line max-len
			const texture_path_without_extname = `${this.workspace.root}/${this.name}/${this.workspace.TEXTURES_FOLDER_NAME}/${relative_path}`;

			if (
				f.webkitRelativePath === texture_path_without_extname + '.png' ||
				f.webkitRelativePath === texture_path_without_extname + '.jpg'
			) {
				return f;
			}
			return undefined;
		});
	}

	/**
	 * 获取物品图片的绝对路径
	 * @param texture_relative_path 图片相对路径
	 */
	public getItemTextureAbsolutePath(texture_relative_path: string) {
		return this.workspace.files.find((f) => {
			// eslint-disable-next-line max-len
			const texture_path_without_extname = `${this.workspace.root}/${this.name}/${this.workspace.TEXTURES_FOLDER_NAME}/${texture_relative_path}`;

			if (
				f.webkitRelativePath === texture_path_without_extname + '.png' ||
				f.webkitRelativePath === texture_path_without_extname + '.jpg'
			) {
				return f;
			}
			return undefined;
		});
	}

	public getItemsAdderData(config: ItemsAdderConfigType): ItemsAdderData {
		const items_adder_data: ItemsAdderData = { config, namespace: config.info.namespace, items: {}, entities: {} };

		for (const key in config.items) {
			if (Object.prototype.hasOwnProperty.call(config.items, key)) {
				const item = config.items[key];

				if (item.resource.model_path) {
					const model_file = this.getModelAbsolutePath(item.resource.model_path);

					/**
					 * 例子：
					 * {
					 * 	 'aa': 'folder_name:modal_name/image.png'
					 * }
					 */
					const textures: Record<string, string> = JSON.parse(model_file?.content.toString() || '{}').textures;

					const textures_result: Record<string, string> = {};

					for (const [name, texture_relative_path] of Object.entries(textures)) {
						const texture_file = this.getModelTextureAbsolutePath(texture_relative_path);

						if (texture_file) {
							textures_result[name] = texture_file.content;
						}
					}

					if (model_file) {
						items_adder_data.items[key] = {
							item_config: item,
							model: {
								...model_file,
								resolved_textures: textures_result
							}
						};
					}
				} else if (item.resource.textures?.length) {
					const textures_result = [];

					// 一般 config.items[key].resource.textures 为一个数组，里面的元素为图片相对路径，但是没有名字
					for (const texture_relative_path of item.resource.textures) {
						const texture_file = this.getItemTextureAbsolutePath(texture_relative_path);
						if (texture_file) {
							textures_result.push({
								...texture_file,
								base64: texture_file.content
							});
						}
					}

					items_adder_data.items[key] = {
						item_config: item,
						textures: textures_result
					};
				}
			}
		}

		// TODO 解析实体
		// const entities: ItemsAdderData['entities'] = {};

		return items_adder_data;
	}
}
