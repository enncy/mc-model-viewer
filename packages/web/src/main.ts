import { createApp } from 'vue';
import App from './App.vue';
import { router } from './route';
import ArcoVue from '@arco-design/web-vue';
import ArcoVueIcon from '@arco-design/web-vue/es/icon';

import '@/assets/tailwind.css';
import '@/assets/css/style.css';
//  arco-design 的 css 必须最后引入，否则会和 tailwind 冲突
import '@arco-design/web-vue/dist/arco.css';

window.addEventListener('error', function (e) {
	console.error(e);
});

window.addEventListener('unhandledrejection', function (e) {
	e.promise.catch((e) => {
		console.error(e);
	});
});

createApp(App).use(router).use(ArcoVue).use(ArcoVueIcon).mount('#app');
