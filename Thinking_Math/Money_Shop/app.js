const coins = [
  { value: 1, label: "1p", type: "copper" },
  { value: 2, label: "2p", type: "copper" },
  { value: 5, label: "5p", type: "silver" },
  { value: 10, label: "10p", type: "silver" },
  { value: 20, label: "20p", type: "silver" },
  { value: 50, label: "50p", type: "silver" },
  { value: 100, label: "£1", type: "gold" },
  { value: 200, label: "£2", type: "gold" },
  { value: 500, label: "£5", type: "note" }
];

const levels = [
  {
    title: "1p to 10p",
    note: "Start with small coins and make amounts under 30p.",
    maxPrice: 30,
    coinValues: [1, 2, 5, 10],
    products: ["Pencil", "Sticker", "Apple", "Card", "Rubber"]
  },
  {
    title: "Up to 50p",
    note: "Use 20p and 50p coins to make larger totals.",
    maxPrice: 90,
    coinValues: [1, 2, 5, 10, 20, 50],
    products: ["Juice", "Crayon", "Snack", "Notebook", "Ruler"]
  },
  {
    title: "Pounds and pence",
    note: "Practise prices over £1 with £1 and £2 coins.",
    maxPrice: 230,
    coinValues: [1, 2, 5, 10, 20, 50, 100, 200],
    products: ["Story Book", "Toy Car", "Puzzle", "Paint Set", "Lunch Box"]
  },
  {
    title: "Pay with notes",
    note: "Use £5 and practise change from whole pounds.",
    maxPrice: 420,
    coinValues: [1, 2, 5, 10, 20, 50, 100, 200, 500],
    products: ["Game Pack", "Art Box", "Maths Kit", "Gift Bag", "Craft Set"]
  }
];

const state = {
  mode: "pay",
  level: 0,
  round: 1,
  stars: 0,
  correct: 0,
  streak: 0,
  price: 0,
  target: 0,
  payment: 100,
  product: "",
  selected: [],
  solved: false
};

const els = {
  modeButtons: [...document.querySelectorAll(".mode-btn")],
  roundLabel: document.getElementById("round-label"),
  starLabel: document.getElementById("star-label"),
  correctLabel: document.getElementById("correct-label"),
  streakLabel: document.getElementById("streak-label"),
  modeLabel: document.getElementById("mode-label"),
  taskTitle: document.getElementById("task-title"),
  priceLabel: document.getElementById("price-label"),
  productArt: document.getElementById("product-art"),
  instruction: document.getElementById("task-instruction"),
  selectedTotal: document.getElementById("selected-total"),
  targetCaption: document.getElementById("target-caption"),
  targetTotal: document.getElementById("target-total"),
  selectedCoins: document.getElementById("selected-coins"),
  feedback: document.getElementById("feedback"),
  checkBtn: document.getElementById("check-btn"),
  clearBtn: document.getElementById("clear-btn"),
  hintBtn: document.getElementById("hint-btn"),
  nextBtn: document.getElementById("next-btn"),
  coinTray: document.getElementById("coin-tray"),
  levelBtn: document.getElementById("level-btn"),
  levelTitle: document.getElementById("level-title"),
  levelNote: document.getElementById("level-note")
};

function formatMoney(pence) {
  if (pence < 100) return `${pence}p`;
  const pounds = Math.floor(pence / 100);
  const pennies = pence % 100;
  return pennies === 0 ? `£${pounds}` : `£${pounds}.${String(pennies).padStart(2, "0")}`;
}

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function sensiblePrice(maxPrice) {
  const steps = [7, 8, 9, 11, 12, 14, 15, 16, 18, 20, 22, 24, 25, 26, 28, 30, 32, 35, 36, 40, 42, 45, 48, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 110, 120, 125, 135, 150, 175, 190, 210, 225, 240, 275, 320, 350, 375, 410];
  const pool = steps.filter((value) => value <= maxPrice);
  return randomFrom(pool);
}

