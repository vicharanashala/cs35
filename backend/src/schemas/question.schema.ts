import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Question extends Document {
  @Prop({ required: true }) question: string;
  @Prop({ required: true }) category: string;
  @Prop() pendingCategory: string;   // student's custom category awaiting admin approval
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop() screenshotUrl: string;
  @Prop({ enum: ['open', 'answered', 'reopened'], default: 'open' }) status: 'open' | 'answered' | 'reopened';
  @Prop({ type: Types.ObjectId, ref: 'User' }) contributorId: Types.ObjectId;
  @Prop() contributorName: string;
  @Prop({ default: 0 }) upvotes: number;
  @Prop({ default: 0 }) downvotes: number;
  @Prop({ default: 0 }) views: number;
  @Prop({ default: false }) isReopened: boolean;
  @Prop() reopenReason: string;
  createdAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);