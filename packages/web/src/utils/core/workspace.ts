import { Asset, AssetInfo } from './assets';

export interface AssetFolderInfo {
	name: string;
	type: string;
	assets: AssetInfo[];
}

export interface Folder {}

export class AssetFolder {
	name: string;
	type: string;
	assets: Asset[];

	constructor(name: string, type: string, assets: Asset[]) {
		this.name = name;
		this.type = type;
		this.assets = assets;
	}

	public static async loadFromFiles(name: string, type: string, files: File[] | FileList) {
		return new AssetFolder(name, type, await Promise.all(Array.from(files).map(Asset.from)));
	}

	public static async deserialize(info: AssetFolderInfo) {
		return new AssetFolder(info.name, info.type, await Promise.all(info.assets.map(Asset.deserialize)));
	}

	serialize(): AssetFolderInfo {
		return {
			name: this.name,
			type: this.type,
			assets: this.assets.map((asset) => asset.serialize())
		};
	}
}
