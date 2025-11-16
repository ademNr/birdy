# Birdy - AI Study Assistant

An AI-powered study assistant for Tunisian students that helps process study materials, generate summaries, formulas, practice questions, flashcards, and personalized study plans.

## Features

- 📚 **Summaries & Key Points** - Extract important information from study materials
- 🔢 **Important Formulas** - Automatically detect and highlight formulas
- ❓ **Exam Questions** - Generate potential exam questions
- 📝 **MCQs & Flashcards** - Auto-generate quizzes and study cards
- 🗣️ **Voice Explanation** - Listen to AI-read summaries
- 📅 **Personalized Study Plans** - Get study schedules based on exam dates
- 👥 **Collaborative Features** - Share materials and vote on useful summaries

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js with email/password authentication
- **AI**: Google Gemini API (Flash 2.5)
- **File Processing**: PDF, Word, PowerPoint support

## Prerequisites

- Node.js 18+ 
- pnpm
- MongoDB (local or Atlas)
- Gemini API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd birdy
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env.local` file in the root directory:
```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/birdy
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/birdy

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# Gemini API
GEMINI_API_KEY=your-gemini-api-key-here

```

4. Generate NextAuth secret:
```bash
openssl rand -base64 32
```

5. Run the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Getting API Keys

### Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` file

### MongoDB
- **Local**: Install MongoDB locally or use Docker
- **Atlas**: Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### Email (Gmail Example)
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Use the app password in `SMTP_PASSWORD`

## Project Structure

```
birdy/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Main dashboard
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   └── lib/              # Utilities
├── pages/
│   └── api/              # API routes
│       ├── auth/         # Authentication endpoints
│       ├── upload.ts     # File upload
│       ├── process.ts    # AI processing
│       └── materials/    # Study materials endpoints
├── models/               # MongoDB models
├── lib/                  # Server-side utilities
└── uploads/              # Uploaded files (gitignored)
```

## Usage

1. **Sign Up**: Enter your email and password to create an account
2. **Upload Files**: Upload PDF, Word, or PowerPoint files
3. **Select Features**: Choose what you want to generate (summaries, formulas, questions, etc.)
4. **Process**: Let AI process your materials
5. **Study**: Review summaries, practice with MCQs, use flashcards, follow study plans

## Supported File Formats

- PDF (`.pdf`)
- Microsoft Word (`.doc`, `.docx`)
- Microsoft PowerPoint (`.ppt`, `.pptx`)
- Text files (`.txt`)

## API Endpoints

- `POST /api/auth/register` - Create new user account
- `POST /api/upload` - File upload
- `POST /api/process` - Process files with AI
- `GET /api/materials` - Get user's study materials
- `POST /api/materials/share` - Share material with others
- `POST /api/materials/vote` - Vote on materials

## Development

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
