// Ensure Node-like globals needed by @solana/web3.js exist in the browser
(() => {
    try {
        const g = typeof globalThis !== "undefined" ? globalThis : window;
        if (!g.global) g.global = g;
        if (!g.process) g.process = { env: {} };

        // Prefer the Buffer from the buffer polyfill if available
        if (!g.Buffer || typeof g.Buffer.from !== "function" || typeof g.Buffer.alloc !== "function") {
            if (g.buffer && g.buffer.Buffer) {
                g.Buffer = g.buffer.Buffer;
            }
        }

        // Minimal Buffer shim if still missing
        if (!g.Buffer || typeof g.Buffer.from !== "function" || typeof g.Buffer.alloc !== "function") {
            const textEncoder = new (g.TextEncoder || function() {})();
            const textDecoder = g.TextDecoder ? new g.TextDecoder() : null;

            function from(input, encOrOffset, length) {
                if (input == null) return new Uint8Array(0);
                if (typeof input === "string") {
                    if (textEncoder && typeof textEncoder.encode === "function") {
                        return textEncoder.encode(input);
                    }
                    const arr = unescape(encodeURIComponent(input)).split("").map(c => c.charCodeAt(0));
                    return new Uint8Array(arr);
                }
                if (Array.isArray(input)) return new Uint8Array(input);
                if (input instanceof Uint8Array) return new Uint8Array(input);
                if (input instanceof ArrayBuffer) return new Uint8Array(input, encOrOffset || 0, length || undefined);
                // BigInt to LE bytes (common in web3 encode paths)
                if (typeof input === "bigint") {
                    // default to 8 bytes
                    let hex = input.toString(16);
                    if (hex.length % 2) hex = "0" + hex;
                    const bytes = hex.match(/.{1,2}/g).map(h => parseInt(h, 16)).reverse();
                    return new Uint8Array(bytes);
                }
                if (typeof input === "number") return new Uint8Array([input & 0xff]);
                return new Uint8Array(0);
            }

            function alloc(size, fill, encoding) {
                const a = new Uint8Array(size);
                if (fill !== undefined) {
                    if (typeof fill === "number") {
                        a.fill(fill);
                    } else if (typeof fill === "string") {
                        a.set(from(fill, encoding));
                    } else if (fill instanceof Uint8Array) {
                        a.set(fill.subarray(0, size));
                    }
                }
                return a;
            }

            function concat(list, totalLength) {
                if (!Array.isArray(list)) return new Uint8Array(0);
                const len = totalLength || list.reduce((n, x) => n + (x ? x.length || x.byteLength || 0 : 0), 0);
                const out = new Uint8Array(len);
                let offset = 0;
                for (const item of list) {
                    if (!item) continue;
                    const u8 = item instanceof Uint8Array ? item : from(item);
                    out.set(u8, offset);
                    offset += u8.length;
                }
                return out;
            }

            class BufferShim extends Uint8Array {}
            BufferShim.from = from;
            BufferShim.alloc = alloc;
            BufferShim.concat = concat;
            BufferShim.isBuffer = (obj) => obj instanceof Uint8Array;
            g.Buffer = BufferShim;
        }

        // Ensure a real global var binding exists for Buffer so libraries resolve it
        try {
            const s = document.createElement("script");
            s.text = "var Buffer = globalThis.Buffer;";
            document.head.appendChild(s);
        } catch (_) {}
    } catch (_) {}
})();

