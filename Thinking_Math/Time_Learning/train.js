(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const storageKey = "time-monster-train-v2";
  const today = () => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
  };
  const shuffle = values => {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  const choice = values => values[Math.floor(Math.random() * values.length)];
  const nextHour = h => h === 12 ? 1 : h + 1;
  const prevHour = h => h === 1 ? 12 : h - 1;
  const digital = (h, m) => `${h}:${String(m).padStart(2, "0")}`;
  const hourWords = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
  const numberWords = { 5: "five", 10: "ten", 20: "twenty", 25: "twenty-five" };
  function words(h, m) {
    const hour = hourWords[(m > 30 ? nextHour(h) : h) - 1];
    if (m === 0) return `${hour} o'clock`;
    if (m === 30) return `half past ${hour}`;
    const amount = m <= 30 ? m : 60 - m;
    const minutes = amount === 15 ? "quarter" : `${numberWords[amount]} minutes`;
    return `${minutes} ${m <= 30 ? "past" : "to"} ${hour}`;
  }
  const stops = {
    1: { name: "First Stop", title: "Meet the two hands", story: "👾 The train is ready to leave. Help Time Monster read the station clock!", copy: "The short blue hand shows the hour. The long red hand points to 12 for o'clock, or 6 for half past.", example: "Example: red at 12 and blue at 3 means 3:00. Red at 6 and blue between 3 and 4 means 3:30.", sample: [3, 0], realLife: "Can you find an o'clock or half-past time on a clock at home?" },
    2: { name: "Quarter Bridge", title: "A quarter of an hour", story: "🌉 The bridge opens at quarter time. Read the clock to help the train cross!", copy: "Red at 3 means quarter past. Red at 9 means quarter to the NEXT hour.", example: "Example: at 2:45, the blue hand is nearly at 3. We say quarter to three.", sample: [2, 45], realLife: "What do you do a quarter of an hour before dinner?" },
    3: { name: "Minute Mountain", title: "Count in fives", story: "⛰️ The mountain has a marker every five minutes. Count them with Time Monster!", copy: "Follow the long red hand. Each big number adds five minutes. After 6, count how many minutes are left until the next hour.", example: "Example: red at 4 means 20 minutes past. If blue is just after 4, the time is 4:20.", sample: [4, 20], realLife: "Find a real clock. How many minutes will pass when the red hand moves one big number?" },
    4: { name: "Word Town", title: "Say what you see", story: "🏘️ The conductor speaks in time words. Help the train find its way home!", copy: "Tell the time in words. Before half past, say past this hour. After half past, say to the next hour.", example: "Example: 8:45 is quarter to nine—not quarter to eight.", sample: [8, 45], realLife: "Tell someone the time in words when you next see a clock." }
  };
  function readProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved && Number.isInteger(saved.unlocked) && saved.unlocked >= 1 && saved.unlocked <= 4 && saved.runs && typeof saved.runs === "object")
        return saved;
    } catch (_) { /* Private mode may disable storage. */ }
    return { unlocked: 1, stars: 0, best: {}, runs: {}, stamps: {}, visits: {} };
  }
  const progress = readProgress();
  progress.best ||= {};
  progress.stamps ||= {};
  progress.visits ||= {};
  if (!progress.visits[today()]) {
    progress.visits[today()] = true;
    save();
  }
  let level = 1, clockHour = 3, clockMinute = 0, secondTimer = null, second = 0, audioContext;
  const tabs = [...document.querySelectorAll(".level-tab")];
  const clock = $("clock");

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch (_) { /* Play stays usable. */ }
  }
  function makeClockFace() {
    for (let i = 0; i < 60; i++) {
      const angle = (i * 6 - 90) * Math.PI / 180, radius = i % 5 === 0 ? 45 : 46;
      const tick = document.createElement("div");
      tick.className = i % 5 === 0 ? "tick major" : "tick";
      tick.style.left = `${50 + radius * Math.cos(angle)}%`;
      tick.style.top = `${50 + radius * Math.sin(angle)}%`;
      tick.style.transform = `rotate(${i * 6}deg)`;
      clock.append(tick);
    }
    for (let i = 1; i <= 12; i++) {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const number = document.createElement("div");
      number.className = "clock-number" + ([12, 3, 6, 9].includes(i) ? " landmark" : "");
      number.style.left = `${50 + 40 * Math.cos(angle)}%`;
      number.style.top = `${50 + 40 * Math.sin(angle)}%`;
      number.textContent = i;
      clock.append(number);
    }
  }
  function setClock(h, m) {
    clockHour = h; clockMinute = m;
    $("hourHand").style.transform = `rotate(${h * 30 + m * .5}deg)`;
    $("minuteHand").style.transform = `rotate(${m * 6}deg)`;
    clock.setAttribute("aria-label", "Clock with a short blue hour hand and a long red minute hand. Ask for a clue to hear where they point.");
  }
  function playSound(type) {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audioContext ||= new Audio();
      if (audioContext.state === "suspended") audioContext.resume();
      const osc = audioContext.createOscillator(), gain = audioContext.createGain(), now = audioContext.currentTime;
      osc.type = "sine"; osc.connect(gain); gain.connect(audioContext.destination);
      osc.frequency.setValueAtTime(type === "correct" ? 480 : 380, now);
      if (type === "correct") osc.frequency.setValueAtTime(720, now + .12);
      gain.gain.setValueAtTime(type === "tick" ? .012 : .08, now);
      gain.gain.exponentialRampToValueAtTime(.001, now + (type === "tick" ? .04 : .3));
      osc.start(now); osc.stop(now + (type === "tick" ? .04 : .3));
    } catch (_) { /* Audio is optional. */ }
  }
  function optionSet(answer, candidates) {
    return shuffle([answer, ...shuffle([...new Set(candidates)].filter(x => x !== answer)).slice(0, 3)]);
  }
  function makeItem(h, m, type) {
    const answer = type === "words" ? words(h, m) : digital(h, m);
    let options;
    if (type === "words") {
      const nearby = [
        words(nextHour(h), m), words(prevHour(h), m), words(h, m === 15 ? 45 : m === 45 ? 15 : m === 0 ? 30 : 0),
        words(h, m === 30 ? 0 : m === 0 ? 15 : 30), words(nextHour(h), m === 45 ? 15 : 45)
      ];
      options = optionSet(answer, nearby);
    } else {
      const minuteChoices = m === 0 || m === 30 ? [0, 30, 15, 45] :
        m === 15 || m === 45 ? [0, 15, 30, 45] :
        [m, (m + 5) % 60, (m + 55) % 60, 60 - m, 0, 30];
      const nearby = [
        digital(nextHour(h), m), digital(prevHour(h), m),
        ...minuteChoices.map(x => digital(h, x)), digital(nextHour(h), minuteChoices[1])
      ];
      options = optionSet(answer, nearby);
    }
    const direction = m === 0 ? "at 12: zero minutes" :
      m === 30 ? "at 6: thirty minutes" :
      m <= 30 ? `at ${m / 5}: ${m} minutes past` :
      `at ${m / 5}: ${60 - m} minutes to the next hour`;
    const hourClue = m > 30 ? `The short blue hand is nearly at ${nextHour(h)}, but it has not reached it yet. The hour is still ${h}.` :
      m === 0 ? `The short blue hand points to ${h}.` : `The short blue hand has moved past ${h}.`;
    const hint = `The long red hand is ${direction}. ${hourClue}`;
    return {
      hour: h, minute: m, type, answer, options,
      prompt: type === "words" ? "Which words match this clock?" : "What time does this clock show?",
      hint,
      explain: type === "words" ? `${hint} We say “${answer}”.` : `${hint} So it is ${answer}.`
    };
  }
  function makeTrip(stop) {
    const h = () => Math.floor(Math.random() * 12) + 1;
    let plan;
    if (stop === 1) plan = [0, 30, 0, 30, choice([0, 30])];
    else if (stop === 2) plan = [15, 45, 15, 45, choice([15, 45])];
    else if (stop === 3) plan = shuffle([5, 20, 25, 40, 55]);
    else plan = shuffle([0, 15, 30, 45, choice([5, 20, 40, 55])]);
    return { items: plan.map(m => makeItem(h(), m, stop === 4 ? "words" : "digital")), index: 0, score: 0, mistakes: 0, clue: false, answered: false };
  }
  function ticket() {
    const visits = Object.keys(progress.visits).length;
    $("starCounter").textContent = progress.stars;
    $("dailyTicket").textContent = progress.stamps[today()]
      ? `🎟️ Today's ticket stamped! · ${visits} visit${visits === 1 ? "" : "s"}`
      : `🎟️ Today's ticket: finish one 5-question trip · ${visits} visit${visits === 1 ? "" : "s"}`;
  }
  function showOnly(mode) {
    $("stationIntro").classList.toggle("hidden", mode !== "intro");
    $("questionWrap").classList.toggle("hidden", mode !== "question");
    $("playArea").classList.toggle("hidden", mode === "summary");
    $("choicesGrid").classList.toggle("hidden", mode !== "question");
    $("questionActions").classList.toggle("hidden", mode !== "question");
    $("summary").classList.toggle("hidden", mode !== "summary");
    $("feedback").classList.add("hidden");
    $("playArea").classList.toggle("intro-clock", mode === "intro");
  }
  function renderTabs() {
    tabs.forEach(tab => {
      const n = Number(tab.dataset.level), locked = n > progress.unlocked;
      tab.disabled = locked;
      tab.classList.toggle("locked", locked);
      tab.classList.toggle("active", n === level);
      tab.setAttribute("aria-current", n === level ? "step" : "false");
      tab.setAttribute("aria-label", `${stops[n].name}: ${locked ? "locked, finish the previous stop" : progress.best[n] != null ? `best ${progress.best[n]} of 5` : "ready"}`);
    });
  }
  function selectLevel(n) {
    if (n > progress.unlocked) return;
    level = n;
    progress.lastLevel = n;
    save();
    renderTabs(); ticket();
    const run = progress.runs[n];
    if (run) return renderQuestion();
    showOnly("intro");
    $("introTitle").textContent = stops[n].title;
    $("introStory").textContent = stops[n].story;
    $("introCopy").textContent = stops[n].copy;
    $("introExample").textContent = stops[n].example;
    $("startButton").textContent = progress.best[n] != null ? "Try 5 more questions →" : "Start 5 questions →";
    clock.classList.toggle("simplify", n === 1);
    setClock(...stops[n].sample);
  }
  function renderQuestion() {
    const run = progress.runs[level];
    if (!run) return selectLevel(level);
    const item = run.items[run.index];
    showOnly("question");
    clock.classList.toggle("simplify", level === 1);
    setClock(item.hour, item.minute);
    $("levelName").textContent = `${stops[level].name} · question ${run.index + 1} of 5`;
    $("questionText").textContent = item.prompt;
    $("tripProgress").textContent = `🚂 ${"●".repeat(run.index)}○${"·".repeat(4 - run.index)} · No timer. Think, then tap.`;
    $("choicesGrid").replaceChildren();
    item.options.forEach(value => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "choice-btn"; button.textContent = value;
      if (run.answered) {
        button.disabled = true;
        if (value === item.answer) button.classList.add("correct");
      } else if ((run.wrong || []).includes(value)) {
        button.disabled = true; button.classList.add("incorrect");
      } else button.addEventListener("click", () => answer(value, button));
      $("choicesGrid").append(button);
    });
    $("hintButton").classList.toggle("hidden", run.answered);
    $("continueButton").classList.toggle("hidden", !run.answered);
    $("continueButton").textContent = run.index === 4 ? "See my trip →" : "Next question →";
    if (run.answered) feedback("Now you can explain it!", item.explain, false);
    else if (run.mistakes > 0 || run.clue) feedback("Look at the hands", item.hint, true);
    $("questionWrap").scrollIntoView({ block: "start", behavior: "instant" });
  }
  function feedback(heading, detail, mistake) {
    const el = $("feedback");
    el.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = heading;
    el.append(title, document.createTextNode(detail));
    el.classList.remove("hidden");
    el.classList.toggle("mistake", mistake);
  }
  function answer(value, button) {
    const run = progress.runs[level], item = run.items[run.index];
    if (run.answered) return;
    if (value !== item.answer) {
      run.mistakes++;
      (run.wrong ||= []).push(value);
      button.classList.add("incorrect");
      button.disabled = true;
      playSound("try");
      if (run.mistakes >= 2) {
        run.answered = true;
        progress.stars++;
        [...$("choicesGrid").children].forEach(b => {
          b.disabled = true;
          if (b.textContent === item.answer) b.classList.add("correct");
        });
        $("hintButton").classList.add("hidden");
        $("continueButton").classList.remove("hidden");
        $("continueButton").textContent = run.index === 4 ? "See my trip →" : "Next question →";
        feedback("Let's work it out together", item.explain, true);
      } else feedback("Good try—look again", item.hint, true);
    } else {
      run.answered = true;
      button.classList.add("correct");
      [...$("choicesGrid").children].forEach(b => b.disabled = true);
      if (run.mistakes === 0 && !run.clue) run.score++;
      progress.stars++;
      playSound("correct");
      $("hintButton").classList.add("hidden");
      $("continueButton").classList.remove("hidden");
      $("continueButton").textContent = run.index === 4 ? "See my trip →" : "Next question →";
      feedback(run.mistakes || run.clue ? "You found it!" : "You read the clock!", item.explain, false);
      ticket();
    }
    save();
    ticket();
    $("feedback").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  function finishTrip() {
    const run = progress.runs[level];
    progress.best[level] = Math.max(progress.best[level] || 0, run.score);
    progress.stamps[today()] = true;
    if (level < 4) progress.unlocked = Math.max(progress.unlocked, level + 1);
    delete progress.runs[level];
    save(); ticket(); renderTabs(); showOnly("summary");
    const summary = $("summary");
    summary.replaceChildren();
    const heading = document.createElement("h2"), detail = document.createElement("p"), next = document.createElement("p"), actions = document.createElement("div");
    heading.textContent = "🚉 Stop reached!";
    detail.textContent = `You tried all 5 clocks. You read ${run.score} on your own, first try. Clues and second tries helped with the others.`;
    next.textContent = level < 4 ? `The next stop, ${stops[level + 1].name}, is open. You can also practise here again.` : "You have visited every stop! A new short trip is waiting whenever you return.";
    const transfer = document.createElement("p");
    transfer.textContent = `Try it in real life: ${stops[level].realLife}`;
    actions.className = "learning-actions";
    const replay = document.createElement("button");
    replay.className = "quiet-action"; replay.type = "button"; replay.textContent = "Practise this stop";
    replay.addEventListener("click", () => selectLevel(level));
    actions.append(replay);
    if (level < 4) {
      const onward = document.createElement("button");
      onward.className = "primary-action"; onward.type = "button"; onward.textContent = "Next stop →";
      onward.addEventListener("click", () => selectLevel(level + 1));
      actions.append(onward);
    }
    summary.append(heading, detail, next, transfer, actions);
  }
  function showGuide() { $("guideModal").classList.add("open"); $("closeGuide").focus(); }
  function closeGuide() { $("guideModal").classList.remove("open"); $("guideButton").focus(); }
  makeClockFace();
  tabs.forEach(tab => tab.addEventListener("click", () => selectLevel(Number(tab.dataset.level))));
  $("startButton").addEventListener("click", () => {
    progress.runs[level] = makeTrip(level);
    save(); renderQuestion();
  });
  $("continueButton").addEventListener("click", () => {
    const run = progress.runs[level];
    if (!run || !run.answered) return;
    if (run.index === 4) finishTrip();
    else {
      run.index++; run.mistakes = 0; run.clue = false; run.answered = false; run.wrong = [];
      save(); renderQuestion();
    }
  });
  $("hintButton").addEventListener("click", () => {
    const run = progress.runs[level];
    if (!run || run.answered) return;
    run.clue = true; save();
    feedback("Look at the hands", run.items[run.index].hint, true);
    $("feedback").scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
  $("guideButton").addEventListener("click", showGuide);
  $("closeGuide").addEventListener("click", closeGuide);
  $("guideModal").addEventListener("click", e => { if (e.target === $("guideModal")) closeGuide(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && $("guideModal").classList.contains("open")) closeGuide(); });
  $("clockCenter").addEventListener("click", () => {
    const hand = $("secondHand");
    if (secondTimer) {
      clearInterval(secondTimer); secondTimer = null; hand.style.display = "none";
      $("clockCenter").setAttribute("aria-pressed", "false");
    } else {
      second = 0; hand.style.transform = "rotate(0deg)"; hand.style.display = "block";
      $("clockCenter").setAttribute("aria-pressed", "true");
      secondTimer = setInterval(() => {
        second = (second + 1) % 60;
        hand.style.transform = `rotate(${second * 6}deg)`;
        if (!document.hidden) playSound("tick");
      }, 1000);
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && secondTimer) $("clockCenter").click();
  });
  selectLevel(Math.min(progress.unlocked, Math.max(1, progress.lastLevel || 1)));
})();
