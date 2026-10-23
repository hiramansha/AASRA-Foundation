
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* =========================================
     AASRA FOUNDATION
     Frontend + Cloudflare API
  ========================================= */

  const API_BASE_URL =
    "https://aasra-foundation.23-st-028.workers.dev";

  // BILINGUAL MESSAGES
  function getLanguage() {
    return localStorage.getItem("aasra-language") === "ur"
      ? "ur"
      : "en";
  }

  function showMessage(element, english, urdu, isError = false) {
    if (!element) return;

    const language = getLanguage();

    element.textContent = language === "ur" ? urdu : english;
    element.setAttribute("dir", language === "ur" ? "rtl" : "ltr");
    element.setAttribute("role", "status");
    element.setAttribute("aria-live", "polite");
    element.classList.toggle("error", isError);
  }

  // MOBILE NAVIGATION
  const menuToggle = document.getElementById("menu-toggle");
  const mainNav = document.getElementById("main-nav");

  function closeMenu() {
    if (!menuToggle || !mainNav) return;

    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }

  if (menuToggle && mainNav) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-controls", "main-nav");

    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("is-open");

      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
      );
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", (event) => {
      if (
        !mainNav.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 850) closeMenu();
    });
  }

  // FOOTER YEAR
  const yearElement = document.getElementById("current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // SMOOTH SCROLLING
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
      });

      if (window.location.hash !== targetId) {
        history.replaceState(null, "", targetId);
      }
    });
  });

  // LOCALSTORAGE FORM HANDLER
  // Used by the Help Request form only.
  function setupLocalStorageForm(
    formIds,
    messageId,
    storageKey,
    successMessage
  ) {
    const ids = Array.isArray(formIds) ? formIds : [formIds];

    const form = ids
      .map((id) => document.getElementById(id))
      .find(Boolean);

    const messageElement = document.getElementById(messageId);

    if (!form || !messageElement) return;

    if (form.dataset.localStorageReady === "true") return;
    form.dataset.localStorageReady = "true";

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      messageElement.textContent = "";

      if (!form.reportValidity()) return;

      const emailField = form.querySelector('input[type="email"]');

      if (emailField && emailField.value.trim()) {
        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          emailField.value.trim()
        );

        if (!validEmail) {
          emailField.setCustomValidity(
            "Please enter a valid email address."
          );
          emailField.reportValidity();
          emailField.setCustomValidity("");
          return;
        }
      }

      const formData = {};

      new FormData(form).forEach((value, key) => {
        if (typeof value === "string") {
          formData[key] = value.trim();
        }
      });

      try {
        const existingValue = localStorage.getItem(storageKey);
        const savedData = existingValue
          ? JSON.parse(existingValue)
          : [];

        if (!Array.isArray(savedData)) {
          throw new Error("Unexpected saved data format.");
        }

        savedData.push({
          ...formData,
          savedAt: new Date().toISOString()
        });

        localStorage.setItem(storageKey, JSON.stringify(savedData));

        const messages = {
          en: "Your demo help request has been saved in this browser.",
          ur: "آپ کی مدد کی درخواست اس براؤزر میں محفوظ ہو گئی ہے۔"
        };

        showMessage(
          messageElement,
          messages.en || successMessage,
          messages.ur || successMessage
        );

        form.reset();
      } catch (error) {
        console.error("AASRA local storage error:", error);

        showMessage(
          messageElement,
          "Could not save your information in this browser. Please try again.",
          "آپ کی معلومات محفوظ نہیں ہو سکیں۔ براہِ کرم دوبارہ کوشش کریں۔",
          true
        );
      }
    });
  }

  // HELP REQUEST FORM
  setupLocalStorageForm(
    ["help-form"],
    "help-message",
    "aasra_help_requests",
    "Your demo help request has been saved in this browser."
  );

  // SHARED API FORM SUBMISSION HELPER
  async function submitToAPI({
    form,
    messageElement,
    endpoint,
    payload,
    submitButton,
    successEnglish,
    successUrdu,
    errorEnglish,
    errorUrdu
  }) {
    const originalButtonText = submitButton
      ? submitButton.textContent
      : "";

    if (submitButton) {
      submitButton.disabled = true;

      if (submitButton.tagName === "BUTTON") {
        submitButton.textContent =
          getLanguage() === "ur" ? "بھیجا جا رہا ہے..." : "Sending...";
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Request failed.");
      }

      showMessage(
        messageElement,
        result.message || successEnglish,
        successUrdu
      );

      form.reset();
    } catch (error) {
      console.error(`AASRA API error (${endpoint}):`, error);

      showMessage(
        messageElement,
        errorEnglish,
        errorUrdu,
        true
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;

        if (submitButton.tagName === "BUTTON") {
          submitButton.textContent = originalButtonText;
        }
      }
    }
  }

  // VOLUNTEER FORM — CLOUDFLARE API
  const volunteerForm = [
    document.getElementById("volunteer-form-element"),
    document.getElementById("volunteer-form")
  ].find(Boolean);

  const volunteerMessage = document.getElementById("volunteer-message");

  if (volunteerForm && volunteerMessage) {
    if (volunteerForm.dataset.apiReady !== "true") {
      volunteerForm.dataset.apiReady = "true";

      volunteerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        volunteerMessage.textContent = "";

        if (!volunteerForm.reportValidity()) return;

        const formData = new FormData(volunteerForm);

        const payload = {
          name: String(formData.get("name") || "").trim(),
          email: String(formData.get("email") || "").trim(),
          phone: String(formData.get("phone") || "").trim(),
          skills: String(formData.get("skills") || "").trim(),
          availability: String(
            formData.get("availability") || ""
          ).trim(),
          message: String(formData.get("message") || "").trim()
        };

        if (
          !payload.name ||
          !payload.email ||
          !payload.phone ||
          !payload.skills ||
          !payload.availability
        ) {
          showMessage(
            volunteerMessage,
            "Please complete all required fields.",
            "براہِ کرم تمام ضروری خانے پُر کریں۔",
            true
          );
          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
          showMessage(
            volunteerMessage,
            "Please enter a valid email address.",
            "براہِ کرم درست ای میل ایڈریس درج کریں۔",
            true
          );
          return;
        }

        const submitButton = volunteerForm.querySelector(
          'button[type="submit"], input[type="submit"]'
        );

        await submitToAPI({
          form: volunteerForm,
          messageElement: volunteerMessage,
          endpoint: "/api/volunteer",
          payload,
          submitButton,
          successEnglish:
            "Thank you for volunteering! Your application was submitted successfully.",
          successUrdu:
            "رضاکار بننے کا شکریہ! آپ کی درخواست کامیابی سے جمع ہو گئی ہے۔",
          errorEnglish:
            "We could not submit your volunteer application. Please try again later.",
          errorUrdu:
            "آپ کی رضاکارانہ درخواست جمع نہیں ہو سکی۔ براہِ کرم دوبارہ کوشش کریں۔"
        });
      });
    }
  }

  // CONTACT FORM — CLOUDFLARE API
  const contactForm = document.getElementById("contact-form");
  const contactMessage = document.getElementById("contact-message");

  if (contactForm && contactMessage) {
    contactMessage.setAttribute("role", "status");
    contactMessage.setAttribute("aria-live", "polite");

    if (contactForm.dataset.apiReady !== "true") {
      contactForm.dataset.apiReady = "true";

      contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        contactMessage.textContent = "";

        if (!contactForm.reportValidity()) return;

        const formData = new FormData(contactForm);

        const payload = {
          name: String(formData.get("name") || "").trim(),
          email: String(formData.get("email") || "").trim(),
          message: String(formData.get("message") || "").trim()
        };

        if (!payload.name || !payload.email || !payload.message) {
          showMessage(
            contactMessage,
            "Please complete your name, email, and message.",
            "براہِ کرم اپنا نام، ای میل اور پیغام مکمل درج کریں۔",
            true
          );
          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
          showMessage(
            contactMessage,
            "Please enter a valid email address.",
            "براہِ کرم درست ای میل ایڈریس درج کریں۔",
            true
          );
          return;
        }

        const submitButton = contactForm.querySelector(
          'button[type="submit"], input[type="submit"]'
        );

        await submitToAPI({
          form: contactForm,
          messageElement: contactMessage,
          endpoint: "/api/contact",
          payload,
          submitButton,
          successEnglish:
            "Your message has been submitted successfully.",
          successUrdu:
            "آپ کا پیغام کامیابی سے جمع ہو گیا ہے۔",
          errorEnglish:
            "We could not send your message. Please try again later.",
          errorUrdu:
            "آپ کا پیغام نہیں بھیجا جا سکا۔ براہِ کرم کچھ دیر بعد دوبارہ کوشش کریں۔"
        });
      });
    }
  }

  // ESCAPE KEY: REMOVE FOCUS FROM INPUTS
  document.querySelectorAll("input, textarea").forEach((element) => {
    element.addEventListener("keydown", (event) => {
      if (event.key === "Escape") element.blur();
    });
  });
});
