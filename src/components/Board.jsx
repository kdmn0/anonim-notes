import React, { useState, useEffect } from 'react';
import './Board.css';
import Note from './Note';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

const MOCK_MESSAGES = [
  { id: 1, content: "Bu proje harika olacak!", color: "#ff7eb9", position_x: 20, position_y: 30 },
  { id: 2, content: "Anonim olmak bazen rahatlatıcıdır.", color: "#7afcff", position_x: 50, position_y: 60 },
  { id: 3, content: "Supabase bağlantısı henüz yapılmadı. Bilgileri girin!", color: "#feff9c", position_x: 70, position_y: 20 },
];

function Board() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setMessages(MOCK_MESSAGES);
        setLoading(false);
      }, 500);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase.from('messages').select('*');
      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        // Zaten lokalden eklendiyse (aynı id) tekrar ekleme
        setMessages((prev) => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => prev.map(m => m.id === payload.new.id ? payload.new : m));
      })
      .subscribe();

    // Kendi eklediğimiz notların anında görünmesi için Local Event Listener
    const handleLocalAdd = (e) => {
      const newMsg = e.detail;
      setMessages((prev) => {
        if (prev.find(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    };
    window.addEventListener('noteAddedLocally', handleLocalAdd);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('noteAddedLocally', handleLocalAdd);
    };
  }, []);

  const handleMoveEnd = async (id, newX, newY) => {
    if (!isSupabaseConfigured) return;
    
    // Optimistic Update: Ekranda anında pozisyonu güncelle
    setMessages((prev) => prev.map(m => m.id === id ? { ...m, position_x: newX, position_y: newY } : m));

    // Supabase veritabanını güncelle
    const { error } = await supabase
      .from('messages')
      .update({ position_x: newX, position_y: newY })
      .eq('id', id);
      
    if (error) {
      console.error("Not taşınırken hata oluştu:", error);
    }
  };

  if (loading) {
    return <div className="board-message">Panodaki notlar yükleniyor...</div>;
  }

  return (
    <div className="board-container">
      {messages.length === 0 && (
        <div className="board-message">Henüz kimse bir şey yazmamış. İlk yazan sen ol!</div>
      )}
      {messages.map((msg) => (
        <Note key={msg.id} message={msg} onMoveEnd={handleMoveEnd} />
      ))}
    </div>
  );
}

export default Board;
