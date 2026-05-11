// =====================================================================
// Terminal — the actual nav. Reads from window.VFS.
// =====================================================================

(function () {
  const HOST = "jdub-sandboxhost";
  const USER = "guest";

  const out = document.getElementById("term-out");
  const input = document.getElementById("term-input");
  const promptEl = document.getElementById("term-prompt");
  const cwdEl = document.getElementById("term-cwd-label");

  const HISTORY_KEY = "jdub-term-history";
  const MAX_HISTORY = 200;

  let cwd = []; // path segments from VFS root
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  let historyIdx = history.length;

  // ---------- helpers ----------

  function pathStr() {
    return cwd.length === 0 ? "~" : "~/" + cwd.join("/");
  }

  function renderPrompt() {
    promptEl.innerHTML = `<span class="prompt-user">${USER}@${HOST}</span><span class="prompt-colon">:</span><span class="prompt-cwd">${pathStr()}</span><span class="prompt-dollar">$</span>`;
    cwdEl.textContent = pathStr();
  }

  function getNode(segments) {
    let node = window.VFS;
    for (const s of segments) {
      if (!node || !node.__dir) return null;
      node = node.children[s];
      if (!node) return null;
    }
    return node;
  }

  function currentDir() {
    return getNode(cwd);
  }

  function resolvePath(arg) {
    // Returns { segments, node, name } or { error }
    if (!arg || arg === "~" || arg === "~/") return { segments: [], node: window.VFS };
    let segs;
    if (arg === "/") segs = [];
    else if (arg.startsWith("/")) segs = arg.slice(1).split("/").filter(Boolean);
    else if (arg.startsWith("~/")) segs = arg.slice(2).split("/").filter(Boolean);
    else segs = [...cwd, ...arg.split("/").filter(Boolean)];

    // resolve .. and .
    const out = [];
    for (const s of segs) {
      if (s === "." || s === "") continue;
      if (s === "..") out.pop();
      else out.push(s);
    }
    const node = getNode(out);
    return { segments: out, node, name: out[out.length - 1] || "/" };
  }

  // ---------- output ----------

  function print(html, cls = "") {
    const el = document.createElement("div");
    el.className = "term-line " + cls;
    el.innerHTML = html;
    out.appendChild(el);
    return el;
  }

  function printPlain(text, cls = "") {
    const el = document.createElement("div");
    el.className = "term-line " + cls;
    el.textContent = text;
    out.appendChild(el);
    return el;
  }

  function printBlock(text, cls = "term-block") {
    const el = document.createElement("pre");
    el.className = "term-line " + cls;
    el.textContent = text;
    out.appendChild(el);
    return el;
  }

  function echoCommand(cmd) {
    const el = document.createElement("div");
    el.className = "term-line term-echo";
    el.innerHTML = `<span class="prompt-user">${USER}@${HOST}</span><span class="prompt-colon">:</span><span class="prompt-cwd">${pathStr()}</span><span class="prompt-dollar">$</span> <span class="echo-cmd"></span>`;
    el.querySelector(".echo-cmd").textContent = cmd;
    out.appendChild(el);
  }

  function escapeHTML(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ---------- commands ----------

  const COMMANDS = {};

  COMMANDS.help = {
    desc: "show available commands",
    run() {
      const rows = Object.entries(COMMANDS)
        .filter(([, c]) => !c.hidden)
        .map(([name, c]) => `  ${name.padEnd(12)} ${c.desc}`)
        .join("\n");
      printBlock(
        `available commands\n──────────────────\n${rows}\n\nfiles are read with: cat <file>\ndirectories are entered with: cd <dir>\nlist with: ls   ·   search with: grep <pattern> <file>\n`
      );
    },
  };

  COMMANDS.ls = {
    desc: "list files in current directory",
    run(args) {
      const target = args[0] ? resolvePath(args[0]) : { node: currentDir(), segments: cwd };
      if (!target.node) return printPlain(`ls: ${args[0]}: no such file or directory`, "term-err");
      if (!target.node.__dir) return printPlain(args[0] || pathStr(), "term-out-line");

      const all = args.includes("-a") || args.includes("-la") || args.includes("-al");
      const long = args.includes("-l") || args.includes("-la") || args.includes("-al");

      let names = Object.keys(target.node.children);
      if (!all) names = names.filter((n) => !n.startsWith("."));

      if (long) {
        const rows = names
          .sort()
          .map((n) => {
            const node = target.node.children[n];
            const isDir = !!node.__dir;
            const size = isDir ? "    -" : String(node.length || 0).padStart(5, " ");
            const flag = isDir ? "d" : "-";
            const display = isDir ? `<span class="ls-dir">${n}/</span>` : n;
            return `${flag}rw-r--r--  jdub  friends  ${size}  ${display}`;
          })
          .join("\n");
        const el = document.createElement("pre");
        el.className = "term-line term-block";
        el.innerHTML = rows;
        out.appendChild(el);
        return;
      }

      // grid layout
      const items = names.sort().map((n) => {
        const node = target.node.children[n];
        return node.__dir
          ? `<span class="ls-dir">${escapeHTML(n)}/</span>`
          : `<span class="ls-file">${escapeHTML(n)}</span>`;
      });
      const el = document.createElement("div");
      el.className = "term-line term-ls-grid";
      el.innerHTML = items.join("");
      out.appendChild(el);
    },
  };

  COMMANDS.cat = {
    desc: "print file contents",
    run(args) {
      if (args.length === 0) return printPlain("cat: missing file operand", "term-err");
      for (const a of args) {
        const t = resolvePath(a);
        if (!t.node) {
          printPlain(`cat: ${a}: no such file or directory`, "term-err");
          continue;
        }
        if (t.node.__dir) {
          printPlain(`cat: ${a}: is a directory`, "term-err");
          continue;
        }
        printBlock(t.node, "term-block term-file");
      }
    },
  };

  COMMANDS.cd = {
    desc: "change directory",
    run(args) {
      if (args.length === 0 || args[0] === "~" || args[0] === "/") {
        cwd = [];
        renderPrompt();
        return;
      }
      const t = resolvePath(args[0]);
      if (!t.node) return printPlain(`cd: ${args[0]}: no such file or directory`, "term-err");
      if (!t.node.__dir) return printPlain(`cd: ${args[0]}: not a directory`, "term-err");
      cwd = t.segments;
      renderPrompt();
    },
  };

  COMMANDS.pwd = {
    desc: "print working directory",
    run() {
      printPlain("/home/" + USER + (cwd.length ? "/" + cwd.join("/") : ""));
    },
  };

  COMMANDS.grep = {
    desc: "search inside a file",
    run(args) {
      if (args.length < 2) return printPlain("usage: grep <pattern> <file>", "term-err");
      const [pattern, ...files] = args;
      let re;
      try {
        re = new RegExp(pattern, "i");
      } catch {
        return printPlain(`grep: invalid pattern: ${pattern}`, "term-err");
      }
      const showFile = files.length > 1;
      let any = false;
      for (const f of files) {
        const t = resolvePath(f);
        if (!t.node || t.node.__dir) {
          printPlain(`grep: ${f}: not a regular file`, "term-err");
          continue;
        }
        const lines = t.node.split("\n");
        for (const line of lines) {
          if (re.test(line)) {
            any = true;
            const highlighted = escapeHTML(line).replace(
              new RegExp(pattern, "ig"),
              (m) => `<span class="grep-hit">${m}</span>`
            );
            print((showFile ? `<span class="grep-file">${f}:</span> ` : "") + highlighted);
          }
        }
      }
      if (!any) printPlain("(no matches)", "term-mute");
    },
  };

  COMMANDS.clear = {
    desc: "clear the screen",
    run() {
      out.innerHTML = "";
    },
  };

  COMMANDS.whoami = {
    desc: "who you are right now",
    run() {
      printPlain(USER);
    },
  };

  COMMANDS.date = {
    desc: "current date and time",
    run() {
      printPlain(new Date().toString());
    },
  };

  COMMANDS.uname = {
    desc: "system info",
    run(args) {
      if (args.includes("-a")) {
        printPlain(
          `${HOST} 4.20.69-friendly #1 SMP green-phosphor x86_64 GNU/jdub`
        );
      } else {
        printPlain("jdub-os");
      }
    },
  };

  COMMANDS.echo = {
    desc: "echo arguments",
    run(args) {
      printPlain(args.join(" "));
    },
  };

  COMMANDS.history = {
    desc: "show command history",
    run() {
      const lines = history
        .slice(-50)
        .map((c, i) => `  ${String(history.length - 50 + i + 1).padStart(4, " ")}  ${c}`)
        .join("\n");
      printBlock(lines || "(empty)");
    },
  };

  COMMANDS.reboot = {
    desc: "replay the boot sequence",
    run() {
      printPlain("rebooting…", "term-mute");
      setTimeout(() => {
        // Force a top-level navigation to the BBS root with an explicit
        // reboot flag so boot.js always replays the show.
        location.replace(location.pathname.replace(/[^/]+$/, "") + "?reboot=1");
      }, 400);
    },
  };

  COMMANDS.theme = {
    desc: "switch theme — try 'theme amber' or 'theme green'",
    run(args) {
      const t = args[0];
      if (t === "amber" || t === "green") {
        document.documentElement.dataset.theme = t;
        localStorage.setItem("jdub-theme", t);
        printPlain(`theme: ${t}`, "term-mute");
      } else {
        printPlain(
          `theme: ${document.documentElement.dataset.theme || "green"} — try 'theme amber' or 'theme green'`,
          "term-mute"
        );
      }
    },
  };

  COMMANDS.exit = {
    desc: "leave (returns you to julianwest.com)",
    run() {
      printPlain("logout", "term-mute");
      printPlain("connection closed.", "term-mute");
      setTimeout(() => {
        location.href = "https://julianwest.com/";
      }, 500);
    },
  };

  // -------- easter eggs --------

  COMMANDS.sudo = {
    desc: "request superuser",
    hidden: true,
    run(args) {
      const rest = args.join(" ");
      if (/make.*sandwich/i.test(rest)) {
        printPlain("okay.", "term-ok");
      } else {
        printPlain("guest is not in the sudoers file. this incident has been logged.", "term-err");
      }
    },
  };

  COMMANDS.fortune = {
    desc: "a small piece of wisdom",
    hidden: true,
    run() {
      const fortunes = [
        "every terminal is a time machine to 1978.",
        "the best feature is the one you didn't ship.",
        "if you can't explain it to a duck, refactor.",
        "the network is reliable. — anonymous, just before disaster.",
        "a clever solution and a working solution are rarely the same.",
        "writing is thinking. typing is not.",
      ];
      printPlain(fortunes[Math.floor(Math.random() * fortunes.length)], "term-mute");
    },
  };

  COMMANDS.matrix = {
    desc: "fall down the rabbit hole",
    hidden: true,
    run() {
      const lines = 18;
      const cols = 60;
      const chars = "01·∙•◦アカサタナハマヤラワ";
      let s = "";
      for (let r = 0; r < lines; r++) {
        let row = "";
        for (let c = 0; c < cols; c++) {
          row += Math.random() < 0.4 ? chars[Math.floor(Math.random() * chars.length)] : " ";
        }
        s += row + "\n";
      }
      printBlock(s, "term-block term-matrix");
    },
  };

  COMMANDS.man = {
    desc: "show a manual page",
    hidden: true,
    run(args) {
      if (!args[0]) return printPlain("what manual page do you want?", "term-mute");
      printBlock(
        `MAN(1)\n\nNAME\n    ${args[0]} — a thing that may or may not exist\n\nDESCRIPTION\n    documentation is left as an exercise for the reader.\n    try 'help' for the list of real commands.\n`
      );
    },
  };

  COMMANDS.neofetch = {
    desc: "system splash",
    hidden: true,
    run() {
      const art = `
       _________
      |  _____  |     ${USER}@${HOST}
      | |     | |     ─────────────────
      | |  >_ | |     OS:    jdub-os (green phosphor)
      | |_____| |     KERN:  4.20.69-friendly
      |_________|     UPTIME: just now
       \\_______/      SHELL: /bin/sh
        |  |  |       TERM:  vt220-friendly
       _|__|__|_      THEME: green-on-black
                     PHILOSOPHY: less is more
`;
      printBlock(art, "term-block term-fetch");
    },
  };

  // ---------- input loop ----------

  function execute(rawLine) {
    const line = rawLine.trim();
    if (!line) {
      echoCommand("");
      return;
    }
    echoCommand(line);
    history.push(line);
    if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    historyIdx = history.length;

    // tokenize (simple; respects double quotes)
    const tokens = [];
    const re = /"([^"]*)"|(\S+)/g;
    let m;
    while ((m = re.exec(line))) tokens.push(m[1] !== undefined ? m[1] : m[2]);

    const [name, ...args] = tokens;
    const cmd = COMMANDS[name];
    if (!cmd) {
      printPlain(`${name}: command not found. try 'help'.`, "term-err");
      return;
    }
    try {
      cmd.run(args);
    } catch (e) {
      printPlain(`error: ${e.message}`, "term-err");
    }
  }

  // tab completion: only files in current dir
  function complete(value) {
    const tokens = value.split(/\s+/);
    const last = tokens[tokens.length - 1] || "";
    if (tokens.length === 1) {
      // command
      const matches = Object.keys(COMMANDS).filter((c) => c.startsWith(last));
      if (matches.length === 1) {
        tokens[tokens.length - 1] = matches[0] + " ";
        return tokens.join(" ");
      }
      if (matches.length > 1) {
        printPlain(matches.join("  "), "term-mute");
      }
      return value;
    }
    // file/dir under cwd
    const dir = currentDir();
    if (!dir || !dir.__dir) return value;
    const candidates = Object.keys(dir.children).filter((n) => n.startsWith(last));
    if (candidates.length === 1) {
      const node = dir.children[candidates[0]];
      tokens[tokens.length - 1] = candidates[0] + (node.__dir ? "/" : "");
      return tokens.join(" ");
    }
    if (candidates.length > 1) {
      printPlain(candidates.join("  "), "term-mute");
    }
    return value;
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const v = input.value;
      input.value = "";
      execute(v);
      // scroll to bottom
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
      input.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIdx > 0) {
        historyIdx--;
        input.value = history[historyIdx] || "";
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx < history.length) {
        historyIdx++;
        input.value = history[historyIdx] || "";
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      input.value = complete(input.value);
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      COMMANDS.clear.run();
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      echoCommand(input.value + "^C");
      input.value = "";
    }
  });

  // Click anywhere in terminal to refocus input.
  document.addEventListener("click", (e) => {
    if (window.getSelection().toString()) return; // don't steal selections
    if (document.body.classList.contains("post-boot")) input.focus();
  });

  // ---------- init ----------

  function init() {
    // restore theme
    const saved = localStorage.getItem("jdub-theme");
    if (saved) document.documentElement.dataset.theme = saved;

    renderPrompt();

    // banner
    printPlain(
      `jdub-sandboxhost v0.4.0 — green phosphor build`,
      "term-mute"
    );
    printPlain(
      `the phosphor is a lie but we keep forgetting`,
      "term-mute"
    );
    const fileCount = Object.keys(window.VFS.children).filter((n) => !n.startsWith(".")).length;
    printPlain(
      `${fileCount} files. type \`help\` or try: ls · cat about.txt · neofetch`,
      "term-mute"
    );
    print(" ");

    setTimeout(() => input.focus(), 50);
  }

  if (document.body.classList.contains("post-boot")) {
    init();
  } else {
    window.addEventListener("boot:done", init, { once: true });
  }
})();
