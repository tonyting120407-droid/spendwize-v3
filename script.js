const STORAGE_KEY = "spendwize-finance-data";
const FIXED_CATEGORIES = ["Housing", "Utilities", "Insurance", "Subscriptions", "Loan", "Education", "Transportation", "Health", "Other"];
const DAILY_CATEGORIES = ["Food", "Accessories", "Transportation", "Shopping", "Entertainment", "Health", "Education", "Travel", "Other"];
const CATEGORY_KEYWORDS = {
  Food: ["food", "grocery", "groceries", "restaurant", "coffee", "lunch", "dinner", "breakfast", "snack", "pizza", "burger", "tea"],
  Accessories: ["accessory", "accessories", "jewelry", "watch", "wallet", "bag", "backpack", "belt", "hat", "sunglasses", "headphones"],
  Transportation: ["gas", "fuel", "uber", "lyft", "bus", "train", "metro", "parking", "taxi", "transit", "toll"],
  Shopping: ["shopping", "amazon", "clothes", "shirt", "pants", "shoes", "store", "target", "walmart"],
  Entertainment: ["movie", "game", "concert", "music", "streaming", "netflix", "spotify", "show", "ticket"],
  Health: ["doctor", "medicine", "pharmacy", "health", "dentist", "therapy", "gym", "vitamin"],
  Education: ["book", "course", "tuition", "school", "class", "education", "notebook"],
  Travel: ["flight", "hotel", "airbnb", "trip", "travel", "vacation", "luggage"],
};

