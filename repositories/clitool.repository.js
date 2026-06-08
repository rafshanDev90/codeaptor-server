import CliTool from '../models/clitool.model.js';

export const findTools = async (filter, options = {}) => {
  const query = CliTool.find(filter).populate('category', 'name slug');

  if (options.select) query.select(options.select);
  if (options.sort) query.sort(options.sort);
  if (options.skip) query.skip(options.skip);
  if (options.limit) query.limit(options.limit);

  return await query.lean();
};

export const findToolById = async (id, populate = true) => {
  let query = CliTool.findById(id);
  if (populate) query = query.populate('category', 'name slug');
  return await query.lean();
};

export const findToolBySlug = async (slug) => {
  return await CliTool.findOne({ name: slug, isActive: true })
    .populate('category', 'name slug')
    .lean();
};

export const createTool = async (data) => {
  return await CliTool.create(data);
};

export const updateToolById = async (id, data) => {
  return await CliTool.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('category', 'name slug')
    .lean();
};

export const deactivateToolById = async (id) => {
  return await CliTool.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
};

export const countTools = async (filter = {}) => {
  return await CliTool.countDocuments(filter);
};

export const aggregateTools = async (pipeline) => {
  return await CliTool.aggregate(pipeline);
};

export const findToolsWithPagination = async (filter, sort, page, limit) => {
  const skip = (page - 1) * limit;
  const [tools, total] = await Promise.all([
    CliTool.find(filter)
      .populate('category', 'name slug')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    CliTool.countDocuments(filter),
  ]);
  return { tools, total, pages: Math.ceil(total / limit) };
};
