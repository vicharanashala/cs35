import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Answer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true, index: true })
  questionId: Types.ObjectId;
  @Prop({ required: true }) content: string;
  @Prop({ required: true }) contributorName: string;
  @Prop({ type: Types.ObjectId, ref: 'User', index: true }) contributorId: Types.ObjectId;
  @Prop({ default: false }) isVerified: boolean;
  @Prop({ default: 0 }) upvotes: number;
  createdAt: Date;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);
AnswerSchema.index({ isVerified: -1 });