function createId() {
  return globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `expense-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function now() {
  return new Date().toISOString();
}

const defaultData = {
  income: 4800,
  taxRate: 21,
  savingsGoal: 600,
  dailyBudget: 35,
  expenses: [
    { id: createId(), type: "fixed", name: "Rent", category: "Housing", amount: 1450, cadence: "monthly", date: now() },
    { id: createId(), type: "fixed", name: "Electric fee", category: "Utilities", amount: 120, cadence: "monthly", date: now() },
    { id: createId(), type: "fixed", name: "Car insurance", category: "Insurance", amount: 1200, cadence: "yearly", date: now() },
    { id: createId(), type: "daily", name: "Groceries", category: "Food", amount: 42.5, date: now() },
  ],
  updatedAt: now(),
};

let state = loadState();
let editingFixedPaymentId = null;

const elements = {
  showDashboardButton: document.querySelector("#showDashboardButton"),
  toggleInterface: document.querySelector("#toggleInterface"),
  viewHistoryButton: document.querySelector("#viewHistoryButton"),
  dashboardView: document.querySelector("#dashboardView"),
  editorView: document.querySelector("#editorView"),
  historyView: document.querySelector("#historyView"),
  historyBackButton: document.querySelector("#historyBackButton"),
  totalSpending: document.querySelector("#totalSpending"),
  totalSpendingHint: document.querySelector("#totalSpendingHint"),
  moneyLeft: document.querySelector("#moneyLeft"),
  remainingHint: document.querySelector("#remainingHint"),
  lastUpdated: document.querySelector("#lastUpdated"),
  categoryBreakdown: document.querySelector("#categoryBreakdown"),
  categoryCount: document.querySelector("#categoryCount"),
  healthStatus: document.querySelector("#healthStatus"),
  spendingProgress: document.querySelector("#spendingProgress"),
  budgetMessage: document.querySelector("#budgetMessage"),
  dailyExpenseForm: document.querySelector("#dailyExpenseForm"),
  dailyExpenseName: document.querySelector("#dailyExpenseName"),
  dailyExpenseAmount: document.querySelector("#dailyExpenseAmount"),
  autoSortMessage: document.querySelector("#autoSortMessage"),
  goalsForm: document.querySelector("#goalsForm"),
  savingsGoalInput: document.querySelector("#savingsGoalInput"),
  dailyBudgetInput: document.querySelector("#dailyBudgetInput"),
  savingsGoalDisplay: document.querySelector("#savingsGoalDisplay"),
  dailyBudgetDisplay: document.querySelector("#dailyBudgetDisplay"),
  averageDailyDisplay: document.querySelector("#averageDailyDisplay"),
  financeForm: document.querySelector("#financeForm"),
  incomeInput: document.querySelector("#incomeInput"),
  taxInput: document.querySelector("#taxInput"),
  expenseName: document.querySelector("#expenseName"),
  expenseCategory: document.querySelector("#expenseCategory"),
  expenseCadence: document.querySelector("#expenseCadence"),
  expenseAmount: document.querySelector("#expenseAmount"),
  saveExpenseButton: document.querySelector("#saveExpenseButton"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  expenseList: document.querySelector("#expenseList"),
  expenseCount: document.querySelector("#expenseCount"),
  dailyHistoryList: document.querySelector("#dailyHistoryList"),
  dailyHistoryCount: document.querySelector("#dailyHistoryCount"),
  fixedHistoryList: document.querySelector("#fixedHistoryList"),
  fixedHistoryCount: document.querySelector("#fixedHistoryCount"),
  resetData: document.querySelector("#resetData"),
  expenseTemplate: document.querySelector("#expenseItemTemplate"),
};

function normalizeExpense(expense) {
  const type = expense.type || (expense.source === "daily" ? "daily" : "fixed");
  const fallbackCategory = type === "fixed" ? "Other" : categorizeExpense(expense.name || "");
  return {
    id: expense.id || createId(),
    type,
    name: expense.name || "Untitled expense",
    category: expense.category || fallbackCategory,
    amount: Number(expense.amount) || 0,
    cadence: type === "fixed" && expense.cadence === "yearly" ? "yearly" : "monthly",
    date: expense.date || expense.createdAt || now(),
  };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return structuredClone(defaultData);
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      income: Number(parsed.income) || 0,
      taxRate: Number(parsed.taxRate) || 0,
      savingsGoal: Number(parsed.savingsGoal) || 0,
      dailyBudget: Number(parsed.dailyBudget) || 0,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses.map(normalizeExpense) : [],
      updatedAt: parsed.updatedAt || now(),
    };
  } catch {
    return structuredClone(defaultData);
  }
}

function saveState() {
  state.updatedAt = now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatDate(date) {
  return new Date(date).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function monthlyValue(expense) {
  if (expense.type !== "fixed") {
    return Number(expense.amount) || 0;
  }
  return expense.cadence === "yearly" ? (Number(expense.amount) || 0) / 12 : Number(expense.amount) || 0;
}

function getDailyExpenses() {
  return state.expenses.filter((expense) => expense.type === "daily");
}

function getFixedPayments() {
  return state.expenses.filter((expense) => expense.type === "fixed");
}

function getSortedExpenses(expenses) {
  return [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function calculateSummary() {
  const dailySpent = getDailyExpenses().reduce((sum, expense) => sum + Number(expense.amount), 0);
  const fixedMonthlyTotal = getFixedPayments().reduce((sum, expense) => sum + monthlyValue(expense), 0);
  const totalSpent = dailySpent + fixedMonthlyTotal;
  const afterTaxes = Math.max(state.income - state.income * (state.taxRate / 100), 0);
  const moneyLeft = afterTaxes - totalSpent - state.savingsGoal;
  const averageDailySpend = dailySpent / new Date().getDate();

  return { afterTaxes, dailySpent, fixedMonthlyTotal, totalSpent, moneyLeft, averageDailySpend };
}

function categorizeExpense(itemName) {
  const normalizedName = itemName.toLowerCase();
  const match = Object.entries(CATEGORY_KEYWORDS).find(([, keywords]) => keywords.some((keyword) => normalizedName.includes(keyword)));
  return match ? match[0] : "Other";
}

function getDailyCategoryTotals() {
  return getDailyExpenses().reduce((totals, expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + Number(expense.amount);
    return totals;
  }, {});
}

function populateCategoryOptions() {
  elements.expenseCategory.innerHTML = "";
  FIXED_CATEGORIES.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.expenseCategory.append(option);
  });
}

function renderDashboard() {
  const { afterTaxes, dailySpent, fixedMonthlyTotal, totalSpent, moneyLeft, averageDailySpend } = calculateSummary();
  const usedWithGoal = totalSpent + state.savingsGoal;
  const spendingRatio = afterTaxes > 0 ? Math.min((usedWithGoal / afterTaxes) * 100, 100) : 0;

  elements.totalSpending.textContent = currency(totalSpent);
  elements.totalSpendingHint.textContent = `${currency(dailySpent)} daily + ${currency(fixedMonthlyTotal)} fixed payments this month`;
  elements.moneyLeft.textContent = currency(moneyLeft);
  elements.remainingHint.textContent = moneyLeft >= 0 ? "Available after fixed payments and saving goal" : "Over budget after fixed payments and saving goal";
  elements.moneyLeft.closest(".metric-card").classList.toggle("negative", moneyLeft < 0);
  elements.lastUpdated.textContent = `Last updated ${new Date(state.updatedAt).toLocaleString()}`;

  elements.savingsGoalInput.value = state.savingsGoal || "";
  elements.dailyBudgetInput.value = state.dailyBudget || "";
  elements.savingsGoalDisplay.textContent = currency(state.savingsGoal);
  elements.dailyBudgetDisplay.textContent = currency(state.dailyBudget);
  elements.averageDailyDisplay.textContent = currency(averageDailySpend);

  elements.spendingProgress.style.width = `${spendingRatio}%`;
  elements.spendingProgress.style.background = spendingRatio > 90
    ? "linear-gradient(90deg, #d92d20, #f97066)"
    : spendingRatio > 70
      ? "linear-gradient(90deg, #d9822b, #fdb022)"
      : "linear-gradient(90deg, #0f9f6e, #70d878)";

  const overDailyBudget = state.dailyBudget > 0 && averageDailySpend > state.dailyBudget;
  const statusClass = spendingRatio > 90 || moneyLeft < 0 || overDailyBudget ? "danger" : spendingRatio > 70 ? "warning" : "success";
  const statusText = statusClass === "danger" ? "Needs attention" : statusClass === "warning" ? "Watch closely" : "Balanced";
  elements.healthStatus.className = `pill ${statusClass}`;
  elements.healthStatus.textContent = statusText;

  if (afterTaxes === 0) {
    elements.budgetMessage.textContent = "Enter monthly income in fixed payments to calculate money left to spend.";
  } else if (overDailyBudget) {
    elements.budgetMessage.textContent = `Your average daily spend is ${currency(averageDailySpend)}, above your ${currency(state.dailyBudget)} daily budget.`;
  } else {
    elements.budgetMessage.textContent = `${currency(usedWithGoal)} of your ${currency(afterTaxes)} after-tax income is assigned to spending and savings.`;
  }

  renderCategories(dailySpent);
}

function renderCategories(dailySpent) {
  const categoryTotals = getDailyCategoryTotals();
  const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  elements.categoryCount.textContent = `${entries.length} ${entries.length === 1 ? "category" : "categories"}`;
  elements.categoryBreakdown.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No daily spending yet. Add a daily expenditure to start categorizing goods.";
    elements.categoryBreakdown.append(empty);
    return;
  }

  entries.forEach(([category, amount]) => {
    const row = document.createElement("div");
    row.className = "category-row";
    const percent = dailySpent > 0 ? (amount / dailySpent) * 100 : 0;

    const label = document.createElement("strong");
    label.textContent = category;
    const value = document.createElement("span");
    value.textContent = currency(amount);
    const track = document.createElement("div");
    track.className = "category-track";
    const fill = document.createElement("div");
    fill.className = "category-fill";
    fill.style.width = `${percent}%`;
    track.append(fill);
    row.append(label, value, track);
    elements.categoryBreakdown.append(row);
  });
}

function renderEditor() {
  const fixedPayments = getSortedExpenses(getFixedPayments());
  elements.incomeInput.value = state.income || "";
  elements.taxInput.value = state.taxRate || "";
  elements.expenseCount.textContent = `${fixedPayments.length} ${fixedPayments.length === 1 ? "payment" : "payments"}`;
  elements.expenseList.innerHTML = "";

  if (!fixedPayments.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "Fixed monthly and yearly payments you add will appear here.";
    elements.expenseList.append(empty);
    return;
  }

  fixedPayments.forEach((expense) => {
    const item = elements.expenseTemplate.content.firstElementChild.cloneNode(true);
    item.querySelector(".expense-title").textContent = expense.name;
    item.querySelector(".expense-meta").textContent = `${expense.category} • ${capitalize(expense.cadence)} payment • ${currency(monthlyValue(expense))}/month value`;
    item.querySelector(".expense-value").textContent = `${currency(Number(expense.amount))}/${expense.cadence === "yearly" ? "yr" : "mo"}`;
    item.querySelector(".edit-expense").addEventListener("click", () => editFixedPayment(expense.id));
    item.querySelector(".delete-expense").addEventListener("click", () => removeExpense(expense.id));
    elements.expenseList.append(item);
  });
}

function renderHistory() {
  renderHistorySection({
    list: elements.dailyHistoryList,
    count: elements.dailyHistoryCount,
    items: getSortedExpenses(getDailyExpenses()),
    singular: "transaction",
    plural: "transactions",
    emptyText: "No daily expenditures yet. Add one from the dashboard.",
    meta: (expense) => `${expense.category} • Auto-sorted • ${formatDate(expense.date)}`,
    value: (expense) => currency(expense.amount),
  });

  renderHistorySection({
    list: elements.fixedHistoryList,
    count: elements.fixedHistoryCount,
    items: getSortedExpenses(getFixedPayments()),
    singular: "payment",
    plural: "payments",
    emptyText: "No fixed payments yet. Add rent, electricity, subscriptions, or yearly fees from the fixed payments page.",
    meta: (expense) => `${expense.category} • ${capitalize(expense.cadence)} • ${currency(monthlyValue(expense))}/month value`,
    value: (expense) => `${currency(expense.amount)}/${expense.cadence === "yearly" ? "yr" : "mo"}`,
  });
}

function renderHistorySection({ list, count, items, singular, plural, emptyText, meta, value }) {
  count.textContent = `${items.length} ${items.length === 1 ? singular : plural}`;
  list.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = emptyText;
    list.append(empty);
    return;
  }

  items.forEach((expense) => {
    const item = document.createElement("li");
    item.className = "history-item";

    const details = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = expense.name;
    const subtitle = document.createElement("span");
    subtitle.textContent = meta(expense);
    details.append(title, subtitle);

    const amount = document.createElement("strong");
    amount.className = "history-amount";
    amount.textContent = value(expense);

    item.append(details, amount);
    list.append(item);
  });
}

function renderApp() {
  renderDashboard();
  renderEditor();
  renderHistory();
}

function showView(viewName) {
  const views = {
    dashboard: elements.dashboardView,
    editor: elements.editorView,
    history: elements.historyView,
  };

  Object.entries(views).forEach(([name, element]) => {
    element.classList.toggle("active", name === viewName);
  });

  elements.showDashboardButton.classList.toggle("hidden", viewName === "dashboard");
  elements.toggleInterface.textContent = viewName === "editor" ? "Back to dashboard" : "Open fixed payments";
}

function handleEditorToggle() {
  showView(elements.editorView.classList.contains("active") ? "dashboard" : "editor");
}

function handleGoalsSubmit(event) {
  event.preventDefault();
  state.savingsGoal = Math.max(Number(elements.savingsGoalInput.value) || 0, 0);
  state.dailyBudget = Math.max(Number(elements.dailyBudgetInput.value) || 0, 0);
  elements.autoSortMessage.textContent = "Saving and daily budget goals updated.";
  saveState();
  renderApp();
}

function handleFinanceSubmit(event) {
  event.preventDefault();

  state.income = Math.max(Number(elements.incomeInput.value) || 0, 0);
  state.taxRate = Math.min(Math.max(Number(elements.taxInput.value) || 0, 0), 100);

  const name = elements.expenseName.value.trim();
  const amount = Number(elements.expenseAmount.value);
  if (name && amount > 0) {
    const fixedPayment = {
      name,
      category: elements.expenseCategory.value,
      cadence: elements.expenseCadence.value,
      amount,
      type: "fixed",
    };

    if (editingFixedPaymentId) {
      state.expenses = state.expenses.map((expense) => expense.id === editingFixedPaymentId
        ? { ...expense, ...fixedPayment }
        : expense);
    } else {
      state.expenses.push({ id: createId(), date: now(), ...fixedPayment });
    }
    clearFixedPaymentForm();
  }

  saveState();
  renderApp();
}

function handleDailyExpenseSubmit(event) {
  event.preventDefault();

  const name = elements.dailyExpenseName.value.trim();
  const amount = Number(elements.dailyExpenseAmount.value);
  if (!name || amount <= 0) {
    elements.autoSortMessage.textContent = "Enter both an item name and a cost greater than $0.";
    return;
  }

  const category = categorizeExpense(name);
  state.expenses.push({
    id: createId(),
    type: "daily",
    name,
    category,
    amount,
    date: now(),
    cadence: "monthly",
  });
  elements.dailyExpenseName.value = "";
  elements.dailyExpenseAmount.value = "";
  elements.autoSortMessage.textContent = `Added ${currency(amount)} for “${name}” and auto-sorted it into ${category}.`;

  saveState();
  renderApp();
}

function editFixedPayment(id) {
  const expense = getFixedPayments().find((item) => item.id === id);
  if (!expense) {
    return;
  }

  editingFixedPaymentId = id;
  elements.expenseName.value = expense.name;
  elements.expenseCategory.value = expense.category;
  elements.expenseCadence.value = expense.cadence;
  elements.expenseAmount.value = expense.amount;
  elements.saveExpenseButton.textContent = "Update fixed payment";
  elements.cancelEditButton.classList.remove("hidden");
  showView("editor");
  elements.expenseName.focus();
}

function clearFixedPaymentForm() {
  editingFixedPaymentId = null;
  elements.expenseName.value = "";
  elements.expenseAmount.value = "";
  elements.expenseCadence.value = "monthly";
  elements.saveExpenseButton.textContent = "Save fixed payment";
  elements.cancelEditButton.classList.add("hidden");
}

function removeExpense(id) {
  state.expenses = state.expenses.filter((expense) => expense.id !== id);
  if (editingFixedPaymentId === id) {
    clearFixedPaymentForm();
  }
  saveState();
  renderApp();
}

function resetData() {
  state = structuredClone(defaultData);
  state.expenses = state.expenses.map((expense) => ({ ...expense, id: createId(), date: now() }));
  elements.autoSortMessage.textContent = "Demo data restored.";
  saveState();
  clearFixedPaymentForm();
  renderApp();
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

populateCategoryOptions();
elements.showDashboardButton.addEventListener("click", () => showView("dashboard"));
elements.toggleInterface.addEventListener("click", handleEditorToggle);
elements.viewHistoryButton.addEventListener("click", () => showView("history"));
elements.historyBackButton.addEventListener("click", () => showView("dashboard"));
elements.financeForm.addEventListener("submit", handleFinanceSubmit);
elements.dailyExpenseForm.addEventListener("submit", handleDailyExpenseSubmit);
elements.goalsForm.addEventListener("submit", handleGoalsSubmit);
elements.resetData.addEventListener("click", resetData);
elements.cancelEditButton.addEventListener("click", clearFixedPaymentForm);

renderApp();
