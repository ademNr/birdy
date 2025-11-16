import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/examlyBird.png"
                alt="Birdy"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-lg font-bold text-gray-900">Birdy</span>
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <Link
                href="/auth/signin"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-green-50 rounded-full">
            <span className="text-green-600 text-sm">🤖</span>
            <span className="text-green-700 text-xs font-semibold">AI-Powered Study Assistant</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Transform Your Study Materials
          </h1>

          {/* Sub-headline */}
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload PDFs, notes, and exams. Get instant summaries, formulas, practice questions, and personalized study plans.
          </p>

          {/* CTA Button */}
          <Link
            href="/auth/signup"
            className="inline-block bg-gray-900 text-white px-6 py-3 rounded-md text-base font-semibold hover:bg-gray-800 transition-colors mb-8"
          >
            Start for free
          </Link>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">★★★★★</span>
              <span className="font-medium">from 100+ reviews</span>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything you need to ace your exams
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl mb-3">📚</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Summaries & Key Points</h3>
              <p className="text-sm text-gray-600">
                Extract important information and key concepts from your study materials instantly.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl mb-3">🔢</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Important Formulas</h3>
              <p className="text-sm text-gray-600">
                Automatically detect and highlight formulas with context and explanations.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl mb-3">❓</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Exam Questions</h3>
              <p className="text-sm text-gray-600">
                Generate potential exam questions and practice quizzes automatically.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Flashcards & MCQs</h3>
              <p className="text-sm text-gray-600">
                Create flashcards and multiple-choice questions for quick review.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl mb-3">🗣️</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Voice Explanation</h3>
              <p className="text-sm text-gray-600">
                Listen to AI-read summaries and key points for better understanding.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-3xl mb-3">📅</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Study Plans</h3>
              <p className="text-sm text-gray-600">
                Get personalized study schedules based on your exam dates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Gradient */}
      <div className="h-32 bg-gradient-to-b from-gray-50 to-white"></div>
    </div>
  );
}
