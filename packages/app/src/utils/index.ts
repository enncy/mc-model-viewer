import { BrowserWindow, shell } from 'electron';
import path from 'path';
const ElectronRemote = require('@electron/remote/main') as typeof import('@electron/remote/main');

export function createWindow(options: {
	hideTitleBar?: boolean;
	title?: string;
	icon?: string;
	handleOpenExternal: boolean;
	enableRemoteModule: boolean;
	minHeight?: number;
	minWidth?: number;
	width?: number;
	height?: number;
}) {
	const win = new BrowserWindow({
		title: options.title,
		icon: options.icon || path.resolve('../../public/favicon.ico'),
		minHeight: options.minHeight ?? 800,
		minWidth: options.minWidth ?? 1200,
		width: options.width ?? 1200,
		height: options.height ?? 800,
		center: true,
		hasShadow: true,
		...(options.hideTitleBar
			? {
					autoHideMenuBar: true,
					titleBarStyle: 'hidden',
					titleBarOverlay: {
						color: 'white',
						symbolColor: 'black'
					},
					frame: false
			  }
			: {}),
		show: false,
		webPreferences: {
			webgl: true,
			zoomFactor: 1,
			// 关闭拼写矫正
			spellcheck: false,
			webSecurity: true,
			// 开启node
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	if (options.hideTitleBar) {
		win.removeMenu();
		win.webContents.once('did-finish-load', () => {
			win.webContents.emit('show-custom-title-bar');
		});
	}

	if (options.handleOpenExternal) {
		win.webContents.on('will-navigate', (event, url) => {
			event.preventDefault();
			shell.openExternal(url);
		});

		win.webContents.setWindowOpenHandler((detail) => {
			shell.openExternal(detail.url);
			return {
				action: 'deny'
			};
		});
	}

	if (options.enableRemoteModule) {
		// 启用 remote 模块
		ElectronRemote.enable(win.webContents);
	}

	win.removeMenu();

	return win;
}
