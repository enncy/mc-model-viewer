<template>
	<div class="workspace h-full">
		<a-row class="h-full flex-nowrap">
			<a-col
				flex="200px"
				class="h-full overflow-auto"
			>
				<template
					v-for="(folder, index) of state.folders"
					:key="index"
				>
					<div
						class="folder text-lg"
						:style="{
							cursor: state.loading ? 'progress' : 'pointer'
						}"
						@click="state.loading ? '' : setFolder(folder.name)"
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

					<template v-if="state.loading">
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
								:style="{ width: state.texture_image_size + 'px', height: state.texture_image_size + 'px' }"
							>
								<span
									v-for="(color, i) of state.current_pixel_data.colors || []"
									:key="i"
									:style="{
										backgroundColor: color,
										width: state.texture_image_size / (state.current_pixel_data.width || 0) + 'px',
										height: state.texture_image_size / (state.current_pixel_data.height || 0) + 'px'
									}"
									class="inline-block"
									style="border-right: 1px solid #f5f5f5; border-bottom: 1px solid #f5f5f5"
								></span>
							</div>
						</div>

						<a-collapse :default-active-key="state.current_preview_group.map((d) => d.namespace)">
							<a-collapse-item
								v-for="{ namespace, items } of state.current_preview_group"
								:key="namespace"
								:header="namespace"
							>
								<template v-if="state.current_preview_group.some((g) => g.items.length) === false">
									<a-empty />
								</template>
								<div
									v-else
									class="p-1"
								>
									<a-collapse :default-active-key="['材质', '模型']">
										<a-collapse-item
											v-if="items.some((i) => i.model_image)"
											key="模型"
											class="p-1"
											header="模型"
										>
											<div class="model-image-list">
												<template
													v-for="({ model_image, parsed_data }, index) of items"
													:key="index"
												>
													<template v-if="model_image">
														<div class="flex items-center">
															<div
																class="model-image-container cursor-pointer"
																@click="
																	async () => {
																		state.current_selected.parsed_data = parsed_data;
																		state.current_selected.pixel_data = undefined;
																		state.current_selected.modal_visible = true;
																		if (parsed_data.model && details_renderer) {
																			details_renderer.removeAll();
																			await renderParsedModel(details_renderer, parsed_data.model);
																			showModelCanvasDetails(details_renderer.renderer.domElement);
																		}
																	}
																"
																@mouseenter="
																	async () => {
																		if (parsed_data.model && preview_renderer) {
																			preview_renderer.removeAll();
																			await renderParsedModel(preview_renderer, parsed_data.model);
																			showModelCanvas(preview_renderer.renderer.domElement);
																		}
																	}
																"
																@mouseleave="
																	() => {
																		removeModelCanvas();
																	}
																"
															>
																<img :src="model_image" />
																<div class="text-slate-500 text-xs flex justify-center w-full mt-2">
																	{{ parsed_data.item_config.display_name }}
																</div>
															</div>
														</div>
													</template>
												</template>
											</div>
										</a-collapse-item>
										<a-collapse-item
											v-if="items.some((i) => i.texture_image)"
											key="材质"
											class="p-1"
											header="材质"
										>
											<div class="texture-image-list">
												<template
													v-for="({ texture_image, parsed_data }, index) of items"
													:key="index"
												>
													<template v-if="texture_image">
														<div
															class="flex items-center justify-center cursor-pointer texture-image-container"
															style="min-width: 64px; min-height: 64px"
															@click="
																async () => {
																	state.current_selected.pixel_data = await getPixelData(texture_image);
																	state.current_selected.parsed_data = parsed_data;
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
																<div class="text-slate-500 text-xs flex justify-center w-full mt-2">
																	{{ parsed_data.item_config.display_name }}
																</div>
															</div>
														</div>
													</template>
												</template>
											</div>
										</a-collapse-item>
									</a-collapse>
								</div>
							</a-collapse-item>
						</a-collapse>
					</div>
				</div>
			</a-col>
		</a-row>

		<a-modal
			v-model:visible="state.current_selected.modal_visible"
			:title="state.current_selected.parsed_data?.item_config.display_name"
			width="auto"
			:footer="false"
		>
			<div class="details-info text-slate-500 text-xs mb-2">
				<!-- 使用单循环减少变量代码长度 -->
				<template
					v-for="(file, index) of [
						state.current_selected.parsed_data?.model || state.current_selected.parsed_data?.textures?.[0]
					]"
					:key="index"
				>
					<div v-if="file">
						<a-space size="mini">
							<template #split>
								<a-divider
									direction="vertical"
									class="me-1 ms-1"
								/>
							</template>
							<span> 文件名：{{ file.name }} </span>
							<span> 更新于：{{ new Date(file.lastModified).toLocaleString() }} </span>
							<span> 大小：{{ size(file.size) }} </span>
						</a-space>

						<div>
							<span> 路径：{{ file.path || file.webkitRelativePath }} </span>
						</div>
					</div>
				</template>
			</div>
			<div class="current-image-details">
				<!-- 模型预览 -->
				<div id="model-canvas-details"></div>
				<!-- 材质预览 -->
				<div
					v-if="state.current_selected.pixel_data"
					class="text-center flex flex-wrap"
					:style="{ width: 600 + 'px', height: 600 + 'px' }"
				>
					<span
						v-for="(color, i) of state.current_selected.pixel_data.colors || []"
						:key="i"
						:style="{
							backgroundColor: color,
							width: 600 / (state.current_selected.pixel_data.width || 0) + 'px',
							height: 600 / (state.current_selected.pixel_data.height || 0) + 'px'
						}"
						class="inline-block"
						style="border-right: 1px solid #f5f5f5; border-bottom: 1px solid #f5f5f5"
					></span>
				</div>
			</div>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { Workspace, WorkspaceOptions, Folder } from '../utils/workspace';
