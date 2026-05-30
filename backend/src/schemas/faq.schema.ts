import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Faq extends Document {
  @Prop({ required: true }) question: string;
  @Prop({ required: true }) answer: string;
  @Prop({ required: true }) category: string;
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop({ default: 0 }) views: number;
  @Prop({ type: [Number], required: false }) embedding?: number[];
  @Prop({ default: false }) isAnswered: boolean;
  @Prop({ default: false }) isPinned: boolean;
  @Prop({ default: 0 }) helpfulCount: number;
  @Prop({ default: 0 }) unhelpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const FaqSchema = SchemaFactory.createForClass(Faq);
