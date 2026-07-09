'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Conversation {
  phone: string;
  displayName: string;
  lastMessage: string;
  lastTimestamp: number;
  messageCount: number;
}

interface MessageEntry {
  id: string;
  phone: string;
  direction: 'sent' | 'received';
  text: string;
  timestamp: number;
  type: 'text' | 'template' | 'image' | 'document';
  templateName?: string;
}

export default function ConversationsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!apiKey) return;
    try {
      const res = await fetch('/api/admin/conversations', {
        headers: { 'x-api-key': apiKey },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
    } catch {
      console.error('Failed to fetch conversations');
    }
    setLoading(false);
  }, [apiKey]);

  const fetchMessages = useCallback(
    async (phone: string) => {
      if (!apiKey) return;
      try {
        const res = await fetch(`/api/admin/conversations?phone=${encodeURIComponent(phone)}`, {
          headers: { 'x-api-key': apiKey },
        });
        if (res.ok) {
          const data = await res.json();
          const cleaned = phone.replace(/[^0-9]/g, '');
          setMessages(data.messages?.[cleaned] || []);
        }
      } catch {
        console.error('Failed to fetch messages');
      }
    },
    [apiKey]
  );

  useEffect(() => {
    if (!authenticated || !apiKey) return;
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [authenticated, apiKey, fetchConversations]);

  useEffect(() => {
    if (!selectedPhone) return;
    fetchMessages(selectedPhone);
    const interval = setInterval(() => fetchMessages(selectedPhone), 10000);
    return () => clearInterval(interval);
  }, [selectedPhone, fetchMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (phone: string) => {
    setSelectedPhone(phone);
    setMobileView('chat');
    if (!messages.length || messages[0]?.phone !== phone.replace(/[^0-9]/g, '')) {
      fetchMessages(phone);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.displayName.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  if (!authenticated) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h1 style={styles.loginLogo}>ADYAWEAR</h1>
          <p style={styles.loginSubtitle}>Conversations</p>
          <input
            type="password"
            placeholder="Admin API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchConversations()}
            style={styles.loginInput}
            autoFocus
          />
          <button onClick={fetchConversations} style={styles.loginButton}>
            Access Conversations
          </button>
        </div>
      </div>
    );
  }

  const selectedConv = conversations.find((c) => c.phone === selectedPhone);

  return (
    <div style={styles.container}>
      {/* Conversation List */}
      <div
        style={{
          ...styles.sidebar,
          display: mobileView === 'list' ? 'flex' : 'none',
        }}
        className="sidebar-panel"
      >
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarHeaderTop}>
            <h2 style={styles.sidebarTitle}>Conversations</h2>
            <span style={styles.conversationCount}>{conversations.length}</span>
          </div>
          <div style={styles.searchContainer}>
            <svg style={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a5a5a" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
              className="search-input"
            />
          </div>
        </div>
        <div style={styles.conversationList}>
          {loading ? (
            <div style={styles.emptyState}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={styles.skeletonItem}>
                  <div style={styles.skeletonAvatar} />
                  <div style={{ flex: 1 }}>
                    <div style={styles.skeletonLine} />
                    <div style={{ ...styles.skeletonLine, width: '60%', height: 10 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p style={styles.emptyText}>No conversations yet</p>
              <p style={styles.emptySubtext}>Messages will appear here once customers start chatting</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.phone}
                onClick={() => handleSelectConversation(conv.phone)}
                className="conv-item"
                style={{
                  ...styles.conversationItem,
                  background: selectedPhone === conv.phone ? '#1a1a1a' : 'transparent',
                  borderLeft: selectedPhone === conv.phone ? '3px solid #C4964A' : '3px solid transparent',
                }}
              >
                <div style={styles.avatar}>
                  {conv.displayName.replace(/[^0-9]/g, '').slice(-2)}
                </div>
                <div style={styles.conversationContent}>
                  <div style={styles.conversationTop}>
                    <span style={styles.conversationName}>{conv.displayName}</span>
                    <span style={styles.timestamp}>{formatTime(conv.lastTimestamp)}</span>
                  </div>
                  <div style={styles.conversationBottom}>
                    <span style={styles.lastMessage}>{conv.lastMessage}</span>
                    {conv.messageCount > 0 && (
                      <span style={styles.messageBadge}>{conv.messageCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Thread */}
      <div
        style={{
          ...styles.chatPanel,
          display: mobileView === 'chat' ? 'flex' : 'flex',
        }}
        className="chat-panel"
      >
        {selectedPhone && selectedConv ? (
          <>
            <div style={styles.chatHeader}>
              <button
                onClick={() => setMobileView('list')}
                style={styles.backButton}
                className="mobile-back"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4964A" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div style={styles.chatHeaderAvatar}>
                {selectedConv.displayName.replace(/[^0-9]/g, '').slice(-2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.chatHeaderName}>{selectedConv.displayName}</div>
                <div style={styles.chatHeaderStatus}>Online</div>
              </div>
              <button
                onClick={fetchConversations}
                style={styles.refreshButton}
                title="Refresh"
                className="refresh-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A7E72" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>
            </div>
            <div style={styles.messageList}>
              {messages.length === 0 ? (
                <div style={styles.emptyChatState}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <p style={styles.emptyChatText}>No messages in this conversation</p>
                  <p style={styles.emptyChatSubtext}>Messages will appear here when the customer sends a message</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isSent = msg.direction === 'sent';
                  const showTimestamp =
                    idx === 0 ||
                    messages[idx - 1].direction !== msg.direction ||
                    messages[idx - 1].timestamp + 300000 < msg.timestamp;

                  return (
                    <div key={msg.id} style={{ marginBottom: 4 }}>
                      {showTimestamp && (
                        <div style={styles.dateDivider}>
                          <span style={styles.dateDividerText}>
                            {formatDate(msg.timestamp)}
                          </span>
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: isSent ? 'flex-end' : 'flex-start',
                          padding: '2px 24px',
                        }}
                      >
                        <div
                          style={{
                            ...styles.messageBubble,
                            background: isSent ? '#1a2a1a' : '#1a1a22',
                            border: isSent
                              ? '1px solid #2a4a2a'
                              : '1px solid #2a2a3a',
                            borderLeft: isSent
                              ? '3px solid #4ade80'
                              : '3px solid #C4964A',
                            borderTopLeftRadius: isSent ? 16 : 4,
                            borderTopRightRadius: isSent ? 4 : 16,
                          }}
                        >
                          <p style={styles.messageText}>{msg.text}</p>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              marginTop: 4,
                            }}
                          >
                            <span style={styles.messageTime}>
                              {formatHour(msg.timestamp)}
                            </span>
                            {isSent && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="#4ade80" stroke="none">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>
          </>
        ) : (
          <div style={styles.noSelectionState}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <h2 style={styles.noSelectionTitle}>ADYAWEAR Conversations</h2>
            <p style={styles.noSelectionText}>
              Select a conversation from the left panel to view messages
            </p>
          </div>
        )}
      </div>

      <style>{responsiveCSS}</style>
    </div>
  );
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatHour(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

const responsiveCSS = `
  * {
    scrollbar-width: thin;
    scrollbar-color: #1a1a1a transparent;
  }
  *::-webkit-scrollbar {
    width: 6px;
  }
  *::-webkit-scrollbar-track {
    background: transparent;
  }
  *::-webkit-scrollbar-thumb {
    background: #1a1a1a;
    border-radius: 3px;
  }
  .search-input:focus {
    border-color: #C4964A !important;
    box-shadow: 0 0 0 2px rgba(196, 150, 74, 0.15) !important;
  }
  .conv-item:hover {
    background: #131313 !important;
  }
  .refresh-btn:hover {
    background: #1a1a1a !important;
  }
  @media (max-width: 767px) {
    .sidebar-panel {
      width: 100% !important;
      border-right: none !important;
    }
    .chat-panel {
      width: 100% !important;
    }
    .mobile-back {
      display: flex !important;
    }
  }
  @media (min-width: 768px) {
    .mobile-back {
      display: none !important;
    }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    background: '#0a0a0a',
    color: '#e0e0e0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    overflow: 'hidden',
  },
  loginContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#0a0a0a',
  },
  loginBox: {
    background: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    padding: '48px 40px',
    maxWidth: 400,
    width: '90%',
    textAlign: 'center' as const,
  },
  loginLogo: {
    color: '#C4964A',
    fontSize: 28,
    fontWeight: 300,
    letterSpacing: 6,
    textTransform: 'uppercase' as const,
    margin: 0,
  },
  loginSubtitle: {
    color: '#8A7E72',
    fontSize: 14,
    letterSpacing: 2,
    marginTop: 4,
    marginBottom: 32,
  },
  loginInput: {
    width: '100%',
    padding: '14px 16px',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    color: '#e0e0e0',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  loginButton: {
    marginTop: 16,
    width: '100%',
    padding: '14px 24px',
    background: '#C4964A',
    color: '#0a0806',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  sidebar: {
    width: 380,
    minWidth: 380,
    display: 'flex',
    flexDirection: 'column' as const,
    borderRight: '1px solid #1a1a1a',
    background: '#0d0d0d',
    height: '100vh',
  },
  sidebarHeader: {
    padding: '16px 16px 8px',
    borderBottom: '1px solid #1a1a1a',
    flexShrink: 0,
  },
  sidebarHeaderTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#e0e0e0',
    margin: 0,
    letterSpacing: 1,
  },
  conversationCount: {
    background: '#1a1a1a',
    color: '#8A7E72',
    fontSize: 12,
    padding: '2px 10px',
    borderRadius: 12,
    fontWeight: 500,
  },
  searchContainer: {
    position: 'relative' as const,
    marginBottom: 8,
  },
  searchIcon: {
    position: 'absolute' as const,
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 36px',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    color: '#e0e0e0',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  },
  conversationList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '4px 0',
  },
  conversationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    borderBottom: '1px solid #111',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#1a1a1a',
    border: '2px solid #2a2a2a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: '#C4964A',
    flexShrink: 0,
  },
  conversationContent: {
    flex: 1,
    minWidth: 0,
  },
  conversationTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e0e0e0',
  },
  timestamp: {
    fontSize: 11,
    color: '#5a5a5a',
    flexShrink: 0,
  },
  conversationBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  lastMessage: {
    fontSize: 13,
    color: '#8A7E72',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    flex: 1,
  },
  messageBadge: {
    background: '#1a2a1a',
    color: '#4ade80',
    fontSize: 11,
    fontWeight: 600,
    padding: '1px 8px',
    borderRadius: 12,
    flexShrink: 0,
  },
  chatPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    background: '#0a0a0a',
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderBottom: '1px solid #1a1a1a',
    background: '#0d0d0d',
    flexShrink: 0,
  },
  backButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#1a1a1a',
    border: '2px solid #2a2a2a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 600,
    color: '#C4964A',
  },
  chatHeaderName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#e0e0e0',
  },
  chatHeaderStatus: {
    fontSize: 11,
    color: '#4ade80',
  },
  refreshButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 8,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px 0',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: '10px 14px',
    borderRadius: 16,
    position: 'relative' as const,
  },
  messageText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.5,
    color: '#e0e0e0',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  messageTime: {
    fontSize: 10,
    color: '#5a5a5a',
  },
  dateDivider: {
    display: 'flex',
    justifyContent: 'center',
    padding: '16px 0',
  },
  dateDividerText: {
    background: '#1a1a1a',
    color: '#8A7E72',
    fontSize: 11,
    padding: '4px 12px',
    borderRadius: 12,
  },
  noSelectionState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 40,
  },
  noSelectionTitle: {
    color: '#C4964A',
    fontSize: 20,
    fontWeight: 300,
    letterSpacing: 3,
    margin: 0,
  },
  noSelectionText: {
    color: '#5a5a5a',
    fontSize: 14,
    margin: 0,
    textAlign: 'center' as const,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '60px 20px',
  },
  emptyText: {
    color: '#5a5a5a',
    fontSize: 14,
    fontWeight: 500,
    margin: 0,
    marginTop: 8,
  },
  emptySubtext: {
    color: '#3a3a3a',
    fontSize: 12,
    margin: 0,
    textAlign: 'center' as const,
    maxWidth: 280,
  },
  emptyChatState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: '100%',
    padding: 40,
  },
  emptyChatText: {
    color: '#5a5a5a',
    fontSize: 14,
    fontWeight: 500,
    margin: 0,
    marginTop: 8,
  },
  emptyChatSubtext: {
    color: '#3a3a3a',
    fontSize: 12,
    margin: 0,
    textAlign: 'center' as const,
    maxWidth: 280,
  },
  skeletonItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#1a1a1a',
    flexShrink: 0,
  },
  skeletonLine: {
    height: 12,
    background: '#1a1a1a',
    borderRadius: 4,
    marginBottom: 8,
    width: '80%',
  },
};
