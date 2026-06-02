export const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, Object.keys(meta).length ? meta : '');
  },
  error: (message, error, meta = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error || '', Object.keys(meta).length ? meta : '');
  },
  debug: (message, meta = {}) => {
    console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`, Object.keys(meta).length ? meta : '');
  }
};
