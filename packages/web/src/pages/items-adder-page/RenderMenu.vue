<template>
	<div>
		<a-space v-if="renderItem">
			<slot name="prepend-actions"></slot>

			<template v-if="renderItem.data.model_filepath">
				<a-switch
					v-model="setting.show_grid"
					unchecked-text="网格"
					checked-text="网格"
					@change="
						(show) => {
							show ? mcModelRenderer.showGridHelper() : mcModelRenderer.hideGridHelper();
						}
					"
				>
				</a-switch>

				<a-switch
					v-model="setting.show_axes"
					unchecked-text="坐标轴"
					checked-text="坐标轴"
					@change="
						(show) => {
							show ? mcModelRenderer.showAxesHelper() : mcModelRenderer.hideAxesHelper();
						}
					"
				>
				</a-switch>

				<a-divider
					direction="vertical"
					style="margin: 0 4px"
				/>
			</template>

			<a-tooltip content="刷新页面">
				<a-button
					shape="circle"
					@click="reload"
				>
					<IconSync style="font-size: 18px" />
				</a-button>
			</a-tooltip>

			<a-tooltip content="窗口置顶">
				<a-button
					shape="circle"
					:type="setting.alwayOnTop ? 'outline' : 'secondary'"
					@click="pin"
				>
					<IconPushpin style="font-size: 18px" />
				</a-button>
			</a-tooltip>

			<a-tooltip content="保存截图到剪贴板">
				<a-button
					shape="circle"
					@click="modelScreenshot"
				>
					<IconCamera style="font-size: 18px" />
				</a-button>
			</a-tooltip>

			<a-tooltip content="保存截图至本地">
				<a-button
					shape="circle"
					@click="saveModelScreenshot"
				>
					<IconDownload style="font-size: 18px" />
				</a-button>
			</a-tooltip>

			<a-divider
				style="margin: 0 4px"
				direction="vertical"
			/>

			<a-tooltip
				v-if="renderItem.filename"
				content="在文件夹中显示此文件"
			>
				<a-button
					class="action-btn-folder"
					shape="circle"
					@click="() => showInFolder(renderItem.filename)"
				>
					<IconFolder style="font-size: 18px" />
				</a-button>
			</a-tooltip>

			<a-tooltip
				v-if="renderItem.filename"
				content="使用 BlockBench 打开此文件"
			>
				<a-button
					class="action-btn-blockbench"
					shape="circle"
					@click="openFileInBlockBench(renderItem.filename)"
				>
					<img
						src="@/assets/img/blockbench-icon.png"
						style="width: 20px"
					/>
				</a-button>
			</a-tooltip>

			<a-tooltip
				v-if="renderItem.data.model_filepath"
				content="使用VScode打开 - 模型文件"
			>
				<a-button
					class="action-btn-vscode"
					shape="circle"
					@click="openFileInVscode(renderItem.data.model_filepath)"
				>
					<icon-common style="font-size: 18px; color: white" />
				</a-button>
			</a-tooltip>

			<a-tooltip
				v-if="renderItem.data.config_filepath"
				content="使用VScode打开 - 配置文件"
			>
				<a-button
					class="action-btn-vscode"
					shape="circle"
					@click="openFileInVscode(renderItem.data.config_filepath)"
				>
					<img
						src="@/assets/img/vscode-icon.png"
						style="width: 18px"
					/>
				</a-button>
			</a-tooltip>

			<slot name="append-actions"></slot>
		</a-space>
	</div>
</template>

<script setup lang="ts">
import { store } from '@/store';
import { RenderItem } from '@/utils/core/renderer';
import { McModelRenderer } from '@/utils/model-viewer';
import { requireElectronContext, runIn } from '@/utils/remote';
import { Message } from '@arco-design/web-vue';
import { reactive } from 'vue';

const props = defineProps<{
	renderItem: RenderItem;
	mcModelRenderer: McModelRenderer;
}>();

