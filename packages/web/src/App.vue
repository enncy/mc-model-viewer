<template>
	<div ref="renderContainer">
		<div
			ref="headerContainer"
			class="header-container"
		>
			<div class="header">Items-Adder-Preview</div>
		</div>
		<div class="body-container">
			<a-config-provider :locale="zhCN">
				<router-view v-slot="{ Component }">
					<keep-alive>
						<component :is="Component" />
					</keep-alive>
				</router-view>
			</a-config-provider>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue';
import { requireElectronContext, isElectronEnv } from './utils/remote';
import zhCN from '@arco-design/web-vue/es/locale/lang/zh-CN';

const headerContainer = ref<HTMLDivElement>();
const renderContainer = ref<HTMLDivElement>();

onMounted(() => {
	nextTick(() => {
		if (!headerContainer.value) {
			return;
		}

		if (isElectronEnv()) {
			requireElectronContext(({ remote }) => {
				if (remote.getCurrentWindow().isMenuBarVisible()) {
					if (!headerContainer.value) {
						return;
					}
					headerContainer.value.style.display = 'none';
					renderContainer.value?.classList.add('base-container');
				}
			});
		} else {
			headerContainer.value.style.display = 'flex';
			renderContainer.value?.classList.add('custom-title-container');
		}
	});
});

requireElectronContext(({ ipcRenderer, remote }) => {
	// 显示复制粘贴菜单栏
	window.addEventListener('contextmenu', (e) => {
		e.preventDefault();
		ipcRenderer.send('show-context-menu');
	});
	// 添加平台标识
	document.body.classList.add(`platform-${remote.process.platform}`);

	// windows 10 以下版本添加 window-frame 样式
	if (remote.process.platform === 'win32') {
		const release = getWindowsRelease();
		if (release !== 'win11') {
			document.documentElement.classList.add('window-frame');
		}
	}

	/** 获取 windows 版本号 */
	function getWindowsRelease() {
		const release = remote.process.getSystemVersion();
		if (release.startsWith('6.1')) {
			return 'win7';
		} else if (parseInt(release.split('.').at(-1) || '0') > 22000) {
			return 'win11';
		} else {
			return 'win10';
		}
	}
});
</script>

<style lang="less">
/** darwin 为 macos  */
body.platform-darwin {
	.header {
		margin-left: 124px;
	}
}

.header-container {
	// electron 可拖拽
	-webkit-app-region: drag;
	width: 100%;
	display: flex;
	align-items: center;
	/** 系统自带控件高度为 32 */
	height: 32px;
	cursor: default;
	border-bottom: 1px solid #f3f3f3;
	z-index: 999999;
	position: relative;
	background-color: white;

	.header {
		padding-left: 12px;
	}
}

.body-container {
	overflow: auto;
}
.base-container {
	display: grid;
	grid-template-rows: 100vh;
	grid-template-areas: 'body';
}

.custom-title-container {
	display: grid;
	grid-template-rows: 32px calc(100vh - 32px);
	grid-template-areas:
		'header'
		'body';
}
</style>
