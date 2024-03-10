import { reactive, watch } from 'vue';
import merge from 'lodash/merge';
import { requireElectronContext } from '@/utils/remote';
import { Message } from '@arco-design/web-vue';
import { AssetFolderInfo } from '@/utils/core/workspace';

export const store = reactive({
	current_workspace_name: '',
	setting: {
		folder_preview: {
			show_displayname: true,
			/**
			 * 物品默认大小
			 */
			item_default_size: 64,
			/**
			 * 模型默认大小
			 */
			model_default_size: 128
		},
		blockbench_path: '',
		vscode_path: ''
	},
	current_render_group_name: '',
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
