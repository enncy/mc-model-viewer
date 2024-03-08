import { WorkspaceOptions } from '@/utils/workspace';
import { reactive, watch } from 'vue';
import merge from 'lodash/merge';
import { requireElectronContext } from '@/utils/remote';
import { Message } from '@arco-design/web-vue';
import { AssetFolderInfo } from '@/utils/core/workspace';

export const store = reactive({
	current_workspace_name: '',
	workspaces: [] as WorkspaceOptions[],
	setting: {
		workspace: {
			/**
			 * 自动更新文件内容
			 */
			auto_update_files: true,
			need_update_flex_exts: ['json', 'yml', 'yaml', 'png', 'jpg'],
			itemsadder_plugin_folder_name: 'ItemsAdder',
			itemsadder_plugin_contents_name: 'contents'
		},
		preview_render: {
			width: 200,
			height: 200
		},
		details_render: {
			width: 600,
			height: 600
		},
		blockbench_path: '',
		vscode_path: ''
	},
	current_folder_render_info_name: '',
	current_asset_folder_name: '',
	asset_folders: [] as AssetFolderInfo[]
});

watch(
	store,
	() => {
		// 保存
		localStorage.setItem('store', JSON.stringify(store));
	},
	{ deep: true }
);

// 读取数据
const localStore = localStorage.getItem('store');
if (localStore) {
	merge(store, JSON.parse(localStore));
}

/**
 * 读取第三方软件路径
 */

if (store.setting.blockbench_path === '') {
	requireThirdPartAppPath('Blockbench', 'BlockBench.exe', (res) => {
		store.setting.blockbench_path = res;
		Message.success('Blockbench路径已自动设置');
	});
}

if (store.setting.vscode_path === '') {
	requireThirdPartAppPath('Microsoft VS Code', 'Code.exe', (res) => {
		store.setting.vscode_path = res;
		Message.success('VSCode路径已自动设置');
	});
}

function requireThirdPartAppPath(dir_name: string, app_name: string, callback: (path: string) => any) {
	requireElectronContext(({ child_process, path, remote }) => {
		if (process.platform === 'win32') {
			const cmd = `where /R ${remote.app.getPath('home')} ${app_name}`;
			console.log('cmd', cmd);
			const exec = child_process.exec(cmd);

			exec.stdout?.on('data', (data) => {
				const res = data.toString();
				if (res && path.dirname(res).endsWith(dir_name)) {
					callback(String(res).trim());
					exec.kill();
				}
			});

			exec.stderr?.on('data', (data) => {
				console.error(data);
				Message.error(data.toString());
			});
		}
	});
}
