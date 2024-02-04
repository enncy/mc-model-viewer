import type * as ElectronRemote from '@electron/remote';
import type { ipcRenderer as IpcRenderer } from 'electron';

export function isElectronEnv() {
	return typeof global !== 'undefined';
}

export interface ElectronContext {
	remote: typeof ElectronRemote;
	ipcRenderer: typeof IpcRenderer;
	fs: typeof import('fs');
	path: typeof import('path');
	child_process: typeof import('child_process');
}

export function requireElectronContext<T extends (context: ElectronContext) => any>(
	handle: T
): ReturnType<T> | undefined {
	if (typeof global !== 'undefined') {
		const remote: typeof ElectronRemote = require('@electron/remote');
		const ipcRenderer = require('electron').ipcRenderer;
		const fs = require('fs');
		const path = require('path');
		const child_process = require('child_process');
		return handle({ remote, ipcRenderer, fs, path, child_process });
	} else {
		console.warn('remote is not available in the browser');
	}
}

export function runIn<E extends (context: ElectronContext) => any, W extends () => any>(ctx: {
	electron: E;
	web: W;
}): ReturnType<E | W> {
	if (typeof global !== 'undefined') {
		const remote: typeof ElectronRemote = require('@electron/remote');
		const ipcRenderer = require('electron').ipcRenderer;
		const fs = require('fs');
		const path = require('path');
		const child_process = require('child_process');
		return ctx.electron({ remote, ipcRenderer, fs, path, child_process });
	} else {
		return ctx.web();
	}
}
