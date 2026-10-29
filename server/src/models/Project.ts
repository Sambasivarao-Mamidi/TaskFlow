import { Schema, model, Document, Types } from "mongoose";

export type ProjectStatus = "active" | "archived";

export interface IProject extends Document {
  name: string;
  description: string;
  workspaceId: Types.ObjectId;
  createdBy: Types.ObjectId;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true, maxLength: 100 },
    description: { type: String, default: "" },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

export const Project = model<IProject>("Project", projectSchema);
