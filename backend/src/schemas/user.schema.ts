import { Prop, Schema, SchemaFactory } from '@nestjs/common';
import { Document } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class User extends Document {
  @Prop({ required: true, unique: true }) email: string;
  @Prop({ required: true }) password: string;
  @Prop({ required: true, enum: ['student', 'admin'] }) role: 'student' | 'admin';
  @Prop({ default: true }) isActive: boolean;
  @Prop() name: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
