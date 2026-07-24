import { Schema, model, HydratedDocument } from 'mongoose';
import { UserRole } from '../constants/enums';
import { UserEntity } from '../interfaces/user.interface';

const UserSchema = new Schema<UserEntity>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 1,
      maxlength: 128,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.ADMIN,
    },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type UserDocument = HydratedDocument<UserEntity>;

export const UserModel = model<UserEntity>('User', UserSchema);
