<!-- eslint-disable vue/no-v-html -->
<template>
	<a-row
		style="flex-wrap: nowrap"
		:style="{ minWidth: temp_setting.details_render.width + 'px' }"
	>
		<a-col :flex="temp_setting.details_render.width">
			<div class="mb-2 flex justify-end border-b pb-1">
				<div v-for="file of [parsedData.model || parsedData.textures?.[0]]">
					<a-space v-if="file">
						<a-space size="mini">
							<span>背景：</span>
							<a-select
								v-model="setting.background"
								size="mini"
								:options="[
									{ label: '透明', value: 'transparent' },
									{ label: '白色', value: 'white' }
								]"
								@change="(background) => {
                                    details_renderer.setBackGroundColor(background.toString( ) as any) 
                                }"
							>
							</a-select>
						</a-space>
						<a-switch
							v-model="setting.show_grid"
							unchecked-text="显示网格"
							checked-text="显示网格"
							@change="
								(show) => {
									show ? details_renderer.showGridHelper() : details_renderer.hideGridHelper();
								}
							"
						>
						</a-switch>

						<a-switch
							v-model="setting.show_axes"
							unchecked-text="显示坐标轴"
							checked-text="显示坐标轴"
							@change="
								(show) => {
									show ? details_renderer.showAxesHelper() : details_renderer.hideAxesHelper();
								}
							"
						>
						</a-switch>

						<a-divider direction="vertical" />

						<a-tooltip content="在文件夹中显示此文件">
							<a-button
								class="action-btn-folder"
								shape="circle"
								@click="
									() => requireElectronContext(({ remote }) => file.path && remote.shell.showItemInFolder(file.path))
								"
							>
								<IconFolder style="font-size: 18px" />
							</a-button>
						</a-tooltip>

						<a-tooltip content="使用 BlockBench 打开此模型">
							<a-button
								class="action-btn-blockbench"
								shape="circle"
								@click="openFileInBlockBench(file)"
							>
								<img
									src="../assets/img/blockbench-icon.png"
									style="width: 20px"
								/>
							</a-button>
						</a-tooltip>

						<a-tooltip content="使用 Vscode 打开此配置文件">
							<a-button
								class="action-btn-vscode"
								shape="circle"
								@click="openFileInVscode()"
							>
								<img
									src="../assets/img/vscode-icon.png"
									style="width: 18px"
								/>
							</a-button>
						</a-tooltip>

						<a-divider direction="vertical" />

						<a-tooltip content="保存截图到剪贴板">
							<a-button
								shape="circle"
								@click="modelScreenshot"
							>
								<IconCamera style="font-size: 18px" />
							</a-button>
						</a-tooltip>
						<a-tooltip content="保存截图至本地">
							<a-button
								shape="circle"
								@click="saveModelScreenshot"
							>
								<IconDownload style="font-size: 18px" />
							</a-button>
						</a-tooltip>
						<a-tooltip :content="setting.maximize ? '缩小' : '放大'">
							<a-button
								shape="circle"
								@click="toggleSize"
							>
								<IconShrink
									v-if="setting.maximize"
									style="font-size: 18px"
								/>
								<IconExpand
									v-else
									style="font-size: 18px"
								/>
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
					v-if="state.pixel_data"
					class="texture-image-details text-center flex flex-wrap"
					:style="{
						width: store.setting.details_render.width + 'px',
						height: store.setting.details_render.height + 'px'
					}"
				>
					<span
						v-for="(color, i) of state.pixel_data.colors || []"
						:key="i"
						:style="{
							backgroundColor: color === 'transparent' ? undefined : color,
							width: store.setting.details_render.width / (state.pixel_data.width || 0) + 'px',
							height: store.setting.details_render.height / (state.pixel_data.height || 0) + 'px'
						}"
						:class="'inline-block ' + getBackgroundBoardClassName(state.pixel_data, i)"
						style="border-right: 1px solid #f5f5f5; border-bottom: 1px solid #f5f5f5"
					></span>
				</div>
			</div>

			<div class="details-info text-slate-500 text-xs mt-2">
				<!-- 使用单循环减少变量代码长度 -->
				<template
					v-for="(file, index) of [parsedData.model || parsedData.textures?.[0]]"
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

			<div class="text-start w-full">
				<a-row>
					<a-col
						flex="42px"
						class="text-xs"
						>描述：</a-col
					>
					<a-col
						flex="auto"
						class="minecraft-lores"
					>
						<div v-for="item of [...(parsedData.item_config.lore || ['无描述'])]">
							<div
								class="minecraft-lore"
								v-html="colored(item)"
							></div>
						</div>
					</a-col>
				</a-row>
			</div>
		</a-col>
	</a-row>
