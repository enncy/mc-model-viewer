<!-- eslint-disable vue/no-v-html -->
<template>
	<div class="folder-preview">
		<div
			class="folder-preview-container"
			:style="{
				gridTemplateColumns: `repeat(auto-fill, ${
					childName === 'items'
						? store.setting.folder_preview.item_default_size
						: store.setting.folder_preview.model_default_size
				}px)`
			}"
		>
			<template v-for="item of renderGroup.items || []">
				<div
					class="cursor-pointer preview-item"
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
						<a-row>
							<a-col class="flex justify-center">
								<div class="flex justify-center items-center">
									<img :src="item.screenshot" />
								</div>
							</a-col>
							<a-col
								v-if="store.setting.folder_preview.show_displayname"
								class="text-center mt-1 displayname"
							>
								<span v-html="colored(item.displayname)"></span>
							</a-col>
						</a-row>
					</a-tooltip>
				</div>
			</template>
		</div>
		<template v-if="renderGroup.children.length">
			<a-card
				v-for="child of renderGroup.children"
				:key="child.name"
				:title="child.name"
			>
				<div :class="child.name">
					<FolderPreview
						:child-name="child.name"
						:render-group="child"
						@render="(item) => emits('render', item)"
					></FolderPreview>
				</div>
			</a-card>
		</template>
	</div>
</template>

<script setup lang="ts">
import { RenderGroup, RenderItem } from '@/utils/core/renderer';
import FolderPreview from './FolderPreview.vue';
import { colored } from '@/utils/color';
import { store } from '@/store';

defineProps<{
	renderGroup: RenderGroup;
	childName?: string;
}>();

const emits = defineEmits<{
	(e: 'render', item: RenderItem): void;
}>();
</script>

<style scoped lang="less">
.folder-preview-container {
	display: grid;
	gap: 8px;
}

.folder-preview {
	:deep(.arco-card-body) {
		background-color: white !important;
		margin: 0;
		padding: 0;
	}
}

.items {
	:deep(.folder-preview-container) {
		color: white;
		font-size: 12px;
		background-color: #c6c6c6;
		padding: 12px;
		gap: 0px;

		.preview-item {
			img {
				overflow: hidden;
			}

			overflow: hidden;

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

.preview-item {
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
