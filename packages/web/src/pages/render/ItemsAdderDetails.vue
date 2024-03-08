<!-- eslint-disable vue/no-v-html -->
<template>
	<div class="text-white">
		<div>
			<div>
				名称：
				<span
					v-if="renderItem.displayname"
					v-html="colored(renderItem.displayname)"
				></span>
			</div>
			<div>路径：{{ '/' + renderItem.parents.join('/') }}</div>
			<div>文件路径：{{ renderItem.filename }}</div>
			<div>配置文件：{{ renderItem.data.config_filepath }}</div>
		</div>

		<!-- 使用循环只是为了减少调用链长度 -->
		<template
			v-for="(item_json, index) of renderItem.data.item_json ? [renderItem.data.item_json] : []"
			:key="index"
		>
			<div>
				<span> 物品信息： </span>
				<ul style="padding-left: 20px">
					<template v-if="item_json.behaviours">
						<li>是否启用：{{ item_json.enabled }}</li>
						<li v-if="item_json.behaviours.furniture_sit">
							坐骑高度：{{ item_json.behaviours.furniture_sit.sit_height }}
						</li>
						<li>光亮等级：{{ item_json.behaviours.furniture.light_level }}</li>
						<li>
							放置类型：{{
								Object.keys(item_json.behaviours.furniture.placeable_on)
									.filter((k) => item_json.behaviours.furniture.placeable_on[k])
									.join(' , ')
							}}
						</li>
						<li v-if="item_json.behaviours.furniture.hitbox">
							hitbox：{{ JSON.stringify(item_json.behaviours.furniture.hitbox) }}
						</li>
					</template>

					<li>
						<a-row>
							<a-col flex="42px">描述：</a-col>
							<a-col flex="auto">
								<div class="minecraft-lores-container">
									<div class="minecraft-lores">
										<div v-for="item of [...(item_json.lore || [renderItem.displayname])]">
											<div v-html="colored(item)"></div>
										</div>
									</div>
								</div>
							</a-col>
						</a-row>
					</li>
				</ul>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { colored } from '@/utils/color';
import { RenderItem } from '@/utils/core/renderer';

defineProps<{
	renderItem: RenderItem;
}>();
</script>

<style scoped lang="less"></style>
