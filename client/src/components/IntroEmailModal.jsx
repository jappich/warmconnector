import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

/**
 * Modal component for displaying and copying generated introduction emails
 */

/**
 * Modal component for displaying and copying generated introduction emails
 */
const IntroEmailModal = ({ email, onClose }) => {
  const [copied, setCopied] = useState(false);

  // Copy email content to clipboard
  const copyToClipboard = () => {
    const fullEmail = `To: ${email.to}
${email.cc ? `CC: ${email.cc}\n` : ''}
Subject: ${email.subject}

${email.body}`;

    navigator.clipboard.writeText(fullEmail).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!email) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative max-w-2xl w-full bg-gray-900 border border-indigo-500/30 rounded-lg shadow-2xl shadow-indigo-500/20 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header with glow effect */}
        <div className="bg-gray-800/70 border-b border-indigo-500/30 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Introduction Email</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Email content area */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* Email header */}
          <div className="space-y-3 mb-5">
            <div className="flex">
              <span className="text-gray-400 w-24">To:</span>
              <span className="text-white font-medium flex-1">{email.to}</span>
            </div>
            
            {email.cc && (
              <div className="flex">
                <span className="text-gray-400 w-24">CC:</span>
                <span className="text-white font-medium flex-1">{email.cc}</span>
              </div>
            )}
            
            <div className="flex">
              <span className="text-gray-400 w-24">Subject:</span>
              <span className="text-white font-medium flex-1">{email.subject}</span>
            </div>
          </div>
          
          {/* Separator with glow */}
          <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent my-4"></div>
          
          {/* Email body */}
          <div className="text-gray-200 whitespace-pre-line">
            {email.body}
          </div>
        </div>
        
        {/* Actions footer */}
        <div className="p-4 bg-gray-800/70 border-t border-indigo-500/30 flex justify-end">
          <button
            onClick={copyToClipboard}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all 
              ${copied 
                ? 'bg-green-600/20 text-green-400 border border-green-500/50' 
                : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/50 hover:bg-indigo-600/30'}
            `}
          >
            {copied ? (
              <>
                <Check size={16} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy to Clipboard
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntroEmailModal;