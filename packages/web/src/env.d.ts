/// <reference types="vite/client" />

declare module '*.vue' {
	import { DefineComponent } from 'vue';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
	const component: DefineComponent<{}, {}, any>;

	export default component;
}

declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';

export {};

declare global {
	class JsonModel {
		constructor(name: string, json: any, texture: any): void;
	}
	// eslint-disable-next-line no-unused-vars
	class ModelViewer {
		renderer: { domElement: HTMLCanvasElement };
		constructor(container: HTMLElement): void;
		load: (model: JsonModel) => void;
		resize: () => void;
		removeAll: () => void;
	}
}
