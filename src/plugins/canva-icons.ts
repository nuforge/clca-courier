/**
 * Canva Icons Plugin
 * Registers custom Canva icon components globally
 */

import type { App } from 'vue';
import CanvaIcon from '../components/CanvaIcon.vue';
import CanvaLogo from '../components/CanvaLogo.vue';

export default {
  install(app: App) {
    // Register Canva components globally
    app.component('CanvaIcon', CanvaIcon);
    app.component('CanvaLogo', CanvaLogo);
  }
};
