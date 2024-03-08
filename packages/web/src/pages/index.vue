<template>
	<div class="page-container h-full">
		<input
			id="folderSelector"
			type="file"
			webkitdirectory
			directory
			multiple="false"
			style="display: none"
			@change="(e) => fileChange(e)"
		/>

		<div>
			<div class="shadow p-3">
				<a-row>
					<a-col flex="auto">
						<a-space>
							<span> 工作区： </span>
							<a-select
								v-model="store.current_asset_folder_name"
								placeholder="请选择工作区"
								style="min-width: 200px"
							>
								<a-option
									v-for="folder in store.asset_folders"
									:key="folder.name"
									:value="folder.name"
									:selected="folder.name === store.current_asset_folder_name"
								>
									{{ folder.name }}
								</a-option>
							</a-select>

							<template v-if="store.current_asset_folder_name">
								<a-tooltip content="刷新页面">
									<a-button @click="reload">
										<IconSync />
									</a-button>
								</a-tooltip>
								<a-popconfirm
									content="确定移除工作区？此操作不会删除本地文件"
									@ok="removeFolder"
								>
									<a-tooltip content="移除工作区">
										<a-button status="danger">
											<IconDelete />
										</a-button>
									</a-tooltip>
								</a-popconfirm>
							</template>
						</a-space>
					</a-col>
					<a-col
						flex="200px"
						class="flex justify-end"
					>
						<a-space>
							<a-button @click="selectFolder"> + 创建工作区</a-button>
							<a-tooltip
								content="设置"
								@click="state.setting_modal.visible = true"
							>
								<a-button shape="circle">
									<IconSettings class="text-lg" />
								</a-button>
							</a-tooltip>
						</a-space>
					</a-col>
				</a-row>
			</div>
		</div>

		<div
			v-if="state.loading"
			style="position: absolute"
			class="w-full h-full flex justify-center items-center loading"
		>
			<a-spin
				class="mt-5"
				:loading="state.loading"
				tip="正在加载中..."
			>
			</a-spin>
		</div>
		<div
			v-if="folder_render_infos.length"
			class="h-full"
		>
			<a-row class="h-full flex-nowrap">
				<a-col
					flex="200px"
					class="h-full me-2 border-r-2 overflow-auto"
				>
					<template
						v-for="(folder, index) of folder_render_infos"
						:key="index"
					>
						<div
							class="folder text-lg"
							:class="{ current: state.current_folder_render_info?.name === folder.name }"
							@click="
								() => {
									state.current_folder_render_info = folder;
									store.current_folder_render_info_name = folder.name;
								}
							"
						>
							<a-space size="mini">
								<IconFolder /> <span> {{ folder.name }} </span>
							</a-space>
						</div>
					</template>
				</a-col>
				<a-col
					flex="auto"
					class="h-full overflow-auto p-2"
				>
					<FolderRender
						v-if="state.current_folder_render_info"
						:folder-render-info="state.current_folder_render_info"
						@render="render"
					></FolderRender>
				</a-col>
			</a-row>
		</div>

		<div v-else>
			<div
				v-if="state.loading === false"
				class="h-full flex justify-center items-center"
			>
				<a-empty
					v-if="state.current_folder_render_info === undefined"
					description="暂无数据，请在右上角新建工作区"
				/>
				<a-empty
					v-else-if="state.current_folder_render_info === null"
					description="暂无数据，可能是未读取到资源，请确保工作区的类型一致"
				/>
			</div>
		</div>

		<a-modal
			v-model:visible="state.setting_modal.visible"
			title="设置"
			:footer="false"
			:simple="false"
			:width="800"
		>
			<Settings />
		</a-modal>

		<a-modal
			v-model:visible="state.create_modal.visible"
			title="创建工作区"
			:mask-closable="false"
			@ok="createWorkspace"
		>
			<a-input
				v-model="state.create_modal.name"
				placeholder="输入名称"
				class="mb-2"
			>
				<template #prepend>工作区名称</template>
			</a-input>

			<a-select
				v-model="state.create_modal.type"
				placeholder="请选择工作区类型"
				:options="[
					{ value: 'items-adder', label: 'items-adder' },
					{ value: 'germ', label: '萌芽引擎' }
				]"
			>
				<template #prepend>工作区名称</template>
			</a-select>
		</a-modal>
	</div>
</template>

<script setup lang="ts">
import { store } from '@/store';
import { ItemsAdderFolderRenderer } from '@/utils/core/items.adder.model.renderer';
import { FolderRenderInfo, RenderItem } from '@/utils/core/renderer';
import { AssetFolder } from '@/utils/core/workspace';
import { Message } from '@arco-design/web-vue';
import { onMounted, reactive, ref, watch } from 'vue';
import { globalAssetFolder, globalFolderRenderer } from '.';
import { ipcRenderer } from 'electron';
import FolderRender from '@/components/FolderRender.vue';
import Settings from '@/components/Settings.vue';
import { runIn } from '@/utils/remote';