</template>

<script setup lang="ts">
import { store } from '@/store';
import { colored } from '@/utils/color';
import { ParsedItemAdderItemData } from '@/utils/interface';
import { PixelData } from './interface';
import { McModelRenderer } from '../utils/model-viewer/index';
import { reactive, onDeactivated, onMounted } from 'vue';
import { requireElectronContext, runIn, isElectronEnv } from '../utils/remote';
import { WorkspaceFile } from '../utils/interface';
import { Message } from '@arco-design/web-vue';
import { renderParsedModel } from '@/utils/model-viewer/utils';
import { getPixelData, getBackgroundBoardClassName, size } from './utils';
import AutoFormItem from '@/components/AutoFormItem.vue';
import merge from 'lodash/merge';

const props = defineProps<{
	parsedData: ParsedItemAdderItemData;
}>();

const emits = defineEmits<{
	(e: 'update:parsedData', data: ParsedItemAdderItemData): void;
}>();

const state = reactive({
	pixel_data: undefined as PixelData | undefined,
	is_in_electron_env: isElectronEnv()
});

const setting = reactive({
	background: 'transparent',
	show_grid: true,
	show_axes: true,
	maximize: false
});

const temp_setting = reactive({
	details_render: {
		width: store.setting.details_render.width,
		height: store.setting.details_render.height
	}
});

/**
 * 自定义 MC 模型渲染器
 */
let details_renderer = new McModelRenderer({
	width: store.setting.details_render.width,
	height: store.setting.details_render.height
});

onMounted(async () => {
	const texture = props.parsedData.textures?.[0].base64;
	if (props.parsedData.model) {
		renderDetailsModel();
	} else if (texture) {
		state.pixel_data = await getPixelData(texture);
	}
});

onDeactivated(() => {
	document.querySelector('#model-canvas-details')?.replaceChildren();

	// 销毁全部渲染器
	details_renderer.removeAll();
	details_renderer.renderer.dispose();
});

function openFileInBlockBench(file: WorkspaceFile) {
	requireElectronContext(({ child_process }) => {
		if (file.path) {
			const cmd = `"${store.setting.blockbench_path}" "${file.path}"`;
			console.log('cmd', cmd);
			child_process.exec(cmd);
		}
	});
}

function openFileInVscode() {
	requireElectronContext(({ child_process }) => {
		if (props.parsedData.config_file.path) {
			const cmd = `"${store.setting.vscode_path}" "${props.parsedData.config_file.path}"`;
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
						remote.app.getPath('pictures') + '/' + (props.parsedData.item_config.display_name || 'image') + '.png'
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
			a.download = (props.parsedData.item_config.display_name || 'image') + '.png';
			a.click();
		}
	});
}

async function toggleSize() {
	setting.maximize = !setting.maximize;

	if (setting.maximize) {
		temp_setting.details_render.width = window.innerWidth * 0.6;
		temp_setting.details_render.height = window.innerHeight * 0.6;
	} else {
		temp_setting.details_render.width = store.setting.details_render.width;
		temp_setting.details_render.height = store.setting.details_render.height;
	}

	const texture = props.parsedData.textures?.[0].base64;
	const model = props.parsedData.model;

	// 重新渲染模型
	if (model) {
		renderDetailsModel();
	} else if (texture) {
		state.pixel_data = await getPixelData(texture);
	}
}

async function renderDetailsModel() {
	if (props.parsedData.model && details_renderer) {
		details_renderer.removeAll();
		details_renderer.dispose();

		details_renderer = new McModelRenderer({
			width: temp_setting.details_render.width,
			height: temp_setting.details_render.height
		});
		await renderParsedModel(details_renderer, props.parsedData.model, {
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
</script>

<style scoped lang="less">
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

.action-btn-folder {
	color: #ffb218df !important;
	background-color: #ffb2181c !important;
	border-color: #ffb2181c !important;
}

.action-btn-blockbench {
	color: #188fffc9 !important;
	background-color: #1e93d9 !important;
	border-color: #1890ff1a !important;
}

.action-btn-vscode {
	background-color: #0098ff !important;
	border-color: #188fffc9 !important;
}

.minecraft-lores {
	margin-top: 4px;
	border: 4px solid #4d106a;
	border-radius: 8px;
	padding: 12px;
	line-height: 24px;
	background-color: #100116;
	color: #dbdbdb;

	* {
		font-family: 'Minecraftia', sans-serif;
	}
}
</style>
