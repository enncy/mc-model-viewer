import { ItemsAdderConfigType, ItemsAdderData, WorkspaceFile } from './interface';
import yaml from 'yaml';
import { isElectronEnv, requireElectronContext, runIn } from './remote';
import { Message } from '@arco-design/web-vue';

export interface WorkspaceOptions {
	name: string;
	files: WorkspaceFile[];
}

export class Workspace {
	/**
	 * ItemsAdder插件的根目录，一般为'contents'
	 */
	root: string = '';

	/**
	 * 是否是有效的ItemsAdder工作区
	 */
	valid: boolean = false;
	/**
	 * 是否正在加载文件
	 */
	files_loading: boolean = false;

	public static CONFIGS_FOLDER_NAME = 'configs';
	public static MODELS_FOLDER_NAME = 'models';
	public static TEXTURES_FOLDER_NAME = 'textures';

	constructor(
		/**
		 * 工作区名称
		 */
		public name: string,
		/**
		 * 工作区文件列表
		 */
		public files: WorkspaceFile[],
		/**
		 * 设置
		 */
		public settings: {
			auto_update_files: boolean;
			need_update_flex_exts: string[];
			itemsadder_plugin_folder_name: string;
			itemsadder_plugin_contents_name: string;
		}
	) {
		/**
		 * 如果是electron环境，更新文件内容
		 */
		if (isElectronEnv() && this.settings.auto_update_files) {
			this.files_loading = true;
			updateFileContent(files, this.settings.need_update_flex_exts)
				?.then(() => {
					this.files_loading = false;
					this.onFilesLoadingFinish();
				})
				?.catch((err) => {
					Message.error('工作区加载失败: ' + String(err));
					console.error(err);
				});
		}

		this.root = files[0]?.webkitRelativePath?.split('/')[0] || '';

		runIn({
			electron: () => {
				/**
				 * ItemsAdder插件的内容路径
				 */
				const itemsadder_plugin_path =
					files[0].path?.replace(/\\/g, '/').replace(files[0]?.webkitRelativePath, '') || '';

				if (
					itemsadder_plugin_path.split('/').filter(String).at(-1) !== this.settings.itemsadder_plugin_folder_name ||
					this.root !== this.settings.itemsadder_plugin_contents_name
				) {
					this.valid = false;
				} else {
					this.valid = true;
				}
			},
			web: () => {
				if (this.root !== this.settings.itemsadder_plugin_contents_name) {
					this.valid = false;
				} else {
					this.valid = true;
				}
			}
		});
	}

	public onFilesLoadingFinish() {}

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
				configs.push(Object.assign({ file: child }, yaml.parse(child.content.toString())));
			}
			folderContents.push(new Folder(folder, configs, this));
		}
		return folderContents;
	}

	private getFolderConfigsFile(folder: string) {
		const children: WorkspaceFile[] = [];
		for (const file of this.files) {
			if (
				file.webkitRelativePath.startsWith(`${this.root}/${folder}/${Workspace.CONFIGS_FOLDER_NAME}`) &&
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
				`${this.workspace.root}/${this.name}/${Workspace.MODELS_FOLDER_NAME}/${model_relative_path}.json`
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
			const texture_path_without_extname = `${this.workspace.root}/${this.name}/${Workspace.TEXTURES_FOLDER_NAME}/${relative_path}`;

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
			const texture_path_without_extname = `${this.workspace.root}/${this.name}/${Workspace.TEXTURES_FOLDER_NAME}/${texture_relative_path}`;

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
							config_file: config.file,
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
						config_file: config.file,
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

function updateFileContent(files: WorkspaceFile[], NEED_UPDATE_FILE_EXTS: string[]) {
	return requireElectronContext(({ fs, path }) => {
		return Promise.all(
			files.map((file) => {
				return new Promise<void>((resolve, reject) => {
					const file_path = file.path;

					if (!file_path) {
						return resolve();
					}

					fs.stat(file_path, (err, stats) => {
						if (err) {
							return reject(err);
						}

						if (
							stats.isFile() &&
							// 如果文件的修改时间大于上次加载的时间
							stats.mtime.getTime() > file.lastModified &&
							// 并且文件是需要更新的格式的文件
							NEED_UPDATE_FILE_EXTS.some((ext) => path.extname(file_path).includes(ext))
						) {
							console.log('update file content:', file_path);

							fs.readFile(file_path, (err, data) => {
								if (err) {
									return reject(err);
								}
								// 更新文件内容
								if (['.png', '.jpg'].some((ext) => path.extname(file_path).includes(ext))) {
									file.content = `data:image/${path.extname(file_path).replace('.', '')};base64,${data.toString(
										'base64'
									)}`;
								} else {
									file.content = data.toString();
								}

								file.lastModified = stats.mtime.getTime();
								resolve();
							});
						} else {
							resolve();
						}
					});
				});
			})
		);
	});
}
