import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, MessageSquareQuote, CheckCircle } from 'lucide-react';

export default function MultilingualSection() {
  const { t, setLanguage, language } = useLanguage();

  const languageCards = [
    {
      code: 'en',
      name: 'English',
      native: 'English',
      sampleText: 'Submit and track your public grievance with transparency.',
      badge: 'Default',
    },
    {
      code: 'ta',
      name: 'Tamil',
      native: 'தமிழ்',
      sampleText: 'உங்கள் பொது குறைகளை வெளிப்படைத்தன்மையுடன் பதிவு செய்யுங்கள்.',
      badge: 'Regional',
    },
    {
      code: 'hi',
      name: 'Hindi',
      native: 'हिन्दी',
      sampleText: 'पारदर्शिता के साथ अपनी सार्वजनिक शिकायत दर्ज करें और ट्रैक करें।',
      badge: 'Regional',
    },
    {
      code: 'te',
      name: 'Telugu',
      native: 'తెలుగు',
      sampleText: 'పారదర్శకతతో మీ ప్రజా ఫిర్యాదును సమర్పించండి మరియు ట్రాక్ చేయండి.',
      badge: 'Regional',
    },
    {
      code: 'kn',
      name: 'Kannada',
      native: 'ಕನ್ನಡ',
      sampleText: 'ಪಾರದರ್ಶಕತೆಯೊಂದಿಗೆ ನಿಮ್ಮ ಸಾರ್ವಜನಿಕ ಕುಂದುಕೊರತೆಯನ್ನು ಸಲ್ಲಿಸಿ.',
      badge: 'Regional',
    },
    {
      code: 'ml',
      name: 'Malayalam',
      native: 'മലയാളം',
      sampleText: 'സുതാര്യതയോടെ നിങ്ങളുടെ പരാതി സമർപ്പിക്കുകയും ട്രാക്ക് ചെയ്യുകയും ചെയ്യുക.',
      badge: 'Regional',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md bg-gov-100 text-gov-800 text-xs font-semibold tracking-wider uppercase">
            <Globe className="w-3.5 h-3.5" />
            <span>{t('home.feature2Title', 'Inclusive Civic Access')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('home.heroSubtitle', 'Public Services in Your Language')}
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            {t('footer.description', 'Language should never be a barrier to accessing public grievance services.')}
          </p>
        </div>

        {/* Language Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {languageCards.map((lang, idx) => {
            const isSelected = language === lang.code;
            return (
              <div 
                key={idx}
                onClick={() => setLanguage(lang.code)}
                className={`border rounded-xl p-6 transition-all shadow-subtle flex flex-col justify-between cursor-pointer group ${
                  isSelected 
                    ? 'bg-gov-50/80 border-gov-600 ring-2 ring-gov-600/20 shadow-md' 
                    : 'bg-slate-50 border-slate-200 hover:border-gov-400 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-slate-900">
                      {lang.native}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                      isSelected ? 'bg-gov-900 text-white border-gov-900' : 'bg-white text-slate-600 border-slate-200'
                    }`}>
                      {lang.name}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-sm text-slate-600 font-normal leading-relaxed bg-white/70 p-3 rounded-lg border border-slate-200/60">
                    <div className="flex items-start space-x-2">
                      <MessageSquareQuote className="w-4 h-4 text-gov-600 mt-0.5 shrink-0" />
                      <span className="italic">{lang.sampleText}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'text-gov-800' : 'text-emerald-600'}`} />
                    <span>{isSelected ? t('status.completed', 'Active Interface Language') : t('common.apply', 'Click to switch interface')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Note Box */}
        <div className="mt-10 p-4 bg-gov-50 border border-gov-200 rounded-xl text-center max-w-2xl mx-auto">
          <p className="text-xs text-gov-900 font-medium">
            {t('home.heroSubtitle', 'Citizens can type grievances naturally in any supported regional language. Semantic analysis maps intent directly to government departments.')}
          </p>
        </div>

      </div>
    </section>
  );
}
