import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class User extends Document {
  @Prop({ required: true, unique: true }) email: string;
  @Prop({ required: true }) password: string;
  @Prop({ required: true, enum: ['student', 'admin'] }) role: 'student' | 'admin';
  @Prop({ default: true }) isActive: boolean;
  @Prop() name: string;
  @Prop({ unique: true, sparse: true }) studentId: string;
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Question' }], default: [] }) questionsAsked: Types.ObjectId[];
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Question' }], default: [] }) questionsAnswered: Types.ObjectId[];
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Question' }], default: [] }) questionsBookmarked: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
