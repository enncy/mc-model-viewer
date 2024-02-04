<template>
	<div>
		<a-divider> 宽高设置 </a-divider>
		<AutoFormItem
			:flex="common_width"
			label="预览图宽度"
			class="mb-2"
		>
			<a-input-number
				v-model="store.setting.preview_render.width"
				size="small"
				:min="64"
				:max="200"
			>
				<template #append>
					<div class="me-3">像素</div>
				</template>
			</a-input-number>
		</AutoFormItem>
		<AutoFormItem
			:flex="common_width"
			class="mb-2"
			label="预览图高度"
		>
			<a-input-number
				v-model="store.setting.preview_render.height"
				size="small"
				:min="64"
				:max="200"
			>
				<template #append>
					<div class="me-3">像素</div>
				</template>
			</a-input-number>
		</AutoFormItem>
		<AutoFormItem
			:flex="common_width"
			class="mb-2"
			label="详情图宽度"
		>
			<a-input-number
				v-model="store.setting.details_render.width"
				size="small"
				:min="200"
				:max="1000"
			>
				<template #append>
					<div class="me-3">像素</div>
				</template>
			</a-input-number>
		</AutoFormItem>
		<AutoFormItem
			:flex="common_width"
			class="mb-2"
			label="详情图高度"
		>
			<a-input-number
				v-model="store.setting.details_render.height"
				size="small"
				:min="200"
				:max="1000"
			>
				<template #append>
					<div class="me-3">像素</div>
				</template>
			</a-input-number>
		</AutoFormItem>

		<a-divider>
			<OnlyElectronTag> 工作区设置 </OnlyElectronTag>
		</a-divider>

		<AutoFormItem
			label="自动同步文件内容"
			:flex="common_width"
			class="mb-2"
		>
			<div class="flex justify-end">
				<a-switch
					v-model="store.setting.workspace.auto_update_files"
					:disabled="!is_in_electron"
				/>
			</div>
		</AutoFormItem>
		<AutoFormItem
			label="需要同步的文件后缀"
			:flex="common_width"
			class="mb-2"
		>
			<a-select
				:disabled="!is_in_electron"
				size="small"
				:model-value="store.setting.workspace.need_update_flex_exts"
				multiple
				allow-create
				@change="
					(exts) =>
						(store.setting.workspace.need_update_flex_exts = [...(Array.isArray(exts) ? exts : [exts])].map(
							(e) => '.' + String(e).trim()
						))
				"
			>
			</a-select>
		</AutoFormItem>
		<AutoFormItem
			:flex="common_width"
			label="ItemsAdder文件夹名"
			class="mb-2"
		>
			<a-input
				v-model="store.setting.workspace.itemsadder_plugin_folder_name"
				:disabled="!is_in_electron"
				size="small"
				placeholder="默认为 'ItemsAdder'"
			/>
		</AutoFormItem>

		<AutoFormItem
			:flex="common_width"
			label="ItemsAdder内容文件夹名"
			class="mb-2"
		>
			<a-input
				v-model="store.setting.workspace.itemsadder_plugin_contents_name"
				:disabled="!is_in_electron"
				size="small"
				placeholder="默认为 'contents'"
			/>
		</AutoFormItem>

		<a-divider>
			<OnlyElectronTag> 第三方应用设置 </OnlyElectronTag>
		</a-divider>

		<AutoFormItem
			class="mb-2"
			label="BlockBench 路径"
		>
			<a-input
				v-model="store.setting.blockbench_path"
				:disabled="true"
				size="small"
				placeholder="无"
			>
				<template #append>
					<div v-if="is_in_electron">
						<a-button @click="setBlockBenchPath">设置 </a-button>
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

function setBlockBenchPath() {
	requireElectronContext(({ remote }) => {
		remote.dialog
			.showOpenDialog({
				properties: ['openFile'],
				defaultPath: store.setting.blockbench_path,
				filters: [{ name: 'BlockBench', extensions: ['exe'] }]
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
