import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import './AddNoteForm.css';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

const COLORS = [
  '#feff9c', // Yellow
  '#ff7eb9', // Pink
  '#7afcff', // Blue
  '#b2ff9e', // Green
  '#ffc085', // Orange
];

function AddNoteForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown takibi
  React.useEffect(() => {
    let interval;
    if (cooldown > 0) {
      interval = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || cooldown > 0) return;

    // Son mesaj atma zamanını kontrol et (10 saniye bekleme süresi)
    const lastPostTime = localStorage.getItem('lastPostTime');
    const now = Date.now();
    if (lastPostTime && now - parseInt(lastPostTime) < 10000) {
      const remaining = Math.ceil((10000 - (now - parseInt(lastPostTime))) / 1000);
      setCooldown(remaining);
      return;
    }

    setIsSubmitting(true);
    const newNote = {
      content: content.slice(0, 250), // Frontend'de de ekstra garanti kesme
      color: selectedColor,
      position_x: Math.floor(Math.random() * 80) + 10,
      position_y: Math.floor(Math.random() * 70) + 10,
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('messages').insert([newNote]).select();
      if (!error && data && data.length > 0) {
        window.dispatchEvent(new CustomEvent('noteAddedLocally', { detail: data[0] }));
        localStorage.setItem('lastPostTime', now.toString());
        setCooldown(10); // Başarılı olunca 10 saniye bekleme başlat
      }
    } else {
      console.log('Mock Not Eklendi:', newNote);
      alert('Supabase bağlı değil. Mesaj sadece console\'a yazdırıldı.');
    }

    setContent('');
    setIsOpen(false);
    setIsSubmitting(false);
  };

  return (
    <>
      <button className="fab-button" onClick={() => setIsOpen(true)}>
        <Plus size={32} />
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsOpen(false)}>
              <X size={24} />
            </button>
            <h2>Yeni Not Ekle</h2>
            
            <form onSubmit={handleSubmit}>
              <textarea
                placeholder="Aklından geçenleri yaz..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={200}
                autoFocus
              />
              
              <div className="color-picker">
                {COLORS.map(color => (
                  <div
                    key={color}
                    className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={!content.trim() || cooldown > 0 || isSubmitting}
              >
                {cooldown > 0 ? `Bekleyin (${cooldown}sn)` : isSubmitting ? 'Asılıyor...' : 'Panoya As'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AddNoteForm;
