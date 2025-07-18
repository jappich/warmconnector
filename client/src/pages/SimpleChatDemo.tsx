import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export default function SimpleChatDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([]);
  const [chatInput, setChatInput] = useState('');

  const questions = [
    "What city do you call home?",
    "Where'd you study?", 
    "Which companies have you worked at?",
    "What deals or projects are top-of-mind right now?",
    "Any hobbies or personal passions we can use as ice-breakers?"
  ];

  const handleAnswerSubmit = () => {
    if (currentAnswer.trim()) {
      const newAnswers = [...answers, currentAnswer];
      setAnswers(newAnswers);
      setCurrentAnswer('');
      
      if (step < questions.length - 1) {
        setStep(step + 1);
      } else {
        // Onboarding complete, start chat
        setChatMessages([
          {role: 'assistant', content: "Hi! I'm Alex, your AI networking assistant. I've learned about your background. How can I help you make valuable connections today?"}
        ]);
      }
    }
  };

  const handleChatSubmit = async () => {
    if (chatInput.trim()) {
      const userMessage = {role: 'user', content: chatInput};
      setChatMessages(prev => [...prev, userMessage]);
      setChatInput('');

      // Simulate AI response based on user's background
      setTimeout(() => {
        let response = "I can help you with that! ";
        if (chatInput.toLowerCase().includes('google') || chatInput.toLowerCase().includes('tech')) {
          response += `Given your background${answers[2] ? ` at ${answers[2]}` : ''}, I'd recommend leveraging your existing network for warm introductions. Let me suggest some strategies...`;
        } else if (chatInput.toLowerCase().includes('investor') || chatInput.toLowerCase().includes('funding')) {
          response += "For investor connections, I recommend targeting VCs who've invested in companies similar to yours. Your alumni network could be valuable here.";
        } else {
          response += "Based on your profile, I can suggest several networking approaches. What specific outcome are you hoping to achieve?";
        }
        
        setChatMessages(prev => [...prev, {role: 'assistant', content: response}]);
      }, 1000);
    }
  };

  const isOnboardingComplete = step >= questions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Business Chat Friend Demo</h1>
          <p className="text-xl text-slate-300 mb-8">Click the purple chat icon below to start!</p>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700/50">
            <h2 className="text-2xl font-semibold text-white mb-4">How It Works:</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-purple-400">1. Onboarding (5 Questions)</h3>
                <ul className="text-slate-300 space-y-1 text-sm">
                  <li>• Your hometown</li>
                  <li>• Education background</li>
                  <li>• Work history</li>
                  <li>• Current projects</li>
                  <li>• Personal interests</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-blue-400">2. AI-Powered Chat</h3>
                <ul className="text-slate-300 space-y-1 text-sm">
                  <li>• OpenAI GPT-4o integration</li>
                  <li>• Context-aware responses</li>
                  <li>• Personalized networking advice</li>
                  <li>• Professional conversation memory</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110"
          >
            <MessageCircle size={24} />
          </button>
        )}

        {isOpen && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-80 h-96 flex flex-col">
            {/* Header */}
            <div className="bg-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="font-semibold">
                {isOnboardingComplete ? "Chat with Alex" : `Question ${step + 1} of ${questions.length}`}
              </h3>
              <button onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {!isOnboardingComplete ? (
                // Onboarding
                <div className="space-y-4">
                  <p className="text-white font-medium">{questions[step]}</p>
                  <input
                    type="text"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                    className="w-full bg-slate-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Type your answer..."
                    autoFocus
                  />
                  <button
                    onClick={handleAnswerSubmit}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded transition-colors"
                  >
                    {step < questions.length - 1 ? 'Next' : 'Start Chatting'}
                  </button>
                  
                  {answers.length > 0 && (
                    <div className="mt-4 text-sm text-slate-400">
                      <p>Previous answers:</p>
                      {answers.map((answer, i) => (
                        <p key={i} className="truncate">• {answer}</p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Chat
                <div className="space-y-3">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`p-2 rounded text-sm ${
                      msg.role === 'user' 
                        ? 'bg-purple-600 text-white ml-4' 
                        : 'bg-slate-700 text-slate-200 mr-4'
                    }`}>
                      {msg.content}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Input */}
            {isOnboardingComplete && (
              <div className="p-4 border-t border-slate-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                    className="flex-1 bg-slate-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Ask Alex for networking help..."
                  />
                  <button
                    onClick={handleChatSubmit}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}