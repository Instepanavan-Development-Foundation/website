"use client"
import React, { useEffect, useState } from 'react'
import "@/public/css/yatranslate.css";

enum Language {
    HY = 'hy',
    EN = 'en',
    RU = 'ru',
    FR = 'fr'
}

const flagEmojis: Record<Language, string> = {
    [Language.HY]: "🇦🇲",
    [Language.EN]: "🇬🇧",
    [Language.RU]: "🇷🇺",
    [Language.FR]: "🇫🇷"
};

declare global {
    interface Window {
        yaTranslateInit: () => void;
        yaTranslateSetLang: (lang: string) => void;
    }
}

function LanguageSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLang, setSelectedLang] = useState<Language>(Language.HY); // Default to Armenian

    useEffect(() => {
        const interval = setInterval(() => {
            if (typeof window !== "undefined" && window.yaTranslateInit) {
                window.yaTranslateInit();
                clearInterval(interval);
            }
        }, 50);    
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const savedLang = localStorage.getItem("yt-widget");
        if (savedLang) {
            const parsedLang = JSON.parse(savedLang)?.lang || "hy";
            setSelectedLang(parsedLang as Language);
        }
    }, []);

    const handleLanguageChange = (lang: Language) => {
        if (typeof window !== "undefined") {
            window.yaTranslateSetLang(lang);
            localStorage.setItem("yt-widget", JSON.stringify({ lang: lang, active: true }));
            setSelectedLang(lang);
            window.location.reload();
        }
    };

    return (
        <div className="lang lang_fixed" onClick={() => setIsOpen(!isOpen)}>
          <div id="ytWidget" style={{ display: "none" }}></div>
          <div className="lang__link lang__link_select" data-lang-active="">
            {flagEmojis[selectedLang]}
          </div>
          <div className="lang__list" data-lang-list="">
            {Object.values(Language).map((lang) => (
                <div key={lang} className="lang__link lang__link_sub" onClick={() => handleLanguageChange(lang)}>
                  {flagEmojis[lang]}
                </div>
            ))}
          </div>
        </div>
    );
}

export default LanguageSwitcher;
