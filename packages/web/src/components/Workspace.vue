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
							{{ store.setting.preview_render }}
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
									:class="'inline-block ' + getBackgroundBoardClassName(i)"
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
																state.current_selected.pixel_data = undefined;
																state.current_selected.modal_visible = true;
																renderDetailsModel();
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
															state.current_selected.pixel_data = await getPixelData(texture_image);
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
			:fullscreen="state.current_selected.setting.maximize"
			:mask-closable="false"
			@close="
				() => {
					state.current_selected.parsed_data = undefined;
					state.current_selected.pixel_data = undefined;
					details_renderer.removeAll();
					details_renderer.dispose();
					dom.querySelector('#model-canvas-details')?.replaceChildren();
				}
			"
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

			<div class="mb-2 flex justify-end border-b pb-1">
				<div
					v-for="file of [
						state.current_selected.parsed_data?.model || state.current_selected.parsed_data?.textures?.[0]
					]"
				>
					<a-space v-if="file">
						<a-space size="mini">
							<span>背景：</span>
							<a-select
								v-model="state.current_selected.setting.background"
								size="mini"
								:options="[
									{ label: '透明', value: 'transparent' },
									{ label: '白色', value: 'white' }
								]"
								@change="(background) => details_renderer.setBackGroundColor(background.toString( ) as any)"
							>
							</a-select>
						</a-space>
						<a-switch
							v-model="state.current_selected.setting.show_grid"
							unchecked-text="显示网格"
							checked-text="显示网格"
							@change="(show) => (show ? details_renderer.showGridHelper() : details_renderer.hideGridHelper())"
						>
						</a-switch>

						<a-switch
							v-model="state.current_selected.setting.show_axes"
							unchecked-text="显示坐标轴"
							checked-text="显示坐标轴"
							@change="(show) => (show ? details_renderer.showAxesHelper() : details_renderer.hideAxesHelper())"
						>
						</a-switch>

						<a-divider direction="vertical" />

						<template v-if="file.path">
							<a-tooltip content="在文件夹中显示此文件">
								<a-button
									class="action-btn-folder"
									shape="circle"
									@click="
										() => requireElectronContext(({ remote }) => file.path && remote.shell.showItemInFolder(file.path))
									"
								>
									<IconFolder />
								</a-button>
							</a-tooltip>
							<a-tooltip content="使用 BlockBench 打开此文件">
								<a-button
									class="action-btn-blockbench"
									shape="circle"
									@click="openFileInBlockBench(file)"
								>
									BB
								</a-button>
							</a-tooltip>
						</template>

						<a-tooltip content="保存截图到剪贴板">
							<a-button
								shape="circle"
								@click="modelScreenshot"
							>
								<IconCamera />
							</a-button>
						</a-tooltip>
						<a-tooltip content="保存截图至本地">
							<a-button
								shape="circle"
								@click="saveModelScreenshot"
							>
								<IconDownload />
							</a-button>
						</a-tooltip>
						<a-tooltip :content="state.current_selected.setting.maximize ? '缩小' : '放大'">
							<a-button
								shape="circle"
								@click="toggleSize"
							>
								<IconShrink v-if="state.current_selected.setting.maximize" />
								<IconExpand v-else />
							</a-button>
						</a-tooltip>
					</a-space>
				</div>
			</div>

			<div>
				<!-- 模型预览 -->
				<div id="model-canvas-details"></div>
				<!-- 材质预览 -->
				<div
					v-if="state.current_selected.pixel_data"
					class="texture-image-details text-center flex flex-wrap"
					:style="{
						width: store.setting.details_render.width + 'px',
						height: store.setting.details_render.height + 'px'
					}"
				>
					<span
						v-for="(color, i) of state.current_selected.pixel_data.colors || []"
						:key="i"
						:style="{
							backgroundColor: color === 'transparent' ? undefined : color,
							width: store.setting.details_render.width / (state.current_selected.pixel_data.width || 0) + 'px',
							height: store.setting.details_render.height / (state.current_selected.pixel_data.height || 0) + 'px'
						}"
						:class="'inline-block ' + getBackgroundBoardClassName(i)"
						style="border-right: 1px solid #f5f5f5; border-bottom: 1px solid #f5f5f5"
					></span>
				</div>
			</div>

			<div class="details-info text-slate-500 text-xs mt-2">
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

			<div class="text-xs text-start w-full">
				<a-row>
					<a-col flex="42px">描述：</a-col>
					<a-col
						flex="auto"
						class="minecraft-lores"
					>
						<div v-for="item of [...(state.current_selected.parsed_data?.item_config.lore || ['无描述'])]">
							<div
								class="minecraft-lore"
								v-html="colored(item)"
							></div>
						</div>
					</a-col>
				</a-row>
			</div>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { Workspace, WorkspaceOptions, Folder } from '../utils/workspace';
import { onMounted, reactive, nextTick, ref, onDeactivated } from 'vue';
import { ItemsAdderData, ParsedItemAdderItemData, WorkspaceFile } from '../utils/interface';
import { Previewer } from '../utils/previewer';
import { renderParsedModel } from '../utils/model-viewer/utils';
import { McModelRenderer } from '../utils/model-viewer/index';
import { store } from '../store/index';
import { isElectronEnv, requireElectronContext, runIn } from '../utils/remote';
import { Message } from '@arco-design/web-vue';
import { colored } from '../utils/color';

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
		setting: {
			background: 'transparent',
			show_grid: true,
			show_axes: true,
			maximize: false
		},
		pixel_data: undefined as PixelData | undefined,
		parsed_data: undefined as ParsedItemAdderItemData | undefined
	},
	workspace_files_loading: !!isElectronEnv(),
	is_in_electron_env: isElectronEnv(),
	temp_setting: {
		details_render: {
			width: store.setting.details_render.width,
			height: store.setting.details_render.height
		}
	}
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
/**
 * 自定义 MC 模型渲染器
 */
let details_renderer = new McModelRenderer({
	width: store.setting.details_render.width,
	height: store.setting.details_render.height
});

onMounted(async () => {
	state.folders = workspace.getFolders();
});

onDeactivated(() => {
	// 销毁全部渲染器
	previewer.dispose();
	preview_renderer.renderer.dispose();
	details_renderer.renderer.dispose();
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
						if (r === 0 && g === 0 && b === 0 && a === 0) {
							colors.push('transparent');
						} else {
							colors.push(`rgba(${r}, ${g}, ${b}, ${a})`);
						}
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

async function renderDetailsModel() {
	if (state.current_selected.parsed_data?.model && details_renderer) {
		details_renderer.removeAll();
		details_renderer.dispose();
		console.log({
			width: state.temp_setting.details_render.width,
			height: state.temp_setting.details_render.height
		});

		details_renderer = new McModelRenderer({
			width: state.temp_setting.details_render.width,
			height: state.temp_setting.details_render.height
		});
		await renderParsedModel(details_renderer, state.current_selected.parsed_data.model, {
			auto_camera: true,
			show_grid: true,
			show_axes: true
		});

		const details = document.querySelector('#model-canvas-details');
		if (details) {
			details.replaceChildren(details_renderer.renderer.domElement);
		}
	}
}

/**
 *
 * 获取绘制材质背景板的背景类名
 */
function getBackgroundBoardClassName(board_index: number) {
	if (state.current_selected.pixel_data) {
		// 当前的行数 = 当前像素点索引 / 图片宽度 并取整
		const row = Math.floor(board_index / state.current_selected.pixel_data.width);
		// 是否为偶数列
		const is_even_column = board_index % 2 === 0;

		return row % 2 === 0
			? is_even_column
				? 'background-board-1'
				: 'background-board-2'
			: is_even_column
			? 'background-board-2'
			: 'background-board-1';
	}
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

function max(str: string, len = 5) {
	return str.length > len ? str.substring(0, len) + '...' : str;
}

function openFileInBlockBench(file: WorkspaceFile) {
	requireElectronContext(({ child_process }) => {
		const cmd = `${store.setting.blockbench_path} "${file.path}"`;
		if (file.path) {
			console.log('cmd', cmd);

			child_process.exec(cmd);
		}
	});
}

/**
 * 将当前渲染器的画面截图到剪贴板中
 */
function modelScreenshot() {
	runIn({
		electron({ remote }) {
			const data = details_renderer.renderer.domElement.toDataURL();
			if (!data) {
				return Message.error('截图失败: 数据无法获取');
			}
			remote.clipboard.writeImage(remote.nativeImage.createFromDataURL(data));
			Message.success({ content: '保存截图成功 ，可以使用 ctrl + v 快捷粘贴到QQ/微信 ', duration: 10 });
		},
		web() {
			details_renderer.renderer.domElement.toBlob((blob) => {
				if (!blob) {
					return Message.error('截图失败: 数据无法获取');
				}
				navigator.clipboard
					.write([
						new ClipboardItem({
							'image/png': blob
						})
					])
					.then(() => {
						Message.success('截图成功');
					})
					.catch((err) => {
						Message.error('写入剪切板时出错: ' + String(err));
					});
			});
		}
	});
}

function saveModelScreenshot() {
	const data = details_renderer.renderer.domElement.toDataURL();
	if (!data) {
		return Message.error('截图失败');
	}

	runIn({
		electron({ remote, fs }) {
			remote.dialog
				.showSaveDialog({
					title: '保存截图',
					defaultPath:
						remote.app.getPath('pictures') +
						'/' +
						(state.current_selected.parsed_data?.item_config.display_name || 'image') +
						'.png'
				})
				.then((res) => {
					if (!res.canceled && res.filePath) {
						const base64Data = data.replace(/^data:image\/png;base64,/, '');
						fs.writeFile(res.filePath, base64Data, 'base64', (err) => {
							if (err) {
								Message.error('保存失败');
							} else {
								Message.success('保存成功');
							}
						});
					}
				});
		},
		web() {
			const a = document.createElement('a');
			a.href = data;
			a.download = (state.current_selected.parsed_data?.item_config.display_name || 'image') + '.png';
			a.click();
		}
	});
}

async function toggleSize() {
	state.current_selected.setting.maximize = !state.current_selected.setting.maximize;

	if (state.current_selected.setting.maximize) {
		state.temp_setting.details_render.width = window.innerWidth * 0.8;
		state.temp_setting.details_render.height = window.innerHeight * 0.8;
	} else {
		state.temp_setting.details_render.width = store.setting.details_render.width;
		state.temp_setting.details_render.height = store.setting.details_render.height;
	}

	const texture = state.current_selected.parsed_data?.textures?.[0].base64;
	const model = state.current_selected.parsed_data?.model;

	// 重新渲染模型
	if (model) {
		renderDetailsModel();
	} else if (texture) {
		state.current_selected.pixel_data = await getPixelData(texture);
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
#model-canvas-details {
	background: #fafafa;
	display: flex;
	justify-content: center;
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

.action-btn-folder {
	color: #ffb218df !important;
	background-color: #ffb2181c !important;
	border-color: #ffb2181c !important;
}

.action-btn-blockbench {
	color: #188fffc9 !important;
	background-color: #1890ff1a !important;
	border-color: #1890ff1a !important;
}

.minecraft-lores {
	margin-top: 4px;
	border: 4px solid #4d106a;
	border-radius: 8px;
	padding: 12px;
	line-height: 24px;
	background-color: #100116;
	color: #dbdbdb;
}
</style>
