<template>
	<div>
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
