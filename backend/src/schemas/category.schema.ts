import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Category extends Document {
  @Prop({ required: true, unique: true }) name: string;
  @Prop({ default: '📁' }) icon: string;   // emoji icon generated from category name
  @Prop({ default: true }) isActive: boolean;   // false = pending (not yet approved)
  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);