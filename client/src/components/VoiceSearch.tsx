import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useTranslation } from '../i18n/translations';
import type { Language } from '../i18n/translations';

interface VoiceSearchProps {
  onResult: (text: string) => void;
  currentLang?: Language;
}

const VoiceSearch: React.FC<VoiceSearchProps> = ({ onResult, currentLang = 'en' }) => {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      // Match recognition language to app language
      if (currentLang === 'hi') rec.lang = 'hi-IN';
      else if (currentLang === 'mr') rec.lang = 'mr-IN';
      else rec.lang = 'en-IN';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        onResult(text);
      };

      setRecognition(rec);
    }
  }, [currentLang, onResult]);

  const toggleListening = () => {
    if (!recognition) {
      alert("Voice speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <div className="voice-search-container" style={{ display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={toggleListening}
        className={`btn ${isListening ? 'btn-danger pulse-button' : 'btn-secondary'}`}
        style={{
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
        title={isListening ? t('micListening') : t('micLabel')}
      >
        {isListening ? (
          <>
            <Mic size={22} color="white" />
            <span className="voice-ripple"></span>
          </>
        ) : (
          <Mic size={22} />
        )}
      </button>
      {isListening && (
        <span style={{ marginLeft: '12px', fontSize: '0.9rem', color: '#ef4444', fontWeight: 600 }}>
          {t('micListening')}
        </span>
      )}
    </div>
  );
};

export default VoiceSearch;
