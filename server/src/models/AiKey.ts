import { Schema, model, Document, Types } from "mongoose";

export interface IAiKey extends Document {
  userId: Types.ObjectId;
  encryptedKey: string;
  hint: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiKeySchema = new Schema<IAiKey>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    encryptedKey: { type: String, required: true },
    hint: { type: String, required: true },
  },
  { timestamps: true }
);

export const AiKey = model<IAiKey>("AiKey", aiKeySchema);