document.addEventListener("DOMContentLoaded", () => {
    // Original symbol set
    const SYMBOLS = [
        "symbol1",
        "symbol2",
        "symbol3",
        "symbol4",
        "symbol5",
        "HoneySlut",
    ];

    // Allow custom art via localStorage (data URLs). Provide colorful generic icons by default.
    const CUSTOM_ART_KEY = "slot_machine_custom_art_v2";
    const svgDataUri = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    const DEFAULT_ART_MAP = {
        symbol1: svgDataUri(`
            <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
              <rect width='100%' height='100%' fill='#0f172a'/>
              <circle cx='100' cy='100' r='70' fill='#3b82f6' stroke='#1e40af' stroke-width='4'/>
              <text x='50%' y='54%' text-anchor='middle' font-family='Arial' font-size='72' fill='#ffffff' font-weight='bold'>1</text>
            </svg>
        `),
        symbol2: svgDataUri(`
            <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
              <rect width='100%' height='100%' fill='#0f172a'/>
              <rect x='40' y='40' width='120' height='120' fill='#10b981' stroke='#059669' stroke-width='4' rx='10'/>
              <text x='50%' y='54%' text-anchor='middle' font-family='Arial' font-size='72' fill='#ffffff' font-weight='bold'>2</text>
            </svg>
        `),
        symbol3: svgDataUri(`
            <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
              <rect width='100%' height='100%' fill='#0f172a'/>
              <polygon points='100,30 170,150 30,150' fill='#f59e0b' stroke='#d97706' stroke-width='4'/>
              <text x='50%' y='58%' text-anchor='middle' font-family='Arial' font-size='72' fill='#ffffff' font-weight='bold'>3</text>
            </svg>
        `),
        symbol4: svgDataUri(`
            <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
              <rect width='100%' height='100%' fill='#0f172a'/>
              <polygon points='100,40 140,80 140,120 100,160 60,120 60,80' fill='#a78bfa' stroke='#7c3aed' stroke-width='4'/>
              <text x='50%' y='54%' text-anchor='middle' font-family='Arial' font-size='72' fill='#ffffff' font-weight='bold'>4</text>
            </svg>
        `),
        symbol5: svgDataUri(`
            <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
              <rect width='100%' height='100%' fill='#0f172a'/>
              <rect x='50' y='80' width='100' height='60' fill='#22c55e' rx='5'/>
              <circle cx='70' cy='140' r='15' fill='#1f2937'/>
              <circle cx='130' cy='140' r='15' fill='#1f2937'/>
              <rect x='80' y='50' width='40' height='30' fill='#3b82f6'/>
              <text x='50%' y='100%' text-anchor='middle' font-family='Arial' font-size='20' fill='#94a3b8'>Tractor</text>
            </svg>
        `),
        HoneySlut: svgDataUri(`
            <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
              <rect width='100%' height='100%' fill='#0f172a'/>
              <polygon points='100,35 165,165 35,165' fill='#ef4444' stroke='#b91c1c' stroke-width='6'/>
              <rect x='95' y='85' width='10' height='40' fill='#111827'/>
              <rect x='95' y='130' width='10' height='12' fill='#111827'/>
              <text x='50%' y='95%' text-anchor='middle' font-family='Arial' font-size='16' fill='#f87171'>HONEY SLUT</text>
            </svg>
        `),
        // Super-Wildcard Slut emblem for bonus expansion
        SuperWildcardSlut: svgDataUri(`
            <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
              <defs>
                <linearGradient id='dinobg' x1='0' y1='0' x2='1' y2='1'>
                  <stop offset='0%' stop-color='#e879f9'/>
                  <stop offset='100%' stop-color='#22d3ee'/>
                </linearGradient>
              </defs>
              <rect width='100%' height='100%' fill='#0b1220'/>
              <circle cx='100' cy='100' r='64' fill='url(#dinobg)' stroke='#0ea5e9' stroke-width='6'/>
              <text x='50%' y='54%' text-anchor='middle' font-family='Arial' font-size='18' fill='#0b1220' font-weight='900'>SLUT</text>
            </svg>
        `),
    };
    const FALLBACK_PLACEHOLDER = DEFAULT_ART_MAP.symbol1;

    function getCustomArtMap() {
        try {
            const raw = localStorage.getItem(CUSTOM_ART_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.warn("Failed to read custom art map:", e);
            return {};
        }
    }

    function setCustomArtMap(map) {
        try {
            localStorage.setItem(CUSTOM_ART_KEY, JSON.stringify(map));
        } catch (e) {
            console.warn("Failed to save custom art map:", e);
        }
    }

    function clearCustomArt() {
        localStorage.removeItem(CUSTOM_ART_KEY);
    }

    // Resolve a symbol name to a URL (custom data URL or placeholder)
    function resolveSymbolUrl(symbolName) {
        const custom = getCustomArtMap();
        if (custom[symbolName]) return custom[symbolName];
        if (DEFAULT_ART_MAP[symbolName]) return DEFAULT_ART_MAP[symbolName];
        return FALLBACK_PLACEHOLDER;
    }

    const reels = [
        document.getElementById("reel1"),
        document.getElementById("reel2"),
        document.getElementById("reel3"),
    ];

    const applyBackground = (reel, symbol) => {
        const url = resolveSymbolUrl(symbol);
        reel.style.backgroundImage = `url("${url}")`;
        reel.style.backgroundSize = "contain";
        reel.style.backgroundRepeat = "no-repeat";
        reel.style.backgroundPosition = "center";
        reel.textContent = "";
    };

    // Initialize reels with symbol5 as per original game
    reels.forEach(r => applyBackground(r, "symbol5"));

    const spinButton = document.getElementById("spin-button");
    const respinButton = document.getElementById("respin-button");
    const rechargeButton = document.getElementById("recharge-button");
    const connectWalletButton = document.getElementById("connect-wallet");
    const message = document.getElementById("message");
    const scoreElement = document.getElementById("score");
    const rechargeCounterElement = document.getElementById("recharge-counter");
    // HUD chip elements
    const hud = {
        rounds: document.getElementById("rounds-counter"),
        jackpots: document.getElementById("jackpots-counter"),
        pairs: document.getElementById("pairs-counter"),
        nowins: document.getElementById("nowins-counter"),
        respinsSession: document.getElementById("respins-session-counter"),
        honeyHits: document.getElementById("honey-hits-counter"),
        honeyPenalty: document.getElementById("honey-penalty-counter"),
        tripleHoney: document.getElementById("triple-honey-counter"),
        triesG: document.getElementById("feature-tries-g-counter"),
        triesNG: document.getElementById("feature-tries-ng-counter"),
        expand2: document.getElementById("feature-expand2-counter"),
        featureWins: document.getElementById("feature-wins-counter"),
        pairStreak: document.getElementById("pair-streak-counter"),
        netSession: document.getElementById("net-session-counter"),
        highScore: document.getElementById("high-score-counter"),
    };

    let score = 0;
    let respinCount = 0;
    let rechargeCount = 0;
    // Session stats
    const stats = {
        rounds: 0,
        jackpots: 0,
        pairs: 0,
        nowins: 0,
        respinsSession: 0,
        honeyHits: 0,
        honeyPenalty: 0,
        tripleHoney: 0,
        triesG: 0,
        triesNG: 0,
        expand2: 0,
        featureWins: 0,
        pairStreak: 0,
        netSession: 0,
        highScore: 0,
    };
    let currentReel = 0;
    const spinPrice = 21;
    const respinPrice = 34;
    const rechargePoints = 300;

    // Solana / Phantom integration (DEVNET via Helius)
    const RPC_URL = "https://devnet.helius-rpc.com/?api-key=3259bad6-3c6a-4904-aca2-f8bfae8fffcb";
    // WebSocket not required for current flow; HTTP polling is sufficient
    const RECIPIENT_ADDRESS = "64proZNUFDDqPyQSiGw3pkgNtFfj9RndtM7ibw6UJrcQ";
    const RECHARGE_LAMPORTS = 1_000_000; // 0.001 SOL
    let connection = null;
    let walletPublicKey = null;
    try {
        if (window.solanaWeb3) {
            connection = new window.solanaWeb3.Connection(RPC_URL, "confirmed");
        }
    } catch (_) {}

    const isPhantomReady = () => !!(window.solana && (window.solana.isPhantom || window.solana.isConnected));

    const updateWalletUi = () => {
        if (!connectWalletButton) return;
        if (walletPublicKey) {
            const base58 = walletPublicKey.toBase58();
            connectWalletButton.textContent = `Connected: ${base58.slice(0,4)}...${base58.slice(-4)}`;
        } else {
            connectWalletButton.textContent = "Connect Wallet";
        }
    };

    const connectWallet = async () => {
        if (!isPhantomReady()) {
            message.textContent = "⚠️ Phantom wallet not found. Install Phantom to continue.";
            return;
        }
        try {
            const resp = await window.solana.connect();
            walletPublicKey = resp.publicKey || window.solana.publicKey;
            updateWalletUi();
            message.textContent = "✅ Wallet connected.";
        } catch (e) {
            message.textContent = "❌ Wallet connection canceled.";
        }
    };

    const disconnectWallet = async () => {
        try { await window.solana.disconnect(); } catch (_) {}
        walletPublicKey = null;
        updateWalletUi();
        message.textContent = "ℹ️ Wallet disconnected.";
    };

    // Wire wallet button
    connectWalletButton?.addEventListener("click", async () => {
        if (walletPublicKey) return disconnectWallet();
        return connectWallet();
    });
    // Provider events
    if (isPhantomReady()) {
        try {
            window.solana.on("connect", () => { walletPublicKey = window.solana.publicKey; updateWalletUi(); });
            window.solana.on("disconnect", () => { walletPublicKey = null; updateWalletUi(); });
            window.solana.on?.("accountChanged", (pk) => { walletPublicKey = pk || null; updateWalletUi(); });
        } catch (_) {}
    }

    // Animation configuration
    const FRAMES_PER_REEL = 22;
    const FRAME_DURATION_MS = 67; // per-frame duration

    function fibonacciStartFrames(maxFrames) {
        // Build fibonacci sequence until > maxFrames
        const fib = [1, 1];
        while (fib[fib.length - 1] < maxFrames) {
            fib.push(fib[fib.length - 1] + fib[fib.length - 2]);
        }
        // Take two earlier fibonacci numbers under max to start reels earlier
        const valid = fib.filter((n) => n < maxFrames);
        if (valid.length >= 3) {
            return [valid[valid.length - 3], valid[valid.length - 2]]; // e.g., 8,13 for 22
        }
        if (valid.length >= 2) {
            return [valid[valid.length - 2], valid[valid.length - 1]];
        }
        return [1, 1];
    }
    const [FIB_A, FIB_B] = fibonacciStartFrames(FRAMES_PER_REEL);
    const START_FRAME_REEL2 = FIB_B; // e.g., 13 when FRAMES_PER_REEL = 22
    const START_FRAME_REEL3 = FIB_A; // e.g., 8 when FRAMES_PER_REEL = 22

    // Original equal probability distribution
    function rollSymbol() {
        return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    }

    // Send game-event payloads to the server
    function logEvent(payload) {
        fetch("/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }).catch((err) => console.warn("Log failed:", err));
    }

    const startGame = () => {
        score = rechargePoints;
        rechargeCount = 0;
        // reset stats
        Object.keys(stats).forEach(k => stats[k] = 0);
        updateScore(0);
        updateRechargeCounter();
        renderHud();
        message.textContent = `Game started with ${rechargePoints} points!`;
        logEvent({ event: "game_start", score });
    };

    const updateScore = (pts) => {
        score += pts;
        stats.netSession += pts;
        if (score > stats.highScore) stats.highScore = score;
        scoreElement.textContent = `Score: ${score}`;
        renderHud();
        toggleRechargeButton();
    };

    const renderHud = () => {
        if (hud.rounds) hud.rounds.textContent = `Rounds: ${stats.rounds}`;
        if (hud.jackpots) hud.jackpots.textContent = `Jackpots: ${stats.jackpots}`;
        if (hud.pairs) hud.pairs.textContent = `Pairs: ${stats.pairs}`;
        if (hud.nowins) hud.nowins.textContent = `No‑wins: ${stats.nowins}`;
        if (hud.respinsSession) hud.respinsSession.textContent = `Respins (session): ${stats.respinsSession}`;
        if (hud.honeyHits) hud.honeyHits.textContent = `Honey hits: ${stats.honeyHits}`;
        if (hud.honeyPenalty) hud.honeyPenalty.textContent = `Honey penalty: ${stats.honeyPenalty}`;
        if (hud.tripleHoney) hud.tripleHoney.textContent = `Triple Honey: ${stats.tripleHoney}`;
        if (hud.triesG) hud.triesG.textContent = `Feature tries (G): ${stats.triesG}`;
        if (hud.triesNG) hud.triesNG.textContent = `Feature tries (NG): ${stats.triesNG}`;
        if (hud.expand2) hud.expand2.textContent = `Expand→2: ${stats.expand2}`;
        if (hud.featureWins) hud.featureWins.textContent = `Feature wins: ${stats.featureWins}`;
        if (hud.pairStreak) hud.pairStreak.textContent = `Pair streak: ${stats.pairStreak}`;
        if (hud.netSession) hud.netSession.textContent = `Net session: ${stats.netSession}`;
        if (hud.highScore) hud.highScore.textContent = `High score: ${stats.highScore}`;
    };

    const updateRechargeCounter = () => {
        rechargeCounterElement.textContent = `Recharges: ${rechargeCount}`;
    };

    const toggleRechargeButton = () => {
        rechargeButton.style.display = score < 50 ? "inline-block" : "none";
    };

    // Build SystemProgram.transfer instruction without relying on Buffer-heavy layout code
    function u32ToLeBytes(value) {
        const v = value >>> 0;
        return new Uint8Array([
            v & 0xff,
            (v >>> 8) & 0xff,
            (v >>> 16) & 0xff,
            (v >>> 24) & 0xff,
        ]);
    }

    function u64ToLeBytes(value) {
        let v = BigInt(value);
        const bytes = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
            bytes[i] = Number(v & 0xffn);
            v >>= 8n;
        }
        return bytes;
    }

    function buildSystemTransferData(lamports) {
        const INSTRUCTION_INDEX_TRANSFER = 2; // SystemProgram.Transfer
        const idx = u32ToLeBytes(INSTRUCTION_INDEX_TRANSFER);
        const amt = u64ToLeBytes(lamports);
        const out = new Uint8Array(4 + 8);
        out.set(idx, 0);
        out.set(amt, 4);
        return out;
    }

    function createTransferInstruction(fromPubkey, toPubkey, lamports) {
        const { TransactionInstruction, SystemProgram } = window.solanaWeb3;
        return new TransactionInstruction({
            keys: [
                { pubkey: fromPubkey, isSigner: true, isWritable: true },
                { pubkey: toPubkey, isSigner: false, isWritable: true },
            ],
            programId: SystemProgram.programId,
            data: buildSystemTransferData(lamports),
        });
    }

    async function handleRecharge() {
        if (score >= 50) return; // shouldn't be visible
        if (!isPhantomReady()) {
            message.textContent = "⚠️ Phantom wallet not found. Install Phantom to recharge.";
            return;
        }
        if (!walletPublicKey) {
            await connectWallet();
            if (!walletPublicKey) return;
        }
        if (!connection || !window.solanaWeb3) {
            message.textContent = "❌ Solana web3 initialization failed.";
            return;
        }
        try {
            rechargeButton.disabled = true;
            message.textContent = "⏳ Processing recharge payment (0.001 SOL)...";
            const { Transaction, PublicKey } = window.solanaWeb3;
            const recipient = new PublicKey(RECIPIENT_ADDRESS);
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");
            const tx = new Transaction({ feePayer: walletPublicKey, recentBlockhash: blockhash });
            tx.add(createTransferInstruction(walletPublicKey, recipient, RECHARGE_LAMPORTS));
            // Let Phantom populate recentBlockhash/fee payer if required
            tx.feePayer = walletPublicKey;
            // Phantom expects a serialized message for signAndSendTransaction in some versions
            const signed = await window.solana.signAndSendTransaction(tx);
            const signature = signed?.signature || signed; // supports string or { signature }
            await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
            updateScore(rechargePoints);
            rechargeCount++;
            updateRechargeCounter();
            message.textContent = "🎉 Recharge successful (+300)!";
            logEvent({ event: "recharge", kind: "sol", lamports: RECHARGE_LAMPORTS, signature, newScore: score, rechargeCount });
        } catch (e) {
            console.warn("Recharge failed", e);
            message.textContent = "❌ Recharge failed or canceled.";
        } finally {
            rechargeButton.disabled = false;
        }
    }
    rechargeButton.addEventListener("click", handleRecharge);

    const animateReel = (reel, final, delay, frames, onFrame) =>
        new Promise((res) => {
            setTimeout(() => {
                const animSyms = [...SYMBOLS, ...SYMBOLS];
                let idx = 0;
                const dur = FRAME_DURATION_MS;
                const iv = setInterval(() => {
                    if (idx >= frames) {
                        clearInterval(iv);
                        applyBackground(reel, final);
                        res();
                    } else {
                        applyBackground(reel, animSyms[idx % animSyms.length]);
                        idx++;
                        if (onFrame) { try { onFrame(idx); } catch(_) {} }
                    }
                }, dur);
            }, delay);
        });

    const spinReels = async () => {
        if (score < spinPrice) {
            message.textContent = "❌ Not enough points to spin!";
            return;
        }
        updateScore(-spinPrice);
        resetRound();
        spinButton.disabled = true;
        const results = [];
        let p0, p1, p2;
        let started1 = false;
        let started2 = false;

        // Ensure we truly await reels 2 and 3 even though they start later
        let resolveP1, resolveP2;
        p1 = new Promise((res) => { resolveP1 = res; });
        p2 = new Promise((res) => { resolveP2 = res; });

        const startReel = (i) => {
            const sym = rollSymbol();
            results[i] = sym;
            if (i === 0) {
                p0 = animateReel(reels[0], sym, 0, FRAMES_PER_REEL, (frame) => {
                    if (!started1 && frame === START_FRAME_REEL2) { started1 = true; startReel(1); }
                });
            } else if (i === 1) {
                animateReel(reels[1], sym, 0, FRAMES_PER_REEL, (frame) => {
                    if (!started2 && frame === START_FRAME_REEL3) { started2 = true; startReel(2); }
                }).then(() => { if (resolveP1) resolveP1(); });
            } else {
                animateReel(reels[2], sym, 0, FRAMES_PER_REEL).then(() => { if (resolveP2) resolveP2(); });
            }
        };

        startReel(0);
        await Promise.all([p0, p1, p2]);
        stats.rounds += 1;
        renderHud();
        logEvent({ event: "spin", results, beforeScore: score + spinPrice, rounds: stats.rounds });
        checkWin(results);
        spinButton.disabled = false;
    };

    const checkWin = (results) => {
        let honeyCount = results.filter((s) => s === "HoneySlut").length;
        let msg = "";

        if (honeyCount) {
            const ded = honeyCount * 3;
            updateScore(-ded);
            msg += `😈 Honey Slut Penalty x${honeyCount}, –${ded} pts. `;
            logEvent({ event: "honey_penalty", count: honeyCount, newScore: score });
            stats.honeyHits += honeyCount;
            stats.honeyPenalty += ded;
            renderHud();
        }

        if (honeyCount === 3) {
            msg += "Triggering Super-Wildcard Slut! ";
            message.textContent = msg;
            logEvent({ event: "slut_trigger", type: "triple_honey", score });
            stats.tripleHoney += 1;
            stats.triesG += 1; // guaranteed trigger
            renderHud();
            triggerSuperWildcard(true);
            return;
        }

        // Jackpot
        if (results.every((s) => s === results[0])) {
            msg += "🎉 Jackpot! +144 pts!";
            updateScore(144);
            logEvent({ event: "jackpot", symbol: results[0], newScore: score });
            message.textContent = msg;
            audioJackpot.play();
            stats.jackpots += 1;
            stats.pairStreak = 0; // jackpot ends any pair streak semantics
            renderHud();
            endRound();
        }
        // Partial Win
        else if (
            results[0] === results[1] ||
            results[1] === results[2] ||
            results[0] === results[2]
        ) {
            msg += "😊 Partial Win! +13 pts!";
            updateScore(13);
            logEvent({ event: "partial_win", results, newScore: score });
            message.textContent = msg;
            stats.pairs += 1;
            stats.pairStreak += 1;
            renderHud();
            enableRespin(results);
        }
        // No win
        else {
            msg += "😞 Try Again!";
            message.textContent = msg;
            logEvent({ event: "no_match", results, newScore: score });
            stats.nowins += 1;
            stats.pairStreak = 0;
            renderHud();
            endRound();
        }
    };

    const enableRespin = (results) => {
        if (respinCount >= 3) {
            message.textContent = "❌ No more respins!";
            return endRound();
        }
        respinButton.style.display = "inline-block";
        respinButton.textContent = `Respin (Cost: ${respinPrice})`;
        respinButton.onclick = () => respin(results);
    };

    const respin = async (results) => {
        if (respinCount >= 3 || score < respinPrice) {
            message.textContent = "❌ Can't respin!";
            return endRound();
        }
        updateScore(-respinPrice);
        respinCount++;
        stats.respinsSession += 1;
        renderHud();
        const idx =
            results[0] === results[1] ? 2 :
            results[1] === results[2] ? 0 :
            1;
        const final = rollSymbol();
        results[idx] = final;
        await animateReel(reels[idx], final, 0, 36);

        // Log the respin result
        logEvent({ event: "respin", idx, symbol: final, newScore: score });

        // Check again for penalties or wins
        if (results.every((s) => s === "HoneySlut")) {
            message.textContent = "Triggering Super-Wildcard Slut!";
            logEvent({ event: "slut_trigger", type: "after_respin", score });
            // Triple Honey landed during a respin is still a guaranteed feature trigger
            stats.tripleHoney += 1;
            stats.triesG += 1;
            renderHud();
            return triggerSuperWildcard(true);
        }
        if (results.every((s) => s === results[0])) {
            message.textContent = "🎉 Jackpot! +144 pts!";
            updateScore(144);
            logEvent({ event: "jackpot", symbol: results[0], newScore: score });
            audioJackpot.play();
            stats.jackpots += 1;
            stats.pairStreak = 0;
            renderHud();
            return endRound();
        }
        if (respinCount === 3) {
            message.textContent = "❌ No respins left – Slut time!";
            logEvent({ event: "slut_trigger", type: "respin_exhausted", score });
            stats.triesNG += 1;
            renderHud();
            return triggerSuperWildcard();
        }

        message.textContent += " Continue!";
    };

    // Audio setup - using original simple approach
    const audioDinoStart = new Audio("audio/dino_start.mp3");
    const audioDinoReel1 = new Audio("audio/dino_reel1.mp3");
    const audioDinoReel2 = new Audio("audio/dino_reel2.mp3");
    const audioDinoReel3 = new Audio("audio/dino_reel3.mp3");
    const audioDinoFail1 = new Audio("audio/dino_fail1.mp3");
    const audioDinoFail2 = new Audio("audio/dino_fail2.mp3");
    const audioJackpot = new Audio("audio/jackpot_sound.mp3");

    const triggerSuperWildcard = async (guaranteed) => {
        if (!guaranteed && Math.random() > 1/3) {
            message.textContent = "😞 No Slut this time!";
            audioDinoFail1.play();
            logEvent({ event: "slut_fail", reel: currentReel });
            return endRound();
        }
        currentReel = 0;
        audioDinoStart.play();
        const expand = async () => {
            // play reel sound
            [audioDinoReel1, audioDinoReel2, audioDinoReel3][currentReel].play();
            await animateReelWithCustomFrameDuration(reels[currentReel], "SuperWildcardSlut", 0, 55, 90);
            if (currentReel === 2) {
                message.textContent = "🎉 Super-Wildcard Slut! +1000 pts!";
                updateScore(1000);
                logEvent({ event: "slut_win", newScore: score });
                stats.featureWins += 1;
                renderHud();
                return endRound();
            }
            const success = guaranteed && currentReel === 0
                ? true
                : Math.random() <= 1/3;
            if (success) {
                logEvent({ event: "slut_expand", reel: currentReel });
                if (currentReel === 0) { stats.expand2 += 1; renderHud(); }
                currentReel++;
                setTimeout(expand, 500);
            } else {
                [audioDinoFail1, audioDinoFail2][currentReel].play();
                message.textContent = "😞 Super-Wildcard Slut failed to cum.";
                logEvent({ event: "slut_fail", reel: currentReel });
                return endRound();
            }
        };
        expand();
    };

    const animateReelWithCustomFrameDuration = (reel, final, delay, frames, frameDuration) =>
        new Promise((res) => {
            setTimeout(() => {
                const animSyms = [...SYMBOLS, ...SYMBOLS];
                let idx = 0;
                const iv = setInterval(() => {
                    if (idx >= frames) {
                        clearInterval(iv);
                        applyBackground(reel, final);
                        res();
                    } else {
                        applyBackground(reel, animSyms[idx % animSyms.length]);
                        idx++;
                    }
                }, frameDuration);
            }, delay);
        });

    const endRound = () => {
        respinButton.style.display = "none";
        spinButton.disabled = false;
        respinCount = 0;
    };

    const resetRound = () => {
        message.textContent = "Ready for a new spin!";
        respinButton.style.display = "none";
        respinCount = 0;
        reels.forEach(r => {
            r.style.backgroundImage = "";
            r.textContent = "";
        });
    };

    spinButton.addEventListener("click", spinReels);

    // Chip info: map chip IDs to titles and descriptions
    const chipInfo = {
        "score": {
            title: "Score",
            desc: "Your current points balance. Increases on wins and feature payouts; decreases on spins, respins, and Honey penalties."
        },
        "recharge-counter": {
            title: "Recharges",
            desc: "Number of +300 point recharges used this session. Appears when score falls below 50."
        },
        "rounds-counter": {
            title: "Rounds",
            desc: "Base spins played this session (excludes respins)."
        },
        "jackpots-counter": {
            title: "Jackpots",
            desc: "Count of 3-of-a-kind wins (+144)."
        },
        "pairs-counter": {
            title: "Pairs",
            desc: "Total Partial Wins (+13) that unlocked respins."
        },
        "nowins-counter": {
            title: "No-wins",
            desc: "Rounds that ended without a payout (no pair, no jackpot)."
        },
        "respins-session-counter": {
            title: "Respins (session)",
            desc: "Total respins used across all rounds in this session."
        },
        "honey-hits-counter": {
            title: "Honey hits",
            desc: "Total Honey Slut symbols seen on base spins (adds penalties)."
        },
        "honey-penalty-counter": {
            title: "Honey penalty",
            desc: "Cumulative points deducted from Honey Slut penalties (−3 each)."
        },
        "triple-honey-counter": {
            title: "Triple Honey",
            desc: "Times triple Honey Slut landed, guaranteeing the Super‑Wildcard feature."
        },
        "feature-tries-g-counter": {
            title: "Feature tries (G)",
            desc: "Guaranteed Super‑Wildcard starts (e.g., from Triple Honey)."
        },
        "feature-tries-ng-counter": {
            title: "Feature tries (NG)",
            desc: "Non‑guaranteed Super‑Wildcard attempts (after respins without jackpot)."
        },
        "feature-expand2-counter": {
            title: "Expand → 2",
            desc: "Times the Super‑Wildcard expanded from reel 1 to reel 2."
        },
        "feature-wins-counter": {
            title: "Feature wins",
            desc: "Times the Super‑Wildcard reached reel 3 (+1000)."
        },
        "pair-streak-counter": {
            title: "Pair streak",
            desc: "Current consecutive rounds with at least one pair. Resets on no‑win or jackpot."
        },
        "net-session-counter": {
            title: "Net session",
            desc: "Total gains minus total costs since session start."
        },
        "high-score-counter": {
            title: "High score",
            desc: "Peak score achieved during this session."
        }
    };

    const chipInfoModal = document.getElementById("chip-info-modal");
    const chipInfoTitle = document.getElementById("chip-info-title");
    const chipInfoDesc = document.getElementById("chip-info-desc");
    const chipInfoCurrent = document.getElementById("chip-info-current");

    function openChipInfo(id) {
        const meta = chipInfo[id];
        if (!meta || !chipInfoModal) return;
        chipInfoTitle.textContent = meta.title;
        chipInfoDesc.textContent = meta.desc;
        // pull the visible text from the chip for current value
        const el = document.getElementById(id);
        chipInfoCurrent.textContent = el ? `Current: ${el.textContent.replace(/^[^:]+:\s*/, '')}` : 'Current: —';
        chipInfoModal.style.display = "flex";
        chipInfoModal.setAttribute("aria-hidden", "false");
    }

    function closeChipInfo() {
        if (!chipInfoModal) return;
        chipInfoModal.style.display = "none";
        chipInfoModal.setAttribute("aria-hidden", "true");
    }

    // Wire click handlers to all HUD chips
    const chipIds = Object.keys(chipInfo);
    chipIds.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.cursor = "pointer";
        el.addEventListener("click", () => openChipInfo(id));
        el.setAttribute("title", chipInfo[id].title);
    });

    document.getElementById("close-chipinfo")?.addEventListener("click", closeChipInfo);
    document.getElementById("close-chipinfo-x")?.addEventListener("click", closeChipInfo);

    // Modal wiring: preview and persist custom art (can be opened any time)
    const customizeModal = document.getElementById("customize-modal");
    const uploadStatus = document.getElementById("upload-status");
    const inputIds = [
        "symbol1",
        "symbol2",
        "symbol3",
        "symbol4",
        "symbol5",
        "HoneySlut",
        "SuperWildcardSlut",
    ];

    function wireInput(id) {
        const fileInput = document.getElementById(`file-${id}`);
        const previewImg = document.getElementById(`preview-${id}`);
        if (!fileInput || !previewImg) return;
        // Initialize preview from custom art or placeholder
        const custom = getCustomArtMap();
        const key = id;
        const url = custom[key];
        if (url) previewImg.src = url; else previewImg.src = DEFAULT_ART_MAP[key] || FALLBACK_PLACEHOLDER;
        fileInput.addEventListener("change", () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                const map = getCustomArtMap();
                map[key] = reader.result;
                setCustomArtMap(map);
                previewImg.src = reader.result;
                updateUploadProgress();
            };
            reader.readAsDataURL(file);
        });
    }

    // Migrate old custom-art keys (from older app versions)
    function migrateCustomArtKeys() {
        const map = getCustomArtMap();
        let changed = false;
        if (map.Medena && !map.HoneySlut) {
            map.HoneySlut = map.Medena;
            changed = true;
        }
        if (map.Dino && !map.SuperWildcardSlut) {
            map.SuperWildcardSlut = map.Dino;
            changed = true;
        }
        if (changed) setCustomArtMap(map);
    }

    migrateCustomArtKeys();
    inputIds.forEach(wireInput);
    function updateUploadProgress() {
        const map = getCustomArtMap();
        const count = inputIds.filter(id => !!map[id]).length;
        if (uploadStatus) uploadStatus.textContent = `${count} customized`;
    }
    updateUploadProgress();

    document.getElementById("reset-custom-art")?.addEventListener("click", () => {
        clearCustomArt();
        inputIds.forEach((id) => {
            const preview = document.getElementById(`preview-${id}`);
            if (preview) preview.removeAttribute('src');
        });
        updateUploadProgress();
    });

    // Open/close customize modal
    document.getElementById("open-customize")?.addEventListener("click", () => {
        if (customizeModal) {
            customizeModal.style.display = "flex";
            customizeModal.setAttribute("aria-hidden", "false");
        }
    });
    document.getElementById("close-customize")?.addEventListener("click", () => {
        if (customizeModal) {
            customizeModal.style.display = "none";
            customizeModal.setAttribute("aria-hidden", "true");
        }
    });
    document.getElementById("close-customize-x")?.addEventListener("click", () => {
        if (customizeModal) {
            customizeModal.style.display = "none";
            customizeModal.setAttribute("aria-hidden", "true");
        }
    });

    // Rules modal wiring
    const rulesModal = document.getElementById("rules-modal");
    document.getElementById("open-rules")?.addEventListener("click", () => {
        if (rulesModal) {
            rulesModal.style.display = "flex";
            rulesModal.setAttribute("aria-hidden", "false");
        }
    });
    document.getElementById("close-rules")?.addEventListener("click", () => {
        if (rulesModal) {
            rulesModal.style.display = "none";
            rulesModal.setAttribute("aria-hidden", "true");
        }
    });
    document.getElementById("close-rules-x")?.addEventListener("click", () => {
        if (rulesModal) {
            rulesModal.style.display = "none";
            rulesModal.setAttribute("aria-hidden", "true");
        }
    });

    // Global: close modals with Escape
    document.addEventListener("keydown", (evt) => {
        if (evt.key !== "Escape") return;
        if (customizeModal && customizeModal.style.display !== "none") {
            customizeModal.style.display = "none";
            customizeModal.setAttribute("aria-hidden", "true");
        }
        if (rulesModal && rulesModal.style.display !== "none") {
            rulesModal.style.display = "none";
            rulesModal.setAttribute("aria-hidden", "true");
        }
    });

    // Start game immediately
    startGame();
});