import { Schema, model, Document, Types } from "mongoose";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface ITask extends Document {
  title: string;
  description: string;
  projectId: Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  assigneeId: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  parentTaskId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxLength: 200 },
    description: { type: String, default: "" },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    dueDate: { type: Date, default: null, index: true },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    parentTaskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

taskSchema.index({ projectId: 1, status: 1, createdAt: -1 });
taskSchema.index({ parentTaskId: 1 });

export const Task = model<ITask>("Task", taskSchema);
