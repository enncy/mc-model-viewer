<!-- eslint-disable vue/no-v-html -->
<template>
	<div class="folder-render">
		<div class="folder-render-container">
			<template v-for="item of folderRenderInfo.items || []">
				<div
					class="cursor-pointer"
					@click="emits('render', item)"
				>
					<a-tooltip
						background-color="#00000000"
						position="bl"
					>
						<template #content>
							<div class="minecraft-lores-container">
								<div class="minecraft-lores">
									<template v-for="t of item.data.item_json.lore || [item.displayname]">
										<div v-html="colored(t)"></div>
									</template>

									<div style="font-size: 12px; color: gray">单击查看渲染-></div>
								</div>
							</div>
						</template>
						<a-row class="render-item">
							<a-col class="flex justify-center">
								<div
									style="min-width: 32px; min-height: 32px"
									class="flex justify-center items-center"
								>
									<img :src="item.screenshot" />
								</div>
							</a-col>
							<a-col class="text-center mt-1 displayname">
								<span v-html="colored(item.displayname)"></span>
							</a-col>
						</a-row>
					</a-tooltip>
				</div>
			</template>
		</div>
		<template v-if="folderRenderInfo.children.length">
			<a-card
				v-for="child of folderRenderInfo.children"
				:key="child.name"
				:title="child.name"
			>
				<div :class="child.name">
					<FolderRender
						:folder-render-info="child"
						@render="(item) => emits('render', item)"
					></FolderRender>
				</div>
			</a-card>
		</template>
	</div>
</template>

<script setup lang="ts">
import { FolderRenderInfo, RenderItem } from '@/utils/core/renderer';
import FolderRender from './FolderRender.vue';
import { colored } from '@/utils/color';

defineProps<{
	folderRenderInfo: FolderRenderInfo;
}>();

const emits = defineEmits<{
	(e: 'render', item: RenderItem): void;
}>();
</script>

<style scoped lang="less">
.folder-render-container {
	display: grid;
	grid-template-columns: repeat(auto-fill, 64px);
	gap: 8px;
}

.folder-render {
	:deep(.arco-card-body) {
		background-color: white !important;
		margin: 0;
		padding: 0;
	}
}

.items {
	:deep(.folder-render-container) {
		color: white;
		font-size: 12px;
		background-color: #c6c6c6;
		padding: 12px;
		gap: 0px;

		.render-item {
			img {
				max-width: 32px;
				max-height: 32px;
				overflow: hidden;
			}

			border-right: 2px solid #ffffff;
			border-bottom: 2px solid #ffffff;
			border-top: 2px solid #373737;
			border-left: 2px solid #373737;
			background-color: #8b8b8b;
			&:hover {
				background-color: #afafaf;
			}
		}
	}
}

.models {
	:deep(.folder-render-container) {
		grid-template-columns: repeat(auto-fill, 128px);
	}
}

.render-item {
	&:hover {
		background-color: #f8f8f8;
	}
}

// 只显示一行，超出省略号
.displayname {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
</style>