function makeChangePrice() {
  const level = levels[state.level];
  const payOptions = state.level < 2 ? [50, 100] : state.level === 2 ? [100, 200] : [100, 200, 500];
  const payment = randomFrom(payOptions.filter((value) => value <= Math.max(100, level.maxPrice + 100)));
  const possible = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 110, 120, 125, 130, 150, 175, 180, 220, 250, 275, 320, 350, 375, 410]
    .filter((price) => price < payment && price <= level.maxPrice);
  state.payment = payment;
  return randomFrom(possible.length ? possible : [25, 40, 65]);
}

function selectedTotal() {
  return state.selected.reduce((sum, coin) => sum + coin.value, 0);
}

function minCoinCount(amount, allowedValues) {
  let remaining = amount;
  let count = 0;
  [...allowedValues].sort((a, b) => b - a).forEach((value) => {
    count += Math.floor(remaining / value);
    remaining %= value;
  });
  return remaining === 0 ? count : Infinity;
}

function bestHint(amount) {
  const allowed = levels[state.level].coinValues.filter((value) => value <= amount).sort((a, b) => b - a);
  if (!allowed.length) return "Look at the target amount and start with a small coin.";
  return `Try a ${formatMoney(allowed[0])} coin next.`;
}

function renderCoins() {
  const available = coins.filter((coin) => levels[state.level].coinValues.includes(coin.value));
  els.coinTray.innerHTML = "";
  available.forEach((coin) => {
    const btn = document.createElement("button");
    btn.className = `coin ${coin.type}`;
    btn.type = "button";
    btn.textContent = coin.label;
    btn.setAttribute("aria-label", `Add ${coin.label}`);
    btn.addEventListener("click", () => addCoin(coin));
    els.coinTray.appendChild(btn);
  });
}

function renderSelected() {
  els.selectedCoins.innerHTML = "";
  state.selected.forEach((coin, index) => {
    const btn = document.createElement("button");
    btn.className = `selected-coin ${coin.type}`;
    btn.type = "button";
    btn.textContent = coin.label;
    btn.title = "Tap to remove";
    btn.addEventListener("click", () => {
      state.selected.splice(index, 1);
      updateTotals();
      setFeedback("neutral", "Coin removed. Keep going.");
    });
    els.selectedCoins.appendChild(btn);
  });
}

function setFeedback(kind, text) {
  els.feedback.className = `feedback ${kind}`;
  els.feedback.textContent = text;
}

function updateTotals() {
  const total = selectedTotal();
  els.selectedTotal.textContent = formatMoney(total);
  renderSelected();
}

function addCoin(coin) {
  if (state.solved) return;
  state.selected.push(coin);
  updateTotals();
  const total = selectedTotal();
  const diff = state.target - total;
  if (diff > 0) {
    setFeedback("neutral", `You have ${formatMoney(total)}. You need ${formatMoney(diff)} more.`);
  } else if (diff < 0) {
    setFeedback("try", `You have ${formatMoney(total)}. That is ${formatMoney(Math.abs(diff))} too much.`);
  } else {
    setFeedback("good", "That matches the target. Press Check.");
  }
}

