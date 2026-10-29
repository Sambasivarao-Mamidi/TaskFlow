import { Schema, model, Document, Types } from "mongoose";

export type WorkspaceRole = "owner" | "member";

export interface IWorkspaceMember {
  userId: Types.ObjectId;
  role: WorkspaceRole;
}

export interface IWorkspace extends Document {
  name: string;
  ownerId: Types.ObjectId;
  members: IWorkspaceMember[];
  deletedAt: Date | null;
  createdAt: Date;
}

const workspaceMemberSchema = new Schema<IWorkspaceMember>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["owner", "member"], required: true },
});

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true, maxLength: 100 },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    members: [workspaceMemberSchema],
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

workspaceSchema.index({ "members.userId": 1 });

export const Workspace = model<IWorkspace>("Workspace", workspaceSchema);
