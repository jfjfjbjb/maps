import { createApp } from 'vue'
import 'ol/ol.css'
import App from './App.vue'
import eruda from 'eruda'

createApp(App).mount('#app')
eruda.init();
