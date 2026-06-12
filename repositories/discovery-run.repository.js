import DiscoveryRun from '../models/discovery-run.model.js';

export const createRun = async (data) => {
  return await DiscoveryRun.create(data);
};

export const findRunById = async (id) => {
  return await DiscoveryRun.findById(id).populate('triggeredBy', 'name email').lean();
};

export const updateRunById = async (id, data) => {
  return await DiscoveryRun.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
};

export const findRecentRuns = async (limit = 10) => {
  return await DiscoveryRun.find()
    .sort({ startedAt: -1 })
    .limit(limit)
    .populate('triggeredBy', 'name email')
    .lean();
};

export const findLatestRun = async () => {
  return await DiscoveryRun.findOne()
    .sort({ startedAt: -1 })
    .lean();
};

export const findRunningRun = async () => {
  return await DiscoveryRun.findOne({ status: 'running' }).lean();
};
