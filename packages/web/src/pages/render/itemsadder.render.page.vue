<template>
	<div
		style="overflow: hidden"
		class="render-page"
	>
		<a-row
			v-if="renderItemRef"
			style="min-width: 600px"
			class="menu-bar"
		>
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
		<div>
			<div
				ref="modelRenderSlotRef"
				class="model-render-slot"
				@contextmenu="oncModelContextmenu"
			></div>

			<div
				ref="pixelRenderSlotRef"
				class="pixel-render-slot"
				@click="state.current_select_color = ''"
			>
				<div
					v-if="pixel_data"
					:style="{
						width: currentPixelWidth + 'px',
						height: currentPixelWidth + 'px'
					}"
					style="line-height: 0px"
				>
					<span
						v-for="(color, i) of pixel_data.colors || []"
						:key="i"
						:style="{
							backgroundColor: color === 'transparent' ? undefined : color,
							width: currentPixelWidth / (pixel_data.width || 0) + 'px',
							height: currentPixelWidth / (pixel_data.height || 0) + 'px',
							borderRight: state.show_pixel_border ? '1px solid #525252' : undefined,
							borderBottom: state.show_pixel_border ? '1px solid #525252' : undefined,
							borderTop: state.show_pixel_border
								? parseInt(String(i / pixel_data.width)) === 0
									? '1px solid #525252'
									: undefined
								: undefined,
							borderLeft: state.show_pixel_border
								? i % pixel_data.width === 0
									? '1px solid #525252'
									: undefined
								: undefined
						}"
						:class="(color === 'transparent' ? 'transparent-gird' : '') + ' inline-block pixel-item'"
						title="点击显示颜色"
						@click.stop="state.current_select_color = color === 'transparent' ? 'rgba(0,0,0,0)' : color"
					></span>
				</div>
			</div>
		</div>

		<div class="details-modal text-white">
			<div
				v-if="state.current_select_color"
				class="p-2"
			>
				<div>
					<div>rgba : {{ state.current_select_color }}</div>
					<div>hex : {{ rgbaToHex(state.current_select_color) }}</div>
				</div>
			</div>

			<div
				v-if="state.modelGuideModalVisible"
				class="p-2"
			>
				<div>右键拖动： 旋转物体</div>
				<div>右键拖动： 移动相机视角</div>
				<div>滚轮： 缩放物体</div>
			</div>

			<div
				v-if="state.detailsModalVisible"
				class="p-2"
			>
				<div>名称：{{ renderItemRef?.displayname }}</div>
				<div>路径：{{ '/' + renderItemRef?.parents.join('/') }}</div>
				<div>文件路径：{{ renderItemRef?.filename }}</div>
				<div>配置文件：{{ renderItemRef?.data.config_filepath }}</div>

				<div v-if="renderItemRef?.data.model_json">
					<!-- 使用循环只是为了减少调用链长度 -->
					<template v-for="item_json of renderItemRef?.data.item_json ? [renderItemRef?.data.item_json] : []">
						物品信息：
						<ul style="padding-left: 20px">
							<li>是否启用：{{ item_json.enabled }}</li>
							<li v-if="item_json.behaviours.furniture_sit">
								坐骑高度：{{ item_json.behaviours.furniture_sit.sit_height }}
							</li>
							<li>光亮等级：{{ item_json.behaviours.furniture.light_level }}</li>
							<li>
								放置类型：{{
									Object.keys(item_json.behaviours.furniture.placeable_on)
										.filter((k) => item_json.behaviours.furniture.placeable_on[k])
										.join(' , ')
								}}
							</li>
							<li v-if="item_json.behaviours.furniture.hitbox">
								hitbox：{{ JSON.stringify(item_json.behaviours.furniture.hitbox) }}
							</li>
						</ul>
					</template>
				</div>
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
import { reactive, ref } from 'vue';
import RenderMenu from './RenderMenu.vue';
import { getPixelData } from '@/components/utils';
import { PixelData } from '@/components/interface';
import throttle from 'lodash/throttle';

const modelRenderSlotRef = ref<HTMLElement>();
const pixelRenderSlotRef = ref<HTMLElement>();
const renderItemRef = ref<RenderItem>();

const pixel_data = ref<PixelData>();

const currentPixelWidth = ref(getPixelWidth());

const state = reactive({
	show_pixel_border: false,
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

				// modelRenderer.setBackGroundColor('white');

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
			getPixelData(render_item.data.texture).then((pixelData) => {
				pixel_data.value = pixelData;
			});

			const pixelElResize = throttle(() => {
				if (pixelRenderSlotRef.value) {
					currentPixelWidth.value = getPixelWidth();
					pixelRenderSlotRef.value.style.width = window.document.documentElement.clientWidth + 'px';
					pixelRenderSlotRef.value.style.height = window.document.documentElement.clientHeight - 40 + 'px';
				}
			}, 20);

			pixelElResize();
			window.onresize = pixelElResize;
		}
	}
});

function getPixelWidth() {
	return Math.min(window.document.documentElement.clientWidth, window.document.documentElement.clientHeight) - 100;
}

function rgbaToHex(rgba: string) {
	const match = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/);
	if (!match) {
		return '';
	}

	const red = parseInt(match[1]).toString(16).padStart(2, '0');
	const green = parseInt(match[2]).toString(16).padStart(2, '0');
	const blue = parseInt(match[3]).toString(16).padStart(2, '0');
	const alpha = Math.round(parseInt(match[4])).toString(16).padStart(2, '0');
	console.log(red, green, blue, alpha);

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
	min-width: 600px;
	padding: 4px;
	background-color: #72748696;
}

.render-layout {
	display: grid;
	grid-template-rows: 40px calc(100% - 40px);
	height: 100%;
}

.render-page {
	background: url('../../assets/img/render-bg.png');
}

.pixel-render-slot {
	display: flex;
	justify-content: center;
	align-content: center;
	flex-wrap: wrap;
}

.transparent-gird {
	background-color: rgba(76, 64, 64, 0);
}

.pixel-item {
	cursor: pointer;
	&:hover {
		border: 1px solid #188fffb2 !important;
	}
}

.color-panel {
	position: absolute;
	left: 0px;
	top: 40px;
	background-color: rgba(103, 103, 103, 0.535);
}

.details-modal {
	position: absolute;
	left: 0px;
	top: 40px;
	background-color: rgba(103, 103, 103, 0.535);
	overflow: hidden;
}
</style>
