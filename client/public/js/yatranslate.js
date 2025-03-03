/*!***************************************************
 * yatranslate.js v1.0.1
 * https://Get-Web.Site/
 * author: Vitalii P.
 *****************************************************/

const yatranslate = {
    lang: "hy",  // Default language (Armenian)
    langFirstVisit: "en" // First-time visit translation language
};

const flagEmojis = {
    hy: "🇦🇲",
    en: "🇬🇧",
    ru: "🇷🇺",
    fr: "🇫🇷"
};

document.addEventListener("DOMContentLoaded", function () {
    console.log("Yandex Translate script loaded");
    yaTranslateInit();
});

function yaTranslateInit() {
    console.log("yaTranslateInit");

    let savedLang = yaTranslateGetCode();

    // If first-time visit, set the language to langFirstVisit
    if (!savedLang) {
        yaTranslateSetLang(yatranslate.lang);
    }

    console.log("Current language:", savedLang);

    if (savedLang === "hy") {
        console.log("Armenian language is selected. No translation needed.");
        yaTranslateRemoveWidget();
        return;
    }

    // Load Yandex Translate widget
    yaTranslateLoadWidget(savedLang);

    // Click event for language change
    yaTranslateEventHandler("click", "[data-ya-lang]", function (el) {
        let lang = el.getAttribute("data-ya-lang");

        if (lang === "hy") {
            console.log("Switching back to Armenian...");
            yaTranslateSetLang("hy");
            yaTranslateRemoveWidget();
            window.location.reload();
        } else {
            console.log(`Translating to ${lang}`);
            yaTranslateSetLang(lang);
            window.location.reload();
        }
    });

    // Update UI
    yaTranslateHtmlHandler(savedLang);
}

function yaTranslateLoadWidget(lang) {
    console.log(`Loading Yandex Translate for ${lang}...`);
    
    let script = document.createElement("script");
    script.src = `https://translate.yandex.net/website-widget/v1/widget.js?widgetId=ytWidget&pageLang=${yatranslate.lang}&widgetTheme=light&autoMode=false`;
    script.id = "yandex-translate-script";

    document.head.appendChild(script);
}

function yaTranslateRemoveWidget() {
    console.log("Removing Yandex Translate widget...");

    let script = document.getElementById("yandex-translate-script");
    if (script) {
        script.remove();
    }
}

function yaTranslateSetLang(lang) {
    localStorage.setItem("yt-widget", JSON.stringify({ lang: lang, active: true }));
}

function yaTranslateGetCode() {
    let data = localStorage.getItem("yt-widget");
    return data ? JSON.parse(data).lang : yatranslate.lang;
}

function yaTranslateHtmlHandler(code) {
    let activeLangElement = document.querySelector("[data-lang-active]");
    if (activeLangElement) {
        activeLangElement.innerHTML = flagEmojis[code];
    }

    let selectedLangElement = document.querySelector(`[data-ya-lang="${code}"]`);
    if (selectedLangElement) {
        selectedLangElement.remove();
    }
}

function yaTranslateEventHandler(event, selector, handler) {
    document.addEventListener(event, function (e) {
        let el = e.target.closest(selector);
        if (el) handler(el);
    });
}
