document.addEventListener("DOMContentLoaded", () => {
    const symbols = ["symbol1", "symbol2", "symbol3", "symbol4", "traktordzija.gif", "Medena"];
    const reels = [
        document.getElementById("reel1"),
        document.getElementById("reel2"),
        document.getElementById("reel3"),
    ];

    const applyBackground = (reel, symbol) => {
        // if symbol includes “.xxx”, use it; otherwise add “.png”
    const file = /\.\w+$/.test(symbol)
    ? symbol
    : `${symbol}.png`;
        reel.style.backgroundImage = `url(images/${file})`;     
        reel.style.backgroundSize = "contain";
        reel.style.backgroundRepeat = "no-repeat";
        reel.style.backgroundPosition = "center";
        reel.textContent = "";
    };

    reels.forEach(r => applyBackground(r, "traktordzija.gif"));

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
                const animSyms = [...symbols, ...symbols];
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
            const sym = symbols[Math.floor(Math.random() * symbols.length)];
            results.push(sym);
            return animateReel(r, sym, 0, 5 + i * 5);
        });
        await Promise.all(anims);
        logEvent({ event: "spin", results, beforeScore: score + spinPrice });
        checkWin(results);
        spinButton.disabled = false;
    };

    const checkWin = (results) => {
        let medenaCount = results.filter((s) => s === "Medena").length;
        let msg = "";

        if (medenaCount) {
            const ded = medenaCount * 3;
            updateScore(-ded);
            msg += `😈 Medena x${medenaCount}, –${ded} pts. `;
            logEvent({ event: "medena_penalty", count: medenaCount, newScore: score });
        }

        if (medenaCount === 3) {
            msg += "Triggering Super-Wildcard Dino! ";
            message.textContent = msg;
            logEvent({ event: "dino_trigger", type: "triple_medena", score });
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
            enableRespin(results);
        }
        // No win
        else {
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
        const idx =
            results[0] === results[1] ? 2 :
            results[1] === results[2] ? 0 :
            1;
        const final = symbols[Math.floor(Math.random() * symbols.length)];
        results[idx] = final;
        await animateReel(reels[idx], final, 0, 15);

        // Log the respin result
        logEvent({ event: "respin", idx, symbol: final, newScore: score });

        // Check again for penalties or wins
        if (results.every((s) => s === "Medena")) {
            message.textContent = "Triggering Super-Wildcard Dino!";
            logEvent({ event: "dino_trigger", type: "after_respin", score });
            return triggerSuperWildcard(true);
        }
        if (results.every((s) => s === results[0])) {
            message.textContent = "🎉 Jackpot! +144 pts!";
            updateScore(144);
            logEvent({ event: "jackpot", symbol: results[0], newScore: score });
            audioJackpot.play();
            return endRound();
        }
        if (respinCount === 3) {
            message.textContent = "❌ No respins left – Dino time!";
            logEvent({ event: "dino_trigger", type: "respin_exhausted", score });
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
            message.textContent = "😞 No Dino this time!";
            audioDinoFail1.play();
            logEvent({ event: "dino_fail", reel: currentReel });
            return endRound();
        }
        currentReel = 0;
        audioDinoStart.play();
        const expand = async () => {
            // play reel sound
            [audioDinoReel1, audioDinoReel2, audioDinoReel3][currentReel].play();
            await animateReelWithCustomFrameDuration(reels[currentReel], "Dino", 0, 50, 80);
            if (currentReel === 2) {
                message.textContent = "🎉 Super-Wildcard! +1000 pts!";
                updateScore(1000);
                logEvent({ event: "dino_win", newScore: score });
                return endRound();
            }
            const success = guaranteed && currentReel === 0
                ? true
                : Math.random() <= 1/3;
            if (success) {
                logEvent({ event: "dino_expand", reel: currentReel });
                currentReel++;
                setTimeout(expand, 500);
            } else {
                [audioDinoFail1, audioDinoFail2][currentReel].play();
                message.textContent = "😞 Dino failed to cum.";
                logEvent({ event: "dino_fail", reel: currentReel });
                return endRound();
            }
        };
        expand();
    };

    const animateReelWithCustomFrameDuration = (reel, final, delay, frames, frameDuration) =>
        new Promise((res) => {
            setTimeout(() => {
                const animSyms = [...symbols, ...symbols];
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
    startGame();
});