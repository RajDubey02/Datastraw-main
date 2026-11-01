import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Sparkles,
  CheckCircle,
  Clock,
  User,
  Phone,
  RefreshCw,
  Send,
  AlertTriangle,
  Lock,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { fetchConversations, fetchConversationById, approveAIDraft } from '../services/api';
import { formatMessageTime, formatRelativeTime } from '../utils/dateFormatter';

export default function AgentView({ isAgentLoggedIn, onOpenLogin }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [activeData, setActiveData] = useState(null);
  const [draftInput, setDraftInput] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveSuccessMsg, setApproveSuccessMsg] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const loadedDraftIdRef = useRef(null);

  // Load conversations list
  const loadConversations = async (silent = false) => {
    if (!isAgentLoggedIn) return;
    if (!silent) setLoadingList(true);
    try {
      const list = await fetchConversations();
      setConversations(list || []);

      // If no conversation currently selected, select the top one
      if (!selectedConvId && list && list.length > 0) {
        setSelectedConvId(list[0]._id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (!silent) setLoadingList(false);
    }
  };

  // Load active conversation details
  const loadActiveConversation = async (convId, silent = false) => {
    if (!isAgentLoggedIn || !convId) return;
    if (!silent) setLoadingDetail(true);
    try {
      const data = await fetchConversationById(convId);
      setActiveData(data);
      if (data.activeDraft) {
        // Only initialize draft input if this draft hasn't been loaded yet
        // Never overwrite if user is currently editing, clearing, or modifying it
        if (loadedDraftIdRef.current !== data.activeDraft._id) {
          loadedDraftIdRef.current = data.activeDraft._id;
          setDraftInput(data.activeDraft.draftText || '');
        }
      } else {
        loadedDraftIdRef.current = null;
        setDraftInput('');
      }
    } catch (err) {
      console.error('Failed to load active conversation:', err);
    } finally {
      if (!silent) setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (isAgentLoggedIn) {
      loadConversations();
      if (selectedConvId) {
        loadActiveConversation(selectedConvId);
      }
      const interval = setInterval(() => {
        loadConversations(true);
        if (selectedConvId) {
          loadActiveConversation(selectedConvId, true);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAgentLoggedIn, selectedConvId]);

  // If not logged in, show lock screen prompting login
  if (!isAgentLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Agent Authentication Required</h2>
          <p className="text-xs text-gray-500 mt-1">
            As specified in the assessment requirements, only authenticated support specialists can access customer conversations and approve AI drafts.
          </p>
        </div>
        <button
          onClick={onOpenLogin}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Sign In to Agent Portal</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const handleApproveDraft = async () => {
    if (!draftInput.trim() || !selectedConvId || approving) return;

    setApproving(true);
    setApproveSuccessMsg(null);
    try {
      await approveAIDraft(
        selectedConvId,
        draftInput.trim(),
        activeData?.activeDraft?._id
      );
      loadedDraftIdRef.current = null;
      setDraftInput('');
      setApproveSuccessMsg('Reply approved and added to customer conversation!');
      setTimeout(() => setApproveSuccessMsg(null), 3500);

      // Refresh active conversation and conversations list
      await loadActiveConversation(selectedConvId, true);
      await loadConversations(true);
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[calc(100vh-140px)] min-h-[560px] sm:h-[750px]">
        {/* Left Sidebar: Conversation List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex-col bg-slate-50/50 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3.5 sm:p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Conversations</h2>
              <p className="text-[11px] text-gray-500">Sorted by newest activity</p>
            </div>
            <button
              onClick={() => loadConversations(false)}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                No active conversations yet.
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv._id === selectedConvId;
                const cust = conv.customer || {};
                return (
                  <button
                    key={conv._id}
                    onClick={() => {
                      if (conv._id !== selectedConvId) {
                        loadedDraftIdRef.current = null;
                      }
                      setSelectedConvId(conv._id);
                      setMobileShowChat(true);
                    }}
                    className={`w-full p-3.5 sm:p-4 text-left transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 border-blue-600'
                        : 'hover:bg-white bg-slate-50/30'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {cust.name ? cust.name.charAt(0) : 'C'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-semibold text-gray-900 truncate">
                          {cust.name || 'Anonymous Customer'}
                        </h4>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {formatRelativeTime(conv.lastMessageAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-500 truncate mt-1">
                        {conv.lastSenderType === 'agent' ? 'You: ' : ''}
                        {conv.lastMessageText || 'No message text'}
                      </p>

                      {conv.hasPendingDraft && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>AI Draft Ready</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center / Right: Conversation Thread + AI Draft Box */}
        <div className={`flex-1 flex-col bg-white ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
          {activeData ? (
            <>
              {/* Header */}
              <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-1.5 -ml-1 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                    title="Back to conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                    {activeData.customer?.name ? activeData.customer.name.charAt(0) : 'C'}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[150px] sm:max-w-none">
                      {activeData.customer?.name || 'Customer'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {activeData.customer?.phone || 'N/A'}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium">Open</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] sm:text-xs text-gray-400">
                  <span className="hidden sm:inline">Customer ID: </span><code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono text-[10px] sm:text-[11px]">{activeData.customer?.customerId}</code>
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                {activeData.messages.map((msg, idx) => {
                  const isAgent = msg.senderType === 'agent';
                  return (
                    <div
                      key={msg._id || idx}
                      className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-xs text-sm leading-relaxed ${
                          isAgent
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-xs'
                        }`}
                      >
                        <div
                          className={`text-[10px] font-semibold mb-1 ${
                            isAgent ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {isAgent ? 'Agent (Approved Reply)' : activeData.customer?.name || 'Customer'}
                        </div>
                        <p className="whitespace-pre-line">{msg.text}</p>
                        <div
                          className={`text-[10px] mt-1 text-right ${
                            isAgent ? 'text-blue-200' : 'text-gray-400'
                          }`}
                        >
                          {formatMessageTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Approval Success Notification Banner */}
              {approveSuccessMsg && (
                <div className="mx-4 mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{approveSuccessMsg}</span>
                </div>
              )}

              {/* AI Draft Review & Approval Card */}
              {activeData.activeDraft ? (
                <div className="p-4 border-t border-gray-200 bg-linear-to-b from-blue-50/40 to-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-blue-100 text-blue-700">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        AI Suggested Reply
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-200">
                        Knowledge Base Grounded
                      </span>
                    </div>

                    <span className="text-[11px] text-gray-500">
                      Edit if needed before approving
                    </span>
                  </div>

                  {activeData.activeDraft.failureReason && (
                    <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Note: AI Fallback policy was used ({activeData.activeDraft.failureReason})</span>
                    </div>
                  )}

                  <div className="relative">
                    <textarea
                      rows={3}
                      value={draftInput}
                      onChange={(e) => setDraftInput(e.target.value)}
                      className="w-full text-sm p-3 border border-blue-200 rounded-xl bg-white shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none leading-relaxed transition"
                      placeholder="Suggested AI reply will appear here for review..."
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-[11px] text-gray-500">
                      Clicking <strong>Approve</strong> will publish this reply to the customer's open conversation.
                    </p>
                    <button
                      type="button"
                      onClick={handleApproveDraft}
                      disabled={approving || !draftInput.trim()}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{approving ? 'Approving...' : 'Approve & Send to Customer'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>All customer messages in this conversation have been answered.</span>
                  </div>
                  <span className="text-[11px] text-gray-400">Waiting for next customer message...</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <MessageSquare className="w-12 h-12 stroke-1 text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-600">Select a conversation from the left</p>
              <p className="text-xs text-gray-400 mt-1">Review customer questions and approve AI drafts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
