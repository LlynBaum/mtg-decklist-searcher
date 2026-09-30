import './assets/main.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'
import Deck from "@/views/Deck.vue";
import Home from "@/views/Home.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", component: Home, name: "home" },
        { path: "/deck/:deckId", component: Deck, name: "deck", props: true },
    ]
});

createApp(App).use(router).mount('#app');
