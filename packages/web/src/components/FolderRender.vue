<template>
	<div>
		<div class="folder-preview-container">
			<template v-for="item of folderRenderInfo.items || []">
				<div
					class="cursor-pointer"
					@click="emits('render', item)"
				>
					<a-row class="preview-item">
						<a-col class="flex justify-center">
							<img :src="item.screenshot" />
						</a-col>
						<a-col class="text-center">
							{{ item.displayname }}
						</a-col>
					</a-row>
				</div>
			</template>
		</div>
		<a-collapse
			v-if="folderRenderInfo.children.length"
			:default-active-key="folderRenderInfo.children.map((c) => c.name)"
		>
			<a-collapse-item
				v-for="child of folderRenderInfo.children"
				:key="child.name"
				:header="child.name"
			>
				<FolderRender
					:folder-render-info="child"
					@render="(item) => emits('render', item)"
				></FolderRender>
			</a-collapse-item>
		</a-collapse>
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
}
</style>
