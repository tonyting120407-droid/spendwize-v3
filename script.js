function createId() {
  return globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `expense-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const STORAGE_KEY = "spendwize-finance-data";

const defaultData = {
  income: 4800,
  taxRate: 21,
  expenses: [
    { id: createId(), name: "Rent", category: "Housing", amount: 1450 },
    { id: createId(), name: "Groceries", category: "Food", amount: 420 },
    { id: createId(), name: "Transit pass", category: "Transportation", amount: 95 },
  ],
  updatedAt: new Date().toISOString(),
};

let state = loadState();
let editingExpenseId = null;

const elements = {
  toggleInterface: document.querySelector("#toggleInterface"),
  dashboardView: document.querySelector("#dashboardView"),
  editorView: document.querySelector("#editorView"),
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
  resetData: document.querySelector("#resetData"),
  expenseTemplate: document.querySelector("#expenseItemTemplate"),
};

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
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return structuredClone(defaultData);
  }
}

function saveState() {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
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
    elements.categoryBreakdown.innerHTML = '<p class="empty-state">No spending yet. Open the editing interface to add your first expense.</p>';
    return;
  }

  entries.forEach(([category, amount]) => {
    const row = document.createElement("div");
    row.className = "category-row";
    const percent = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;
    row.innerHTML = `
      <strong>${category}</strong>
      <span>${currency(amount)}</span>
      <div class="category-track"><div class="category-fill" style="width: ${percent}%"></div></div>
    `;
    elements.categoryBreakdown.append(row);
  });
}

function renderEditor() {
  elements.incomeInput.value = state.income || "";
  elements.taxInput.value = state.taxRate || "";
  elements.expenseCount.textContent = `${state.expenses.length} ${state.expenses.length === 1 ? "item" : "items"}`;
  elements.expenseList.innerHTML = "";

  if (!state.expenses.length) {
    elements.expenseList.innerHTML = '<li class="empty-state">Expenses you add will appear here for quick editing.</li>';
    return;
  }

  state.expenses.forEach((expense) => {
    const item = elements.expenseTemplate.content.firstElementChild.cloneNode(true);
    item.querySelector(".expense-title").textContent = expense.name;
    item.querySelector(".expense-meta").textContent = expense.category;
    item.querySelector(".expense-value").textContent = currency(Number(expense.amount));
    item.querySelector(".edit-expense").addEventListener("click", () => editExpense(expense.id));
    item.querySelector(".delete-expense").addEventListener("click", () => removeExpense(expense.id));
    elements.expenseList.append(item);
  });
}

function renderApp() {
  renderDashboard();
  renderEditor();
}

function switchInterface() {
  const editorIsActive = elements.editorView.classList.toggle("active");
  elements.dashboardView.classList.toggle("active", !editorIsActive);
  elements.toggleInterface.textContent = editorIsActive ? "Back to dashboard" : "Open editing interface";
}

function handleSubmit(event) {
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
      });
    }
    clearExpenseForm();
  }

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
  state.expenses = state.expenses.map((expense) => ({ ...expense, id: createId() }));
  saveState();
  renderApp();
}

elements.toggleInterface.addEventListener("click", switchInterface);
elements.financeForm.addEventListener("submit", handleSubmit);
elements.resetData.addEventListener("click", resetData);
elements.cancelEditButton.addEventListener("click", clearExpenseForm);

renderApp();
