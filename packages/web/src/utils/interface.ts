export interface WorkspaceFile {
	name: string;
	size: number;
	/**
	 * 在web浏览器中无法获取
	 */
	path?: string;
	type: string;
	lastModified: number;
	webkitRelativePath: string;
	content: string;
}

export type Base64 = string;

export interface ItemsAdderBaseType {
	display_name: string;
}

export interface ItemsAdderItemType extends ItemsAdderBaseType {
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

export interface ItemsAdderEntityType extends ItemsAdderBaseType {
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

export interface MinecraftModelType {
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
}

export interface ItemsAdderConfigType {
	file: WorkspaceFile;
	info: { namespace: string };
	items: Record<string, ItemsAdderItemType>;
	entities: Record<string, ItemsAdderEntityType>;
}

export interface ParsedItemAdderItemModelData extends WorkspaceFile {
	resolved_textures: Record<string, Base64>;
}

/**
 * 解析后的ItemsAdder 物品和模型数据
 */
export interface ParsedItemAdderItemData {
	config_file: WorkspaceFile;

	item_config: ItemsAdderItemType;
	/**
	 * 如果此物品是一个模型，那么这个字段会有值
	 * 模型文件内容
	 */
	model?: ParsedItemAdderItemModelData;
	/**
	 * 如果此物品是一个物品，那么这个字段会有值，（物品的模型一般由 itemsadder 自动生成）
	 * 解析后的资源路径
	 */
	textures?: ({
		base64: string;
	} & WorkspaceFile)[];
}

/**
 * 解析后的ItemsAdder数据
 */
export interface ItemsAdderData {
	namespace: string;
	config: ItemsAdderConfigType;
	items: Record<string, ParsedItemAdderItemData>;
	entities: Record<string, {}>;
}
