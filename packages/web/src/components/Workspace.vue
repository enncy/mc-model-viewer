<!-- eslint-disable vue/no-v-html -->
<template>
	<div class="workspace h-full">
		<a-row class="h-full flex-nowrap">
			<a-col
				flex="200px"
				class="h-full me-2 border-r-2 overflow-auto"
			>
				<template
					v-for="(folder, index) of state.folders"
					:key="index"
				>
					<div
						class="folder text-lg"
						:class="{ current: state.current_folder?.name === folder.name }"
						:style="{
							cursor: state.loading ? 'progress' : 'pointer'
						}"
						@click="state.loading ? '' : showFolderContent(folder.name)"
					>
						<a-space size="mini">
							<IconFolder /> <span> {{ folder.name }} </span>
						</a-space>
					</div>
				</template>
			</a-col>
			<a-col
				flex="auto"
				class="h-full overflow-auto"
			>
				<div class="mt-2">
					<div id="model-view"></div>

					<template v-if="workspace.valid === false">
						<a-alert
							class="mb-2"
							type="warning"
						>
							当前工作区很可能不是 ItemsAdder 插件的根目录！请删除并重新选择工作区
						</a-alert>
					</template>

					<template v-if="state.workspace_files_loading || state.loading">
						<a-skeleton :animation="true">
							<a-space
								direction="vertical"
								:style="{ width: '100%' }"
								size="large"
							>
								<a-skeleton-line :rows="3" />
							</a-space>
						</a-skeleton>
					</template>
					<template v-else-if="state.current_preview_group.length <= 0">
						<a-empty />
					</template>
					<div v-else>
						<!-- 鼠标移入显示预览图片 -->
						<div class="absolute current-image-previewer">
							<!-- 模型预览 -->
							<div id="model-canvas-preview"></div>
							<!-- 材质预览 -->
							<div
								v-if="state.current_pixel_data"
								class="text-center flex flex-wrap"
								:style="{
									width: store.setting.preview_render.width + 'px',
									height: store.setting.preview_render.height + 'px'
								}"
							>
								<span
									v-for="(color, i) of state.current_pixel_data.colors || []"
									:key="i"
									:style="{
										backgroundColor: color === 'transparent' ? undefined : color,
										width: store.setting.preview_render.width / (state.current_pixel_data.width || 0) + 'px',
										height: store.setting.preview_render.height / (state.current_pixel_data.height || 0) + 'px'
									}"
									:class="'inline-block ' + getBackgroundBoardClassName(state.current_pixel_data, i)"
									style="border-right: 1px solid #f5f5f5; border-bottom: 1px solid #f5f5f5"
								></span>
							</div>
						</div>

						<a-collapse :default-active-key="state.current_preview_group.map((d) => d.namespace)">
							<a-collapse-item
								v-for="group of state.current_preview_group"
								:key="group.namespace"
							>
								<template #header> {{ group.namespace }} </template>
								<template #extra>
									<a-input-search
										v-model="group.search"
										size="mini"
										placeholder="搜索"
										@click.stop
									/>
								</template>

								<template v-if="state.current_preview_group.some((g) => g.items.length) === false">
									<a-empty />
								</template>
								<div
									v-else
									class="p-1"
								>
									<div class="item-list">
										<template
											v-if="
												group.search &&
												group.items.filter((i) => i.parsed_data.item_config.display_name.includes(group.search))
													.length === 0
											"
										>
											<a-empty />
										</template>
										<template
											v-for="({ model_image, texture_image, parsed_data }, index) of !group.search
												? group.items
												: group.items.filter((i) => i.parsed_data.item_config.display_name.includes(group.search))"
											:key="index"
										>
											<template v-if="model_image">
												<div class="flex items-center">
													<div
														class="model-image-container cursor-pointer"
														@click="
															() => {
																state.current_selected.parsed_data = parsed_data;
																state.current_selected.modal_visible = true;
															}
														"
														@mouseenter="
															async () => {
																if (parsed_data.model && preview_renderer) {
																	preview_renderer.dispose();
																	preview_renderer.removeAll();
																	await renderParsedModel(preview_renderer, parsed_data.model, {
																		auto_camera: true
																	});
																	dom
																		.querySelector('#model-canvas-preview')
																		?.replaceChildren(preview_renderer.renderer.domElement);
																}
															}
														"
														@mouseleave="() => dom.querySelector('#model-canvas-preview')?.replaceChildren()"
													>
														<img :src="model_image" />
														<div class="text-slate-500 text-xs flex justify-center w-full mt-2">
															<div v-html="colored(max(parsed_data.item_config.display_name, 6))"></div>
														</div>
													</div>
												</div>
											</template>
											<template v-else-if="texture_image">
												<div
													class="flex items-center justify-center cursor-pointer texture-image-container"
													style="min-width: 64px; min-height: 64px"
													@click="
														async () => {
															state.current_selected.parsed_data = parsed_data;
															dom.querySelector('#model-canvas-preview')?.replaceChildren();
															state.current_selected.modal_visible = true;
														}
													"
													@mouseenter="async () => (state.current_pixel_data = await getPixelData(texture_image))"
													@mouseleave="() => (state.current_pixel_data = undefined)"
												>
													<div>
														<div class="w-full flex justify-center">
															<img :src="texture_image" />
														</div>
														<div class="text-slate-500 text-xs text-center w-full mt-2">
															<div v-html="colored(max(parsed_data.item_config.display_name, 6))"></div>
														</div>
													</div>
												</div>
											</template>
										</template>
									</div>
								</div>
							</a-collapse-item>
						</a-collapse>
					</div>
				</div>
			</a-col>
		</a-row>

		<a-modal
			v-model:visible="state.current_selected.modal_visible"
			width="auto"
			:footer="false"
			:body-style="{ padding: '8px 12px 24px 12px' }"
			class="workspace-modal-details"
			:mask-closable="false"
			:unmount-on-close="true"
		>
			<template #title>
				<div
					v-html="
						colored(
							state.current_selected.parsed_data?.item_config.display_name +
								' &0(' +
								((state.current_selected.parsed_data?.model || state.current_selected.parsed_data?.textures?.[0])
									?.name || '') +
								')'
						)
					"
				></div>
			</template>

			<ItemDetailsEditor
				v-if="state.current_selected.parsed_data"
				v-model:parsed-data="state.current_selected.parsed_data"
			></ItemDetailsEditor>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { Workspace, WorkspaceOptions, Folder } from '../utils/workspace';
