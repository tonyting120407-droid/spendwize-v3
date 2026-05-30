# SpendWize

SpendWize is a lightweight personal finance web app for tracking daily expenditures, credit-card purchases, monthly or yearly fixed payments, saving goals, daily budgets, transaction history, and money left to spend.

## Features

- Dashboard summary separates total balance, total spending, fixed spending, regular expenditures, money left for the month, and money left for the day.
- Daily expenditure form that auto-sorts purchases into categories and lets users mark whether each purchase was paid by credit card.
- Advanced mode for recurring monthly or yearly expenses such as rent, electric fees, insurance, subscriptions, and loans.
- Inline fixed-payment editing so users can update the exact payment row they clicked.
- Credit card tracking for monthly credit limit, credit used by daily purchases, available credit, and payback amount subtracted from money left to spend.
- Goals section for setting a monthly saving goal and daily spending budget.
- Transaction history split into separate Daily Expenditures and Fixed Payments sections.
- Budget health progress meter that considers after-tax income, cash/debit spending, fixed payments, credit card payback, and savings goals.
- Local browser storage so changes remain after refreshes.

## Run locally

Open `index.html` in a browser, or serve the folder with any static file server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.
