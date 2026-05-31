/* Lightning tip jar + Nostr zap links for Gallop 82 (static, no backend). */
(function () {
  const cfg = window.GALLOP82_SUPPORT || {};
  const mount = document.getElementById("tipJar");
  if (!mount) return;

  const SATS = [21, 100, 1000, 10000];
  let lnurlMeta = null;
  let busy = false;

  mount.innerHTML =
    '<div class="tip-grid">' +
      '<div class="tip-main">' +
        '<p class="tip-lede">Free games, forever. If Gallop 82 saved you from a boring study hall, send sats.</p>' +
        '<div class="tip-addr" id="tipAddr" hidden></div>' +
        '<div class="tip-presets" id="tipPresets"></div>' +
        '<p class="tip-status" id="tipStatus"></p>' +
        '<div class="tip-actions" id="tipActions"></div>' +
      '</div>' +
      '<div class="tip-qr-wrap">' +
        '<div class="tip-qr" id="tipQr" aria-label="Lightning payment QR code"></div>' +
        '<p class="tip-qr-hint" id="tipQrHint">Scan with any Lightning wallet</p>' +
      '</div>' +
    '</div>';

  const elAddr = document.getElementById("tipAddr");
  const elPresets = document.getElementById("tipPresets");
  const elStatus = document.getElementById("tipStatus");
  const elActions = document.getElementById("tipActions");
  const elQr = document.getElementById("tipQr");
  const elQrHint = document.getElementById("tipQrHint");

  function setStatus(msg, err) {
    elStatus.textContent = msg || "";
    elStatus.className = "tip-status" + (err ? " err" : "");
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const old = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => { btn.textContent = old; }, 1400);
    }).catch(() => setStatus("Copy failed — select the text manually.", true));
  }

  function drawQr(payload) {
    elQr.innerHTML = "";
    if (!payload || typeof qrcode === "undefined") return;
    const qr = qrcode(0, "M");
    qr.addData(payload);
    qr.make();
    const cell = 4, margin = 8;
    const n = qr.getModuleCount();
    const size = n * cell + margin * 2;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f5f0dc";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#1a1d22";
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++)
        if (qr.isDark(r, c)) ctx.fillRect(margin + c * cell, margin + r * cell, cell, cell);
    elQr.appendChild(canvas);
  }

  async function fetchLnurl(address) {
    const parts = address.trim().split("@");
    if (parts.length !== 2) throw new Error("Invalid Lightning address");
    const res = await fetch("https://" + parts[1] + "/.well-known/lnurlp/" + encodeURIComponent(parts[0]));
    if (!res.ok) throw new Error("Could not resolve Lightning address");
    const data = await res.json();
    if (data.status === "ERROR") throw new Error(data.reason || "LNURL error");
    return data;
  }

  async function invoiceForSats(sats) {
    if (!lnurlMeta) throw new Error("Lightning not configured");
    const msats = sats * 1000;
    if (msats < lnurlMeta.minSendable || msats > lnurlMeta.maxSendable)
      throw new Error("Amount out of range for this address");
    let url = lnurlMeta.callback + "?amount=" + msats;
    if (cfg.zapNote) url += "&comment=" + encodeURIComponent(cfg.zapNote);
    const res = await fetch(url);
    if (!res.ok) throw new Error("Invoice request failed");
    const data = await res.json();
    if (data.status === "ERROR") throw new Error(data.reason || "Invoice error");
    return data.pr;
  }

  async function pickAmount(sats) {
    if (busy) return;
    busy = true;
    setStatus("Fetching invoice…");
    try {
      const inv = await invoiceForSats(sats);
      drawQr("lightning:" + inv.toUpperCase());
      elQrHint.textContent = sats + " sats — pay within ~1 hour";
      setStatus(sats + " sats invoice ready. Scan QR or copy invoice below.");
      showInvoiceCopy(inv);
    } catch (e) {
      setStatus(e.message || "Could not create invoice.", true);
    }
    busy = false;
  }

  function showInvoiceCopy(bolt11) {
    let btn = document.getElementById("tipCopyInv");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tip-btn";
      btn.id = "tipCopyInv";
      elActions.appendChild(btn);
    }
    btn.textContent = "Copy invoice";
    btn.onclick = () => copyText(bolt11, btn);
  }

  function renderPresets() {
    elPresets.innerHTML = "";
    SATS.forEach(s => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tip-preset";
      b.textContent = s + " sats";
      b.onclick = () => pickAmount(s);
      elPresets.appendChild(b);
    });
  }

  function renderNostr(npub) {
    const row = document.createElement("div");
    row.className = "tip-nostr";
    const label = document.createElement("span");
    label.className = "tip-npub";
    label.textContent = cfg.nip05 || npub.slice(0, 20) + "…";
    label.title = npub;
    row.appendChild(label);

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "tip-btn ghost";
    copy.textContent = "Copy npub";
    copy.onclick = () => copyText(npub, copy);
    row.appendChild(copy);

    const clients = [
      { name: "Zap on Primal", url: "https://primal.net/p/" + encodeURIComponent(npub) },
      { name: "Zap on Snort", url: "https://snort.social/p/" + encodeURIComponent(npub) }
    ];
    clients.forEach(c => {
      const a = document.createElement("a");
      a.className = "tip-btn ghost";
      a.href = c.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = c.name;
      row.appendChild(a);
    });
    elActions.appendChild(row);
  }

  async function npubToHex(npub) {
    // minimal bech32 decode for npub / nprofile prefixes
    const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
    function polymod(values) {
      const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
      let chk = 1;
      for (const v of values) {
        const b = chk >> 25;
        chk = ((chk & 0x1ffffff) << 5) ^ v;
        for (let i = 0; i < 5; i++) if ((b >> i) & 1) chk ^= GEN[i];
      }
      return chk;
    }
    function hrpExpand(hrp) {
      const ret = [];
      for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >> 5);
      ret.push(0);
      for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31);
      return ret;
    }
    const sep = npub.lastIndexOf("1");
    if (sep < 1) throw new Error("bad npub");
    const hrp = npub.slice(0, sep).toLowerCase();
    const data = npub.slice(sep + 1);
    const vals = [];
    for (const c of data) {
      const idx = CHARSET.indexOf(c);
      if (idx < 0) throw new Error("bad npub");
      vals.push(idx);
    }
    if (polymod(hrpExpand(hrp).concat(vals)) !== 1) throw new Error("bad npub checksum");
    const bits = vals.slice(0, -6);
    let acc = 0, cnt = 0, out = [];
    for (const v of bits) {
      acc = (acc << 5) | v; cnt += 5;
      while (cnt >= 8) { cnt -= 8; out.push((acc >> cnt) & 255); }
    }
    return out.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function lud16FromProfile(npub) {
    const hex = await npubToHex(npub);
    const res = await fetch("https://api.nostr.band/v0/profile/" + hex);
    if (!res.ok) return "";
    const data = await res.json();
    const prof = data.profiles && data.profiles[hex];
    return (prof && (prof.lud16 || prof.lud06)) || "";
  }

  async function init() {
    let address = (cfg.lightningAddress || "").trim();
    const npub = (cfg.npub || "").trim();

    if (!address && npub) {
      setStatus("Looking up Lightning address from Nostr profile…");
      try { address = await lud16FromProfile(npub); } catch (e) { /* ignore */ }
    }

    if (!address && !npub) {
      mount.querySelector(".tip-main").innerHTML =
        '<p class="tip-lede">Tip jar not configured yet. Edit <code>web/support-config.js</code> ' +
        'with your Lightning address and/or Nostr npub, then redeploy.</p>';
      elQr.parentElement.hidden = true;
      return;
    }

    if (address) {
      elAddr.hidden = false;
      elAddr.innerHTML = '<span class="tip-label">Lightning</span> <code id="tipAddrText">' +
        address + '</code>';
      const copyAddr = document.createElement("button");
      copyAddr.type = "button";
      copyAddr.className = "tip-btn ghost";
      copyAddr.textContent = "Copy";
      copyAddr.onclick = () => copyText(address, copyAddr);
      elAddr.appendChild(copyAddr);
      drawQr("lightning:" + address);
      renderPresets();
      try {
        lnurlMeta = await fetchLnurl(address);
        setStatus("Pick an amount to generate a fresh invoice QR.");
      } catch (e) {
        setStatus("Address shown — preset invoices unavailable (" + e.message + ").", true);
        elPresets.hidden = true;
      }
    }

    if (npub) {
      if (!address) setStatus("Zap via Nostr — open a client below.");
      renderNostr(npub);
    }
  }

  init();
})();
