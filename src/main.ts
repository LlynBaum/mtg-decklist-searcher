import './assets/main.css'

import { createApp } from 'vue'
import {createRouter, createWebHistory} from 'vue-router'
import App from './App.vue'

createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", component: App },
    ]
});
createApp(App).mount('#app')
