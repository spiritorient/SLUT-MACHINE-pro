document.addEventListener("DOMContentLoaded", () => {
    // New symbol set with roles
    const SYMBOLS = [
        "value_bronze",
        "value_silver",
        "value_gold",
        "value_diamond",
        "trap",
        "wildcard",
    ];

    // Allow custom art via localStorage (data URLs). Use generic SVG placeholder by default.
    const CUSTOM_ART_KEY = "slot_machine_custom_art_v2";
    const PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='100%25' height='100%25' fill='%23e9eef3'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23667' font-family='Arial' font-size='18'>Upload Art</text></svg>";
    const DEFAULT_ART_MAP = {
        value_bronze: PLACEHOLDER,
        value_silver: PLACEHOLDER,
        value_gold: PLACEHOLDER,
        value_diamond: PLACEHOLDER,
        trap: PLACEHOLDER,
        wildcard: PLACEHOLDER,
    };

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
        return PLACEHOLDER;
    }
    const reels = [
        document.getElementById("reel1"),
        document.getElementById("reel2"),
        document.getElementById("reel3"),
    ];

    const applyBackground = (reel, symbol) => {
        const url = resolveSymbolUrl(symbol);
        reel.style.backgroundImage = `url(${url})`;
        reel.style.backgroundSize = "contain";
        reel.style.backgroundRepeat = "no-repeat";
        reel.style.backgroundPosition = "center";
        reel.textContent = "";
    };

    // Start with blank reels (placeholder draws when symbols are applied)
    reels.forEach(r => {
        r.style.backgroundImage = "";
        r.textContent = "";
    });

    const spinButton = document.getElementById("spin-button");
    const respinButton = document.getElementById("respin-button");
    const rechargeButton = document.getElementById("recharge-button");
    const message = document.getElementById("message");
    const scoreElement = document.getElementById("score");
    const rechargeCounterElement = document.getElementById("recharge-counter");

    let score = 0;
    let respinCount = 0;
    let rechargeCount = 0;
    let currentReel = 0;
    const spinPrice = 21;
    const respinPrice = 34;
    const rechargePoints = 300;

    // Weighted symbol distribution to balance gameplay
    const symbolWeights = {
        value_bronze: 5,
        value_silver: 4,
        value_gold: 3,
        value_diamond: 2,
        trap: 3,
        wildcard: 1,
    };
    const weightedBag = Object.entries(symbolWeights).flatMap(([sym, w]) => Array(w).fill(sym));
    function rollSymbol() {
        return weightedBag[Math.floor(Math.random() * weightedBag.length)];
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
        updateScore(0);
        updateRechargeCounter();
        message.textContent = `Game started with ${rechargePoints} points!`;
        logEvent({ event: "game_start", score });
    };

    const updateScore = (pts) => {
        score += pts;
        scoreElement.textContent = `Score: ${score}`;
        toggleRechargeButton();
    };

    const updateRechargeCounter = () => {
        rechargeCounterElement.textContent = `Recharges: ${rechargeCount}`;
    };

    const toggleRechargeButton = () => {
        rechargeButton.style.display = score < 50 ? "inline-block" : "none";
    };

    rechargeButton.addEventListener("click", () => {
        if (score < 50) {
            updateScore(rechargePoints);
            rechargeCount++;
            updateRechargeCounter();
            message.textContent = "🎉 You recharged 300 points!";
            logEvent({ event: "recharge", newScore: score, rechargeCount });
        }
    });

    const animateReel = (reel, final, delay, frames) =>
        new Promise((res) => {
            setTimeout(() => {
                const animSyms = [...weightedBag];
                let idx = 0;
                const dur = 100;
                const iv = setInterval(() => {
                    if (idx >= frames) {
                        clearInterval(iv);
                        applyBackground(reel, final);
                        res();
                    } else {
                        applyBackground(reel, animSyms[idx % animSyms.length]);
                        idx++;
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
        const anims = reels.map((r, i) => {
            const sym = rollSymbol();
            results.push(sym);
            return animateReel(r, sym, 0, 5 + i * 5);
        });
        await Promise.all(anims);
        logEvent({ event: "spin", results, beforeScore: score + spinPrice });
        checkWin(results);
        spinButton.disabled = false;
    };

    const checkWin = (results) => {
        const valueSymbols = ["value_bronze", "value_silver", "value_gold", "value_diamond"];
        const payoutJackpot = {
            value_bronze: 60,
            value_silver: 100,
            value_gold: 160,
            value_diamond: 300,
        };
        const partialPayout = {
            value_bronze: 15,
            value_silver: 20,
            value_gold: 25,
            value_diamond: 30,
        };
        const trapPenalty = 5;

        const trapCount = results.filter((s) => s === "trap").length;
        const wildcardCount = results.filter((s) => s === "wildcard").length;
        let msg = "";

        if (trapCount) {
            const ded = trapCount * trapPenalty;
            updateScore(-ded);
            msg += `⚠️ Trap x${trapCount}, –${ded} pts. `;
            logEvent({ event: "trap", count: trapCount, newScore: score });
        }

        if (trapCount === 3) {
            msg += "Triggering Wildcard Bonus! ";
            message.textContent = msg;
            logEvent({ event: "wildcard_trigger", type: "triple_trap", score });
            triggerSuperWildcard(true);
            return;
        }

        // Count value symbols
        const counts = Object.fromEntries(valueSymbols.map(v => [v, 0]));
        results.forEach((s) => {
            if (counts.hasOwnProperty(s)) counts[s]++;
        });

        // Determine best match using wildcards to complete sets
        let bestSymbol = null;
        let bestCount = 0;
        valueSymbols.forEach((v) => {
            const total = counts[v] + wildcardCount;
            if (total > bestCount) {
                bestCount = total;
                bestSymbol = v;
            }
        });

        if (bestCount >= 3) {
            const payout = payoutJackpot[bestSymbol];
            msg += `🎉 Jackpot! +${payout} pts!`;
            updateScore(payout);
            logEvent({ event: "jackpot", symbol: bestSymbol, wildcards: wildcardCount, newScore: score });
            message.textContent = msg;
            audioJackpot.play();
            endRound();
        } else if (bestCount === 2) {
            const payout = partialPayout[bestSymbol];
            msg += `😊 Partial Win! +${payout} pts!`;
            updateScore(payout);
            logEvent({ event: "partial_win", symbol: bestSymbol, wildcards: wildcardCount, newScore: score });
            message.textContent = msg;
            enableRespin(results);
        } else {
            msg += "😞 Try Again!";
            message.textContent = msg;
            logEvent({ event: "no_match", results, newScore: score });
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
        // Choose the reel that is not part of the best potential match
        const valueSymbols = ["value_bronze", "value_silver", "value_gold", "value_diamond"];
        const wildcardCount = results.filter((s) => s === "wildcard").length;
        const counts = Object.fromEntries(valueSymbols.map(v => [v, 0]));
        results.forEach((s) => { if (counts.hasOwnProperty(s)) counts[s]++; });
        let bestSymbol = valueSymbols[0];
        let bestCount = 0;
        valueSymbols.forEach((v) => { const total = counts[v] + wildcardCount; if (total > bestCount) { bestCount = total; bestSymbol = v; } });
        let idx = results.findIndex((s) => s !== bestSymbol && s !== "wildcard");
        if (idx === -1) idx = 2;
        const final = rollSymbol();
        results[idx] = final;
        await animateReel(reels[idx], final, 0, 15);

        // Log the respin result
        logEvent({ event: "respin", idx, symbol: final, newScore: score });

        // Check again for penalties or wins
        if (results.every((s) => s === "trap")) {
            message.textContent = "Triggering Wildcard Bonus!";
            logEvent({ event: "wildcard_trigger", type: "after_respin", score });
            return triggerSuperWildcard(true);
        }
        // Re-evaluate full win after respin
        checkWin(results);
        if (respinCount === 3) {
            message.textContent = "❌ No respins left – Wildcard time!";
            logEvent({ event: "wildcard_trigger", type: "respin_exhausted", score });
            return triggerSuperWildcard();
        }

        message.textContent += " Continue!";
    };

    // Audio setup
    const audioDinoStart = new Audio("audio/dino_start.mp3");
    const audioDinoReel1 = new Audio("audio/dino_reel1.mp3");
    const audioDinoReel2 = new Audio("audio/dino_reel2.mp3");
    const audioDinoReel3 = new Audio("audio/dino_reel3.mp3");
    const audioDinoFail1 = new Audio("audio/dino_fail1.mp3");
    const audioDinoFail2 = new Audio("audio/dino_fail2.mp3");
    const audioJackpot = new Audio("audio/jackpot_sound.mp3");

    const triggerSuperWildcard = async (guaranteed) => {
        if (!guaranteed && Math.random() > 1/3) {
            message.textContent = "😞 No Wildcard this time!";
            audioDinoFail1.play();
            logEvent({ event: "wildcard_fail", reel: currentReel });
            return endRound();
        }
        currentReel = 0;
        audioDinoStart.play();
        const expand = async () => {
            // play reel sound
            [audioDinoReel1, audioDinoReel2, audioDinoReel3][currentReel].play();
            await animateReelWithCustomFrameDuration(reels[currentReel], "wildcard", 0, 50, 80);
            if (currentReel === 2) {
                message.textContent = "🎉 Wildcard Bonus! +1000 pts!";
                updateScore(1000);
                logEvent({ event: "wildcard_win", newScore: score });
                return endRound();
            }
            const success = guaranteed && currentReel === 0
                ? true
                : Math.random() <= 1/3;
            if (success) {
                logEvent({ event: "wildcard_expand", reel: currentReel });
                currentReel++;
                setTimeout(expand, 500);
            } else {
                [audioDinoFail1, audioDinoFail2][currentReel].play();
                message.textContent = "😞 Bonus failed to complete.";
                logEvent({ event: "wildcard_fail", reel: currentReel });
                return endRound();
            }
        };
        expand();
    };

    const animateReelWithCustomFrameDuration = (reel, final, delay, frames, frameDuration) =>
        new Promise((res) => {
            setTimeout(() => {
                const animSyms = [...weightedBag];
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

    // Modal wiring: preview and persist custom art (can be opened any time)
    const customizeModal = document.getElementById("customize-modal");
    const uploadStatus = document.getElementById("upload-status");
    const inputIds = [
        "value_bronze",
        "value_silver",
        "value_gold",
        "value_diamond",
        "trap",
        "wildcard",
    ];

    function wireInput(id) {
        const fileInput = document.getElementById(`file-${id}`);
        const previewImg = document.getElementById(`preview-${id}`);
        if (!fileInput || !previewImg) return;
        // Initialize preview from custom art
        const custom = getCustomArtMap();
        const key = id;
        const url = custom[key];
        if (url) previewImg.src = url; else previewImg.removeAttribute('src');
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

    // Rules modal
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

    // Start game immediately
    startGame();
});