function newRound() {
  const level = levels[state.level];
  state.selected = [];
  state.solved = false;
  state.product = randomFrom(level.products);
  state.price = state.mode === "change" ? makeChangePrice() : sensiblePrice(level.maxPrice);
  state.target = state.mode === "change" ? state.payment - state.price : state.price;

  els.productArt.textContent = state.product;
  els.roundLabel.textContent = `Round ${state.round}`;
  els.starLabel.textContent = `${state.stars} ${state.stars === 1 ? "star" : "stars"}`;
  els.correctLabel.textContent = String(state.correct);
  els.streakLabel.textContent = String(state.streak);
  els.levelBtn.textContent = `Level ${state.level + 1}`;
  els.levelTitle.textContent = level.title;
  els.levelNote.textContent = level.note;
  els.priceLabel.textContent = formatMoney(state.price);
  els.targetTotal.textContent = formatMoney(state.target);
  els.nextBtn.classList.add("hidden");
  els.checkBtn.classList.remove("hidden");

  if (state.mode === "pay") {
    els.modeLabel.textContent = "Pay for the item";
    els.taskTitle.textContent = `Buy the ${state.product}`;
    els.instruction.textContent = "Tap coins to make the exact amount.";
    els.targetCaption.textContent = "Target";
  } else if (state.mode === "least") {
    els.modeLabel.textContent = "Fewest coins";
    els.taskTitle.textContent = `Pay for the ${state.product}`;
    els.instruction.textContent = "Make the price using the fewest coins you can.";
    els.targetCaption.textContent = "Target";
  } else {
    els.modeLabel.textContent = "Find the change";
    els.taskTitle.textContent = `Pay ${formatMoney(state.payment)}`;
    els.instruction.textContent = `The ${state.product} costs ${formatMoney(state.price)}. Tap the change you should get back.`;
    els.targetCaption.textContent = "Change";
  }

  updateTotals();
  renderCoins();
  setFeedback("neutral", "Choose coins from the tray.");
}

function solveRound(successText) {
  state.solved = true;
  state.correct += 1;
  state.streak += 1;
  state.stars += state.streak > 0 && state.streak % 5 === 0 ? 2 : 1;
  els.correctLabel.textContent = String(state.correct);
  els.streakLabel.textContent = String(state.streak);
  els.starLabel.textContent = `${state.stars} ${state.stars === 1 ? "star" : "stars"}`;
  setFeedback("good", successText);
  els.checkBtn.classList.add("hidden");
  els.nextBtn.classList.remove("hidden");
}

function checkAnswer() {
  const total = selectedTotal();
  if (total !== state.target) {
    const diff = state.target - total;
    state.streak = 0;
    els.streakLabel.textContent = "0";
    if (diff > 0) {
      setFeedback("try", `Not yet. You need ${formatMoney(diff)} more.`);
    } else {
      setFeedback("bad", `Too much. Take away ${formatMoney(Math.abs(diff))}.`);
    }
    return;
  }

  if (state.mode === "least") {
    const best = minCoinCount(state.target, levels[state.level].coinValues);
    if (state.selected.length > best) {
      state.streak = 0;
      els.streakLabel.textContent = "0";
      setFeedback("try", `Correct amount, but it can be done with ${best} coins. Try fewer coins.`);
      return;
    }
    solveRound(`Smart pay. ${formatMoney(state.target)} with ${best} coins.`);
    return;
  }

  if (state.mode === "change") {
    solveRound(`Correct. ${formatMoney(state.payment)} minus ${formatMoney(state.price)} is ${formatMoney(state.target)}.`);
    return;
  }

  solveRound(`Correct. You paid exactly ${formatMoney(state.target)}.`);
}

function showHint() {
  const total = selectedTotal();
  const diff = state.target - total;
  if (diff > 0) {
    setFeedback("neutral", bestHint(diff));
  } else if (diff < 0) {
    setFeedback("try", `You are over by ${formatMoney(Math.abs(diff))}. Tap a selected coin to remove it.`);
  } else if (state.mode === "least") {
    const best = minCoinCount(state.target, levels[state.level].coinValues);
    setFeedback("neutral", `Now count your coins. The best answer uses ${best} coins.`);
  } else {
    setFeedback("good", "You have the right amount. Press Check.");
  }
}

els.modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    els.modeButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    state.mode = button.dataset.mode;
    state.round = 1;
    state.streak = 0;
    newRound();
  });
});

els.levelBtn.addEventListener("click", () => {
  state.level = (state.level + 1) % levels.length;
  state.round = 1;
  state.streak = 0;
  newRound();
});

els.checkBtn.addEventListener("click", checkAnswer);
els.clearBtn.addEventListener("click", () => {
  if (state.solved) return;
  state.selected = [];
  updateTotals();
  setFeedback("neutral", "Cleared. Choose new coins.");
});
els.hintBtn.addEventListener("click", showHint);
els.nextBtn.addEventListener("click", () => {
  state.round += 1;
  newRound();
});

newRound();
