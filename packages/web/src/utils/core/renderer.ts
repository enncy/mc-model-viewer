export type RenderItem = {
	screenshot: string;
	filename: string;
	displayname: string;
	parents: string[];
	data: any;
};

export type RenderGroup = {
	name: string;
	items: RenderItem[];
	children: RenderGroup[];
};

export interface FolderRenderer {
	list(callback: (item: RenderItem) => void): Promise<void>;
	screenshot(item: RenderItem): Promise<string>;
	render(item: RenderItem): Promise<HTMLElement>;
	dispose(): void;
}
