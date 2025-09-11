import { boot } from 'quasar/wrappers';
import CanvaIconsPlugin from '../plugins/canva-icons';

// Register Canva icons plugin
export default boot(({ app }) => {
  app.use(CanvaIconsPlugin);
});
