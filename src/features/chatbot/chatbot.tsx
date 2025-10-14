"use client";
import Button from "@/common/components/Button";
import { useState, useRef, useEffect } from "react";
import styles from "./ChatWidget.module.css";
import Input from "@/common/components/Input";


interface ChatBotProps {
  messages: { role: string; content: string }[];
  setMessages: React.Dispatch<
    React.SetStateAction<{ role: string; content: string }[]>
  >;
}

export default function Chatbot({messages, setMessages}: ChatBotProps) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message locally
    const history = [...messages, { role: "user", content: input }];
    setMessages(history);
    setInput("");

    // Fetch with streaming
    const res = await fetch("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    // Initialize an empty assistant message
    let assistantMsg = { role: "assistant", content: "" };
    setMessages((m) => [...m, assistantMsg]);

    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      // Decode chunk and accumulate
      buffer += decoder.decode(value, { stream: true });

      // Process full lines
      const lines = buffer.split("\n");
      // Keep the last partial line in buffer
      buffer = lines.pop()!;

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          const text = json.message?.content || "";
          // Append only the content
          assistantMsg.content += text;
          setMessages((m) => [...m.slice(0, -1), { ...assistantMsg }]);
        } catch (err) {
          console.warn("Failed to parse JSON chunk", err);
        }
      }
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {/* scrollable area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          height: 400,
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: 10,
          background: "#fff",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                background: msg.role === "user" ? "#dcf8c6" : "#f1f0f0",
                padding: "8px 12px",
                borderRadius: 12,
                maxWidth: "75%",
                wordBreak: "break-word",
                lineHeight: 1.4,
              }}
            >
                {msg.content.split(" ").map((word, index) =>
                word.match(/https?:\/\/[^\s.]+/) ? (
                  <a
                  key={index}
                  href={word.replace(/\.$/, "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#007bff", textDecoration: "underline" }}
                  >
                  {word.replace(/\.$/, "")}
                  </a>
                ) : (
                  <span key={index}>{word} </span>
                )
                )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* input area */}
      <form onSubmit={handleSubmit} style={{ display: "flex", marginTop: 10, gap: '8px', padding: '8px' }}>
        <Input
          type="text"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
        <Button type="submit" classNameProps={styles.button}>Send</Button>
      </form>
    </div>
  );
}
