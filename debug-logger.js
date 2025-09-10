console.log('NODE ENV CHECK:', process.env.NODE_ENV);
console.log('import.meta support check');

import('./src/utils/logger.ts').then(mod => {
  console.log('Logger keys:', Object.keys(mod.logger));
  console.log('Success method:', mod.logger.success);
  console.log('Drive method:', mod.logger.drive);
  console.log('Warn method:', mod.logger.warn);
  console.log('Logger object methods:', Object.getOwnPropertyNames(mod.logger));
}).catch(err => {
  console.error('Import error:', err.message);
});
