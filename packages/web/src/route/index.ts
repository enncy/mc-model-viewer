import { createRouter, createWebHistory } from 'vue-router';
import index from '@/pages/index.vue';
import New from '@/pages/new.vue';
import ItemsAdderPage from '@/pages/items-adder-page/index.vue';

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			component: index
		},
		{
			path: '/new',
			component: New,
			children: [
				{
					path: 'items-adder',
					component: () => import('@/pages/items-adder-page/index.vue')
				}
			]
		},
		{
			path: '/items-adder-render',
			component: ItemsAdderPage
		}
	]
});
