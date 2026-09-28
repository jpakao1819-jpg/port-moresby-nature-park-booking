/**
 * Secret Access Gate & Cloud Controller v2.0
 * 
 * Features:
 * - Global Cloud Synchronization: Controls access across all client devices automatically.
 * - Multi-device support: Android, iOS, tablet, desktop.
 * - Secret trigger: 3 taps/clicks in the middle-right 30% screen zone.
 * - Real-time auto-unlock: When Master unlocks from anywhere, clients' pages unlock automatically.
 * 
 * Codes:
 * - "3"         -> Grants public access globally for clients & visitors.
 * - "05/05/2002" -> Kill switch (locks the website for everyone).
 * - "09/07/2003" -> Reboot / restore (unlocks the website for everyone).
 */

;(function () {
  "use strict";

  /* -- CONFIGURATION ---------------------------------------- */
  const CODES = {
    ACCESS: "3",
    REBOOT: "09/07/2003",
    KILL:   "05/05/2002",
  };

  // Cloud backend endpoints for cross-device synchronization
  const CLOUD_CONFIG = {
    PRIMARY_APP_KEY: "7i4f8prd",
    PRIMARY_ITEM_KEY: "site_status",
    PRIMARY_GET_URL: "https://keyvalue.immanuel.co/api/KeyVal/GetValue/7i4f8prd/site_status",
    PRIMARY_SET_URL: "https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/7i4f8prd/site_status/",
    BACKUP_OBJ_URL:  "https://api.restful-api.dev/objects/ff808181a09d98f701a0e6220b6d2ab1",
    POLL_INTERVAL_MS: 6000, // Poll every 6 seconds to auto-unlock clients in real time
  };

  // Trigger Zone: Right 30% of screen, middle 40% vertical band
  const TRIGGER_ZONE = {
    xMin: 0.70,
    xMax: 1.00,
    yMin: 0.30,
    yMax: 0.70,
  };

  const TAP_WINDOW_MS = 900; // Time window for 3 consecutive taps/clicks

  /* -- LOCAL STATE ------------------------------------------- */
  let tapTimestamps = [];
  let lastPointerTime = 0;
  let isOverlayActive = true;
  let pollTimer = null;

  /* -- OVERLAY (Locked Screen for Clients) ------------------- */
  const overlay = document.createElement("div");
  overlay.id = "ag-overlay";
  Object.assign(overlay.style, {
    position:       "fixed",
    inset:          "0",
    background:     "#0a0a0a",
    color:          "#f5f5f5",
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    justifyContent: "center",
    zIndex:         "2147483646",
    fontFamily:     "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    userSelect:     "none",
    transition:     "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.6s",
    padding:        "2rem",
    textAlign:      "center",
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

  // Query current status from Cloud
  async function fetchCloudStatus() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Primary check
      const res = await fetch(CLOUD_CONFIG.PRIMARY_GET_URL + "?_nc=" + Date.now(), {
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
      // Primary timed out or errored, try backup
    }

    // Backup check
    try {
      const resBackup = await fetch(CLOUD_CONFIG.BACKUP_OBJ_URL + "?_nc=" + Date.now(), {
        headers: { "Cache-Control": "no-cache" }
      });
      if (resBackup.ok) {
        const data = await resBackup.json();
        if (data && data.data && data.data.status) {
          const s = String(data.data.status).toLowerCase();
          if (s === "open" || s === "granted") return "open";
          if (s === "locked" || s === "killed") return "locked";
        }
      }
    } catch (err) {
      // Offline fallback
    }

    return null;
  }

  // Broadcast new status to Cloud across all users
  async function broadcastCloudStatus(status) {
    const isTargetOpen = (status === "open");
    const targetWord = isTargetOpen ? "open" : "locked";

    let primarySuccess = false;
    let backupSuccess = false;

    // Send to primary store
    try {
      const pRes = await fetch(CLOUD_CONFIG.PRIMARY_SET_URL + targetWord, {
        method: "POST",
        headers: { "Content-Length": "0" },
      });
      if (pRes.ok) primarySuccess = true;
    } catch (e) {
      console.warn("Primary cloud sync warning:", e);
    }

    // Send to backup store
    try {
      const bRes = await fetch(CLOUD_CONFIG.BACKUP_OBJ_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "NaturePark_GateState",
          data: { status: targetWord, updatedAt: Date.now() }
        })
      });
      if (bRes.ok) backupSuccess = true;
    } catch (e) {
      console.warn("Backup cloud sync warning:", e);
    }

    return primarySuccess || backupSuccess;
  }

  /* -- UI HELPERS -------------------------------------------- */

  function showOverlay() {
    isOverlayActive = true;
    overlay.style.visibility = "visible";
    overlay.style.opacity = "1";
    if (!document.body.contains(overlay)) {
      document.body.appendChild(overlay);
    }
  }

  function hideOverlay() {
    isOverlayActive = false;
    overlay.style.opacity = "0";
    setTimeout(() => {
      if (!isOverlayActive && overlay.parentNode) {
        overlay.style.visibility = "hidden";
        overlay.remove();
      }
    }, 600);
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

  async function checkAndApplyStatus() {
    const cloudStatus = await fetchCloudStatus();
    if (cloudStatus === "open") {
      hideOverlay();
    } else if (cloudStatus === "locked") {
      showOverlay();
    }
  }

  function startAutoSync() {
    // Immediate check
    checkAndApplyStatus();

    // Ongoing poll for automatic real-time update on client screens
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(checkAndApplyStatus, CLOUD_CONFIG.POLL_INTERVAL_MS);
  }

  /* -- CODE ACTIONS ------------------------------------------ */

  async function handleGrantAccess() {
    setMessage("Broadcasting access to clients...", "#60a5fa");
    const input = popup.querySelector("#ag-input");
    const submitBtn = popup.querySelector("#ag-submit");
    if (submitBtn) submitBtn.disabled = true;

    await broadcastCloudStatus("open");

    setMessage("Access granted globally. The site is now open.", "#4ade80");
    hideOverlay();

    setTimeout(() => {
      if (submitBtn) submitBtn.disabled = false;
      closePopup();
    }, 1200);
  }

  async function handleKillSite() {
    setMessage("Engaging kill switch...", "#f87171");
    const submitBtn = popup.querySelector("#ag-submit");
    if (submitBtn) submitBtn.disabled = true;

    await broadcastCloudStatus("locked");

    setMessage("Site locked for all clients worldwide.", "#ef4444");
    showOverlay();

    setTimeout(() => {
      if (submitBtn) submitBtn.disabled = false;
      closePopup();
    }, 1300);
  }

  async function handleRebootSite() {
    setMessage("Rebooting site...", "#fbbf24");
    const submitBtn = popup.querySelector("#ag-submit");
    if (submitBtn) submitBtn.disabled = true;

    await broadcastCloudStatus("open");

    setMessage("System rebooted. Access restored for all clients.", "#4ade80");
    hideOverlay();

    setTimeout(() => {
      if (submitBtn) submitBtn.disabled = false;
      closePopup();
    }, 1200);
  }

  async function handleCode() {
    const input = popup.querySelector("#ag-input");
    if (!input) return;
    const val = input.value.trim();

    if (val === CODES.ACCESS) {
      await handleGrantAccess();
    } else if (val === CODES.KILL) {
      await handleKillSite();
    } else if (val === CODES.REBOOT) {
      await handleRebootSite();
    } else {
      setMessage("Incorrect decree.", "#ef4444");
      input.value = "";
      input.focus();
    }
  }

  /* -- TAP & CLICK DETECTOR (Mobile & Desktop) --------------- */

  function handleZoneHit(clientX, clientY) {
    // If the modal popup is already visible, ignore trigger
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

    // Keep only taps inside window
    tapTimestamps = tapTimestamps.filter(t => now - t <= TAP_WINDOW_MS);

    if (tapTimestamps.length >= 3) {
      tapTimestamps = [];
      openPopup();
    }
  }

  // Universal pointer listener: works on mouse, touch (Android, iOS), and pen
  window.addEventListener("pointerdown", function (e) {
    const now = Date.now();
    if (now - lastPointerTime < 60) return; // Debounce rapid touch artifacts
    lastPointerTime = now;
    handleZoneHit(e.clientX, e.clientY);
  }, true);

  // Fallback click listener for older browsers
  window.addEventListener("click", function (e) {
    if (Date.now() - lastPointerTime < 100) return;
    handleZoneHit(e.clientX, e.clientY);
  }, true);

  /* -- INITIALIZATION ---------------------------------------- */

  function init() {
    // Default to locked overlay on first arrival
    showOverlay();

    // Attach popup dialog to DOM
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

    // Start auto synchronization with Cloud
    startAutoSync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
