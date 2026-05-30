import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ required: true, index: true })
  userId: string; // The user ID, or 'admin' for global admin notifications

  @Prop({ required: true })
  type: string; // e.g. 'new_question', 'answer_added', 'answer_verified', 'points_adjusted'

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  link: string;

  @Prop({ default: false })
  isRead: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
