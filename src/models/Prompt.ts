import mongoose from 'mongoose';

export interface IPrompt {
  _id?: string;
  title: string;
  prompt: string;
  type: string;
  image?: string;
  userId: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const PromptSchema = new mongoose.Schema<IPrompt>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    prompt: {
      type: String,
      required: [true, 'Prompt is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      trim: true,
      enum: ['Character', 'Background', 'Pose'],
    },
    image: {
      type: String,
      trim: true,
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function(tags: string[]) {
          return tags.every(tag => tag.trim().length > 0);
        },
        message: 'Tags cannot be empty'
      }
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Prompt || mongoose.model<IPrompt>('Prompt', PromptSchema);