const setting = reactive({
	show_grid: true,
	show_axes: true,
	maximize: false,
	alwayOnTop: false
});

function openFileInBlockBench(filepath: string) {
	if (filepath) {
		requireElectronContext(({ child_process }) => {
			const cmd = `"${store.setting.blockbench_path}" "${filepath}"`;
			console.log('cmd', cmd);
			child_process.exec(cmd);
		});
	}
}

function openFileInVscode(filepath: string) {
	if (filepath) {
		requireElectronContext(({ child_process }) => {
			const cmd = `"${store.setting.vscode_path}" "${filepath}"`;
			console.log('cmd', cmd);
			child_process.exec(cmd);
		});
	}
}

function showInFolder(filepath: string) {
	if (filepath) {
		requireElectronContext(({ remote }) => {
			remote.shell.showItemInFolder(filepath);
		});
	}
}

function pin() {
	requireElectronContext(({ remote }) => {
		setting.alwayOnTop = !setting.alwayOnTop;
		remote.getCurrentWindow().setAlwaysOnTop(setting.alwayOnTop);
	});
}

/**
 * 将当前渲染器的画面截图到剪贴板中
 */
function modelScreenshot() {
	runIn({
		electron({ remote }) {
			const data = props.mcModelRenderer.renderer.domElement.toDataURL();

			if (!data) {
				return Message.error('截图失败: 数据无法获取');
			}
			remote.clipboard.writeImage(remote.nativeImage.createFromDataURL(data));
			Message.success({ content: '保存截图成功 ，可以使用 ctrl + v 快捷粘贴到QQ/微信 ', duration: 3 * 1000 });
		},
		web() {
			props.mcModelRenderer.renderer.domElement.toBlob((blob) => {
				if (!blob) {
					return Message.error('截图失败: 数据无法获取');
				}
				navigator.clipboard
					.write([
						new ClipboardItem({
							'image/png': blob
						})
					])
					.then(() => {
						Message.success('截图成功');
					})
					.catch((err) => {
						Message.error('写入剪切板时出错: ' + String(err));
					});
			});
		}
	});
}

function saveModelScreenshot() {
	const data = props.mcModelRenderer.renderer.domElement.toDataURL();
	if (!data) {
		return Message.error('截图失败');
	}

	runIn({
		electron({ remote, fs }) {
			remote.dialog
				.showSaveDialog({
					title: '保存截图',
					defaultPath: remote.app.getPath('pictures') + '/' + (props.renderItem.displayname || 'image') + '.png'
				})
				.then((res) => {
					if (!res.canceled && res.filePath) {
						const base64Data = data.replace(/^data:image\/png;base64,/, '');
						fs.writeFile(res.filePath, base64Data, 'base64', (err) => {
							if (err) {
								Message.error('保存失败');
							} else {
								Message.success('保存成功');
							}
						});
					}
				});
		},
		web() {
			const a = document.createElement('a');
			a.href = data;
			a.download = (props.renderItem.displayname || 'image') + '.png';
			a.click();
		}
	});
}

function reload() {
	runIn({
		electron({ remote }) {
			remote.getCurrentWindow().reload();
		},
		web() {
			window.location.reload();
		}
	});
}
</script>

<style scoped lang="less">
.action-btn-folder {
	color: white !important;
	background-color: #ffb218df !important;
	border-color: #ffb218df !important;
}

.action-btn-blockbench {
	color: #188fffc9 !important;
	background-color: #1e93d9 !important;
	border-color: #1890ff1a !important;
}

.action-btn-vscode {
	background-color: #0098ff !important;
	border-color: #188fffc9 !important;
}

.minecraft-lores {
	margin-top: 4px;
	border: 4px solid #4d106a;
	border-radius: 8px;
	padding: 12px;
	line-height: 24px;
	background-color: #100116;
	color: #dbdbdb;

	* {
		font-family: 'Minecraftia', sans-serif;
	}
}
</style>
