<template>
	<div
		style="overflow: hidden"
		class="render-page"
	>
		<div
			v-if="renderItemRef"
			class="menu-bar"
			style="min-width: 700px; overflow: hidden; position: absolute"
		>
			<a-row>
				<a-col flex="auto">
					<RenderMenu
						:render-item="renderItemRef"
						:mc-model-renderer="modelRenderer"
					>
						<template #prepend-actions>
							<template v-if="renderItemRef.data.texture">
								<a-switch
									v-model="state.show_pixel_border"
									checked-text="显示边框"
									unchecked-text="显示边框"
								></a-switch>

								<a-divider
									direction="vertical"
									style="margin: 0 4px"
								/>
							</template>
						</template>
					</RenderMenu>
				</a-col>

				<a-col
					flex="100px"
					style="height: 32px"
					class="flex items-center justify-center"
				>
					<a-button
						size="mini"
						@click="showDetails"
					>
						详情信息 <IconDown />
					</a-button>
				</a-col>
				<a-col
					v-if="renderItemRef.data.model_json"
					flex="100px"
					style="height: 32px"
					class="flex items-center justify-center"
				>
					<a-button
						size="mini"
						@click="showModelGuide"
					>
						操作教程 <IconQuestionCircle />
					</a-button>
				</a-col>
			</a-row>
		</div>
		<div class="render-container">
			<div
				ref="modelRenderSlotRef"
				class="model-render-slot"
				@contextmenu="oncModelContextmenu"
			></div>

			<div
				v-if="pixelImageDataURL"
				ref="pixelRenderSlotRef"
				class="h-full"
				@click="state.current_select_color = ''"
			>
				<PixelImage
					:image-data-url="pixelImageDataURL"
					:show-pixel-border="state.show_pixel_border"
					:width="state.pixel_width"
					@select-color="(color) => (state.current_select_color = color)"
				></PixelImage>
			</div>
		</div>
		<div class="details-modal">
			<div
				v-if="state.current_select_color"
				class="p-1"
				style="color: #b3b1b1"
			>
				<div>
					<div>rgba : {{ state.current_select_color }}</div>
					<div>hex : {{ rgbaToHex(state.current_select_color) }}</div>
				</div>
			</div>

			<div
				v-if="state.modelGuideModalVisible"
				class="p-1"
				style="color: #b3b1b1"
			>
				<div>右键拖动： 旋转物体</div>
				<div>右键拖动： 移动相机视角</div>
				<div>滚轮： 缩放物体</div>
			</div>

			<div
				v-if="state.detailsModalVisible && renderItemRef"
				class="p-1"
			>
				<ItemsAdderDetails :render-item="renderItemRef" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { AssetFolder } from '@/utils/core/workspace';
import { ItemsAdderFolderRenderer } from '@/utils/core/items.adder.model.renderer';
import { store } from '@/store';
import { ipcRenderer } from 'electron';
import { RenderItem } from '@/utils/core/renderer';
import { McModelRenderer } from '@/utils/model-viewer';
import { reactive, ref, h } from 'vue';
import RenderMenu from './RenderMenu.vue';
import throttle from 'lodash/throttle';
import PixelImage from './PixelImage.vue';
import ItemsAdderDetails from './ItemsAdderDetails.vue';

const modelRenderSlotRef = ref<HTMLElement>();
const pixelRenderSlotRef = ref<HTMLElement>();
const renderItemRef = ref<RenderItem>();

const pixelImageDataURL = ref<string>();

const state = reactive({
	show_pixel_border: true,
	pixel_width: 256,
	current_select_color: '',
	detailsModalVisible: false,
	modelGuideModalVisible: false
});

const modelRenderer = new McModelRenderer({
	width: window.document.documentElement.clientWidth,
	height: window.document.documentElement.clientHeight - 40
});

ipcRenderer.on('args', async (e, { render_item: _render_item, asset_folder }) => {
	const render_item = _render_item as RenderItem;

	if (render_item && asset_folder) {
		renderItemRef.value = render_item;

		window.document.title += ' - ' + render_item.parents.join('/') + '/' + render_item.displayname;

		if (render_item.data.model_json) {
			const folder = store.asset_folders.find((f) => f.name === asset_folder);
			if (folder) {
				const assetFolder = await AssetFolder.deserialize(folder);

				const renderer = new ItemsAdderFolderRenderer(assetFolder, modelRenderer);

				const el = await renderer.render(render_item);
				modelRenderSlotRef.value!.replaceChildren(el as Node);

				window.onresize = throttle(() => {
					if (modelRenderSlotRef.value) {
						modelRenderer.resize(
							Math.max(window.document.documentElement.clientWidth, 400),
							window.document.documentElement.clientHeight - 40
						);
					}
				}, 20);
			}
		} else {
			pixelImageDataURL.value = render_item.data.texture;

			state.pixel_width = Math.min(
				window.document.documentElement.clientWidth,
				window.document.documentElement.clientHeight - 40
			);
			window.addEventListener(
				'resize',
				throttle(() => {
					state.pixel_width = Math.min(
						window.document.documentElement.clientWidth,
						window.document.documentElement.clientHeight - 40
					);
				}, 20)
			);
		}
	}
});

function rgbaToHex(rgba: string) {
	const match = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/);
	if (!match) {
		return '';
	}

	const red = parseInt(match[1]).toString(16).padStart(2, '0');
	const green = parseInt(match[2]).toString(16).padStart(2, '0');
	const blue = parseInt(match[3]).toString(16).padStart(2, '0');
	const alpha = Math.round(parseInt(match[4])).toString(16).padStart(2, '0');
	return `#${red}${green}${blue}${alpha}`;
}

function showDetails() {
	state.detailsModalVisible = !state.detailsModalVisible;
}

function showModelGuide() {
	state.modelGuideModalVisible = !state.modelGuideModalVisible;
}

function oncModelContextmenu(e: Event) {
	// 阻止显示默认的菜单
	e.preventDefault();
	e.stopPropagation();
}
</script>

<style scoped lang="less">
.menu-bar {
	padding: 4px;
	background-color: #72748696;
	width: 100%;
}

.render-container {
	position: absolute;
	top: 40px;
	height: calc(100% - 40px);
	width: 100%;
}

.render-page {
	background: url('../../assets/img/render-bg.png');
	height: 100%;
	width: 100%;
}

.transparent-gird {
	background-color: rgba(76, 64, 64, 0);
}

.details-modal {
	position: absolute;
	left: 0px;
	top: 40px;
	background-color: #67616121;
	overflow: hidden;
	width: fit-content;
	height: fit-content;
}
</style>
