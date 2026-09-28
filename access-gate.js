/**
 * ╔═══════════════════════════════════════════════════════╗
 * ║              SECRET ACCESS GATE v1.0                 ║
 * ╠═══════════════════════════════════════════════════════╣
 * ║  Trigger  : Triple-click the middle-right zone       ║
 * ║  Code "3"          → Grants buyer access             ║
 * ║  Code 09/07/2003   → Reboots / restores the site     ║
 * ║  Code 05/05/2002   → Kill switch (locks the site)    ║
 * ╚═══════════════════════════════════════════════════════╝
 *
 * HOW TO ADD TO YOUR PAGE:
 *   <script src="access-gate.js"></script>
 *   Place this tag just before </body> in your HTML file.
 *
 * TO CHANGE THE CODES:
 *   Edit the CODES object below.
 *
 * TO CHANGE THE TRIGGER ZONE:
 *   Edit TRIGGER_ZONE xMin/xMax/yMin/yMax (0-1 fractions of the viewport).
 */

;(function () {
  "use strict";

  /* -- CONFIGURATION ---------------------------------------- */
  const CODES = {
    ACCESS:  "3",            // Buyer access code
    REBOOT:  "09/07/2003",  // Reboot / restore
    KILL:    "05/05/2002",  // Kill switch
  };

  // Triple-click must land in the middle-right zone.
  // Values are 0-to-1 fractions of the viewport.
  const TRIGGER_ZONE = {
    xMin: 0.70,  // right 30% of the screen
    xMax: 1.00,
    yMin: 0.30,  // vertically centred band
    yMax: 0.70,
  };

  const TRIPLE_CLICK_WINDOW_MS = 600; // max ms between first and third click
  const SESSION_KEY = "__ag_access";  // sessionStorage key

  /* -- STATE ------------------------------------------------- */
  let clickTimes = [];
  let isKilled   = localStorage.getItem("__ag_killed") === "1";
  let hasAccess  = sessionStorage.getItem(SESSION_KEY) === "1";

  /* -- OVERLAY (the locked screen shown to non-buyers) ------- */
  const overlay = document.createElement("div");
  overlay.id = "ag-overlay";
  Object.assign(overlay.style, {
    position:       "fixed",
    inset:          "0",
    background:     "#0a0a0a",
    color:          "#fff",
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    justifyContent: "center",
    zIndex:         "2147483647",
    fontFamily:     "system-ui, sans-serif",
    userSelect:     "none",
    transition:     "opacity 0.5s ease",
  });
  overlay.innerHTML = `
    <div style="font-size:clamp(1.4rem,4vw,2.2rem);font-weight:700;letter-spacing:0.05em;">🔒 Private Access Only</div>
    <p style="margin-top:0.75rem;font-size:1rem;opacity:0.55;">This site is for authorised users only.</p>
  `;

  /* -- POPUP (the code entry dialog) ------------------------- */
  const popup = document.createElement("div");
  popup.id = "ag-popup";
  Object.assign(popup.style, {
    position:       "fixed",
    inset:          "0",
    display:        "none",
    alignItems:     "center",
    justifyContent: "center",
    background:     "rgba(0,0,0,0.75)",
    backdropFilter: "blur(6px)",
    zIndex:         "2147483647",
    fontFamily:     "system-ui, sans-serif",
  });

  popup.innerHTML = `
    <div id="ag-card" style="
      background:#141414;
      border:1px solid #2a2a2a;
      border-radius:16px;
      padding:2rem 2.5rem;
      min-width:min(320px,90vw);
      display:flex;
      flex-direction:column;
      gap:1rem;
      box-shadow:0 24px 64px rgba(0,0,0,0.6);
    ">
      <h2 style="margin:0;color:#fff;font-size:1.1rem;letter-spacing:0.03em;font-family:'Times New Roman',Georgia,serif;font-style:italic;line-height:1.4;">⚜️ Master, what fate would you like to befall thy Clients?</h2>
      <input id="ag-input" type="password" placeholder="Code..." autocomplete="off" style="
        background:#1e1e1e;
        border:1px solid #333;
        border-radius:8px;
        color:#fff;
        font-size:1.1rem;
        padding:0.6rem 0.9rem;
        outline:none;
        width:100%;
        box-sizing:border-box;
        letter-spacing:0.1em;
      " />
      <div id="ag-message" style="font-size:0.85rem;min-height:1.2em;color:#ff4d4d;"></div>
      <button id="ag-submit" style="
        background:#4f46e5;
        color:#fff;
        border:none;
        border-radius:8px;
        padding:0.65rem;
        font-size:1rem;
        cursor:pointer;
        transition:background 0.2s;
      ">Submit</button>
      <button id="ag-cancel" style="
        background:transparent;
        color:#555;
        border:none;
        font-size:0.85rem;
        cursor:pointer;
        padding:0;
        align-self:center;
      ">Cancel</button>
    </div>
  `;

  /* -- HELPERS ----------------------------------------------- */
  function inZone(e) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rx = e.clientX / vw;
    const ry = e.clientY / vh;
    return (
      rx >= TRIGGER_ZONE.xMin && rx <= TRIGGER_ZONE.xMax &&
      ry >= TRIGGER_ZONE.yMin && ry <= TRIGGER_ZONE.yMax
    );
  }

  function showOverlay() {
    overlay.style.opacity = "1";
    document.body.appendChild(overlay);
  }

  function hideOverlay() {
    overlay.style.opacity = "0";
    setTimeout(() => overlay.remove(), 500);
  }

  function openPopup() {
    popup.style.display = "flex";
    input.value = "";
    msg.textContent = "";
    setTimeout(() => input.focus(), 50);
  }

  function closePopup() {
    popup.style.display = "none";
    input.value = "";
    msg.textContent = "";
  }

  function setMessage(text, color = "#ff4d4d") {
    msg.style.color = color;
    msg.textContent = text;
  }

  /* -- CODE ACTIONS ------------------------------------------ */
  function grantAccess() {
    sessionStorage.setItem(SESSION_KEY, "1");
    hasAccess = true;
    isKilled  = false;
    setMessage("✅ Access granted!", "#4ade80");
    setTimeout(() => {
      closePopup();
      hideOverlay();
    }, 900);
  }

  function killSite() {
    isKilled = true;
    hasAccess = false;
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.setItem("__ag_killed", "1");
    setMessage("💀 Kill code accepted. Site locked.", "#ff4d4d");
    setTimeout(() => {
      closePopup();
      showOverlay();
    }, 1000);
  }

  function rebootSite() {
    isKilled  = false;
    hasAccess = true;
    localStorage.removeItem("__ag_killed");   // clear persistent kill -- refresh won't re-lock
    sessionStorage.setItem(SESSION_KEY, "1"); // restore owner session
    setMessage("🔄 Rebooting...", "#facc15");
    setTimeout(() => {
      closePopup();
      hideOverlay(); // owner sees the site immediately after reboot
    }, 1000);
  }

  function handleCode() {
    const val = input.value.trim();

    if (val === CODES.KILL) {
      killSite();
    } else if (val === CODES.REBOOT) {
      rebootSite();
    } else if (val === CODES.ACCESS) {
      grantAccess();
    } else {
      setMessage("❌ Incorrect code.");
      input.value = "";
      input.focus();
    }
  }

  /* -- CLICK SEQUENCE DETECTOR ------------------------------- */
  document.addEventListener("click", function (e) {
    if (!inZone(e)) {
      clickTimes = []; // reset if outside zone
      return;
    }

    const now = Date.now();
    clickTimes.push(now);

    // Keep only clicks within the time window
    clickTimes = clickTimes.filter(t => now - t <= TRIPLE_CLICK_WINDOW_MS);

    if (clickTimes.length >= 3) {
      clickTimes = [];
      openPopup();
    }
  }, true); // capture mode -- fires even when overlay is showing

  /* -- POPUP WIRING ------------------------------------------ */
  function initGate() {
    document.body.appendChild(popup);

    // Show overlay for all non-authorised visitors (killed site OR no session access)
    if (isKilled || !hasAccess) showOverlay();

    const btn    = document.getElementById("ag-submit");
    const cancel = document.getElementById("ag-cancel");

    btn.addEventListener("click", handleCode);
    cancel.addEventListener("click", closePopup);

    // Submit on Enter, dismiss on Escape
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter")  handleCode();
      if (e.key === "Escape") closePopup();
    });

    // Hover colour on submit button
    btn.addEventListener("mouseenter", () => btn.style.background = "#4338ca");
    btn.addEventListener("mouseleave", () => btn.style.background = "#4f46e5");
  }

  // If script loads at end of <body>, DOM is already ready — run immediately.
  // Otherwise wait for DOMContentLoaded.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGate);
  } else {
    initGate();
  }

  /* -- GRAB REFS AFTER POPUP HTML EXISTS --------------------- */
  const input = popup.querySelector("#ag-input");
  const msg   = popup.querySelector("#ag-message");

})();
