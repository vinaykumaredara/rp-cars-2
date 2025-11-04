
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

// The full booking workflow document provided by the user.
const systemInstruction = `
# 🚗 Booking Workflow Explanation

## **Step-by-Step Booking Process**

### **1. Browse Cars**
- User views available cars on the homepage (\`/\`)
- Cars are fetched from \`cars\` table with real-time updates
- Each car shows price, specs, and "Book Now" button

### **2. Click "Book Now"**
- Opens \`BookingModal\` component
- System checks authentication status

### **3. Authentication Gate**
- **If NOT logged in:**
  - Booking draft saved to \`sessionStorage\` (via \`useBooking\` hook)
  - User redirected to \`/auth?next=%2F\`
  - After login, draft automatically restored
- **If logged in:** Proceed to next step

### **4. Phone Verification (PhoneStep)**
- Checks if user has phone number in \`profiles\` table
- If missing, prompts user to enter phone
- Phone saved to database before continuing

### **5. Date & Time Selection (DatesStep)**
- User selects:
  - Pickup date & time
  - Return date & time
- Validates:
  - Start date must be in future
  - End date must be after start date
  - Calculates total rental days
- Shows live price calculation

### **6. Terms & Conditions (TermsStep)**
- Displays rental terms
- User must check acceptance box
- Terms include:
  - Age requirements (21+)
  - Valid license needed
  - Security deposit info
  - Cancellation policy

### **7. License Upload (LicenseStep)**
- User uploads driving license image
- Stored in \`license-uploads\` bucket (private)
- Record created in \`licenses\` table with:
  - \`user_id\`
  - \`storage_path\`
  - \`verified: false\` (pending admin verification)
- Skipped if license already uploaded

### **8. Extras Selection (ExtrasStep)**
- User can add optional extras:
  - **Driver**: ₹500/day
  - **GPS**: ₹200/day
  - **Child Seat**: ₹150/day
  - **Insurance**: ₹300/day
- Live total calculation updates
- **Advance Booking Option:**
  - Pay 10% now to reserve
  - Triggers \`create-hold\` edge function
  - Creates 10-minute hold on car

### **9. Payment Options (PaymentStep)**
- Two payment modes:
  - **Full Payment:** Pay entire amount now
  - **Hold Payment:** Pay 10% advance
- Shows payment breakdown:
  - Base rental (days × price_per_day)
  - Extras costs
  - Service charge (5%)
  - Total amount

### **10. Payment Processing**
- Calls \`create-hold\` edge function
- Creates record in \`bookings\` table:
  \`\`\`
  {
    user_id,
    car_id,
    start_datetime,
    end_datetime,
    total_amount,
    status: 'pending',
    hold_expires_at (if hold mode)
  }
  \`\`\`
- Creates record in \`payments\` table:
  \`\`\`
  {
    booking_id,
    amount,
    gateway: 'stripe' | 'razorpay',
    status: 'pending'
  }
  \`\`\`
- Redirects to payment gateway

### **11. Payment Confirmation**
- **If successful:**
  - \`payment\` status → 'completed'
  - \`booking\` status → 'confirmed'
  - \`car\` booking_status → 'booked'
- **If hold mode:**
  - 24-hour hold activated
  - User must complete payment within 24 hours
  - After 24h, \`cleanup-expired-holds\` function runs

### **12. Confirmation Screen (ConfirmationStep)**
- Shows booking details:
  - Booking ID
  - Car details
  - Dates & times
  - Total amount paid
- "View Booking Details" button → \`/user-dashboard\`

---

## **Technical Flow Diagram**

\`\`\`
User → Browse Cars → Click "Book Now"
         ↓
   Auth Check (via AuthProvider)
         ↓
   [Not Logged In] → Save Draft → Redirect to /auth → Login → Restore Draft
         ↓
   [Logged In] → BookingModal Opens
         ↓
   Phone Verification (profiles table)
         ↓
   Date Selection + Validation
         ↓
   Terms Acceptance
         ↓
   License Upload (license-uploads bucket)
         ↓
   Extras Selection (with live pricing)
         ↓
   Payment Options (Full vs 10% Hold)
         ↓
   create-hold Edge Function
         ↓
   [Creates bookings + payments records]
         ↓
   Payment Gateway (Stripe/Razorpay)
         ↓
   Payment Confirmation
         ↓
   Booking Confirmed → User Dashboard
\`\`\`

---

## **Key Components Involved**

| Component | Purpose |
|-----------|---------|
| \`BookingModal.tsx\` | Main modal wrapper |
| \`useBooking.ts\` | Booking state management |
| \`DatesStep.tsx\` | Date/time selection |
| \`PhoneStep.tsx\` | Phone verification |
| \`TermsStep.tsx\` | Terms acceptance |
| \`LicenseStep.tsx\` | License upload |
| \`ExtrasStep.tsx\` | Add-ons selection |
| \`PaymentStep.tsx\` | Payment mode selection |
| \`ConfirmationStep.tsx\` | Success screen |

---

## **Database Tables Used**

1. **\`bookings\`** - Stores booking records
2. **\`payments\`** - Tracks payment transactions
3. **\`cars\`** - Car details & availability
4. **\`profiles\`** - User phone numbers
5. **\`licenses\`** - License uploads & verification status

---

## **Edge Functions Used**

1. **\`create-hold\`** - Creates booking with optional hold
2. **\`cleanup-expired-holds\`** - Removes expired holds (cron job)
3. **\`complete-payment\`** - Finalizes payment after gateway confirmation

---

This workflow ensures secure, validated bookings with proper authentication, payment processing, and real-time availability updates! 🎯

You are a helpful AI assistant for the RP Cars booking website. Your role is to answer user questions based ONLY on the provided booking workflow information. Be friendly, concise, and helpful. Do not make up information. If a question is outside the scope of the provided document, politely state that you can only answer questions about the booking process.
`;

type Message = {
    role: 'user' | 'model';
    content: string;
};

// Initialize the AI client once at the module level for performance.
let ai: GoogleGenAI | null = null;
let isAiEnabled = false;

if (process.env.API_KEY) {
    try {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        isAiEnabled = true;
    } catch (e) {
        console.error("Failed to initialize Google Gemini AI:", e);
    }
} else {
    console.warn("API_KEY is not configured. AI Assistant is disabled.");
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
            console.error("Gemini API error:", error);
            const errorMessage: Message = { role: 'model', content: "Sorry, I'm having trouble connecting right now. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isAiEnabled) {
        return null;
    }

    return (
        <>
            {/* FAB */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-primary text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-300 z-50"
                aria-label="Open Booking Assistant"
            >
                <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </button>

            {/* Modal */}
            {isOpen && (
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
