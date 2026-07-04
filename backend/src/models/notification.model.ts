// models/notification.model.ts
import mongoose, { Schema } from 'mongoose';
import { INotification } from '../types.js';

const notificationSchema = new Schema<INotification>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read_status: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  action_link: { type: String }
});

notificationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.is_read = ret.read_status;
    return ret;
  }
});

notificationSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.is_read = ret.read_status;
    return ret;
  }
});

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
