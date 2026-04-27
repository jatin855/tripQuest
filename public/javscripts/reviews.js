/* ============================================================
   reviews.js — Reviews Page Frontend Logic (Premium Edition)
   ============================================================ */

(function () {
  "use strict";

  // --- DOM REFS ---
  const stateSelect      = document.getElementById("stateSelect");
  const citySelect       = document.getElementById("citySelect");
  const reviewsDisplay   = document.getElementById("reviewsDisplay");
  const reviewsGrid      = document.getElementById("reviewsGrid");
  const reviewsTitle     = document.getElementById("reviewsTitle");
  const reviewsCount     = document.getElementById("reviewsCount");
  const writeReviewBtn   = document.getElementById("writeReviewBtn");
  const submitSection    = document.getElementById("submitSection");
  const cancelReviewBtn  = document.getElementById("cancelReviewBtn");
  const submitReviewBtn  = document.getElementById("submitReviewBtn");
  const starRating       = document.getElementById("starRating");
  const ratingInput      = document.getElementById("ratingInput");
  const ratingLabel      = document.getElementById("ratingLabel");
  const reviewTextArea   = document.getElementById("reviewText");
  const charCount        = document.getElementById("charCount");
  const formMessage      = document.getElementById("formMessage");
  const placeDisplay     = document.getElementById("placeDisplay");
  const statsSummary     = document.getElementById("statsSummary");
  const statsAvg         = document.getElementById("statsAvg");
  const statsStars       = document.getElementById("statsStars");
  const statsTotal       = document.getElementById("statsTotal");
  const statsBars        = document.getElementById("statsBars");
  const sortSelect       = document.getElementById("sortSelect");
  const sortWrap         = document.getElementById("sortWrap");
  const scrollTopBtn     = document.getElementById("scrollTopBtn");
  const totalReviewsStat = document.getElementById("totalReviewsStat");

  let statesData     = [];
  let currentState   = "";
  let currentCity    = "";
  let selectedRating = 0;
  let allReviews     = [];   // cached reviews for sorting

  const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  // ============================================================
  // 0. HERO PARTICLES
  // ============================================================
  function createParticles() {
    const container = document.getElementById("heroParticles");
    if (!container) return;
    for (let i = 0; i < 20; i++) {
      const p = document.createElement("div");
      p.className = "hero-particle";
      p.style.left = Math.random() * 100 + "%";
      p.style.top  = Math.random() * 100 + "%";
      p.style.width  = (3 + Math.random() * 5) + "px";
      p.style.height = p.style.width;
      p.style.animationDelay    = (Math.random() * 6) + "s";
      p.style.animationDuration = (6 + Math.random() * 6) + "s";
      container.appendChild(p);
    }
  }

  // ============================================================
  // 1. LOAD STATES FROM JSON
  // ============================================================
  async function loadStates() {
    try {
      const res  = await fetch("/data/india-states-cities.json");
      const data = await res.json();
      statesData = data.states;

      // Sort alphabetically
      statesData.sort((a, b) => a.name.localeCompare(b.name));

      statesData.forEach((s) => {
        const opt       = document.createElement("option");
        opt.value       = s.name;
        opt.textContent = s.name;
        stateSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("Failed to load states JSON:", err);
    }
  }

  // ============================================================
  // 2. STATE CHANGE → POPULATE CITIES
  // ============================================================
  stateSelect.addEventListener("change", () => {
    const selectedStateName = stateSelect.value;
    citySelect.innerHTML    = '<option value="">— Choose City —</option>';
    citySelect.disabled     = true;
    currentState            = selectedStateName;
    currentCity             = "";

    // Hide reviews + form when state changes
    reviewsDisplay.style.display = "none";
    if (submitSection) submitSection.style.display = "none";

    if (!selectedStateName) return;

    const stateObj = statesData.find((s) => s.name === selectedStateName);
    if (!stateObj) return;

    // Sort cities alphabetically
    const sortedCities = [...stateObj.cities].sort();

    sortedCities.forEach((city) => {
      const opt       = document.createElement("option");
      opt.value       = city;
      opt.textContent = city;
      citySelect.appendChild(opt);
    });

    citySelect.disabled = false;

    // Subtle animation on city dropdown
    citySelect.style.animation = "none";
    citySelect.offsetHeight; // force reflow
    citySelect.style.animation = "fadeInUp 0.3s ease";
  });

  // ============================================================
  // 3. CITY CHANGE → FETCH REVIEWS
  // ============================================================
  citySelect.addEventListener("change", async () => {
    currentCity = citySelect.value;
    if (!currentCity) {
      reviewsDisplay.style.display = "none";
      return;
    }

    if (placeDisplay) placeDisplay.value = `${currentCity}, ${currentState}`;
    await fetchAndDisplayReviews();
    reviewsDisplay.style.display = "block";

    // Smooth scroll to reviews
    reviewsDisplay.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ============================================================
  // 4. FETCH REVIEWS FROM BACKEND
  // ============================================================
  async function fetchAndDisplayReviews() {
    reviewsGrid.innerHTML = `
      <div class="state-box">
        <div class="spinner"></div>
        <p>Loading reviews…</p>
      </div>`;
    reviewsTitle.textContent = `Reviews for ${currentCity}, ${currentState}`;

    try {
      const res  = await fetch(
        `/reviews/fetch?state=${encodeURIComponent(currentState)}&city=${encodeURIComponent(currentCity)}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load reviews.");

      allReviews = data.reviews || [];
      renderStats(data.stats);
      renderReviews(allReviews);

      // Show sort only if there are reviews
      if (sortWrap) {
        sortWrap.style.display = allReviews.length > 1 ? "flex" : "none";
      }
    } catch (err) {
      reviewsGrid.innerHTML = `
        <div class="state-box">
          <div class="state-icon">⚠️</div>
          <strong>Oops!</strong>
          <p>${escHtml(err.message)}</p>
        </div>`;
    }
  }

  // ============================================================
  // 5. RENDER STATS
  // ============================================================
  function renderStats(stats) {
    if (!statsSummary || !stats) return;

    if (stats.totalReviews === 0) {
      statsSummary.style.display = "none";
      return;
    }

    statsSummary.style.display = "flex";
    statsAvg.textContent  = stats.avgRating.toFixed(1);
    statsTotal.textContent = `${stats.totalReviews} review${stats.totalReviews > 1 ? "s" : ""}`;

    // Stars display
    if (statsStars) {
      let html = "";
      for (let i = 1; i <= 5; i++) {
        html += `<span class="${i <= Math.round(stats.avgRating) ? "star-filled" : "star-empty"}">★</span>`;
      }
      statsStars.innerHTML = html;
    }

    // Distribution bars
    if (statsBars) {
      let barsHTML = "";
      for (let i = 5; i >= 1; i--) {
        const count = stats.ratingCounts[i] || 0;
        const pct   = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
        barsHTML += `
          <div class="stat-bar-row">
            <span class="stat-bar-label">${i}</span>
            <span style="color:#f5a623;font-size:0.75rem;">★</span>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" style="width:${pct}%"></div>
            </div>
            <span class="stat-bar-count">${count}</span>
          </div>`;
      }
      statsBars.innerHTML = barsHTML;
    }

    // Update hero stat
    if (totalReviewsStat) {
      totalReviewsStat.textContent = stats.totalReviews;
    }
  }

  // ============================================================
  // 6. RENDER REVIEW CARDS
  // ============================================================
  function renderReviews(reviews) {
    if (!reviews || reviews.length === 0) {
      reviewsCount.textContent = "";
      reviewsGrid.innerHTML = `
        <div class="state-box">
          <div class="state-icon">🗺️</div>
          <strong>No reviews yet for this place</strong>
          <p>Be the first to share your experience!</p>
        </div>`;
      return;
    }

    reviewsCount.textContent = `${reviews.length} review${reviews.length > 1 ? "s" : ""}`;
    reviewsGrid.innerHTML = "";

    reviews.forEach((r, i) => {
      const card = document.createElement("div");
      card.className = "review-card";
      card.style.animationDelay = `${i * 0.06}s`;

      const stars   = buildStarsHTML(r.rating);
      const date    = formatDate(r.createdAt);
      const timeAgo = timeAgoStr(r.createdAt);
      const initial = (r.username || "A")[0].toUpperCase();
      const rLabel  = RATING_LABELS[r.rating] || "";

      card.innerHTML = `
        <div class="card-header">
          <div class="avatar">${initial}</div>
          <div class="card-meta">
            <div class="card-username">${escHtml(r.username)}</div>
            <div class="card-location">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${escHtml(r.city)}, ${escHtml(r.state)}
            </div>
          </div>
          <div class="card-date" title="${date}">${timeAgo}</div>
        </div>
        <div style="display:flex;align-items:center;margin-bottom:12px;">
          <div class="card-stars">${stars}</div>
          <span class="card-rating-badge">${rLabel}</span>
        </div>
        <div class="card-text">${escHtml(r.reviewText)}</div>
      `;

      reviewsGrid.appendChild(card);
    });
  }

  // ============================================================
  // 7. SORTING
  // ============================================================
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      const sorted = [...allReviews];
      switch (sortSelect.value) {
        case "newest":
          sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case "oldest":
          sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case "highest":
          sorted.sort((a, b) => b.rating - a.rating || new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case "lowest":
          sorted.sort((a, b) => a.rating - b.rating || new Date(b.createdAt) - new Date(a.createdAt));
          break;
      }
      renderReviews(sorted);
    });
  }

  // ============================================================
  // 8. STAR RATING INPUT
  // ============================================================
  if (starRating) {
    const stars = starRating.querySelectorAll("span");

    stars.forEach((star) => {
      star.addEventListener("mouseover", () => {
        const val = parseInt(star.dataset.val);
        highlightStars(val);
        if (ratingLabel) ratingLabel.textContent = RATING_LABELS[val] || "";
      });
      star.addEventListener("mouseleave", () => {
        highlightStars(selectedRating);
        if (ratingLabel) ratingLabel.textContent = selectedRating ? RATING_LABELS[selectedRating] : "Click to rate";
      });
      star.addEventListener("click", () => {
        selectedRating = parseInt(star.dataset.val);
        ratingInput.value = selectedRating;
        highlightStars(selectedRating);
        if (ratingLabel) {
          ratingLabel.textContent = RATING_LABELS[selectedRating];
          ratingLabel.style.color = "#f5a623";
        }
      });
    });

    function highlightStars(val) {
      stars.forEach((s) => {
        s.classList.toggle("active", parseInt(s.dataset.val) <= val);
      });
    }
  }

  // ============================================================
  // 9. SHOW / HIDE FORM
  // ============================================================
  if (writeReviewBtn) {
    writeReviewBtn.addEventListener("click", () => {
      if (!currentState || !currentCity) {
        // Animate the selector to hint
        const sel = document.querySelector(".selector-card");
        if (sel) {
          sel.style.border = "2px solid #f5a623";
          sel.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => { sel.style.border = ""; }, 2000);
        }
        return;
      }
      submitSection.style.display = "block";
      submitSection.scrollIntoView({ behavior: "smooth", block: "center" });
      writeReviewBtn.style.display = "none";
    });
  }

  if (cancelReviewBtn) {
    cancelReviewBtn.addEventListener("click", () => {
      submitSection.style.display = "none";
      if (writeReviewBtn) writeReviewBtn.style.display = "inline-flex";
      resetForm();
    });
  }

  // ============================================================
  // 10. CHAR COUNT
  // ============================================================
  if (reviewTextArea) {
    reviewTextArea.addEventListener("input", () => {
      const len = reviewTextArea.value.length;
      charCount.textContent = `${len} / 1000`;
      if (len >= 10) {
        charCount.style.color = "#00AA6C";
      } else {
        charCount.style.color = "";
      }
    });
  }

  // ============================================================
  // 11. SUBMIT REVIEW
  // ============================================================
  if (submitReviewBtn) {
    submitReviewBtn.addEventListener("click", async () => {
      clearMessage();

      if (!currentState || !currentCity) {
        return showMessage("Please select a state and city first.", "error");
      }
      if (selectedRating === 0) {
        return showMessage("Please select a star rating.", "error");
      }
      const text = reviewTextArea.value.trim();
      if (text.length < 10) {
        return showMessage("Review must be at least 10 characters.", "error");
      }

      submitReviewBtn.disabled    = true;
      submitReviewBtn.innerHTML   = `
        <div class="spinner" style="width:16px;height:16px;border-width:2px;margin:0;"></div>
        Submitting…`;

      try {
        const res = await fetch("/reviews/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state:      currentState,
            city:       currentCity,
            rating:     selectedRating,
            reviewText: text,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Submission failed.");

        showMessage("Review submitted successfully! Thank you. ✨", "success");
        resetForm();

        // Refresh review list
        await fetchAndDisplayReviews();

        // Hide form after short delay
        setTimeout(() => {
          if (submitSection) submitSection.style.display = "none";
          if (writeReviewBtn) writeReviewBtn.style.display = "inline-flex";
          clearMessage();
        }, 2500);
      } catch (err) {
        showMessage(err.message, "error");
      } finally {
        submitReviewBtn.disabled  = false;
        submitReviewBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Submit Review`;
      }
    });
  }

  // ============================================================
  // 12. SCROLL TO TOP
  // ============================================================
  if (scrollTopBtn) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 400) {
        scrollTopBtn.classList.add("visible");
      } else {
        scrollTopBtn.classList.remove("visible");
      }
    });

    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================
  function buildStarsHTML(rating) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
      html += `<span class="${i <= rating ? "filled" : ""}">★</span>`;
    }
    return html;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function timeAgoStr(dateStr) {
    if (!dateStr) return "";
    const now  = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);

    if (diff < 60)    return "Just now";
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return formatDate(dateStr);
  }

  function escHtml(str) {
    if (!str) return "";
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function showMessage(msg, type) {
    if (!formMessage) return;
    formMessage.textContent = msg;
    formMessage.className   = `form-message ${type}`;
  }

  function clearMessage() {
    if (!formMessage) return;
    formMessage.textContent = "";
    formMessage.className   = "form-message";
  }

  function resetForm() {
    if (reviewTextArea)  reviewTextArea.value = "";
    if (ratingInput)     ratingInput.value    = 0;
    if (charCount)       charCount.textContent = "0 / 1000";
    if (ratingLabel) {
      ratingLabel.textContent = "Click to rate";
      ratingLabel.style.color = "";
    }
    selectedRating = 0;
    if (starRating) {
      starRating.querySelectorAll("span").forEach((s) => s.classList.remove("active"));
    }
    clearMessage();
  }

  // ============================================================
  // INIT
  // ============================================================
  createParticles();
  loadStates();
})();
