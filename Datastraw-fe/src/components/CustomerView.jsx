import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Phone, Sparkles, RefreshCw, MessageSquare, CheckCheck } from 'lucide-react';
import { fetchCustomerConversation, sendCustomerMessage, fetchCustomers } from '../services/api';
import { formatMessageTime } from '../utils/dateFormatter';

const SAMPLE_QUESTIONS = [
  "Hi, my order #4471 hasn't arrived yet. Can I change the delivery address?",
  "What is your return policy?",
  "Do you deliver to Dubai?",
  "Is cash on delivery available for a ₹3,500 order?",
  "I think I'm allergic to the serum I bought. What should I do?"
];

export default function CustomerView() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('cust_1042');
  const [customerName, setCustomerName] = useState('Aisha Khan');
  const [customerPhone, setCustomerPhone] = useState('+919800000001');

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isCustomCustomer, setIsCustomCustomer] = useState(false);

  const chatContainerRef = useRef(null);
  const prevMessagesCountRef = useRef(0);

  // Load sample customers
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await fetchCustomers();
      if (data && data.length > 0) {
        setCustomers(data);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  // Load conversation for current customer
  const loadConversation = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchCustomerConversation(selectedCustomerId);
      const newMessages = data.messages || [];
      setMessages((prev) => {
        // Prevent state change and re-render if messages didn't change
        if (prev.length === newMessages.length) {
          const lastPrev = prev[prev.length - 1];
          const lastNew = newMessages[newMessages.length - 1];
          if (lastPrev?._id === lastNew?._id) return prev;
        }
        return newMessages;
      });
    } catch (err) {
      console.error('Failed to load customer conversation:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadConversation();
    // Poll every 3 seconds to catch newly approved agent replies
    const interval = setInterval(() => {
      loadConversation(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedCustomerId]);

  useEffect(() => {
    // Only scroll internally inside the chat box, NEVER scroll the browser window!
    if (chatContainerRef.current && messages.length > prevMessagesCountRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages]);

  const handleSelectCustomer = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomCustomer(true);
      const newId = `cust_${Date.now()}`;
      setSelectedCustomerId(newId);
      setCustomerName('');
      setCustomerPhone('+91');
      setMessages([]);
    } else {
      setIsCustomCustomer(false);
      setSelectedCustomerId(val);
      const found = customers.find((c) => c.customerId === val);
      if (found) {
        setCustomerName(found.name);
        setCustomerPhone(found.phone);
      }
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text || !text.trim() || sending) return;

    setSending(true);
    try {
      await sendCustomerMessage({
        customerId: selectedCustomerId,
        customerName: customerName || 'Valued Customer',
        customerPhone: customerPhone || '+919800000000',
        text: text.trim()
      });
      setInputMessage('');
      await loadConversation(true);
      // Also refresh customer list in case a new customer was added
      loadCustomers();
    } catch (err) {
      alert(`Error sending message: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header & Customer Picker Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">Customer Chat Simulator</h2>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
              Simulates incoming customer messages as if sent from WhatsApp to the webhook.
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            <div className="flex items-center gap-2 text-xs flex-1 sm:flex-none">
              <label className="text-gray-600 font-medium whitespace-nowrap hidden sm:inline">Switch Customer:</label>
              <select
                value={isCustomCustomer ? 'custom' : selectedCustomerId}
                onChange={handleSelectCustomer}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-auto"
              >
                {customers.map((c) => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.name} ({c.phone})
                  </option>
                ))}
                <option value="custom">+ Create New Customer</option>
              </select>
            </div>

            <button
              onClick={() => loadConversation(false)}
              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition shrink-0"
              title="Refresh conversation"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Custom Customer Input Fields (shown if Custom selected) */}
        {isCustomCustomer && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                placeholder="e.g. Vikram Malhotra"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+919876543210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Test Prompt Chips (Assessment Page 5) */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Quick Assessment Test Prompts (1-click to test AI):</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1.5 sm:flex-wrap sm:pb-0">
          {SAMPLE_QUESTIONS.map((question, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(question)}
              disabled={sending}
              className="text-xs text-left bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/60 rounded-xl px-3 py-1.5 transition-all shadow-2xs hover:shadow-xs disabled:opacity-50 shrink-0 sm:shrink"
            >
              "{question}"
            </button>
          ))}
        </div>
      </div>

      {/* WhatsApp / Chat Message Window */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col h-[480px] sm:h-[540px]">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/60 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              {customerName ? customerName.charAt(0) : 'C'}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{customerName || 'Customer'}</h3>
              <p className="text-xs text-gray-500">{customerPhone} • WhatsApp Customer View</p>
            </div>
          </div>

          <div className="text-xs text-gray-400 bg-white px-2.5 py-1 rounded-md border border-gray-200">
            Approved replies visible only
          </div>
        </div>

        {/* Message Thread */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f0f2f5]/40">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <MessageSquare className="w-10 h-10 mb-2 stroke-1 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">No messages in this conversation yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                Click one of the prompt chips above or type a message below to test the AI draft pipeline.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isCustomer = msg.senderType === 'customer';
              return (
                <div
                  key={msg._id || index}
                  className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-xs text-sm leading-relaxed ${
                      isCustomer
                        ? 'bg-emerald-600 text-white rounded-br-xs'
                        : 'bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs'
                    }`}
                  >
                    {!isCustomer && (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mb-1">
                        <span>Verdant Support Specialist</span>
                      </div>
                    )}
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <div
                      className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                        isCustomer ? 'text-emerald-100' : 'text-gray-400'
                      }`}
                    >
                      <span>{formatMessageTime(msg.timestamp)}</span>
                      {isCustomer && <CheckCheck className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 border-t border-gray-200 bg-white rounded-b-2xl flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type a customer question (e.g. Can I cancel my order?)..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={sending}
            className="flex-1 text-sm px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || sending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Sending...' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
