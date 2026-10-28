import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'expense-tracker-transactions';
const BUDGET_KEY = 'expense-tracker-budget';

const defaultTransactions = [
  { id: 1, description: 'Stipendio', amount: 2200, category: 'Entrate', type: 'income', date: '2026-10-01' },
  { id: 2, description: 'Spesa', amount: 120, category: 'Casa', type: 'expense', date: '2026-10-04' },
  { id: 3, description: 'Ristorante', amount: 45, category: 'Cibo', type: 'expense', date: '2026-10-12' },
  { id: 4, description: 'Trasporto', amount: 30, category: 'Trasporti', type: 'expense', date: '2026-10-15' },
];

function formatCurrency(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function getInitialTransactions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultTransactions;
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultTransactions;
  } catch {
    return defaultTransactions;
  }
}

function getCurrentMonthKey(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function App() {
  const [transactions, setTransactions] = useState(getInitialTransactions);
  const [budget, setBudget] = useState(() => {
    const savedBudget = localStorage.getItem(BUDGET_KEY);
    return savedBudget ? Number(savedBudget) : 2500;
  });
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Cibo',
    type: 'expense',
    date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(BUDGET_KEY, String(budget));
  }, [budget]);

  const income = useMemo(
    () => transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0),
    [transactions]
  );

  const expenses = useMemo(
    () => transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0),
    [transactions]
  );

  const balance = income - expenses;

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const monthlyExpenses = transactions.filter(
    (item) => item.type === 'expense' && getCurrentMonthKey(item.date) === currentMonthKey
  ).reduce((sum, item) => sum + Number(item.amount), 0);

  const remainingBudget = Number(budget) - monthlyExpenses;

  const categories = useMemo(
    () => [...new Set(transactions.map((item) => item.category))].sort(),
    [transactions]
  );

  const visibleTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filterCategory === 'all') {
      return sorted;
    }
    return sorted.filter((item) => item.category === filterCategory);
  }, [transactions, filterCategory]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const amount = Number(formData.amount);
    if (!formData.description.trim() || !amount || amount <= 0) {
      return;
    }

    const newTransaction = {
      id: Date.now(),
      description: formData.description.trim(),
      amount,
      category: formData.category,
      type: formData.type,
      date: formData.date,
    };

    setTransactions((prev) => [newTransaction, ...prev]);
    setFormData({
      description: '',
      amount: '',
      category: 'Cibo',
      type: 'expense',
      date: new Date().toISOString().slice(0, 10),
    });
  };

  const handleDelete = (id) => {
    setTransactions((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Tracker delle spese</h1>
        </div>
        <div className="budget-box">
          <span>Budget mensile</span>
          <strong>{formatCurrency(budget)}</strong>
        </div>
      </header>

      <section className="summary-grid">
        <article className="summary-card balance">
          <p>Saldo totale</p>
          <h2>{formatCurrency(balance)}</h2>
        </article>
        <article className="summary-card income">
          <p>Entrate</p>
          <h2>{formatCurrency(income)}</h2>
        </article>
        <article className="summary-card expense">
          <p>Spese</p>
          <h2>{formatCurrency(expenses)}</h2>
        </article>
        <article className="summary-card remaining">
          <p>Budget rimasto</p>
          <h2>{formatCurrency(remainingBudget)}</h2>
        </article>
      </section>

      <section className="panel-grid">
        <div className="panel">
          <h3>Aggiungi movimento</h3>
          <form onSubmit={handleSubmit} className="transaction-form">
            <label>
              Descrizione
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Esempio: Netflix"
              />
            </label>

            <div className="inline-fields">
              <label>
                Importo
                <input
                  type="number"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </label>

              <label>
                Data
                <input type="date" name="date" value={formData.date} onChange={handleChange} />
              </label>
            </div>

            <div className="inline-fields">
              <label>
                Tipo
                <select name="type" value={formData.type} onChange={handleChange}>
                  <option value="expense">Spesa</option>
                  <option value="income">Entrata</option>
                </select>
              </label>

              <label>
                Categoria
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="Cibo">Cibo</option>
                  <option value="Casa">Casa</option>
                  <option value="Trasporti">Trasporti</option>
                  <option value="Svago">Svago</option>
                  <option value="Salute">Salute</option>
                  <option value="Lavoro">Lavoro</option>
                  <option value="Altro">Altro</option>
                  <option value="Entrate">Entrate</option>
                </select>
              </label>
            </div>

            <button type="submit">Aggiungi</button>
          </form>
        </div>

        <div className="panel">
          <h3>Impostazioni</h3>
          <label className="budget-editor">
            Budget mensile
            <input
              type="number"
              min="0"
              step="10"
              value={budget}
              onChange={(event) => setBudget(Number(event.target.value) || 0)}
            />
          </label>

          <div className="stats-box">
            <p>Spese di questo mese</p>
            <strong>{formatCurrency(monthlyExpenses)}</strong>
          </div>

          <div className="stats-box muted">
            <p>Categoria più spenduta</p>
            <strong>
              {(() => {
                const categoryTotals = Object.entries(
                  transactions.reduce((acc, item) => {
                    if (item.type === 'expense') {
                      acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
                    }
                    return acc;
                  }, {})
                );

                if (!categoryTotals.length) return 'Nessuna spesa';

                const topCategory = categoryTotals.sort((a, b) => b[1] - a[1])[0];
                return `${topCategory[0]} (${formatCurrency(topCategory[1])})`;
              })()}
            </strong>
          </div>
        </div>
      </section>

      <section className="panel transactions-panel">
        <div className="panel-header">
          <h3>Movimenti</h3>
          <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
            <option value="all">Tutte le categorie</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <ul className="transaction-list">
          {visibleTransactions.length ? (
            visibleTransactions.map((item) => (
              <li key={item.id} className={item.type === 'income' ? 'income-row' : 'expense-row'}>
                <div>
                  <strong>{item.description}</strong>
                  <span>
                    {item.category} • {item.date}
                  </span>
                </div>
                <div className="amount-remove">
                  <span className={item.type === 'income' ? 'income' : 'expense'}>
                    {item.type === 'income' ? '+' : '-'}
                    {formatCurrency(item.amount)}
                  </span>
                  <button type="button" onClick={() => handleDelete(item.id)}>
                    Elimina
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="empty-state">Nessun movimento trovato.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

export default App;
