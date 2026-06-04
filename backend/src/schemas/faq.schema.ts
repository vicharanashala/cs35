import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Faq extends Document {
  @Prop({ required: true }) question: string;
  @Prop({ required: true }) answer: string;
  @Prop({ required: true }) category: string;
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop({ default: 0 }) views: number;
  @Prop({ type: [Number], required: false }) embedding?: number[];
  @Prop({ default: false }) isAnswered: boolean;
  @Prop({ default: 0 }) upvotes: number;
  @Prop({ default: false }) isPinned: boolean;
  @Prop({ default: 0 }) helpfulCount: number;
  @Prop({ default: 0 }) unhelpfulCount: number;
  @Prop({ type: Types.ObjectId, ref: 'Question', required: false }) originalQuestionId?: Types.ObjectId;

  @Prop({
    type: [
      {
        reason: { type: String, required: true },
        userLabel: { type: String, required: false },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    default: [],
  })
  unhelpfulFeedbacks: { reason: string; userLabel?: string; createdAt?: Date }[];

  createdAt: Date;
  updatedAt: Date;
}

export const FaqSchema = SchemaFactory.createForClass(Faq);