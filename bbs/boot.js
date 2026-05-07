// =====================================================================
// Boot sequence — the "show". Runs once on first land, then cleans up
// and hands off to the terminal. Pressing any key skips ahead.
// =====================================================================

(function () {
  const $ = (sel) => document.querySelector(sel);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const stage = $("#boot-stage");
  const stream = $("#boot-stream");
  const skipHint = $("#boot-skip");

  let skipRequested = false;
  let cleanedUp = false;

  function onSkip() {
    skipRequested = true;
  }
  window.addEventListener("keydown", onSkip, { once: true });
  window.addEventListener("pointerdown", onSkip, { once: true });

  // Quick sleep that resolves immediately if user wants to skip.
  async function nap(ms) {
    if (skipRequested) return;
    const step = 20;
    let waited = 0;
    while (waited < ms && !skipRequested) {
      await sleep(Math.min(step, ms - waited));
      waited += step;
    }
  }

  // Type a string into a target element character-by-character.
  async function type(target, text, cps = 220) {
    const delay = Math.max(4, Math.floor(1000 / cps));
    for (const ch of text) {
      if (skipRequested) {
        target.append(text.slice(target.textContent ? 0 : 0)); // no-op safety
        target.textContent += text.slice(target.textContent.length);
        return;
      }
      target.append(ch);
      // small natural variance
      await sleep(ch === "\n" ? delay * 2 : delay + (Math.random() * 6 - 3));
    }
  }

  function line(html, cls = "") {
    const el = document.createElement("div");
    el.className = "boot-line " + cls;
    el.innerHTML = html;
    stream.appendChild(el);
    el.scrollIntoView({ block: "end" });
    return el;
  }

  function dotsLine(label, status = "ok", cls = "boot-ok") {
    const dots = ".".repeat(Math.max(2, 52 - label.length));
    return line(
      `<span class="boot-label">${label}</span> <span class="boot-dots">${dots}</span> <span class="${cls}">${status}</span>`
    );
  }

  // ---------- the actual sequence ----------
  async function run() {
    // Phase 1: dial-up handshake
    await nap(500);
    await type(line(""), "ATDT 5551990...", 240);
    await nap(550);
    await type(line(""), "RING.", 240);
    await nap(400);
    await type(line(""), "RING.", 240);
    await nap(400);
    await type(line("", "boot-mute"), "CARRIER 28800", 280);
    await nap(220);
    await type(line("", "boot-mute"), "PROTOCOL: LAP-M", 280);
    await nap(220);
    await type(line("", "boot-mute"), "COMPRESSION: V.42bis", 280);
    await nap(300);
    await type(line(""), "CONNECT 28800/ARQ/V42BIS", 320);
    await nap(450);

    // Phase 2: a moment of static
    line(
      '<span class="boot-static">' +
        Array.from({ length: 220 }, () =>
          "·:.◦∙• "[Math.floor(Math.random() * 7)]
        ).join("") +
        "</span>"
    );
    await nap(280);

    // Phase 3: ASCII wordmark — ANSI Shadow style block letters
    const banner = [
      "     ██╗██╗   ██╗██╗     ██╗ █████╗ ███╗   ██╗██╗    ██╗███████╗███████╗████████╗   ██████╗ ██████╗ ███╗   ███╗",
      "     ██║██║   ██║██║     ██║██╔══██╗████╗  ██║██║    ██║██╔════╝██╔════╝╚══██╔══╝  ██╔════╝██╔═══██╗████╗ ████║",
      "     ██║██║   ██║██║     ██║███████║██╔██╗ ██║██║ █╗ ██║█████╗  ███████╗   ██║     ██║     ██║   ██║██╔████╔██║",
      "██   ██║██║   ██║██║     ██║██╔══██║██║╚██╗██║██║███╗██║██╔══╝  ╚════██║   ██║     ██║     ██║   ██║██║╚██╔╝██║",
      "╚█████╔╝╚██████╔╝███████╗██║██║  ██║██║ ╚████║╚███╔███╔╝███████╗███████║   ██║   ▄ ╚██████╗╚██████╔╝██║ ╚═╝ ██║",
      " ╚════╝  ╚═════╝ ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚══╝╚══╝ ╚══════╝╚══════╝   ╚═╝   ▀  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝",
      "",
      "          ░▒▓ green phosphor build · friends only · v0.4.0 ▓▒░",
    ];
    for (const row of banner) {
      line(`<span class="boot-banner">${row || " "}</span>`);
      if (!skipRequested) await sleep(35);
    }
    await nap(300);

    // Phase 4: kernel-ish boot lines
    line('<span class="boot-mute">v0.4.0 · green phosphor build · MMXXVI</span>');
    line(" ");

    const seq = [
      ["[ 0.041222] CPU0 — single-core, green phosphor, 72 ch/s"],
      ["[ 0.083911] memory test ............................ ok (∞ kB free)"],
      ["[ 0.128344] mounting /home/jdub ...................", "ok"],
      ["[ 0.144711] mounting /var/log .....................", "ok"],
      ["[ 0.181004] mounting /etc .........................", "ok"],
      ["[ 0.233812] loading curiosity.ko ..................", "ok"],
      ["[ 0.287215] loading patience.ko ...................", "ok"],
      ["[ 0.312008] loading caffeine.ko ...................", "ok"],
      ["[ 0.448190] starting readerd ......................", "[ ok ]"],
      ["[ 0.502221] starting fileserverd ..................", "[ ok ]"],
      ["[ 0.561477] starting lurkerd ......................", "[ ok ]"],
      ["[ 0.711003] tty0 online — hello."],
    ];
    for (const [text, ok] of seq) {
      if (ok) {
        const el = line("");
        el.innerHTML =
          `<span class="boot-mute">${text}</span> <span class="boot-ok">${ok}</span>`;
      } else {
        line(`<span class="boot-mute">${text}</span>`);
      }
      if (!skipRequested) await sleep(80 + Math.random() * 120);
    }

    line(" ");
    await nap(200);
    await type(line(""), "jdub-sandboxhost login: guest", 280);
    await nap(150);
    await type(line(""), "Last login: was a while ago. welcome back.", 280);
    await nap(400);

    line(" ");
    skipHint.style.opacity = "1";

    // Wait for any input to continue (or auto after a beat).
    await new Promise((resolve) => {
      const go = () => {
        window.removeEventListener("keydown", go);
        window.removeEventListener("pointerdown", go);
        resolve();
      };
      window.addEventListener("keydown", go);
      window.addEventListener("pointerdown", go);
      setTimeout(go, 5000); // auto-advance after 5s
    });

    cleanup();
  }

  function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;
    document.body.classList.add("post-boot");
    stage.classList.add("boot-fading");
    setTimeout(() => {
      stage.remove();
      window.dispatchEvent(new Event("boot:done"));
    }, 700);
  }

  // Skip the boot only when navigating WITHIN the BBS (e.g. back button,
  // an internal link from /bbs/something else). A fresh load — refresh on
  // the main domain into the easter-egg, a deep link, an external referrer —
  // always replays the show.
  function shouldSkipBoot() {
    const params = new URLSearchParams(location.search);
    if (params.has("reboot")) return false; // explicit replay always wins
    if (params.has("skipboot")) return true;

    // Did the previous page in this tab live under /bbs/?
    try {
      if (document.referrer) {
        const ref = new URL(document.referrer);
        if (ref.origin === location.origin && ref.pathname.startsWith("/bbs/")) {
          return true;
        }
      }
    } catch (_) {}

    // Back/forward navigation within the BBS (no referrer but history says
    // we got here via back/forward — treat as in-BBS).
    const nav = performance.getEntriesByType
      ? performance.getEntriesByType("navigation")[0]
      : null;
    if (nav && nav.type === "back_forward") return true;

    return false;
  }

  if (shouldSkipBoot()) {
    cleanup();
  } else {
    run();
  }
})();
