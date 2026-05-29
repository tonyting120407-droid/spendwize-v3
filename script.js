const STORAGE_KEY = "spendwize-finance-data";
const CATEGORIES = [
  "Housing",
  "Food",
  "Transportation",
  "Utilities",
  "Entertainment",
  "Savings",
  "Accessories",
  "Health",
  "Shopping",
  "Education",
  "Travel",
  "Other",
];
const CATEGORY_KEYWORDS = {
  Housing: ["rent", "mortgage", "apartment", "home", "lease"],
  Food: ["food", "grocery", "groceries", "restaurant", "coffee", "lunch", "dinner", "breakfast", "snack", "pizza", "burger"],
  Transportation: ["gas", "fuel", "uber", "lyft", "bus", "train", "metro", "parking", "taxi", "transit"],
  Utilities: ["electric", "water", "internet", "phone", "utility", "utilities", "wifi", "power"],
  Entertainment: ["movie", "game", "concert", "music", "streaming", "netflix", "spotify", "show"],
  Savings: ["saving", "savings", "investment", "invest", "brokerage"],
  Accessories: ["accessory", "accessories", "jewelry", "watch", "wallet", "bag", "backpack", "belt", "hat", "sunglasses"],
  Health: ["doctor", "medicine", "pharmacy", "health", "dentist", "therapy", "gym", "vitamin"],
  Shopping: ["shopping", "amazon", "clothes", "shirt", "pants", "shoes", "store", "target"],
  Education: ["book", "course", "tuition", "school", "class", "education", "notebook"],
  Travel: ["flight", "hotel", "airbnb", "trip", "travel", "vacation", "luggage"],
};

