import { useState } from 'react';
import BusinessChatFriend from '@/components/BusinessChatFriend';

export default function TestBusinessChat() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Business Chat Friend Demo
            </h1>
            <p className="text-xl text-slate-300 mb-6">
              Test the AI-powered networking assistant with OpenAI GPT-4o integration
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700/50">
            <h2 className="text-2xl font-semibold text-white mb-4">How to Test:</h2>
            <div className="space-y-4 text-slate-300">
              <div className="flex items-start gap-3">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</span>
                <p>Look for the <strong className="text-purple-400">purple chat icon</strong> in the bottom-right corner of this page</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                <p>Click the icon to start the <strong className="text-blue-400">5-question onboarding flow</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                <p>Answer questions about your city, education, work history, current projects, and hobbies</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</span>
                <p>Chat with <strong className="text-green-400">Alex</strong> - the AI assistant powered by OpenAI GPT-4o</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">5</span>
                <p>Try asking: <em>"Help me connect with someone at Google"</em> or <em>"What's the best networking strategy for my industry?"</em></p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-6 border border-purple-500/30">
            <h3 className="text-xl font-semibold text-white mb-3">AI Features:</h3>
            <ul className="space-y-2 text-slate-300">
              <li>• <strong className="text-purple-400">Context-aware responses</strong> using your onboarding data</li>
              <li>• <strong className="text-blue-400">Personalized networking strategies</strong> based on your background</li>
              <li>• <strong className="text-green-400">Professional conversation memory</strong> across chat sessions</li>
              <li>• <strong className="text-cyan-400">OpenAI GPT-4o integration</strong> for intelligent networking advice</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Include the chat component */}
      <BusinessChatFriend />
    </div>
  );
}