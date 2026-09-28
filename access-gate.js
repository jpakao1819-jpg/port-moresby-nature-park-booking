/**
 * Secret Access Gate & Cloud Controller v3.0
 * 
 * Rules:
 * 1. Code "3"         -> Opens the website to everyone else globally.
 *                        Stays open until the lock code is used.
 * 2. Code "09/07/2003" -> Reboot code. Opens the website ONLY to the Master
 *                        on the specific device where it is entered.
 * 3. Code "05/05/2002" -> Lock code. Locks the website globally for all visitors
 *                        and clients until unlocked again with code "3".
 * 
 * Cross-device trigger:
 * - Triple-tap or triple-click the middle-right 30% of the screen.
 * - Works on Android, iPhone/iPad (Apple), and desktop computers.
 */

;(function () {
  "use strict";

  /* -- CONFIGURATION ---------------------------------------- */
  const CODES = {
    ACCESS: "3",            // Opens to everyone globally
    REBOOT: "09/07/2003",   // Opens locally only to Master
    KILL:   "05/05/2002",   // Locks globally for everyone
  };

  const CLOUD_CONFIG = {
    APP_KEY: "7i4f8prd",
    ITEM_KEY: "site_status",
    GET_URL: "https://keyvalue.immanuel.co/api/KeyVal/GetValue/7i4f8prd/site_status",
    SET_URL: "https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/7i4f8prd/site_status/",
    LOCKED_POLL_INTERVAL_MS: 5000,   // Poll every 5s when locked so client auto-unlocks in real time
    OPEN_POLL_INTERVAL_MS:   20000,  // Poll every 20s when open to check if Master locked it
  };

  // Middle-right trigger zone (Right 30% of viewport, middle 40% vertical)
  const TRIGGER_ZONE = {
    xMin: 0.70,
    xMax: 1.00,
    yMin: 0.30,
    yMax: 0.70,
  };

  const TAP_WINDOW_MS = 950; // Generous window for 3 taps on mobile or clicks on desktop

  /* -- PERSISTENT KEYS --------------------------------------- */
  const KEY_MASTER_SESSION = "__ag_master_session";
  const KEY_CACHED_STATUS  = "__ag_cached_status";

  /* -- LOCAL STATE ------------------------------------------- */
  let tapTimestamps = [];
  let lastPointerTime = 0;
  let isOverlayShowing = false;
  let pollTimer = null;

  /* -- OVERLAY (Locked Screen for Clients) ------------------- */
  const overlay = document.createElement("div");
  overlay.id = "ag-overlay";
  Object.assign(overlay.style, {
    position:       "fixed",
    inset:          "0",
    background:     "#0a0a0a",
    color:          "#f5f5f5",
    display:        "none",
    flexDirection:  "column",
    alignItems:     "center",
    justifyContent: "center",
    zIndex:         "2147483646",
    fontFamily:     "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    userSelect:     "none",
    transition:     "opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
    padding:        "2rem",
    textAlign:      "center",
    opacity:        "0",
  });

  overlay.innerHTML = `
    <div style="max-width:480px;display:flex;flex-direction:column;align-items:center;">
      <div style="width:48px;height:48px;border-radius:50%;background:#1a1a1a;border:1px solid #333;display:flex;align-items:center;justify-content:center;margin-bottom:1.25rem;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <div style="font-size:clamp(1.4rem, 4vw, 2.2rem);font-weight:700;letter-spacing:0.04em;color:#ffffff;line-height:1.2;">
        Private Access Only
      </div>
      <p style="margin-top:0.85rem;font-size:1rem;color:#8a8a8a;line-height:1.5;max-width:380px;">
        This portal is restricted to authorized visitors. Access will become available once granted by the administrator.
      </p>
    </div>
  `;

  /* -- POPUP (Master Control Interface) ---------------------- */
  const popup = document.createElement("div");
  popup.id = "ag-popup";
  Object.assign(popup.style, {
    position:       "fixed",
    inset:          "0",
    display:        "none",
    alignItems:     "center",
    justifyContent: "center",
    background:     "rgba(0, 0, 0, 0.8)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    zIndex:         "2147483647",
    fontFamily:     "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    padding:        "1.25rem",
    boxSizing:      "border-box",
  });

  popup.innerHTML = `
    <div id="ag-card" style="
      background: #141414;
      border: 1px solid #2a2a2a;
      border-radius: 18px;
      padding: 2.2rem 2.4rem;
      width: 100%;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
      box-shadow: 0 25px 65px rgba(0, 0, 0, 0.85);
      position: relative;
    ">
      <h2 style="
        margin: 0;
        color: #ffffff;
        font-size: 1.25rem;
        font-family: 'Times New Roman', Times, Georgia, serif;
        font-style: italic;
        font-weight: 500;
        line-height: 1.45;
        letter-spacing: 0.02em;
        text-align: center;
      ">
        Master, what faith would you like to befall thy Clients?
      </h2>

      <input id="ag-input" type="password" placeholder="Enter decree..." autocomplete="off" autocapitalize="none" style="
        background: #1e1e1e;
        border: 1px solid #383838;
        border-radius: 10px;
        color: #ffffff;
        font-size: 1.15rem;
        padding: 0.75rem 1rem;
        outline: none;
        width: 100%;
        box-sizing: border-box;
        text-align: center;
        letter-spacing: 0.12em;
        transition: border-color 0.2s;
      " />

      <div id="ag-message" style="
        font-size: 0.88rem;
        min-height: 1.3em;
        text-align: center;
        line-height: 1.4;
        transition: color 0.2s;
      "></div>

      <div style="display:flex;flex-direction:column;gap:0.6rem;">
        <button id="ag-submit" style="
          background: #3b82f6;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 0.8rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        ">Execute</button>

        <button id="ag-cancel" style="
          background: transparent;
          color: #777777;
          border: none;
          font-size: 0.9rem;
          cursor: pointer;
          padding: 0.4rem;
          align-self: center;
        ">Dismiss</button>
      </div>
    </div>
  `;

  /* -- CLOUD SYNC ENGINE ------------------------------------- */

  async function fetchCloudStatus() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(CLOUD_CONFIG.GET_URL + "?_t=" + Date.now(), {
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache" }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        const cleaned = text.replace(/["'\r\n\s]/g, "").toLowerCase();
        if (cleaned === "open" || cleaned === "granted") return "open";
        if (cleaned === "locked" || cleaned === "killed") return "locked";
      }
    } catch (err) {
      // Network hiccup or offline
    }
    return null;
  }

  async function broadcastCloudStatus(status) {
    const targetWord = (status === "open") ? "open" : "locked";
    try {
      const res = await fetch(CLOUD_CONFIG.SET_URL + targetWord, {
        method: "POST",
        headers: { "Content-Length": "0" },
      });
      return res.ok;
    } catch (e) {
      console.warn("Cloud status broadcast error:", e);
      return false;
    }
  }

  /* -- OVERLAY DISPLAY HELPERS ------------------------------- */

  function isMasterUnlocked() {
    return localStorage.getItem(KEY_MASTER_SESSION) === "1";
  }

  function showOverlay() {
    // If master unlocked locally, never lock their screen
    if (isMasterUnlocked()) return;

    if (!isOverlayShowing) {
      isOverlayShowing = true;
      overlay.style.display = "flex";
      // Trigger smooth fade in on next frame
      requestAnimationFrame(() => {
        overlay.style.opacity = "1";
      });
    }
  }

  function hideOverlay() {
    if (isOverlayShowing) {
      isOverlayShowing = false;
      overlay.style.opacity = "0";
      setTimeout(() => {
        if (!isOverlayShowing) {
          overlay.style.display = "none";
        }
      }, 500);
    }
  }

  function openPopup() {
    popup.style.display = "flex";
    const input = popup.querySelector("#ag-input");
    const msg = popup.querySelector("#ag-message");
    if (input) {
      input.value = "";
      setTimeout(() => input.focus(), 60);
    }
    if (msg) msg.textContent = "";
  }

  function closePopup() {
    popup.style.display = "none";
    const input = popup.querySelector("#ag-input");
    const msg = popup.querySelector("#ag-message");
    if (input) input.value = "";
    if (msg) msg.textContent = "";
  }

  function setMessage(text, color = "#ef4444") {
    const msg = popup.querySelector("#ag-message");
    if (msg) {
      msg.style.color = color;
      msg.textContent = text;
    }
  }

  /* -- AUTO-SYNC LOOP ---------------------------------------- */

  async function syncStatus() {
    // Master session always takes precedence locally
    if (isMasterUnlocked()) {
      hideOverlay();
      return;
    }

    const cloud = await fetchCloudStatus();

    if (cloud === "open") {
      localStorage.setItem(KEY_CACHED_STATUS, "open");
      hideOverlay();
      resetPollTimer(CLOUD_CONFIG.OPEN_POLL_INTERVAL_MS);
    } else if (cloud === "locked") {
      localStorage.setItem(KEY_CACHED_STATUS, "locked");
      showOverlay();
      resetPollTimer(CLOUD_CONFIG.LOCKED_POLL_INTERVAL_MS);
    }
  }

  function resetPollTimer(interval) {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(syncStatus, interval);
  }

  /* -- CODE ACTIONS ------------------------------------------ */

  /**
   * Code "3": Opens website to everyone else globally.
   * Stays open until the lock code is executed.
   */
  async function handlePublicOpen() {
    setMessage("Broadcasting decree: Opening to all clients...", "#60a5fa");
    const submitBtn = popup.querySelector("#ag-submit");
    if (submitBtn) submitBtn.disabled = true;

    await broadcastCloudStatus("open");

    localStorage.setItem(KEY_CACHED_STATUS, "open");
    hideOverlay();

    setMessage("Decree enacted. Website is now open globally for all clients.", "#4ade80");

    setTimeout(() => {
      if (submitBtn) submitBtn.disabled = false;
      closePopup();
      resetPollTimer(CLOUD_CONFIG.OPEN_POLL_INTERVAL_MS);
    }, 1300);
  }

  /**
   * Code "09/07/2003": Reboot code.
   * Opens ONLY to the Master on the current device.
   * Does not broadcast to public cloud (clients remain locked).
   */
  function handleMasterReboot() {
    setMessage("Reboot decree recognized. Granting Master access on this device...", "#fbbf24");
    const submitBtn = popup.querySelector("#ag-submit");
    if (submitBtn) submitBtn.disabled = true;

    // Save master session on this device
    localStorage.setItem(KEY_MASTER_SESSION, "1");
    hideOverlay();

    setMessage("Reboot complete. Master access granted locally.", "#4ade80");

    setTimeout(() => {
      if (submitBtn) submitBtn.disabled = false;
      closePopup();
    }, 1200);
  }

  /**
   * Code "05/05/2002": Lock / Kill switch.
   * Locks website globally for all visitors and clients worldwide.
   */
  async function handleGlobalLock() {
    setMessage("Lock decree recognized. Locking website for all clients...", "#f87171");
    const submitBtn = popup.querySelector("#ag-submit");
    if (submitBtn) submitBtn.disabled = true;

    await broadcastCloudStatus("locked");

    // Clear local master privilege and cache
    localStorage.removeItem(KEY_MASTER_SESSION);
    localStorage.setItem(KEY_CACHED_STATUS, "locked");

    showOverlay();

    setMessage("Decree enacted. Website is now locked for all clients worldwide.", "#ef4444");

    setTimeout(() => {
      if (submitBtn) submitBtn.disabled = false;
      closePopup();
      resetPollTimer(CLOUD_CONFIG.LOCKED_POLL_INTERVAL_MS);
    }, 1300);
  }

  async function handleCode() {
    const input = popup.querySelector("#ag-input");
    if (!input) return;
    const val = input.value.trim();

    if (val === CODES.ACCESS) {
      await handlePublicOpen();
    } else if (val === CODES.REBOOT) {
      handleMasterReboot();
    } else if (val === CODES.KILL) {
      await handleGlobalLock();
    } else {
      setMessage("Incorrect decree.", "#ef4444");
      input.value = "";
      input.focus();
    }
  }

  /* -- TAP & CLICK DETECTOR (Universal Mobile & Desktop) ----- */

  function handleZoneHit(clientX, clientY) {
    if (popup.style.display === "flex") return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rx = clientX / vw;
    const ry = clientY / vh;

    const inside = (
      rx >= TRIGGER_ZONE.xMin && rx <= TRIGGER_ZONE.xMax &&
      ry >= TRIGGER_ZONE.yMin && ry <= TRIGGER_ZONE.yMax
    );

    if (!inside) {
      tapTimestamps = [];
      return;
    }

    const now = Date.now();
    tapTimestamps.push(now);

    tapTimestamps = tapTimestamps.filter(t => now - t <= TAP_WINDOW_MS);

    if (tapTimestamps.length >= 3) {
      tapTimestamps = [];
      openPopup();
    }
  }

  window.addEventListener("pointerdown", function (e) {
    const now = Date.now();
    if (now - lastPointerTime < 50) return;
    lastPointerTime = now;
    handleZoneHit(e.clientX, e.clientY);
  }, true);

  window.addEventListener("click", function (e) {
    if (Date.now() - lastPointerTime < 80) return;
    handleZoneHit(e.clientX, e.clientY);
  }, true);

  /* -- INITIALIZATION ---------------------------------------- */

  function init() {
    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    const btn = popup.querySelector("#ag-submit");
    const cancel = popup.querySelector("#ag-cancel");
    const input = popup.querySelector("#ag-input");

    if (btn) btn.addEventListener("click", handleCode);
    if (cancel) cancel.addEventListener("click", closePopup);

    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") handleCode();
        if (e.key === "Escape") closePopup();
      });

      input.addEventListener("focus", () => {
        input.style.borderColor = "#3b82f6";
      });
      input.addEventListener("blur", () => {
        input.style.borderColor = "#383838";
      });
    }

    // Determine initial visual state smoothly:
    // If master unlocked locally, or cached state is 'open', keep screen visible!
    if (isMasterUnlocked() || localStorage.getItem(KEY_CACHED_STATUS) === "open") {
      hideOverlay();
    } else {
      showOverlay();
    }

    // Run first sync immediately and start polling
    syncStatus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
