export function mountDiscoveryRoutes(router) {
  // Using GET to avoid express-formidable parsing issues on non-GET methods
  router.get('/api/discovery/start', async (req, res, next) => {
    try {
      const { startDiscovery } = await import('../services/discovery.service.js');
      const run = await startDiscovery(null);
      res.json({ run });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  router.get('/api/discovery/stop', async (req, res, next) => {
    try {
      const { stopDiscovery } = await import('../services/discovery.service.js');
      const result = await stopDiscovery();
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  router.get('/api/discovery/logs', async (req, res, next) => {
    try {
      const { getActiveRunLogs, getCurrentRunId } = await import('../services/discovery.service.js');
      const [logs, runId] = await Promise.all([getActiveRunLogs(), getCurrentRunId()]);
      res.json({ logs, runId: runId ? runId.toString() : null });
    } catch (err) {
      next(err);
    }
  });

  router.get('/api/discovery/history', async (req, res, next) => {
    try {
      const { getRunHistory } = await import('../services/discovery.service.js');
      const history = await getRunHistory();
      res.json({ history });
    } catch (err) {
      next(err);
    }
  });
}
