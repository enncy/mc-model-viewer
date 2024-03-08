import { createRouter, createWebHistory } from 'vue-router';
import Index from '@/pages/index.vue';
import ItemsAdderPage from '@/pages/render/itemsadder.render.page.vue';

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			component: Index
		},
		{
			path: '/items-adder-render',
			component: ItemsAdderPage
		}
	]
});
