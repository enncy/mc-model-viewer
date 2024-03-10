<template>
	<div
		ref="pixelRenderRef"
		class="pixel-render-slot"
		@click="state.selected_color = ''"
	>
		<div
			v-if="pixel_data"
			:style="{
				width: width + 'px',
				height: width + 'px'
			}"
			style="line-height: 0px; display: flex; flex-wrap: wrap"
		>
			<span
				v-for="(color, i) of pixel_data.colors || []"
				:key="i"
				:style="{
					backgroundColor: color === 'transparent' ? undefined : color,
					width: width / (pixel_data.width || 0) + 'px',
					height: width / (pixel_data.height || 0) + 'px',
					borderRight: showPixelBorder ? '1px solid #525252' : undefined,
					borderBottom: showPixelBorder ? '1px solid #525252' : undefined,
					borderTop: showPixelBorder
						? parseInt(String(i / pixel_data.width)) === 0
							? '1px solid #525252'
							: undefined
						: undefined,
					borderLeft: showPixelBorder ? (i % pixel_data.width === 0 ? '1px solid #525252' : undefined) : undefined
				}"
				:class="(color === 'transparent' ? 'transparent-gird' : '') + ' inline-block pixel-item'"
				title="点击显示颜色"
				@click.stop="
					() => {
						state.selected_color = color === 'transparent' ? 'rgba(0,0,0,0)' : color;
						emits('selectColor', state.selected_color);
					}
				"
			></span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { PixelData } from '@/components/interface';
import { getPixelData } from '@/components/utils';
import { onMounted, reactive, ref } from 'vue';

const props = defineProps<{
	imageDataUrl: string;
	showPixelBorder: boolean;
	width: number;
}>();

const emits = defineEmits<{
	(e: 'selectColor', rgba: string): void;
}>();

const pixel_data = ref<PixelData>();
const pixelRenderRef = ref<HTMLElement>();

const state = reactive({
	selected_color: ''
});

onMounted(() => {
	getPixelData(props.imageDataUrl).then((pixelData) => {
		pixel_data.value = pixelData;
	});
});
</script>

<style scoped lang="less">
.pixel-render-slot {
	display: flex;
	justify-content: center;
	align-content: center;
	flex-wrap: wrap;
	height: 100%;
}
.pixel-item {
	cursor: pointer;
	&:hover {
		border: 1px solid #188fffb2 !important;
	}
}
</style>
