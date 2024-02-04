<template>
	<a-row>
		<a-col :flex="flex || '128px'"> {{ label }} : </a-col>
		<a-col flex="auto">
			<slot></slot>
		</a-col>
	</a-row>
</template>

<script setup lang="ts">
defineProps<{
	label: string;
	flex?: string;
}>();
</script>

<style scoped lang="less"></style>
