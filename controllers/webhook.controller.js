import { Webhook } from 'svix';
import * as userService from '../services/user.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const handleClerkWebhook = catchAsync(async (req, res, next) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    throw new AppError('Webhook secret not configured', 500);
  }

  let payload;
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(req.body, req.headers);
  } catch (err) {
    throw new AppError('Webhook verification failed', 401);
  }

  const { type, data } = payload;

  switch (type) {
    case 'user.created':
    case 'user.updated': {
      const name = `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email_addresses?.[0]?.email_address;
      const email = data.email_addresses?.[0]?.email_address;
      
      await userService.syncUser(data.id, { name, email });
      break;
    }
    case 'user.deleted': {
      await userService.deleteUserByClerkId(data.id);
      break;
    }
  }

  res.status(200).json({ status: 'success' });
});

