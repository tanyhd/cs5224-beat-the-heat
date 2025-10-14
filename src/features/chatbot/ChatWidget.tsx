'use client';
import { useState, useEffect } from 'react';
import Chatbot from '@/features/chatbot/chatbot';
import ChatbotIcon from '@/common/icons/Chatbot';
import styles from './ChatWidget.module.css';

const STORAGE_KEY = 'chat_messages';
const DEFAULT_MSG =  "Hello! I'm your assistant for CardMaster.com. I can help you navigate the website, track your credit card spending, and recommend current credit card offers. How can I assist you today?";
const DEFAULT_ROLE = 'assistant'

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        // Try to parse cached history
        return JSON.parse(raw);
      } else {
        // No cache found → use default welcome
        return [
          {
            role: DEFAULT_ROLE,
            content: DEFAULT_MSG,
          },
        ];
      }
    } catch (err) {
      console.warn('Failed to parse chat history, clearing corrupted cache', err);
      // Remove the corrupt data so it won’t break next time
      window.sessionStorage.removeItem(STORAGE_KEY);
      // Return the same default welcome content
      return [
        {
          role: DEFAULT_ROLE,
          content: DEFAULT_MSG,
        },
      ];
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      console.warn('Could not save chat history');
    }
  }, [messages]);


  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={styles.chatButton}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        <ChatbotIcon stroke="#fff" />
      </button>

      {/* Chat panel, shown when `open` */}
      {open && (
        <div className={styles.chatPanel}>
          <Chatbot messages={messages} setMessages={setMessages} />
        </div>
      )}
    </>
  );
}