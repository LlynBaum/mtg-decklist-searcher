import './assets/main.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'
import Deck from "@/Deck.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", component: App, name: "home" },
        { path: "/deck/:deckId", component: Deck, name: "deck" },
    ]
});

createApp(App).use(router).mount('#app');
