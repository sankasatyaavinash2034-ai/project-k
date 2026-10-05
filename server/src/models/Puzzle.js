import mongoose from 'mongoose';

const processedSectionSchema = new mongoose.Schema(
  {
    sectionIndex: { type: Number, required: true },
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    imageUrl: { type: String, required: true },
  },
  { _id: false }
);

const puzzleSchema = new mongoose.Schema(
  {
    roundNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=800',
    },
    gridRows: {
      type: Number,
      default: 3,
      min: 2,
      max: 5,
    },
    gridCols: {
      type: Number,
      default: 3,
      min: 2,
      max: 5,
    },
    processedSections: [processedSectionSchema],
    solution: {
      type: String,
      required: true,
      trim: true,
    },
    points: {
      type: Number,
      default: 100,
      min: 0,
    },
    timeLimitSeconds: {
      type: Number,
      default: 300,
    },
    hint: {
      type: String,
      default: '',
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    isLockedForGame: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Strip answer solution data when serializing for non-admin viewers
puzzleSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.solution;
  delete obj.__v;
  return obj;
};

export const Puzzle = mongoose.model('Puzzle', puzzleSchema);
