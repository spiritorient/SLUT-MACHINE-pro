Have fun While at it·ı°¢

# Slut·Machine: Complete User Manual

**Version:** 1.1  
**Last Updated:** May 24, 2025

---

## Table of Contents

1. [Overview](#overview)  
2. [Playing the Game](#playing-the-game)  
   - [2.1. Starting a Session](#21-starting-a-session)  
   - [2.2. Session Flow](#22-session-flow)  
3. [User Interface Components](#user-interface-components)  
   - [3.1. Reels](#31-reels)  
   - [3.2. Buttons & Controls](#32-buttons--controls)  
   - [3.3. Displays & Indicators](#33-displays--indicators)  
4. [Core Game Mechanics](#core-game-mechanics)  
   - [4.1. Point Currency System](#41-point-currency-system)  
   - [4.2. Symbol Definitions](#42-symbol-definitions)  
   - [4.3. Randomization & Fairness](#43-randomization--fairness)  
5. [Outcome Categories & Detailed Effects](#outcome-categories--detailed-effects)  
   - [5.1. Jackpot (Triple Non-Medena)](#51-jackpot-triple-non-medena)  
   - [5.2. Partial Win (Two-of-a-Kind)](#52-partial-win-two-of-a-kind)  
   - [5.3. Medena Penalties](#53-medena-penalties)  
   - [5.4. No-Match Round](#54-no-match-round)  
   - [5.5. Super-Wildcard Dino (Triple Medena)](#55-super-wildcard-dino-triple-medena)  
6. [Probability Analysis](#probability-analysis)  
7. [Expected Value Calculations](#expected-value-calculations)  
8. [Strategy & Tactics](#strategy--tactics)  
   - [8.1. Bankroll Management](#81-bankroll-management)  
   - [8.2. Respin Decision Framework](#82-respin-decision-framework)  
   - [8.3. Timing the Dino Chase](#83-timing-the-dino-chase)  
   - [8.4. Session Goals & Limits](#84-session-goals--limits)  
9. [Advanced Gameplay Tips](#advanced-gameplay-tips)  
10. [Accessibility & Customization](#accessibility--customization)  
11. [Glossary of Terms](#glossary-of-terms)  
12. [Appendix: Revision History](#appendix-revision-history)

---

## 1. Overview

**Slut·Machine** is a browser-based slot machine game designed to combine chance with strategic decision points. Three spinning reels display a mix of neutral symbols and a penalty symbol named **Medena**. Players stake points to spin, encounter penalties, and can trigger a high-stakes bonus—**the Super-Wildcard Dino**. The game is balanced to deliver tension: spins are negative-EV, but the rare Dino bonus offers a compelling positive-EV opportunity.

---

## 2. Playing the Game

### 2.1. Starting a Session

- **Starting Balance:** On page load, your balance is automatically set to **300 points** (first implicit recharge).  
- **Session Continuity:** You may play continuously; if your balance ever drops below 50 points, the **Recharge** button appears to top up +300 points. Each recharge is unlimited but counted.

### 2.2. Session Flow

1. **Check Balance & Counters:** Review your **Score** display and **Recharges** counter.  
2. **Click “Spin”** to initiate a round (–21 points).  
3. **Observe Reel Animation:** Three reels spin with staggered durations (5, 10, 15 frames).  
4. **Outcome Resolution:**  
   - Apply any **Medena** penalties (–3 points each).  
   - Evaluate matching symbols for wins or bonus triggers.  
5. **Post-Spin Options:**  
   - **Respin** button appears on two-of-a-kind (costs 34 points, limit 3).  
   - **Recharge** appears when balance <50.  
6. **Repeat** until you choose to stop.

---

## 3. User Interface Components

### 3.1. Reels

- **Visuals:** Three square panels (`.reel`) display symbols via CSS background images.  
- **Animation:** Controlled by JavaScript functions (`animateReel`), cycling through symbols before settling on a final one.

### 3.2. Buttons & Controls

| Element            | ID                  | Description                                      |
|--------------------|---------------------|--------------------------------------------------|
| **Spin Button**    | `spin-button`       | Starts spin; deducts 21 points.                  |
| **Respin Button**  | `respin-button`     | Appears on partial wins; deducts 34 points.      |
| **Recharge Button**| `recharge-button`   | Appears when balance <50; adds 300 points.       |

- Buttons visually update (show/hide) based on game state and balance thresholds.

### 3.3. Displays & Indicators

- **Score Display** (`#score`): Shows current point balance.  
- **Recharges Counter** (`#recharge-counter`): Tracks number of 300-point recharges used.  
- **Message Area** (`#message`): Textual feedback—wins, losses, penalties, bonus triggers.

---

## 4. Core Game Mechanics

### 4.1. Point Currency System

- **Positive Changes:**  
  - **+144 points** for jackpot.  
  - **+13 points** for two-of-a-kind.  
  - **+300 points** per recharge.  
  - **+1000 points** for full Dino expansion.  
- **Negative Changes:**  
  - **–21 points** for each spin.  
  - **–34 points** per respin.  
  - **–3 points** per Medena symbol.  
  - Potential **–9 points** if triple Medena triggers Dino (3× penalty).

### 4.2. Symbol Definitions

| Symbol      | Role                                 |
|-------------|--------------------------------------|
| symbol1–5   | Neutral winning symbols              |
| Medena      | Penalty symbol (–3 points each)      |
| Dino        | Bonus symbol for Super-Wildcard      |

### 4.3. Randomization & Fairness

- Each reel independently selects one of six symbols with equal probability (1/6).  
- Animations do not affect randomness; final results are determined by `Math.random()` prior to animation.

---

## 5. Outcome Categories & Detailed Effects

### 5.1. Jackpot (Triple Non-Medena)

- **Condition:** All three reels match on a neutral symbol.  
- **Process:**  
  1. Deduct base spin cost (–21).  
  2. No Medena penalty.  
  3. Add jackpot reward (+144).  
- **Net Gain:** **+123 points**.  
- **Audio Cue:** `audio/jackpot_sound.mp3`.

### 5.2. Partial Win (Two-of-a-Kind)

- **Condition:** Exactly two reels match (any symbol).  
- **Process:**  
  1. Deduct spin cost (–21).  
  2. Apply Medena penalties if any.  
  3. Add partial reward (+13).  
  4. **Respin option** appears (cost –34).  
- **Net Gain:** **–8 points** before respin.  
- **User Decision:** Choose to respin the odd reel up to three times.

### 5.3. Medena Penalties

- **Condition:** One or two Medena symbols appear anywhere.  
- **Effect:** Immediately subtract **3 points per Medena** before other evaluations.  
- **Examples:**  
  - 1 Medena + 2 distinct symbols → –3 net → no win.  
  - 2 Medena + 1 other → –6 net; then treated as partial win (two-of-a-kind).

### 5.4. No-Match Round

- **Condition:** Three distinct neutral symbols.  
- **Net Loss:** **–21 points**.  
- **Feedback:** “😞 Try Again!”

### 5.5. Super-Wildcard Dino (Triple Medena)

- **Trigger:**  
  - **3× Medena** in initial spin.  
  - OR after **3 failed respins** in a round.  
- **Sequence:**  
  1. Penalty: –9 points (3 × 3).  
  2. Dino appears on reel 1 (guaranteed).  
  3. Attempt expansion on reel 2 (1/3 chance).  
  4. If successful, attempt on reel 3 (1/3 chance).  
- **Full Expansion Reward:** **+1000 points**.  
- **Audio Cues:**  
  - Start: `audio/dino_start.mp3`  
  - Each reel: `audio/dino_reelX.mp3`  
- **Expected Bonus Value:**  
  \[
    	ext{EV} = 1000 	imes rac{1}{3} - 9 pprox +324.3 	ext{ points}
  \]

---

## 6. Probability Analysis

Total possible spin outcomes: \(6^3 = 216\).

| Event                             | Count | Probability | Net Gain |
|-----------------------------------|-------|-------------|----------|
| Jackpot (neutral triplet)         | 5     | 2.31%       | +123     |
| Triple Medena                     | 1     | 0.46%       | +324 EV  |
| Partial neutral pairs             | 75    | 34.72%      | –8       |
| Medena pairs                      | 15    | 6.94%       | +7       |
| Single Medena                     | 60    | 27.78%      | –3       |
| No-Match neutral                  | 60    | 27.78%      | –21      |

---

## 7. Expected Value Calculations

\[
\mathrm{EV} = \sum_i P_i 	imes 	ext{NetGain}_i
pprox -4.71 	ext{ points per spin}
\]

**Interpretation:** The game is negative-EV overall. Play primarily for entertainment, leveraging strategic pauses and occasional bonus chases.

---

## 8. Strategy & Tactics

### 8.1. Bankroll Management

- **Buffer Goal:** Maintain >100 points to handle variance.  
- **Recharge Awareness:** Although unlimited, recharges reflect “free credits.” Aim to minimize reliance.

### 8.2. Respin Decision Framework

- **Baseline EV of Respin:**  
  \[
    \mathrm{EV}_{	ext{respin}} pprox -4.83 	ext{ points}
  \]
- **Rule of Thumb:** Skip respin if your balance is tight; accept the –8 net.

### 8.3. Timing the Dino Chase

- **Positive-EV Trigger:** Only the full Dino sequence can yield positive expected returns.  
- **High-Risk Strategy:** On low balance, intentionally spin to force triple-Medena; albeit extremely rare, it’s the sole positive-EV avenue.

### 8.4. Session Goals & Limits

- **Win Goal:** Stop when +200–300 points above start.  
- **Loss Limit:** Cease play if –500 points from start.  
- **Timeboxing:** Limit sessions to 20–30 minutes for balanced entertainment.

---

## 9. Advanced Gameplay Tips

- **Symbol Swaps:** Developers can replace `/images/symbolX.png` for thematic events.  
- **Sound Tweaks:** Adjust volume or replace audio files (`dino_start.mp3`, etc.) to customize ambience.  
- **Animation Tweaks:** Modify `totalFrames` or `frameDuration` in `animateReel` for faster/slower spins.

---

## 10. Accessibility & Customization

- **Keyboard Controls:** Add event listeners for `Space` (spin) or arrow keys (respin).  
- **Screen Reader Text:** Include `aria-live="polite"` on `#message` for dynamic updates.  
- **High-Contrast Mode:** CSS media query for `prefers-contrast` to boost UI visibility.

---

## 11. Glossary of Terms

- **Balance:** Current points available.  
- **Spin:** Full three-reel wager.  
- **Respin:** Single-reel re-spin on partial wins.  
- **Medena:** Penalty symbol costing 3 points.  
- **Jackpot:** Three identical neutral symbols.  
- **Super-Wildcard Dino:** Bonus expansion sequence triggered by penalties or respin failures.

---

## 12. Appendix: Revision History

- **v1.0** (May 10, 2025): Initial manual.  
- **v1.1** (May 24, 2025): Expanded mechanics, added accessibility and advanced tips.

---

*End of User Manual*