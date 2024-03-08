import { BrowserWindow, Menu, MenuItemConstructorOptions, ipcMain } from 'electron';
import { createWindow } from '../utils';

export function registerIpc() {
	ipcMain.on('create-window', async (e, url, { title, height, width, minHeight, minWidth, hideTitleBar }) => {
		// 创建窗口
		const win = createWindow({
			title: title,
			// 是否隐藏标题栏
			hideTitleBar: hideTitleBar,
			// 处理链接跳转
			handleOpenExternal: true,
			// 启用 remote 模块
			enableRemoteModule: true,
			height: height,
			width: width,
			minHeight: minHeight,
			minWidth: minWidth
		});
		await win.loadURL(url);

		win.removeMenu();

		win.webContents.on('did-finish-load', () => {
			win.show();
		});
	});

	const rendererWinMap = new Map<string, BrowserWindow>();

	/**
	 * 创建渲染窗口，并通过 ipc 传递数据参数，用于大量数据传递无法通过 url params 传递的情况
	 */
	ipcMain.on(
		'open-renderer-with-args',
		async (e, url, { filename, title, height, width, minHeight, minWidth, hideTitleBar }, ...args) => {
			const opened = rendererWinMap.get(filename);
			if (opened) {
				if (opened.isDestroyed() === false) {
					// 置顶窗口
					return opened.moveTop();
				}
			}

			// 创建窗口
			const win = createWindow({
				title: title,
				// 是否隐藏标题栏
				hideTitleBar: hideTitleBar,
				// 处理链接跳转
				handleOpenExternal: true,
				// 启用 remote 模块
				enableRemoteModule: true,
				height: height,
				width: width,
				minHeight: minHeight,
				minWidth: minWidth
			});

			await win.loadURL(url);

			rendererWinMap.set(filename, win);

			win.webContents.on('did-finish-load', () => {
				win.webContents.send('args', ...args);
				win.show();
			});
		}
	);

	// 显示复制粘贴菜单栏
	ipcMain.on('show-context-menu', (event) => {
		const template: MenuItemConstructorOptions[] = [
			{
				label: '复制',
				accelerator: 'CmdOrCtrl+C',
				click(menuItem, browserWindow, event) {
					browserWindow?.webContents.copy();
				}
			},
			{
				label: '粘贴',
				accelerator: 'CmdOrCtrl+V',
				click(menuItem, browserWindow, event) {
					browserWindow?.webContents.paste();
				}
			},
			{
				label: '剪切',
				accelerator: 'CmdOrCtrl+X',
				click(menuItem, browserWindow, event) {
					browserWindow?.webContents.cut();
				}
			},
			{
				label: '全选',
				accelerator: 'CmdOrCtrl+A',
				click(menuItem, browserWindow, event) {
					browserWindow?.webContents.selectAll();
				}
			},
			{
				type: 'separator'
			},
			{
				label: '重新加载',
				accelerator: 'CmdOrCtrl+R',
				click(menuItem, browserWindow, event) {
					browserWindow?.webContents.reload();
				}
			},
			{
				label: '开发者工具',
				click(menuItem, browserWindow, event) {
					browserWindow?.webContents.toggleDevTools();
				}
			}
		];
		const menu = Menu.buildFromTemplate(template);
		menu.popup({ window: BrowserWindow.fromWebContents(event.sender) || undefined });
	});
}
