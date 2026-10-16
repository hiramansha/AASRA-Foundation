
(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const languageButton = document.getElementById("language-toggle");

    if (!languageButton) return;

    const STORAGE_KEY = "aasra-language";

    const placeholders = {
      en: {
        "vol-name": "Your name",
        "vol-email": "you@example.com",
        "contact-name": "Enter your name",
        "contact-email": "Enter your email",
        "contact-subject": "How can we help?",
        "contact-text": "Write your message..."
      },
      ur: {
        "vol-name": "اپنا نام لکھیں",
        "vol-email": "اپنی ای میل لکھیں",
        "contact-name": "اپنا نام لکھیں",
        "contact-email": "اپنی ای میل لکھیں",
        "contact-subject": "ہم آپ کی کیا مدد کر سکتے ہیں؟",
        "contact-text": "اپنا پیغام لکھیں..."
      }
    };

    const buttonLabels = {
      en: {
        text: "اردو",
        ariaLabel: "Switch to Urdu"
      },
      ur: {
        text: "English",
        ariaLabel: "Switch to English"
      }
    };

    const messages = {
      en: {
        volunteer:
          "Demo only: your volunteer interest was not submitted or saved. A secure backend connection is required.",
        contact:
          "Demo only: your message was not sent or saved. A secure backend connection is required."
      },
      ur: {
        volunteer:
          "یہ صرف ڈیمو ہے: آپ کی رضاکارانہ دلچسپی محفوظ یا جمع نہیں ہوئی۔ اس کے لیے محفوظ بیک اینڈ ضروری ہے۔",
        contact:
          "یہ صرف ڈیمو ہے: آپ کا پیغام بھیجا یا محفوظ نہیں ہوا۔ اس کے لیے محفوظ بیک اینڈ ضروری ہے۔"
      }
    };

    function getSavedLanguage() {
      try {
        const savedLanguage = localStorage.getItem(STORAGE_KEY);

        if (savedLanguage === "en" || savedLanguage === "ur") {
          return savedLanguage;
        }
      } catch (error) {
        // Storage may be unavailable in some browsing environments.
      }

      return "en";
    }

    function updatePlaceholders(language) {
      Object.entries(placeholders[language]).forEach(([id, text]) => {
        const field = document.getElementById(id);

        if (field) {
          field.placeholder = text;
        }
      });
    }

    function updateFormMessages(language) {
      const volunteerMessage = document.getElementById("volunteer-message");
      const contactMessage = document.getElementById("contact-message");

      if (volunteerMessage) {
        volunteerMessage.dataset.en = messages.en.volunteer;
        volunteerMessage.dataset.ur = messages.ur.volunteer;
      }

      if (contactMessage) {
        contactMessage.dataset.en = messages.en.contact;
        contactMessage.dataset.ur = messages.ur.contact;
      }

      document.querySelectorAll("[data-en][data-ur]").forEach((element) => {
        if (
          element.id === "volunteer-message" ||
          element.id === "contact-message"
        ) {
          return;
        }

        const translation = element.getAttribute(`data-${language}`);

        if (translation !== null) {
          // Only translate text content; preserve nested HTML and icons.
          if (element.children.length === 0) {
            element.textContent = translation;
          }
        }
      });
    }

    function setLanguage(language) {
      if (language !== "en" && language !== "ur") {
        language = "en";
      }

      const isUrdu = language === "ur";

      document.documentElement.lang = language;
      document.documentElement.dir = isUrdu ? "rtl" : "ltr";
      document.body.dir = isUrdu ? "rtl" : "ltr";

      updatePlaceholders(language);
      updateFormMessages(language);

      languageButton.textContent = buttonLabels[language].text;
      languageButton.setAttribute(
        "aria-label",
        buttonLabels[language].ariaLabel
      );
      languageButton.setAttribute("aria-pressed", String(isUrdu));

      // Keep the selected language for the next visit when possible.
      try {
        localStorage.setItem(STORAGE_KEY, language);
      } catch (error) {
        // Language switching still works without storage.
      }

      document.dispatchEvent(
        new CustomEvent("aasra:languagechange", {
          detail: { language }
        })
      );
    }

    languageButton.addEventListener("click", () => {
      const currentLanguage = document.documentElement.lang;
      setLanguage(currentLanguage === "ur" ? "en" : "ur");
    });

    setLanguage(getSavedLanguage());
  });
})();