function createId() {
  return globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `expense-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function today() {
  return new Date().toISOString();
}

const defaultData = {
  income: 4800,
  taxRate: 21,
  expenses: [
    { id: createId(), name: "Rent", category: "Housing", amount: 1450, date: today(), source: "tracked" },
    { id: createId(), name: "Groceries", category: "Food", amount: 420, date: today(), source: "tracked" },
    { id: createId(), name: "Transit pass", category: "Transportation", amount: 95, date: today(), source: "tracked" },
  ],
  updatedAt: today(),
};

let state = loadState();
let editingExpenseId = null;

const elements = {
  showDashboardButton: document.querySelector("#showDashboardButton"),
  toggleInterface: document.querySelector("#toggleInterface"),
  viewHistoryButton: document.querySelector("#viewHistoryButton"),
  quickHistoryButton: document.querySelector("#quickHistoryButton"),
  addTrackedExpenseButton: document.querySelector("#addTrackedExpenseButton"),
  dashboardView: document.querySelector("#dashboardView"),
  editorView: document.querySelector("#editorView"),
  historyView: document.querySelector("#historyView"),
  historyBackButton: document.querySelector("#historyBackButton"),
  monthlyIncome: document.querySelector("#monthlyIncome"),
  afterTaxes: document.querySelector("#afterTaxes"),
  taxRateLabel: document.querySelector("#taxRateLabel"),
  totalSpending: document.querySelector("#totalSpending"),
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
  financeForm: document.querySelector("#financeForm"),
  incomeInput: document.querySelector("#incomeInput"),
  taxInput: document.querySelector("#taxInput"),
  expenseName: document.querySelector("#expenseName"),
  expenseCategory: document.querySelector("#expenseCategory"),
  expenseAmount: document.querySelector("#expenseAmount"),
  saveExpenseButton: document.querySelector("#saveExpenseButton"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  expenseList: document.querySelector("#expenseList"),
  expenseCount: document.querySelector("#expenseCount"),
  historyList: document.querySelector("#historyList"),
  historyCount: document.querySelector("#historyCount"),
  resetData: document.querySelector("#resetData"),
  expenseTemplate: document.querySelector("#expenseItemTemplate"),
};

function normalizeExpense(expense) {
  return {
    id: expense.id || createId(),
    name: expense.name || "Untitled expense",
    category: CATEGORIES.includes(expense.category) ? expense.category : "Other",
    amount: Number(expense.amount) || 0,
    date: expense.date || expense.createdAt || today(),
    source: expense.source || "tracked",
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
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses.map(normalizeExpense) : [],
      updatedAt: parsed.updatedAt || today(),
    };
  } catch {
    return structuredClone(defaultData);
  }
}

function saveState() {
  state.updatedAt = today();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatDate(date) {
  return new Date(date).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function calculateSummary() {
  const totalSpending = state.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const taxes = state.income * (state.taxRate / 100);
  const afterTaxes = Math.max(state.income - taxes, 0);
  const moneyLeft = afterTaxes - totalSpending;

  return { totalSpending, afterTaxes, moneyLeft };
}

function getCategoryTotals() {
  return state.expenses.reduce((totals, expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + Number(expense.amount);
    return totals;
  }, {});
}

function categorizeExpense(itemName) {
  const normalizedName = itemName.toLowerCase();
  const match = Object.entries(CATEGORY_KEYWORDS).find(([, keywords]) => keywords.some((keyword) => normalizedName.includes(keyword)));
  return match ? match[0] : "Other";
}

function populateCategoryOptions() {
  elements.expenseCategory.innerHTML = "";
  CATEGORIES.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.expenseCategory.append(option);
  });
}

function renderDashboard() {
  const { totalSpending, afterTaxes, moneyLeft } = calculateSummary();
  const spendingRatio = afterTaxes > 0 ? Math.min((totalSpending / afterTaxes) * 100, 100) : 0;

  elements.monthlyIncome.textContent = currency(state.income);
  elements.afterTaxes.textContent = currency(afterTaxes);
  elements.taxRateLabel.textContent = `Tax rate: ${state.taxRate}%`;
  elements.totalSpending.textContent = currency(totalSpending);
  elements.moneyLeft.textContent = currency(moneyLeft);
  elements.remainingHint.textContent = moneyLeft >= 0 ? "After taxes and expenses" : "You are over your after-tax budget";
  elements.moneyLeft.closest(".metric-card").classList.toggle("negative", moneyLeft < 0);
  elements.lastUpdated.textContent = `Last updated ${new Date(state.updatedAt).toLocaleString()}`;

  elements.spendingProgress.style.width = `${spendingRatio}%`;
  elements.spendingProgress.style.background = spendingRatio > 90
    ? "linear-gradient(90deg, #d92d20, #f97066)"
    : spendingRatio > 70
      ? "linear-gradient(90deg, #d9822b, #fdb022)"
      : "linear-gradient(90deg, #0f9f6e, #70d878)";

  const statusClass = spendingRatio > 90 || moneyLeft < 0 ? "danger" : spendingRatio > 70 ? "warning" : "success";
  const statusText = spendingRatio > 90 || moneyLeft < 0 ? "Needs attention" : spendingRatio > 70 ? "Watch closely" : "Balanced";
  elements.healthStatus.className = `pill ${statusClass}`;
  elements.healthStatus.textContent = statusText;
  elements.budgetMessage.textContent = afterTaxes === 0
    ? "Enter your monthly income to unlock spending guidance."
    : `${spendingRatio.toFixed(0)}% of your after-tax income is currently assigned to expenses.`;

  renderCategories(totalSpending);
}

function renderCategories(totalSpending) {
  const categoryTotals = getCategoryTotals();
  const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  elements.categoryCount.textContent = `${entries.length} ${entries.length === 1 ? "category" : "categories"}`;
  elements.categoryBreakdown.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No spending yet. Add a daily expenditure or open the editing interface to add your first tracked expense.";
    elements.categoryBreakdown.append(empty);
    return;
  }

  entries.forEach(([category, amount]) => {
    const row = document.createElement("div");
    row.className = "category-row";
    const percent = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;

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
  elements.incomeInput.value = state.income || "";
  elements.taxInput.value = state.taxRate || "";
  elements.expenseCount.textContent = `${state.expenses.length} ${state.expenses.length === 1 ? "item" : "items"}`;
  elements.expenseList.innerHTML = "";

  if (!state.expenses.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "Expenses you add will appear here for quick editing.";
    elements.expenseList.append(empty);
    return;
  }

  getSortedExpenses().forEach((expense) => {
    const item = elements.expenseTemplate.content.firstElementChild.cloneNode(true);
    item.querySelector(".expense-title").textContent = expense.name;
    item.querySelector(".expense-meta").textContent = `${expense.category} • ${formatDate(expense.date)} • ${expense.source === "daily" ? "Daily expenditure" : "Tracked expense"}`;
    item.querySelector(".expense-value").textContent = currency(Number(expense.amount));
    item.querySelector(".edit-expense").addEventListener("click", () => editExpense(expense.id));
    item.querySelector(".delete-expense").addEventListener("click", () => removeExpense(expense.id));
    elements.expenseList.append(item);
  });
}

function getSortedExpenses() {
  return [...state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderHistory() {
  const expenses = getSortedExpenses();
  elements.historyCount.textContent = `${expenses.length} ${expenses.length === 1 ? "transaction" : "transactions"}`;
  elements.historyList.innerHTML = "";

  if (!expenses.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No transactions yet. Add a daily expenditure from the dashboard to start your history.";
    elements.historyList.append(empty);
    return;
  }

  expenses.forEach((expense) => {
    const item = document.createElement("li");
    item.className = "history-item";

    const details = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = expense.name;
    const meta = document.createElement("span");
    meta.textContent = `${expense.category} • ${formatDate(expense.date)} • ${expense.source === "daily" ? "Auto-sorted daily expenditure" : "Tracked expense"}`;
    details.append(title, meta);

    const amount = document.createElement("strong");
    amount.className = "history-amount";
    amount.textContent = currency(expense.amount);

    item.append(details, amount);
    elements.historyList.append(item);
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
  elements.toggleInterface.textContent = viewName === "editor" ? "Back to dashboard" : "Open editing interface";
}

function handleEditorToggle() {
  showView(elements.editorView.classList.contains("active") ? "dashboard" : "editor");
}

function focusExpenseForm() {
  showView("editor");
  elements.expenseName.focus();
}

function handleFinanceSubmit(event) {
  event.preventDefault();

  state.income = Math.max(Number(elements.incomeInput.value) || 0, 0);
  state.taxRate = Math.min(Math.max(Number(elements.taxInput.value) || 0, 0), 100);

  const name = elements.expenseName.value.trim();
  const amount = Number(elements.expenseAmount.value);
  if (name && amount > 0) {
    if (editingExpenseId) {
      state.expenses = state.expenses.map((expense) => expense.id === editingExpenseId
        ? { ...expense, name, category: elements.expenseCategory.value, amount }
        : expense);
    } else {
      state.expenses.push({
        id: createId(),
        name,
        category: elements.expenseCategory.value,
        amount,
        date: today(),
        source: "tracked",
      });
    }
    clearExpenseForm();
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
    name,
    category,
    amount,
    date: today(),
    source: "daily",
  });
  elements.dailyExpenseName.value = "";
  elements.dailyExpenseAmount.value = "";
  elements.autoSortMessage.textContent = `Added ${currency(amount)} for “${name}” and auto-sorted it into ${category}.`;

  saveState();
  renderApp();
}

function editExpense(id) {
  const expense = state.expenses.find((item) => item.id === id);
  if (!expense) {
    return;
  }

  editingExpenseId = id;
  elements.expenseName.value = expense.name;
  elements.expenseCategory.value = expense.category;
  elements.expenseAmount.value = expense.amount;
  elements.saveExpenseButton.textContent = "Update expense";
  elements.cancelEditButton.classList.remove("hidden");
  showView("editor");
  elements.expenseName.focus();
}

function clearExpenseForm() {
  editingExpenseId = null;
  elements.expenseName.value = "";
  elements.expenseAmount.value = "";
  elements.saveExpenseButton.textContent = "Save updates";
  elements.cancelEditButton.classList.add("hidden");
}

function removeExpense(id) {
  state.expenses = state.expenses.filter((expense) => expense.id !== id);
  if (editingExpenseId === id) {
    clearExpenseForm();
  }
  saveState();
  renderApp();
}

function resetData() {
  state = structuredClone(defaultData);
  state.expenses = state.expenses.map((expense) => ({ ...expense, id: createId(), date: today() }));
  elements.autoSortMessage.textContent = "Demo data restored.";
  saveState();
  clearExpenseForm();
  renderApp();
}

populateCategoryOptions();
elements.showDashboardButton.addEventListener("click", () => showView("dashboard"));
elements.toggleInterface.addEventListener("click", handleEditorToggle);
elements.viewHistoryButton.addEventListener("click", () => showView("history"));
elements.quickHistoryButton.addEventListener("click", () => showView("history"));
elements.historyBackButton.addEventListener("click", () => showView("dashboard"));
elements.addTrackedExpenseButton.addEventListener("click", focusExpenseForm);
elements.financeForm.addEventListener("submit", handleFinanceSubmit);
elements.dailyExpenseForm.addEventListener("submit", handleDailyExpenseSubmit);
elements.resetData.addEventListener("click", resetData);
elements.cancelEditButton.addEventListener("click", clearExpenseForm);

renderApp();
