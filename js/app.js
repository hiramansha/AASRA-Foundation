
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const API_BASE_URL =
    "https://aasra-foundation.23-st-028.workers.dev";

  // LANGUAGE
  function getLanguage() {
    return localStorage.getItem("aasra-language") === "ur"
      ? "ur"
      : "en";
  }

  function showMessage(element, english, urdu, isError = false) {
    if (!element) return;

    element.textContent =
      getLanguage() === "ur" ? urdu : english;

    element.setAttribute("dir", getLanguage() === "ur" ? "rtl" : "ltr");
    element.setAttribute("role", "status");
    element.setAttribute("aria-live", "polite");
    element.classList.toggle("error", isError);
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
      const opened = mainNav.classList.toggle("is-open");

      menuToggle.setAttribute("aria-expanded", String(opened));
      menuToggle.setAttribute(
        "aria-label",
        opened ? "Close navigation" : "Open navigation"
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

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      target.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start"
      });

      if (window.location.hash !== targetId) {
        history.replaceState(null, "", targetId);
      }
    });
  });

  // SHARED API SUBMISSION
  async function submitToAPI({
    form,
    messageElement,
    endpoint,
    payload,
    successEnglish,
    successUrdu,
    errorEnglish,
    errorUrdu
  }) {
    const button = form.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    const originalText = button
      ? button.textContent
      : "";

    if (button) {
      button.disabled = true;
      if (button.tagName === "BUTTON") {
        button.textContent =
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
        throw new Error("Invalid server response");
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Request failed");
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
      if (button) {
        button.disabled = false;

        if (button.tagName === "BUTTON") {
          button.textContent = originalText;
        }
      }
    }
  }

  // VOLUNTEER FORM — CLOUDFLARE API
  const volunteerForm = [
    document.getElementById("volunteer-form-element"),
    document.getElementById("volunteer-form")
  ].find(Boolean);

  const volunteerMessage =
    document.getElementById("volunteer-message");

  if (volunteerForm && volunteerMessage) {
    volunteerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      volunteerMessage.textContent = "";

      if (!volunteerForm.reportValidity()) return;

      const data = new FormData(volunteerForm);

      const payload = {
        name: String(data.get("name") || "").trim(),
        email: String(data.get("email") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        skills: String(
          data.get("interest") || data.get("skills") || ""
        ).trim(),
        availability: String(data.get("availability") || "").trim(),
        message: String(data.get("message") || "").trim()
      };

      if (!payload.name || !payload.email || !payload.skills) {
        showMessage(
          volunteerMessage,
          "Please enter your name, email, and area of interest.",
          "براہِ کرم اپنا نام، ای میل اور دلچسپی کا شعبہ درج کریں۔",
          true
        );
        return;
      }

      if (!validEmail(payload.email)) {
        showMessage(
          volunteerMessage,
          "Please enter a valid email address.",
          "براہِ کرم درست ای میل ایڈریس درج کریں۔",
          true
        );
        return;
      }

      await submitToAPI({
        form: volunteerForm,
        messageElement: volunteerMessage,
        endpoint: "/api/volunteer",
        payload,
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

  // CONTACT FORM — CLOUDFLARE API
  const contactForm = document.getElementById("contact-form");
  const contactMessage = document.getElementById("contact-message");

  if (contactForm && contactMessage) {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      contactMessage.textContent = "";

      if (!contactForm.reportValidity()) return;

      const data = new FormData(contactForm);

      const payload = {
        name: String(data.get("name") || "").trim(),
        email: String(data.get("email") || "").trim(),
        message: String(data.get("message") || "").trim()
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

      if (!validEmail(payload.email)) {
        showMessage(
          contactMessage,
          "Please enter a valid email address.",
          "براہِ کرم درست ای میل ایڈریس درج کریں۔",
          true
        );
        return;
      }

      await submitToAPI({
        form: contactForm,
        messageElement: contactMessage,
        endpoint: "/api/contact",
        payload,
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

  // HELP REQUEST FORM
  // Kept as a local demo until its API endpoint is configured.
  const helpForm = document.getElementById("help-form");
  const helpMessage = document.getElementById("help-message");

  if (helpForm && helpMessage) {
    helpForm.addEventListener("submit", (event) => {
      event.preventDefault();
      helpMessage.textContent = "";

      if (!helpForm.reportValidity()) return;

      try {
        const data = new FormData(helpForm);
        const entry = {};

        data.forEach((value, key) => {
          entry[key] = String(value).trim();
        });

        const saved = JSON.parse(
          localStorage.getItem("aasra_help_requests") || "[]"
        );

        if (!Array.isArray(saved)) {
          throw new Error("Invalid saved data");
        }

        saved.push({
          ...entry,
          savedAt: new Date().toISOString()
        });

        localStorage.setItem(
          "aasra_help_requests",
          JSON.stringify(saved)
        );

        showMessage(
          helpMessage,
          "Your help request has been saved in this browser demo.",
          "آپ کی مدد کی درخواست اس براؤزر کے ڈیمو میں محفوظ ہو گئی ہے۔"
        );

        helpForm.reset();
      } catch (error) {
        console.error("AASRA help form error:", error);

        showMessage(
          helpMessage,
          "Could not save your request in this browser.",
          "آپ کی درخواست اس براؤزر میں محفوظ نہیں ہو سکی۔",
          true
        );
      }
    });
  }

  // ESCAPE KEY: REMOVE FOCUS FROM INPUTS
  document.querySelectorAll("input, textarea").forEach((element) => {
    element.addEventListener("keydown", (event) => {
      if (event.key === "Escape") element.blur();
    });
  });
});
