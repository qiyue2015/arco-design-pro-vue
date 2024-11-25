import { App } from 'vue';
import Breadcrumb from './breadcrumb/index.vue';
import Grid from './grid/index.vue';
import GridTable from './grid/grid-table.vue';
import GridToolbar from './grid/grid-toolbar.vue';
import ImageGallery from './image-gallery/index.vue';
import Tiptap from './tiptap/index.vue';

export default {
  install(Vue: App) {
    Vue.component('Breadcrumb', Breadcrumb);
    Vue.component('Grid', Grid);
    Vue.component('GridToolbar', GridToolbar);
    Vue.component('GridTable', GridTable);
    Vue.component('ImageGallery', ImageGallery);
    Vue.component('Tiptap', Tiptap);
  },
};
