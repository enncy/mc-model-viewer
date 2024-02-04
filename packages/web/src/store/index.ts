import { WorkspaceOptions } from '@/utils/workspace';
import { reactive, watch } from 'vue';
import merge from 'lodash/merge';
import { requireElectronContext } from '@/utils/remote';
import { Message } from '@arco-design/web-vue';

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
		blockbench_path: ''
	}
});

if (store.setting.blockbench_path === '') {
	requireElectronContext(({ child_process, remote }) => {
		const exec = child_process.exec('where /R C:\\Users\\87752\\AppData\\Local\\Programs BlockBench.exe');

		exec.stdout?.on('data', (data) => {
			const path = data.toString();
			if (path) {
				store.setting.blockbench_path = String(path).trim();
			}
		});

		exec.stderr?.on('data', (data) => {
			Message.error(data.toString());
		});
	});
}

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
