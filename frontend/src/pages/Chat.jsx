import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
import { socket } from "../services/socket";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { user } = useAuth();
  const location = useLocation();
  const [chats, setChats] = useState([]);
  const [active, setActive] = useState(location.state?.activeChat || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef();

  useEffect(() => {
    api.get("/chat").then((r) => {
      let fetchedChats = r.data;
      if (location.state?.activeChat) {
        if (!fetchedChats.find(c => c._id === location.state.activeChat._id)) {
          fetchedChats = [location.state.activeChat, ...fetchedChats];
        }
        setActive(location.state.activeChat);
      }
      setChats(fetchedChats);
    });
    
    const handleNotif = ({ chatId, message }) => {
      setChats((prev) => {
        if (!prev.find((c) => c._id === chatId)) {
          api.get("/chat").then(r => setChats(r.data));
          return prev;
        }
        return prev.map(c => c._id === chatId ? { ...c, lastMessage: message.text } : c);
      });
    };
    socket.on("chat:notification", handleNotif);
    return () => socket.off("chat:notification", handleNotif);
  }, [user._id, location.state?.activeChat]);

  useEffect(() => {
    if (!active) return;
    socket.emit("chat:join", active._id);
    api.get(`/chat/${active._id}/messages`).then((r) => setMessages(r.data));
    const handler = (msg) => { if (msg.chat === active._id) setMessages((m) => [...m, msg]); };
    socket.on("chat:message", handler);
    return () => socket.off("chat:message", handler);
  }, [active]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const partner = (c) => c?.participants.find((p) => p._id !== user._id);

  const send = async () => {
    if (!text.trim() || !active) return;
    const { data } = await api.post("/chat/message", { chatId: active._id, text });
    
    const receiverId = partner(active)?._id;
    socket.emit("chat:message", { chatId: active._id, message: data, receiverId });
    
    setMessages((m) => [...m, data]);
    setChats((prev) => prev.map(c => c._id === active._id ? { ...c, lastMessage: data.text } : c));
    setText("");
  };

  return (
    <div className="container section">
      <h1 className="mb-2">Messages</h1>
      <div className="chat-wrap">
        <div className="chat-list">
          {chats.length === 0 && <div style={{ padding: "1rem" }} className="muted">No conversations yet.</div>}
          {chats.map((c) => (
            <div key={c._id} className={`item ${active?._id === c._id ? "active" : ""}`} onClick={() => setActive(c)}>
              <strong>{partner(c)?.name}</strong>
              <div className="muted" style={{ fontSize: ".8rem" }}>{c.lastMessage || "No messages yet"}</div>
            </div>
          ))}
        </div>
        <div className="chat-panel">
          {active ? (
            <>
              <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
                <strong>{partner(active)?.name}</strong>
              </div>
              <div className="chat-msgs">
                {messages.map((m) => (
                  <div key={m._id} className={`msg ${m.sender === user._id ? "me" : "them"}`}>{m.text}</div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="chat-input">
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message..." />
                <button className="btn" onClick={send}>Send</button>
              </div>
            </>
          ) : (
            <div style={{ padding: "2rem", textAlign: "center" }} className="muted">Select a conversation</div>
          )}
        </div>
      </div>
    </div>
  );
}
