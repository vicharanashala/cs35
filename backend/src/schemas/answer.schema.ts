import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Answer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true }) questionId: Types.ObjectId;
  @Prop({ required: true }) content: string;
  @Prop({ required: true }) contributorName: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) contributorId: Types.ObjectId;
  @Prop({ default: false }) isVerified: boolean;
  @Prop({ default: false }) isAccepted: boolean;
  @Prop({ default: 0 }) upvotes: number;
  @Prop({ default: 0 }) downvotes: number;
  @Prop() pendingCategory: string;   // set when answer adds a new category (auto-approved on verify)
  createdAt: Date;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);