<template>
	<div class="flex items-center">
		<slot></slot>
		<a-tooltip content="仅在桌面软件中可以应用">
			<a-tag
				class="ms-2"
				color="blue"
				size="small"
			>
				软件
			</a-tag>
		</a-tooltip>
	</div>
</template>

<script setup lang="ts"></script>

<style scoped lang="less"></style>
