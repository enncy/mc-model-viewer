import type * as ElectronRemote from '@electron/remote';
import type { ipcRenderer as IpcRenderer } from 'electron';

export function isElectronEnv() {
	return typeof global !== 'undefined';
}

export interface ElectronContext {
	remote: typeof ElectronRemote;
	ipcRenderer: typeof IpcRenderer;
}

export function requireElectronContext(handle: (context: ElectronContext) => void) {
	if (typeof global !== 'undefined') {
		const remote: typeof ElectronRemote = require('@electron/remote');
		const ipcRenderer = require('electron').ipcRenderer;
		handle({ remote, ipcRenderer });
	} else {
		console.warn('remote is not available in the browser');
	}
}
