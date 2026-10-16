
(() => {
  const languageButton = document.getElementById("language-toggle");

  if (!languageButton) return;

  let currentLanguage = "en";

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

  function setLanguage(language) {
    currentLanguage = language;

    document.documentElement.lang = language;
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
    document.body.dir = language === "ur" ? "rtl" : "ltr";

    document.querySelectorAll("[data-en][data-ur]").forEach((element) => {
      const translation = element.dataset[language];

      if (translation !== undefined) {
        element.innerHTML = translation;
      }
    });

    Object.entries(placeholders[language]).forEach(([id, placeholder]) => {
      const field = document.getElementById(id);
      if (field) field.placeholder = placeholder;
    });

    languageButton.textContent = language === "en" ? "اردو" : "English";
    languageButton.setAttribute(
      "aria-label",
      language === "en" ? "Switch to Urdu" : "Switch to English"
    );

    languageButton.setAttribute("aria-pressed", String(language === "ur"));
  }

  languageButton.addEventListener("click", () => {
    setLanguage(currentLanguage === "en" ? "ur" : "en");
  });

  setLanguage("en");
})();
