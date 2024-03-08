<template>
	<div>
		<div class="folder-preview-container">
			<template v-for="item of folderRenderInfo.items || []">
				<div
					class="cursor-pointer"
					@click="emits('render', item)"
				>
					<a-row
						class="preview-item"
						title="点击渲染"
					>
						<a-col class="flex justify-center">
							<div
								style="min-width: 32px; min-height: 32px"
								class="flex justify-center items-center"
							>
								<img :src="item.screenshot" />
							</div>
						</a-col>
						<a-col class="text-center mt-1">
							{{ item.displayname }}
						</a-col>
					</a-row>
				</div>
			</template>
		</div>
		<template v-if="folderRenderInfo.children.length">
			<a-card
				v-for="child of folderRenderInfo.children"
				:key="child.name"
				:title="child.name"
			>
				<FolderRender
					:folder-render-info="child"
					@render="(item) => emits('render', item)"
				></FolderRender>
			</a-card>
		</template>
	</div>
</template>

<script setup lang="ts">
import { FolderRenderInfo, RenderItem } from '@/utils/core/renderer';
import FolderRender from './FolderRender.vue';

defineProps<{
	folderRenderInfo: FolderRenderInfo;
}>();

const emits = defineEmits<{
	(e: 'render', item: RenderItem): void;
}>();
</script>

<style scoped lang="less">
.folder-preview-container {
	display: grid;
	grid-template-columns: repeat(auto-fill, 128px);
	gap: 8px;

	:deep(.arco-card-body) {
		background-color: white !important;
		margin: 0;
		padding: 0;
	}
}

.preview-item {
	&:hover {
		background-color: #f8f8f8;
	}
}
</style>
