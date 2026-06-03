import { Webhook } from 'svix';
import * as userService from '../services/user.service.js';

export const handleClerkWebhook = async (req, res, next) => {
  try {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(500).json({ status: 'error', message: 'Webhook secret not configured' });
    }

    const wh = new Webhook(secret);
    const payload = wh.verify(req.body, req.headers);
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
  } catch (err) {
    next(err);
  }
};

