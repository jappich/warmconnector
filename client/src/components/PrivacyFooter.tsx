import { Shield, Lock, CheckCircle } from 'lucide-react';

export default function PrivacyFooter() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 mb-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold mb-2">Enterprise Security</h4>
              <p className="text-sm text-gray-300">
                Bank-level encryption protects all your data. We never store passwords or access private content.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Lock className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold mb-2">Your Data, Your Control</h4>
              <p className="text-sm text-gray-300">
                Disconnect platforms anytime. Delete your account instantly. You own your information completely.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold mb-2">Privacy Promise</h4>
              <p className="text-sm text-gray-300">
                We never sell your data. No ads. No tracking. Used only for connection matching.
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              © 2024 WarmConnector. All rights reserved. Your privacy is our priority.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/security" className="text-gray-300 hover:text-white transition-colors">
                Security
              </a>
              <a href="/terms" className="text-gray-300 hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}