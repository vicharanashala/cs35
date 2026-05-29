import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Faq extends Document {
  @Prop({ required: true }) question: string;
  @Prop({ required: true }) answer: string;
  @Prop({ required: true }) category: string;
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop({ default: 0 }) views: number;
  @Prop({ default: false }) isAnswered: boolean;
  createdAt: Date;
}

export const FaqSchema = SchemaFactory.createForClass(Faq);