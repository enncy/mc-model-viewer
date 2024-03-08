import { app } from 'electron';
import { createWindow } from './src/utils';
import path from 'path';
import { registerIpc } from './src/ipc';
import { registerMenu } from './src/utils/register.menu';

const ElectronRemote = require('@electron/remote/main') as typeof import('@electron/remote/main');
// 初始化 remote 模块
ElectronRemote.initialize();

// 设置应用名称
app.setName('MC Model Viewer');

/** 获取单进程锁 */
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
	app.quit();
} else {
	// 注册菜单栏
	registerMenu();
	bootstrap();
}

/** 启动渲染进程 */
async function bootstrap() {
	// 等待 app 准备完成
	await app.whenReady();
	// 创建窗口
	const window = createWindow({
		// 是否隐藏标题栏
		hideTitleBar: false,
		// 处理链接跳转
		handleOpenExternal: true,
		// 启用 remote 模块
		enableRemoteModule: true
	});

	app.on('quit', (e) => {
		// 交给渲染层去关闭浏览器，可以实现关闭询问功能
		// e.preventDefault();
		// window.webContents.send('close');
	});

	window.on('close', (e) => {
		// 交给渲染层去关闭浏览器，可以实现关闭询问功能
		// e.preventDefault();
		// window.webContents.send('close');
	});

	if (app.isPackaged) {
		await window.loadFile('./public/index.html');
	} else {
		await window.loadURL('http://localhost:3000/');
		window.webContents.openDevTools();
	}

	// 加载完成显示，解决一系列的显示/黑屏问题
	window.show();

	registerIpc();
}
