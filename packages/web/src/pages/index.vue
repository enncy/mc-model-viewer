<template>
	<div class="page-container">
		<input
			ref="folderSelectorRef"
			type="file"
			webkitdirectory
			directory
			multiple="false"
			style="display: none"
			@change="(e) => browseResult(e)"
		/>

		<div class="m-3">
			<div class="shadow p-2">
				<a-row>
					<a-col flex="auto">
						<a-space>
							<span> 工作区： </span>
							<a-select
								v-model="store.current_workspace_name"
								placeholder="请选择工作区"
								style="min-width: 200px"
							>
								<a-option
									v-for="workspace in store.workspaces"
									:key="workspace.name"
									:value="workspace.name"
									:selected="workspace.name === store.current_workspace_name"
								>
									{{ workspace.name }}
								</a-option>
							</a-select>

							<template v-if="current_workspace">
								<a-button
									status="danger"
									@click="removeWorkspace"
								>
									删除
								</a-button>
							</template>
						</a-space>
					</a-col>
					<a-col
						flex="200px"
						class="flex justify-end"
					>
						<a-button @click="createWorkspace"> + 创建工作区</a-button>
					</a-col>
				</a-row>
			</div>
		</div>

		<div class="m-3">
			<div
				v-if="current_workspace"
				class="h-full"
			>
				<WorkspaceComponent :data="current_workspace"></WorkspaceComponent>
			</div>
			<template v-else>
				<a-empty />
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { store } from '@/store';
import { Button, Input, Message, Modal } from '@arco-design/web-vue';
import { h, ref, computed } from 'vue';
import WorkspaceComponent from '@/components/Workspace.vue';
import { Workspace } from '../utils/workspace';

const folderSelectorRef = ref();
const files = ref<FileList>();
const selected = ref(false);

const current_workspace = computed(() => store.workspaces.find((w) => w.name === store.current_workspace_name));

function removeWorkspace() {
	Modal.confirm({
		title: '删除工作区',
		content: '确定要删除 ' + store.current_workspace_name + ' 工作区吗？',
		okText: '确定',
		cancelText: '取消',
		onOk() {
			store.workspaces = store.workspaces.filter((w) => w.name !== store.current_workspace_name);
			store.current_workspace_name = store.workspaces[0]?.name || '';
		}
	});
}

function createWorkspace() {
	const name = ref('');

	Modal.info({
		simple: false,
		title: '创建工作区',
		content: () =>
			h('div', [
				h(
					Input,
					{
						placeholder: '请输入工作区名称',
						onInput: (val) => {
							name.value = val;
						}
					},
					{
						prepend: () => h('span', '名称：')
					}
				),
				h('div', [
					h(
						Button,
						{
							type: 'primary',
							style: 'margin-top: 10px',
							onClick: () => {
								openProjectPath();
							}
						},
						'选择工作区文件夹'
					),
					h('span', selected.value ? ' 已选择' : ' 未选择')
				])
			]),
		okText: '确定',
		async onOk() {
			if (selected.value === false) {
				return Message.error('请选择工作区文件夹');
			}
			if (!name.value.trim()) {
				return Message.error('请输入工作区名称');
			}

			const file_list = Array.from(files.value || []);
			const result: Workspace['files'] = [];
			for (const file of file_list) {
				const getDataURL = () => {
					return new Promise<any>((resolve, reject) => {
						const reader = new FileReader();
						reader.onload = function (e) {
							// @ts-ignore
							resolve(e.target.result);
						};
						reader.readAsDataURL(file);
					});
				};

				console.log('file.path', file);

				result.push({
					name: file.name,
					size: file.size,
					path: file.path,
					type: file.type,
					lastModified: file.lastModified,
					webkitRelativePath: file.webkitRelativePath,
					content: ['.png', '.jpg'].some((ext) => file.name.endsWith(ext)) ? await getDataURL() : await file.text()
				});
			}

			store.workspaces.push({
				name: name.value,
				files: result
			});

			if (store.current_workspace_name === '') {
				store.current_workspace_name = name.value;
			}
		},
		onClose() {
			selected.value = false;
			files.value = undefined;
			console.log(store.workspaces);
		}
	});
}

function openProjectPath() {
	folderSelectorRef.value.click();
}

function browseResult(e: Event) {
	// @ts-ignore
	files.value = e.target.files;
	selected.value = true;
}
</script>

<style scoped lang="less">
.page-container {
	display: grid;
	grid-template-rows: 64px calc(100% - 64px);
	height: 100%;
}
</style>