import { onMounted, reactive, onDeactivated } from 'vue';
import { ItemsAdderData, ParsedItemAdderItemData } from '../utils/interface';
import { Previewer } from '../utils/previewer';
import { renderParsedModel } from '../utils/model-viewer/utils';
import { McModelRenderer } from '../utils/model-viewer/index';
import { store } from '../store/index';
import { isElectronEnv } from '../utils/remote';
import { colored } from '../utils/color';
import { getBackgroundBoardClassName, getPixelData, max } from './utils';
import ItemDetailsEditor from './ItemDetailsEditor.vue';

type PixelData = {
	width: number;
	height: number;
	colors: string[];
};

type PreviewGroup = {
	search: string;
	namespace: string;
	items: {
		parsed_data: ParsedItemAdderItemData;
		texture_image?: string;
		model_image?: string;
	}[];
};

const props = defineProps<{
	data: WorkspaceOptions;
}>();

const dom = document;

const state = reactive({
	loading: false,
	folders: [] as Folder[],
	current_folder: undefined as Folder | undefined,
	current_preview_group: [] as PreviewGroup[],
	current_items_adder_data_list: [] as ItemsAdderData[],
	// 当前鼠标悬浮的像素数据
	current_pixel_data: undefined as PixelData | undefined,
	// 当前选择的数据
	current_selected: {
		modal_visible: false,
		parsed_data: undefined as ParsedItemAdderItemData | undefined
	},
	workspace_files_loading: !!isElectronEnv()
});

/**
 * 工作区
 */
const workspace = new Workspace(props.data.name, props.data.files, store.setting.workspace);
workspace.onFilesLoadingFinish = () => {
	state.workspace_files_loading = false;
};
console.log('workspace', workspace);

/**
 * 预览器
 */
const previewer = new Previewer();

/**
 * 预览渲染器
 */
const preview_renderer = new McModelRenderer({
	width: store.setting.preview_render.width,
	height: store.setting.preview_render.height,
	controls: { autoRotate: true }
});

onMounted(async () => {
	state.folders = workspace.getFolders();
	console.log('folders', state.folders);
});

onDeactivated(() => {
	// 销毁全部渲染器
	previewer.dispose();
	preview_renderer.renderer.dispose();
});

/**
 * 显示文件夹内容
 */
async function showFolderContent(name: string) {
	state.current_folder = state.folders.find((f) => f.name === name);
	if (state.current_folder) {
		if (state.current_folder.configs) {
			state.current_items_adder_data_list =
				state.current_folder.configs.map((c) => state.current_folder?.getItemsAdderData(c) || []).flat() || [];

			if (state.current_items_adder_data_list.length <= 0) {
				state.current_preview_group = [];
				return;
			}

			state.loading = true;

			// 重置预览图
			state.current_preview_group = [];

			const namespaces = Array.from(new Set(state.current_items_adder_data_list.map((item) => item.namespace)));

			for (const namespace of namespaces) {
				const group: PreviewGroup = {
					namespace,
					search: '',
					items: []
				};

				await Promise.all(
					state.current_items_adder_data_list.map(async (data) => {
						const data_list: ParsedItemAdderItemData[] = [];
						for (const key in data.items) {
							if (Object.prototype.hasOwnProperty.call(data.items, key)) {
								const element = data.items[key];
								data_list.push(element);
							}
						}

						await Promise.all(
							data_list.map(async (element) => {
								try {
									const image = await previewer.getDataURL(element);

									if (element.model?.content) {
										group.items.push({
											parsed_data: element,
											model_image: image
										});
									} else if (element.textures?.length) {
										group.items.push({
											parsed_data: element,
											texture_image: image
										});
									}
								} catch (err) {
									console.error(err);
								}
							})
						);
					})
				);

				state.current_preview_group.push(group);
			}

			state.loading = false;
		}
	}
}
</script>

<style scoped lang="less">
.workspace {
	min-width: 800px;

	:deep(.arco-collapse-item-content) {
		background-color: white !important;
		margin: 0;
		padding: 0;
	}
}

.folder {
	padding: 2px 0px 2px 4px;
	display: flex;
	align-items: center;
	cursor: pointer;
	&:hover {
		background: #f9f9f9;
	}

	&.current {
		background: #1890ff1a;
	}
}

.item-list {
	display: grid;
	grid-template-columns: repeat(auto-fill, 128px);
	gap: 4px;

	.texture-image-container {
		&:hover {
			background: #fafafa;
		}
	}
}
.background-board-1 {
	background-color: #e1e1e1c6;
}
.background-board-2 {
	background-color: #d8d8d8cf;
}

.current-image-previewer {
	background: #fafafa;
	border: 1px solid #f5f5f5;
	z-index: 999;
	bottom: 0;
	left: 0;
}
</style>
