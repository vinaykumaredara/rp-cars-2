import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { systemInstruction } from '../constants/aiPrompt';

type Message = {
    role: 'user' | 'model';
    content: string;
};

// --- IMPORTANT SETUP ---
// This app reads the Gemini API key from environment variables,
// making it secure and ready for deployment on services like Netlify.
// FIX: Use process.env.API_KEY as per the coding guidelines.
const API_KEY = process.env.API_KEY;

// Initialize the AI client once at the module level for performance.
let ai: GoogleGenAI | null = null;
// FIX: Use API_KEY to check if AI is enabled.
const isAiEnabled = !!API_KEY;

if (isAiEnabled) {
    try {
        // FIX: Initialize with the correct API_KEY variable.
        ai = new GoogleGenAI({ apiKey: API_KEY });
    } catch (e) {
        console.error("Failed to initialize Google Gemini AI:", e);
    }
} else {
    // FIX: Update the warning message to reference API_KEY.
    console.warn("API_KEY environment variable is not set. AI Assistant is disabled.");
}


const ChatBubble: React.FC<{ message: Message; }> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`rounded-lg px-4 py-2 max-w-sm ${isUser ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'
          }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};

const TypingIndicator = () => (
    <div className="flex justify-start mb-4">
        <div className="rounded-lg px-4 py-2 bg-gray-200 text-gray-800">
            <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
        </div>
    </div>
);

const AIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !ai) return;

        const userMessage: Message = { role: 'user', content: userInput };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userInput,
                config: {
                    systemInstruction,
                },
            });

            const modelMessage: Message = { role: 'model', content: response.text.trim() };
            setMessages(prev => [...prev, modelMessage]);

        } catch (error) {
            const errorMessage: Message = { role: 'model', content: "Sorry, I'm having trouble connecting right now. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <>
            {/* FAB */}
            <button
                onClick={() => isAiEnabled && setIsOpen(true)}
                disabled={!isAiEnabled}
                className="fixed bottom-6 right-6 bg-primary text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-300 z-50 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                // FIX: Update the title attribute to reference API_KEY.
                title={!isAiEnabled ? "AI Assistant is disabled. Set the API_KEY environment variable to enable it." : "Open Booking Assistant"}
                aria-label={!isAiEnabled ? "AI Assistant (disabled)" : "Open Booking Assistant"}
            >
                <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </button>

            {/* Modal */}
            {isOpen && isAiEnabled && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end justify-end z-[100]">
                    <div
                        className="bg-white rounded-tl-lg shadow-2xl w-full max-w-md h-[70vh] flex flex-col m-4 transform transition-transform duration-300 ease-out"
                        style={{ transform: isOpen ? 'translateY(0)' : 'translateY(100%)' }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-bold text-foreground">Booking Assistant</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Chat History */}
                        <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
                            <ChatBubble message={{ role: 'model', content: "Hello! How can I help you with the booking process today?" }} />
                            {messages.map((msg, index) => (
                                <ChatBubble key={index} message={msg} />
                            ))}
                            {isLoading && <TypingIndicator />}
                        </div>

                        {/* Input Form */}
                        <div className="p-4 border-t">
                            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    placeholder="Ask a question..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-primary focus:border-primary"
                                    disabled={isLoading}
                                    aria-label="Chat input"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !ai}
                                    className="bg-primary text-white p-3 rounded-full hover:bg-primary-hover disabled:bg-opacity-50"
                                    aria-label="Send message"
                                >
                                    <svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIAssistant;
