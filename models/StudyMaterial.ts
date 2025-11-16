import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStudyMaterial extends Document {
  userId: mongoose.Types.ObjectId;
  documentIds: mongoose.Types.ObjectId[];
  title: string;
  summary?: string;
  keyPoints?: string[];
  formulas?: Array<{
    formula: string;
    description: string;
    context: string;
  }>;
  examQuestions?: Array<{
    question: string;
    answer: string;
    type: 'short' | 'long' | 'essay';
  }>;
  mcqs?: Array<{
    question: string;
    options: string[];
    correctAnswer: number | number[]; // Support both single and multiple correct answers
    explanation?: string;
  }>;
  flashcards?: Array<{
    front: string;
    back: string;
    category?: string;
  }>;
  studyPlan?: {
    schedule: Array<{
      date: Date;
      topics: string[];
      difficulty: 'easy' | 'medium' | 'hard';
    }>;
    examDate?: Date;
    totalDays: number;
  };
  sharedWith: mongoose.Types.ObjectId[];
  votes: Array<{
    userId: mongoose.Types.ObjectId;
    vote: 'up' | 'down';
  }>;
  outputLanguage?: 'english' | 'french' | 'arabic';
  chapters?: Array<{
    order: number;
    title: string;
    documentId: mongoose.Types.ObjectId;
    summary?: string;
    keyPoints?: string[];
    formulas?: Array<{
      formula: string;
      description: string;
      context: string;
    }>;
    examQuestions?: Array<{
      question: string;
      answer: string;
      type: 'short' | 'long' | 'essay';
    }>;
    mcqs?: Array<{
      question: string;
      options: string[];
      correctAnswer: number | number[];
      explanation?: string;
    }>;
    flashcards?: Array<{
      front: string;
      back: string;
      category?: string;
    }>;
    youtubeVideos?: Array<{
      title: string;
      description: string;
      searchQuery: string;
      relevance: string;
    }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const StudyMaterialSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    documentIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Document',
    }],
    title: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
    },
    keyPoints: [{
      type: String,
    }],
    formulas: [{
      formula: String,
      description: String,
      context: String,
    }],
    examQuestions: [{
      question: String,
      answer: String,
      type: {
        type: String,
        enum: ['short', 'long', 'essay'],
      },
    }],
    mcqs: [{
      question: String,
      options: [String],
      correctAnswer: {
        type: Schema.Types.Mixed, // Allow both Number and Array
        required: true,
      },
      explanation: String,
    }],
    flashcards: [{
      front: String,
      back: String,
      category: String,
    }],
    studyPlan: {
      schedule: [{
        date: Date,
        topics: [String],
        difficulty: {
          type: String,
          enum: ['easy', 'medium', 'hard'],
        },
      }],
      examDate: Date,
      totalDays: Number,
    },
    sharedWith: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    votes: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      vote: {
        type: String,
        enum: ['up', 'down'],
      },
    }],
    outputLanguage: {
      type: String,
      enum: ['english', 'french', 'arabic'],
      default: 'english',
    },
    chapters: [{
      order: {
        type: Number,
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      documentId: {
        type: Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
      },
      summary: String,
      keyPoints: [String],
      formulas: [{
        formula: String,
        description: String,
        context: String,
      }],
      examQuestions: [{
        question: String,
        answer: String,
        type: {
          type: String,
          enum: ['short', 'long', 'essay'],
        },
      }],
      mcqs: [{
        question: String,
        options: [String],
        correctAnswer: {
          type: Schema.Types.Mixed,
          required: true,
        },
        explanation: String,
      }],
      flashcards: [{
        front: String,
        back: String,
        category: String,
      }],
      youtubeVideos: [{
        title: String,
        description: String,
        searchQuery: String,
        relevance: String,
      }],
    }],
  },
  {
    timestamps: true,
  }
);

// Force clear the model cache in development to ensure schema updates are applied
// This is necessary because Mongoose caches models and schema changes won't take effect until cache is cleared
if (process.env.NODE_ENV === 'development') {
  if (mongoose.models.StudyMaterial) {
    delete mongoose.models.StudyMaterial;
  }
  // Also delete from mongoose.modelSchemas if it exists (using type assertion for TypeScript)
  const mongooseAny = mongoose as any;
  if (mongooseAny.modelSchemas && mongooseAny.modelSchemas['StudyMaterial']) {
    delete mongooseAny.modelSchemas['StudyMaterial'];
  }
}

const StudyMaterial: Model<IStudyMaterial> = mongoose.models.StudyMaterial || mongoose.model<IStudyMaterial>('StudyMaterial', StudyMaterialSchema);

export default StudyMaterial;