import { onMounted, reactive, nextTick, ref } from 'vue';
import { ItemsAdderData, ParsedItemAdderItemData } from '../utils/interface';
import { Previewer } from '../utils/previewer';
import { renderParsedModel } from '../utils/model-viewer/utils';
import { McModelRenderer } from '../utils/model-viewer/index';

type PixelData = {
	width: number;
	height: number;
	colors: string[];
};

type PreviewGroup = {
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

/**
 * 工作区
 */
const workspace = new Workspace(props.data.name, props.data.files);
/**
 * 预览器
 */
const previewer = new Previewer();

let preview_renderer: McModelRenderer | undefined;

/**
 * MC 模型渲染器
 */
const details_renderer = new McModelRenderer({ width: 600, height: 600 });

const state = reactive({
	texture_image_size: 200,
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
		pixel_data: undefined as PixelData | undefined,
		parsed_data: undefined as ParsedItemAdderItemData | undefined
	}
});

onMounted(async () => {
	state.folders = workspace.getFolders();
	console.log('folders', state.folders);

	nextTick(async () => {
		preview_renderer = await previewer.waitForRenderer();
	});
});

async function setFolder(name: string) {
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

/**
 * 获取图片像素数据
 * @param textures
 */
function getPixelData(texture: string) {
	return new Promise<PixelData>((resolve, reject) => {
		const canvas = document.createElement('canvas');
		const img = new Image();

		img.src = texture;
		img.onload = async () => {
			try {
				canvas.getContext('2d')?.drawImage(img, 0, 0, img.width, img.height);

				// 遍历获取像素点
				const imageData = canvas.getContext('2d')?.getImageData(0, 0, img.width, img.height)?.data;
				if (imageData) {
					const colors = [];

					for (let i = 0; i < imageData.length; i += 4) {
						const r = imageData[i];
						const g = imageData[i + 1];
						const b = imageData[i + 2];
						const a = imageData[i + 3];
						colors.push(`rgba(${r}, ${g}, ${b}, ${a})`);
					}

					resolve({ width: img.width, height: img.height, colors: colors });
				}
			} catch (err) {
				console.error(err);
			}
		};
		img.onerror = console.error;
	});
}

function showModelCanvas(canvas: HTMLCanvasElement) {
	nextTick(() => {
		const preview = document.querySelector('#model-canvas-preview');
		if (preview) {
			preview.replaceChildren(canvas);
		}
	});
}

function showModelCanvasDetails(canvas: HTMLCanvasElement) {
	nextTick(() => {
		const details = document.querySelector('#model-canvas-details');

		if (details) {
			details.replaceChildren(canvas);
		}
	});
}

function removeModelCanvas() {
	nextTick(() => {
		const preview = document.querySelector('#model-canvas-preview');
		if (preview) {
			preview.replaceChildren();
		}
	});
}

function size(num: number) {
	const mapping = [
		['GB', Math.pow(1024, 3)],
		['MB', Math.pow(1024, 2)],
		['KB', Math.pow(1024, 1)],
		['B', 1]
	] as [string, number][];

	const index = mapping.map((i) => Math.floor(num / i[1])).findIndex((i) => i > 0);

	return (num / mapping[index][1]).toFixed(2) + ' ' + mapping[index][0];
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
}

.texture-image-list {
	display: grid;
	grid-template-columns: repeat(auto-fill, 64px);
	max-height: 800px;
	overflow: auto;

	.texture-image-container {
		&:hover {
			background: #fafafa;
		}
	}
}
.model-image-list {
	display: grid;
	grid-template-columns: repeat(auto-fill, 128px);
	max-height: 800px;
	overflow: auto;

	.model-image-container {
		&:hover {
			background: #fafafa;
		}
	}
}

.current-image-details {
	background: #fafafa;
}

.current-image-previewer {
	background: #fafafa;
	border: 1px solid #f5f5f5;
	z-index: 999;
	bottom: 0;
	left: 0;
}
</style>