const state = reactive({
	setting_modal: {
		visible: false
	},
	create_modal: {
		visible: false,
		name: '',
		type: ''
	},
	current_folder_render_info: undefined as FolderRenderInfo | undefined | null,
	loading: false
});

const selected_file_list = ref<FileList | undefined>();
const folder_render_infos = ref<FolderRenderInfo[]>([]);

onMounted(async () => {
	renderPage();
});

watch(
	() => store.current_asset_folder_name,
	() => {
		renderPage();
	}
);

async function renderPage() {
	state.loading = true;

	try {
		// 清空数据
		state.current_folder_render_info = undefined;
		folder_render_infos.value = [];

		const folder = store.asset_folders.find((f) => f.name === store.current_asset_folder_name);

		if (folder && folder.type) {
			globalAssetFolder.value = await AssetFolder.deserialize(folder);
			if (folder.type === 'items-adder') {
				globalFolderRenderer.value = new ItemsAdderFolderRenderer(globalAssetFolder.value);
			}

			if (globalFolderRenderer.value) {
				await globalFolderRenderer.value.list((render_item) => {
					// 递归查找父级文件夹，如果没有则创建
					const info = initFolder(folder_render_infos.value, render_item.parents);

					if (info) {
						info.items.push(render_item);
						if (state.current_folder_render_info === undefined) {
							state.current_folder_render_info = info;
						}
					}
				});

				if (store.current_folder_render_info_name) {
					const find = folder_render_infos.value.find((f) => f.name === store.current_folder_render_info_name);
					if (find) {
						state.current_folder_render_info = find;
					}
				}

				if (state.current_folder_render_info === undefined) {
					state.current_folder_render_info = null;
				}
			}
		}
	} catch (e) {
		console.error(e);
	}

	state.loading = false;
}

async function fileChange(e: any) {
	selected_file_list.value = e.target.files;
	console.log(e.target.files);

	state.create_modal.visible = true;
}

async function selectFolder() {
	document.querySelector<HTMLInputElement>('#folderSelector')?.click();
}

async function createWorkspace() {
	const name = state.create_modal.name;
	if (!name.trim()) {
		Message.error('请输入名称');
		return;
	}
	if (!state.create_modal.type.trim()) {
		Message.error('请选择类型');
		return;
	}
	if (store.asset_folders.find((f) => f.name.trim() === name.trim())) {
		Message.error('此名称下的工作区已存在');
		return;
	}

	const folder = await AssetFolder.loadFromFiles(
		name.trim(),
		state.create_modal.type.trim(),
		selected_file_list.value || []
	);

	store.asset_folders.push(folder.serialize());
	store.current_asset_folder_name = folder.name;
}

function removeFolder() {
	store.asset_folders = store.asset_folders.filter((f) => f.name !== store.current_asset_folder_name);
	store.current_asset_folder_name = store.asset_folders[0]?.name || '';

	renderPage();
}

// 递归查找父级文件夹，如果没有则创建
function initFolder(folders: FolderRenderInfo[], parents: string[]) {
	if (parents.length < 1) {
		return undefined;
	}

	const folder = folders.find((f) => f.name === parents[0]);
	if (folder) {
		if (parents.length && folder.children.length) {
			return initFolder(folder.children, parents.slice(1));
		} else {
			return folder;
		}
	} else {
		const init = {
			name: parents[0],
			items: [],
			children: []
		};
		folders.push(init);

		if (parents.length === 1) {
			return init;
		}

		return initFolder(init.children, parents.slice(1));
	}
}

async function render(render_item: RenderItem) {
	if (state.current_folder_render_info) {
		let path = '';

		if (globalAssetFolder.value?.type === 'items-adder') {
			path = '/items-adder-render';
		}

		ipcRenderer.send(
			'open-renderer-with-args',
			location.origin + path,
			{
				filename: render_item.filename,
				title: render_item.displayname,
				width: 1000,
				height: 800,
				minWidth: 400,
				minHeight: 400,
				hideTitleBar: false
			},
			{ render_item: JSON.parse(JSON.stringify(render_item)), asset_folder: store.current_asset_folder_name }
		);
	}
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
// p-3 是 0.75rem
@HeaderHeight: calc(32px + (0.75rem * 2));

.page-container {
	display: grid;
	grid-template-rows: @HeaderHeight calc(100% - @HeaderHeight);
	height: 100%;
	min-width: 600px;
}

.folder {
	padding: 2px 0px 2px 4px;
	display: flex;
	align-items: center;
	cursor: pointer;
	&:hover {
		background: #f9f9f9;
	}

	&.current {
		background: #1890ff1a;
	}
}

.loading {
	background-color: rgba(255, 255, 255, 0.63);
}
</style>
