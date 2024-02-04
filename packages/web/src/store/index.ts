import { WorkspaceOptions } from '@/utils/workspace';
import { reactive, watch } from 'vue';

export const store = reactive({
	current_workspace_name: '',
	workspaces: [] as WorkspaceOptions[]
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
	Object.assign(store, JSON.parse(localStore));
}
