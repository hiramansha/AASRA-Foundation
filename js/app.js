
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

    element.textContent = getLanguage() === "ur" ? urdu : english;
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

  // HELP REQUEST FORM — LOCAL BROWSER DEMO
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

  // PROGRAMS — LOAD FROM CLOUDFLARE BACKEND
  const programsContainer = document.getElementById("programs-container");
  const programsError = document.getElementById("programs-error");

  const programTranslations = {
    "Education for All": {
      category: "تعلیم",
      title: "سب کے لیے تعلیم",
      description:
        "تعلیم، تعلیمی آگاہی اور مطالعے کے وسائل تک رسائی کی حوصلہ افزائی کے لیے ایک مجوزہ اقدام۔",
      linkText: "مزید جانیں ↗",
      image:
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=85"
    },
    "Family Well-being": {
      category: "خاندانی فلاح",
      title: "خاندانی فلاح",
      description:
        "خاندانی مدد، سماجی روابط اور دستیاب وسائل کے بارے میں آگاہی پر مبنی پروگرام کا تصور۔",
      linkText: "مدد کے مواقع دیکھیں ↗",
      image:
        "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=85"
    },
    "Volunteer for Change": {
      category: "رضاکارانہ خدمت",
      title: "تبدیلی کے لیے رضاکار بنیں",
      description:
        "کمیونٹی کی سرگرمیوں میں مدد کے لیے لوگوں کو اپنا وقت اور مہارتیں بانٹنے کی ترغیب دینا۔",
      linkText: "کمیونٹی میں شامل ہوں ↗",
      image:
        "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=85"
    },
    "Health Awareness": {
      category: "صحت",
      title: "صحت سے متعلق آگاہی",
      description:
        "صحت کی تعلیم اور متعلقہ امدادی وسائل کے بارے میں معلومات کو فروغ دینے کا مجوزہ اقدام۔",
      linkText: "خدمات دیکھیں ↗",
      image:
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=85"
    },
    "Community Care": {
      category: "کمیونٹی",
      title: "سماجی خدمت",
      description:
        "مقامی ضروریات کی شناخت اور ممکنہ حل تلاش کرنے کے لیے تعاون اور ہمدردی کو فروغ دینا۔",
      linkText: "رابطہ کریں ↗",
      image:
        "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=800&q=85"
    },
    "Hope and Opportunity": {
      category: "مواقع",
      title: "امید اور مواقع",
      description:
        "ایسے مواقع کے بارے میں آگاہی جو افراد کو اعتماد بڑھانے اور اپنے مقاصد حاصل کرنے میں مدد دے سکیں۔",
      linkText: "ہمارا ساتھ دیں ↗",
      image:
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=85"
    }
  };

  const defaultProgramImage =
    "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=800&q=85";

  function createProgramElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    element.textContent = text;

    return element;
  }

  function createProgramCard(program, index) {
    const language = getLanguage();
    const title = String(program.title || "Community Program");
    const description = String(program.description || "");
    const category = String(program.category || "Community");
    const translation = programTranslations[title];

    const card = document.createElement("article");
    card.className = "service-card";

    const image = document.createElement("img");
    image.src =
      String(program.image_url || "").trim() ||
      (translation ? translation.image : defaultProgramImage);
    image.alt = language === "ur"
      ? (translation ? translation.title : title)
      : title;
    image.loading = "lazy";
    image.decoding = "async";

    image.addEventListener("error", () => {
      image.src = defaultProgramImage;
    }, { once: true });

    const categoryLabel = language === "ur" && translation
      ? translation.category
      : category;

    const eyebrow = createProgramElement(
      "span",
      "eyebrow",
      `${String(index + 1).padStart(2, "0")} · ${categoryLabel}`
    );

    const heading = createProgramElement(
      "h3",
      "",
      language === "ur" && translation ? translation.title : title
    );

    const paragraph = createProgramElement(
      "p",
      "",
      language === "ur" && translation
        ? translation.description
        : description
    );

    const link = document.createElement("a");
    link.className = "text-link";

    let linkText = "Learn More ↗";
    let linkHref = "contact.html";

    if (title === "Family Well-being") {
      linkText = language === "ur" ? "مدد کے مواقع دیکھیں ↗" : "Explore Help Options ↗";
      linkHref = "help.html";
    } else if (title === "Volunteer for Change") {
      linkText = language === "ur" ? "کمیونٹی میں شامل ہوں ↗" : "Join the Community ↗";
      linkHref = "get-involved.html";
    } else if (title === "Health Awareness") {
      linkText = language === "ur" ? "خدمات دیکھیں ↗" : "Explore Services ↗";
      linkHref = "services.html";
    } else if (title === "Hope and Opportunity") {
      linkText = language === "ur" ? "ہمارا ساتھ دیں ↗" : "Get Involved ↗";
      linkHref = "get-involved.html";
    } else if (title === "Education for All") {
      linkText = language === "ur" ? "مزید جانیں ↗" : "Learn More ↗";
      linkHref = "contact.html";
    } else {
      linkText = language === "ur" ? "رابطہ کریں ↗" : "Contact Us ↗";
      linkHref = "contact.html";
    }

    if (translation && language === "ur") {
      linkText = translation.linkText;
    }

    link.href = linkHref;
    link.textContent = linkText;

    card.append(image, eyebrow, heading, paragraph, link);

    return card;
  }

  async function loadPrograms() {
    if (!programsContainer) return;

    if (programsError) programsError.hidden = true;

    programsContainer.replaceChildren(
      createProgramElement(
        "p",
        "",
        getLanguage() === "ur" ? "پروگرام لوڈ ہو رہے ہیں..." : "Loading programs..."
      )
    );

    try {
      const response = await fetch(`${API_BASE_URL}/api/programs`, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Programs request failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !Array.isArray(result.programs)) {
        throw new Error("Invalid programs response");
      }

      const activePrograms = result.programs.filter(
        (program) => String(program.status || "active").toLowerCase() === "active"
      );

      if (activePrograms.length === 0) {
        programsContainer.replaceChildren(
          createProgramElement(
            "p",
            "",
            getLanguage() === "ur"
              ? "فی الحال کوئی پروگرام دستیاب نہیں۔"
              : "No programs are currently available."
          )
        );
        return;
      }

      renderPrograms(activePrograms);
    } catch (error) {
      console.error("AASRA programs API error:", error);

      programsContainer.replaceChildren(
        createProgramElement(
          "p",
          "",
          getLanguage() === "ur"
            ? "پروگرام لوڈ نہیں ہو سکے۔ براہِ کرم بعد میں دوبارہ کوشش کریں۔"
            : "Programs could not be loaded. Please try again later."
        )
      );

      if (programsError) programsError.hidden = true;
    }
  }

  let loadedPrograms = [];

  function renderPrograms(programs) {
    if (!programsContainer) return;

    loadedPrograms = programs;

    const fragment = document.createDocumentFragment();

    loadedPrograms.forEach((program, index) => {
      fragment.appendChild(createProgramCard(program, index));
    });

    programsContainer.replaceChildren(fragment);
  }

  // Refresh the program cards in the selected language.
  const languageToggle = document.getElementById("language-toggle");

  if (languageToggle && programsContainer) {
    languageToggle.addEventListener("click", () => {
      window.setTimeout(() => {
        if (loadedPrograms.length > 0) {
          renderPrograms(loadedPrograms);
        }
      }, 0);
    });
  }

  if (programsContainer) {
    loadPrograms();
  }

  // ESCAPE KEY: REMOVE FOCUS FROM INPUTS
  document.querySelectorAll("input, textarea").forEach((element) => {
    element.addEventListener("keydown", (event) => {
      if (event.key === "Escape") element.blur();
    });
  });
});
