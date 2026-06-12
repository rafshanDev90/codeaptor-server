import * as discoveryService from '../services/discovery.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const triggerDiscovery = catchAsync(async (req, res) => {
  const run = await discoveryService.startDiscovery(req.user._id);
  res.json({ status: 'success', data: { run } });
});

export const getDiscoveryStatus = catchAsync(async (req, res) => {
  const run = await discoveryService.getRunStatus(req.params.id);
  if (!run) throw new AppError('Discovery run not found.', 404);
  res.json({ status: 'success', data: { run } });
});

export const getDiscoveryHistory = catchAsync(async (req, res) => {
  const history = await discoveryService.getRunHistory();
  res.json({ status: 'success', data: { history } });
});

export const getDiscoveryLastRun = catchAsync(async (req, res) => {
  const run = await discoveryService.getLastRun();
  res.json({ status: 'success', data: { run } });
});
