<template>
	<div>
		<a-divider> 预览设置 </a-divider>

		<AutoFormItem
			class="mb-2"
			label="显示预览图名称"
		>
			<a-switch v-model="store.setting.folder_preview.show_displayname"> </a-switch>
		</AutoFormItem>

		<AutoFormItem
			class="mb-2"
			label="物品默认大小"
		>
			<a-input-number
				v-model="store.setting.folder_preview.item_default_size"
				style="width: 200px"
				:min="32"
				:max="256"
				:step="16"
			>
				<template #append>像素</template>
			</a-input-number>
		</AutoFormItem>

		<AutoFormItem
			class="mb-2"
			label="模型默认大小"
		>
			<a-input-number
				v-model="store.setting.folder_preview.model_default_size"
				style="width: 200px"
				:min="64"
				:max="256"
				:step="16"
				@change="
					(model_default_size) => {
						previewer.model_size = model_default_size || previewer.model_size;
					}
				"
			>
				<template #append>像素</template>
			</a-input-number>
		</AutoFormItem>

		<a-divider>
			<OnlyElectronTag> 第三方应用设置 </OnlyElectronTag>
		</a-divider>

		<AutoFormItem
			class="mb-2"
			label="blockbench 路径"
		>
			<a-input
				v-model="store.setting.blockbench_path"
				:disabled="true"
				size="small"
				placeholder="无"
			>
				<template #append>
					<div v-if="is_in_electron">
						<a-button
							@click="
								() => {
									setAppPath('BlockBench', (path) => {
										store.setting.blockbench_path = path;
									});
								}
							"
							>设置
						</a-button>
					</div>
				</template>
			</a-input>
		</AutoFormItem>

		<AutoFormItem
			class="mb-2"
			label="vscode 路径"
		>
			<a-input
				v-model="store.setting.vscode_path"
				:disabled="true"
				size="small"
				placeholder="无"
			>
				<template #append>
					<div v-if="is_in_electron">
						<a-button
							@click="
								() => {
									setAppPath('Code', (path) => {
										store.setting.vscode_path = path;
									});
								}
							"
							>设置
						</a-button>
					</div>
				</template>
			</a-input>
		</AutoFormItem>
	</div>
</template>

<script setup lang="ts">
import { store } from '@/store';
import AutoFormItem from './AutoFormItem.vue';
import OnlyElectronTag from './OnlyElectronTag.vue';
import { isElectronEnv, requireElectronContext } from '../utils/remote';
import { previewer } from '@/utils/previewer';
const common_width = '220px';

const is_in_electron = isElectronEnv();

function setAppPath(name: string, callback: (path: string) => any) {
	requireElectronContext(({ remote }) => {
		remote.dialog
			.showOpenDialog({
				properties: ['openFile'],
				defaultPath: store.setting.blockbench_path,
				filters: [{ name: name, extensions: ['exe'] }]
			})
			.then((res) => {
				if (res.canceled) {
					return;
				}
				store.setting.blockbench_path = res.filePaths[0];
			});
	});
}
</script>

<style scoped lang="less"></style>
