import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getAppKitModalStatus } from '../lib/appkit';
import { CustomLoginButton } from '../components/CustomLoginButton';

export function KeyboardTestPage() {
  const [emailInput, setEmailInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textareaInput, setTextareaInput] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testEmailInput = () => {
    const testEmail = 'test@example.com';
    setEmailInput(testEmail);
    addTestResult(`Email input test: Successfully typed "${testEmail}"`);
  };

  const testMKey = () => {
    const testText = 'Testing M key: MMMM mmmm';
    setTextInput(testText);
    addTestResult(`M key test: Successfully typed "${testText}"`);
  };

  const testAppKitModal = () => {
    const isOpen = getAppKitModalStatus();
    addTestResult(`AppKit modal status: ${isOpen ? 'OPEN' : 'CLOSED'}`);
  };

  const clearAll = () => {
    setEmailInput('');
    setTextInput('');
    setTextareaInput('');
    setTestResults([]);
    addTestResult('All inputs cleared');
  };

  return (
    <div className="min-h-screen bg-black py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">Keyboard Input Test</h1>
          <p className="text-white/60 text-lg">
            Test keyboard input functionality, especially the "M" key in various input fields
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Fields */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">Input Fields</h2>
            
            <div className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email Input (try typing ".com")
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Type your email here..."
                  className="w-full px-4 py-3 rounded-xl bg-[#1A1E2E] border border-[#2A2E3E] text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Text Input (try typing "M" characters)
                </label>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type text with M characters..."
                  className="w-full px-4 py-3 rounded-xl bg-[#1A1E2E] border border-[#2A2E3E] text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Textarea (multi-line text)
                </label>
                <textarea
                  value={textareaInput}
                  onChange={(e) => setTextareaInput(e.target.value)}
                  placeholder="Type multi-line text here..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-[#1A1E2E] border border-[#2A2E3E] text-white focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              {/* Test Buttons */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={testEmailInput}
                  className="glass-button bg-blue-600 hover:bg-blue-700"
                >
                  Test Email
                </button>
                <button
                  onClick={testMKey}
                  className="glass-button bg-green-600 hover:bg-green-700"
                >
                  Test M Key
                </button>
                <button
                  onClick={testAppKitModal}
                  className="glass-button bg-purple-600 hover:bg-purple-700"
                >
                  Check AppKit
                </button>
                <button
                  onClick={clearAll}
                  className="glass-button bg-red-600 hover:bg-red-700"
                >
                  Clear All
                </button>
              </div>

              {/* AppKit Login Button for Testing */}
              <div className="mt-4 p-4 bg-[#1A1E2E] rounded-xl border border-[#2A2E3E]">
                <h3 className="text-sm font-semibold text-white/80 mb-2">AppKit Modal Test:</h3>
                <p className="text-xs text-white/60 mb-3">
                  Click the login button below, then try typing "M" in the AppKit modal's email field.
                </p>
                <CustomLoginButton />
              </div>
            </div>
          </motion.div>

          {/* Test Results */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">Test Results</h2>
            
            <div className="space-y-4">
              <div className="bg-[#1A1E2E] rounded-xl p-4 border border-[#2A2E3E]">
                <h3 className="text-lg font-semibold text-white mb-3">Instructions:</h3>
                <ul className="text-white/70 space-y-2 text-sm">
                  <li>• Try typing in each input field above</li>
                  <li>• Pay special attention to the "M" key</li>
                  <li>• Test typing ".com" in the email field</li>
                  <li>• Use keyboard shortcuts (M for mute) outside input fields</li>
                  <li>• Verify that M key works normally in input fields</li>
                </ul>
              </div>

              <div className="bg-[#1A1E2E] rounded-xl p-4 border border-[#2A2E3E] max-h-64 overflow-y-auto">
                <h3 className="text-lg font-semibold text-white mb-3">Activity Log:</h3>
                {testResults.length === 0 ? (
                  <p className="text-white/50 text-sm">No test results yet...</p>
                ) : (
                  <div className="space-y-1">
                    {testResults.map((result, index) => (
                      <div key={index} className="text-sm text-white/70 font-mono">
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-green-400 mb-2">Expected Behavior:</h3>
                <ul className="text-green-300/80 space-y-1 text-sm">
                  <li>✓ M key should work normally in all input fields</li>
                  <li>✓ M key should toggle mute when NOT typing in inputs</li>
                  <li>✓ No interference with typing ".com" in email fields</li>
                  <li>✓ All keyboard shortcuts work outside input fields</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Current Input Values Display */}
        <motion.div
          className="mt-8 glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">Current Input Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1A1E2E] rounded-xl p-4 border border-[#2A2E3E]">
              <h3 className="text-sm font-semibold text-white/80 mb-2">Email:</h3>
              <p className="text-white font-mono text-sm break-all">
                {emailInput || '(empty)'}
              </p>
            </div>
            <div className="bg-[#1A1E2E] rounded-xl p-4 border border-[#2A2E3E]">
              <h3 className="text-sm font-semibold text-white/80 mb-2">Text:</h3>
              <p className="text-white font-mono text-sm break-all">
                {textInput || '(empty)'}
              </p>
            </div>
            <div className="bg-[#1A1E2E] rounded-xl p-4 border border-[#2A2E3E]">
              <h3 className="text-sm font-semibold text-white/80 mb-2">Textarea:</h3>
              <p className="text-white font-mono text-sm break-all whitespace-pre-wrap">
                {textareaInput || '(empty)'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
