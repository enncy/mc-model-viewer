import { Menu, MenuItemConstructorOptions, app } from 'electron';

export function registerMenu() {
	const isMac = process.platform === 'darwin';

	const template = [
		...(isMac
			? [
					{
						label: app.name,
						submenu: [
							{ role: 'about', label: '关于' },
							{ type: 'separator' },
							{ role: 'services', label: '服务' },
							{ type: 'separator' },
							{ role: 'hide', label: '隐藏' },
							{ role: 'hideOthers', label: '隐藏其他' },
							{ role: 'unhide', label: '显示全部' },
							{ type: 'separator' },
							{ role: 'quit', label: '退出' }
						]
					}
			  ]
			: []),
		{
			label: '编辑',
			submenu: [
				{ role: 'undo', label: '撤销' },
				{ role: 'redo', label: '回复' },
				{ type: 'separator' },
				{ role: 'cut', label: '剪切' },
				{ role: 'copy', label: '复制' },
				{ role: 'paste', label: '粘贴' },
				...(isMac
					? [
							{ role: 'pasteAndMatchStyle' },
							{ role: 'delete', label: '删除' },
							{ role: 'selectAll', label: '全选' },
							{ type: 'separator' },
							{
								label: 'Speech',
								submenu: [
									{ role: 'startSpeaking', label: '开始朗读' },
									{ role: 'stopSpeaking', label: '停止朗读' }
								]
							}
					  ]
					: [{ role: 'delete', label: '删除' }, { type: 'separator' }, { role: 'selectAll', label: '全选' }])
			]
		},
		{
			label: '视图',
			submenu: [
				{ role: 'reload', label: '重新加载' },
				{ role: 'forceReload', label: '强制重新加载' },
				{ role: 'toggleDevTools', label: '开发者工具' },
				{ type: 'separator' },
				{ role: 'resetZoom', label: '重置缩放' },
				{ role: 'zoomIn', label: '放大' },
				{ role: 'zoomOut', label: '缩小' },
				{ type: 'separator' },
				{ role: 'togglefullscreen', label: '全屏' }
			]
		},
		{
			label: '窗口',
			submenu: [
				{ role: 'minimize', label: '最小化' },
				...(isMac
					? [
							{ type: 'separator' },
							{ role: 'front', label: '前置所有窗口' },
							{ type: 'separator' },
							{ role: 'window', label: '窗口' }
					  ]
					: [{ role: 'close', label: '关闭' }])
			]
		},
		{
			role: '帮助',
			submenu: [
				{
					label: '更多',
					click: async () => {}
				}
			]
		}
	] as MenuItemConstructorOptions[];

	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
}
