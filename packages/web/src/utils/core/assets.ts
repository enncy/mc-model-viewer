/* global BufferEncoding */

import { isElectronEnv, requireElectronContext } from '../remote';
import YAML from 'yaml';

const _isElectronEnv = isElectronEnv();

export interface AssetInfo {
	basename: string;
	extname: string;
	size: number;
	/**
	 * 在web浏览器中无法获取
	 */
	filepath: string;
	/**
	 * 最后修改时间
	 */
	mtime: number;
	/**
	 * 创建时间
	 */
	ctime: number;
	/**
	 * 初始化的文件内容, 纯文本或者base64编码的图片
	 */
	content: string;
}

export class Asset implements AssetInfo {
	/** 文件名 */
	basename: string;
	/** 文件拓展名 */
	extname: string;
	size: number;
	/**
	 * 在web浏览器中为相对路径，在electron中为绝对路径
	 */
	filepath: string;
	/**
	 * 最后修改时间
	 */
	mtime: number;
	/**
	 * 创建时间
	 */
	ctime: number;
	/**
	 * 初始化的文件内容, 纯文本或者base64编码的图片
	 */
	content: string;
	private _temp_buffer: Buffer | undefined;

	/**
	 *  创建Assets对象
	 * @param asset 文件信息
	 * @param default_content  Web文件的默认内容
	 */
	private constructor(asset_info: AssetInfo) {
		this.basename = asset_info.basename;
		this.extname = asset_info.extname;
		this.size = asset_info.size;
		this.filepath = asset_info.filepath;
		this.mtime = asset_info.mtime;
		this.ctime = asset_info.ctime;
		this.content = asset_info.content;
	}

	public serialize(): AssetInfo {
		return {
			basename: this.basename,
			extname: this.extname,
			size: this.size,
			filepath: this.filepath,
			mtime: this.mtime,
			ctime: this.ctime,
			content: this.content
		};
	}

	public static deserialize(info: AssetInfo): Asset {
		return new Asset(info);
	}

	/**
	 * 获取文件内容，如果文件被修改，则重新读取文件
	 * - 在Web浏览器中，始终返回初始化的文件内容
	 * @param encoding  编码 ， 当在web浏览器中时，此参数无效
	 */
	public async text(encoding?: BufferEncoding | undefined): Promise<string | undefined> {
		try {
			if (_isElectronEnv) {
				const buffer = await this.buffer();
				if (buffer) {
					return buffer.toString(encoding);
				}
			} else {
				return this.content;
			}
		} catch (e) {
			console.error(e);
			return undefined;
		}
	}

	/**
	 * 获取文件JSON内容，如果文件被修改，则重新读取文件
	 * - 在Web浏览器中，始终返回初始化的文件内容
	 */
	public async json<T>(): Promise<T | undefined> {
		try {
			if (_isElectronEnv) {
				const buffer = await this.buffer();
				if (buffer) {
					return JSON.parse(buffer.toString('utf-8'));
				}
			} else {
				return this.content ? JSON.parse(this.content) : undefined;
			}
		} catch (e) {
			console.error(e);
			return undefined;
		}
	}

	/**
	 * 获取文件Yaml内容，如果文件被修改，则重新读取文件
	 * - 在Web浏览器中，始终返回初始化的文件内容
	 */
	public async yaml<T>(): Promise<T | undefined> {
		try {
			if (this.extname.endsWith('yaml') || this.extname.endsWith('yml')) {
				const text = await this.text();
				if (text) {
					return YAML.parse(text);
				}
			}
		} catch (e) {
			console.error(e);
			return undefined;
		}
	}

	/**
	 * 获取文件Base64图像内容，data:image 开头，如果文件被修改，则重新读取文件
	 * - 在Web浏览器中，始终返回初始化的文件内容
	 */
	public async imageDataURL(): Promise<string | undefined> {
		try {
			if (_isElectronEnv) {
				const buffer = await this.buffer();
				return buffer ? `data:image/${this.extname.replace('.', '')};base64,${buffer.toString('base64')}` : undefined;
			} else {
				return this.content?.startsWith('data:image') ? this.content : undefined;
			}
		} catch (e) {
			console.error(e);
			return undefined;
		}
	}

	/**
	 *  创建Assets对象
	 * @param filepathOrWebFile 文件路径或者web文件
	 */
	public static from(filepathOrWebFile: string | File) {
		if (filepathOrWebFile instanceof File) {
			const file = filepathOrWebFile;

			return new Promise<Asset>((resolve, reject) => {
				const ext = file.name.split('.').pop()!;

				const info: AssetInfo = {
					basename: file.name,
					extname: ext,
					size: file.size,
					mtime: file.lastModified,
					ctime: file.lastModified,
					filepath: file.path || file.webkitRelativePath,
					content: ''
				};

				if (['png', 'jpg'].includes(ext)) {
					const reader = new FileReader();
					reader.readAsDataURL(file);
					reader.onload = function () {
						if (reader.result) {
							info.content = reader.result.toString();
							resolve(new Asset(info));
						}
					};
				} else {
					file
						.text()
						.then((text) => {
							info.content = text;
							resolve(new Asset(info));
						})
						.catch(reject);
				}
			});
		}

		if (typeof filepathOrWebFile === 'string' && _isElectronEnv === false) {
			throw new Error('在web浏览器中无法使用文件路径创建Assets对象');
		}

		return new Promise<Asset>((resolve, reject) => {
			const filepath = filepathOrWebFile;
			requireElectronContext(({ fs, path }) => {
				fs.stat(filepath, (err, stats) => {
					if (err) {
						return reject(err);
					}

					if (stats.isDirectory()) {
						return reject(new Error('不能创建文件夹的Assets对象'));
					}

					fs.readFile(filepath, (err, data) => {
						if (err) {
							return reject(err);
						}

						const info: AssetInfo = {
							basename: path.basename(filepath),
							extname: path.extname(filepath),
							size: stats.size,
							filepath: filepath,
							mtime: stats.mtimeMs,
							ctime: stats.ctimeMs,
							content: ''
						};

						if (['.png', '.jpg'].includes(info.extname)) {
							info.content = `data:image/${info.extname.replace('.', '')};base64,${data.toString('base64')}`;
						} else {
							info.content = data.toString('utf-8');
						}

						resolve(new Asset(info));
					});
				});
			});
		});
	}

	private buffer(): Promise<Buffer | undefined> | undefined {
		return requireElectronContext(({ fs }) => {
			return new Promise<Buffer | undefined>((resolve) => {
				fs.stat(this.filepath, (err, stats) => {
					if (err) {
						console.error(err);
						return resolve(undefined);
					}
					if (this._temp_buffer === undefined || stats.mtimeMs > this.mtime) {
						fs.readFile(this.filepath, (err, data) => {
							if (err) {
								console.error(err);
								return resolve(undefined);
							}
							this._temp_buffer = data;
							resolve(data);
						});
					} else {
						resolve(this._temp_buffer);
					}
				});
			});
		});
	}
}
