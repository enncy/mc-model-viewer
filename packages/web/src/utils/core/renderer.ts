import { VNode } from 'vue';

export type RenderItem = {
	screenshot: string;
	filename: string;
	displayname: string;
	parents: string[];
	data: any;
};

export type FolderRenderInfo = {
	name: string;
	items: RenderItem[];
	children: FolderRenderInfo[];
};

export interface FolderRenderer {
	list(callback: (item: RenderItem) => void): Promise<void>;
	screenshot(item: RenderItem): Promise<string>;
	render(item: RenderItem): Promise<HTMLElement>;
	dispose(): void;
}
