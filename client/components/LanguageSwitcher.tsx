"use client";
import React, { useEffect, useState } from 'react'
import "@/public/css/yatranslate.css";

declare global {
    interface Window {
        yaTranslateInit: () => void;
        yaTranslateSetLang: (lang: string) => void;
    }
}

function LanguageSwitcher() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        console.log("isOpen", isOpen);
        
     }, [isOpen]);
    useEffect(() => {
        const interval = setInterval(() => {
            if (typeof window !== "undefined" && window.yaTranslateInit) {
                window.yaTranslateInit();
                clearInterval(interval);
            }
        }, 50);    
        return () => clearInterval(interval);
    }, []);
    
    const handleLanguageChange = (lang: string) => {
        if (typeof window !== "undefined") {
            window.yaTranslateSetLang(lang);
            window.location.reload();
        }
    };
    
    return (
        <div className="lang lang_fixed" onClick={() => setIsOpen(!isOpen)}>
          <div id="ytWidget" style={{ display: "none" }}></div>
      
          {/* Selected Language */}
          <div className="lang__link lang__link_select" data-lang-active="">
            🇦🇲
          </div>
      
          {/* Dropdown Flags */}
          <div className="lang__list" data-lang-list="">
            <div className="lang__link lang__link_sub" onClick={() => handleLanguageChange("ru")}>
              🇷🇺
            </div>
            <div className="lang__link lang__link_sub" onClick={() => handleLanguageChange("en")}>
              🇬🇧
            </div>
            <div className="lang__link lang__link_sub" onClick={() => handleLanguageChange("fr")}>
              🇫🇷
            </div>
            <div className="lang__link lang__link_sub" onClick={() => handleLanguageChange("hy")}>
              🇦🇲
            </div>
          </div>
        </div>
    );
      
      
    
}

export default LanguageSwitcher
