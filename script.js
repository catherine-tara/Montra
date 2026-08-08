/* ── Montra – script.js ── */
'use strict';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const STORAGE_KEY = 'montra_transactions';

const CURRENCIES = {
  IDR: { symbol: 'Rp',  locale: 'id-ID', fractionDigits: 0 },
  USD: { symbol: '$',   locale: 'en-US', fractionDigits: 2 },
  KRW: { symbol: '₩',  locale: 'ko-KR', fractionDigits: 0 },
  JPY: { symbol: '¥',  locale: 'ja-JP', fractionDigits: 0 },
  SGD: { symbol: 'S$', locale: 'en-SG', fractionDigits: 2 },
  EUR: { symbol: '€',  locale: 'de-DE', fractionDigits: 2 },
  GBP: { symbol: '£',  locale: 'en-GB', fractionDigits: 2 },
};

const CATEGORIES = {
  income: [
    'Gaji', 'Freelance', 'Investasi', 'Hadiah', 'Bonus', 'Bisnis', 'Lainnya',
  ],
  expense: [
    'Makanan & Minuman', 'Transportasi', 'Belanja', 'Tagihan & Utilitas',
    'Kesehatan', 'Hiburan', 'Pendidikan', 'Tabungan', 'Perjalanan',
    'Perawatan Diri', 'Rumah Tangga', 'Lainnya',
  ],
};

// Consistent colour palette for categories (coral/fresh/butter shades)
const CAT_COLORS = [
  '#FF6B6B', '#4CAF7D', '#FFD966', '#FF8C42', '#54C6EB',
  '#FF6B9D', '#9ED36A', '#FFA07A', '#70C1B3', '#B5838D',
  '#E9C46A', '#2A9D8F',
];

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
let transactions = [];
let editingId    = null;
let pendingDelId = null;
let chartMode    = 'monthly'; // 'monthly' | 'category'
let mainChart    = null;
// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════

/**
 * Format a numeric amount for a given currency code.
 * IDR uses Indonesian convention: Rp1.000.000
 */
function formatAmount(amount, currencyCode) {
  const cfg = CURRENCIES[currencyCode] || CURRENCIES.IDR;
  const num  = Number(amount);
  if (isNaN(num)) return `${cfg.symbol}0`;

  if (currencyCode === 'IDR') {
    // Indonesian format: Rp1.000.000 (dots as thousand separators, no decimals)
    const formatted = Math.abs(num)
      .toFixed(0)
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${cfg.symbol}${formatted}`;
  }

  // Other currencies: use Intl for locale-correct formatting but strip currency code
  // Store raw numeric, display symbol manually
  const formatted = new Intl.NumberFormat(cfg.locale, {
    minimumFractionDigits: cfg.fractionDigits,
    maximumFractionDigits: cfg.fractionDigits,
  }).format(Math.abs(num));

  // Some locales (e.g. EUR) put thousands as dots — that's fine, let Intl handle it
  return `${cfg.symbol}${formatted}`;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function today() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function monthLabel(dateStr) {
  // dateStr: 'YYYY-MM-DD'
  const [y, m] = dateStr.split('-');
  const names = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${names[parseInt(m, 10) - 1]} ${y}`;
}

// ═══════════════════════════════════════════════════════════════
// LOCAL STORAGE
// ═══════════════════════════════════════════════════════════════
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    transactions = raw ? JSON.parse(raw) : [];
  } catch {
    transactions = [];
  }
}

// ═══════════════════════════════════════════════════════════════
// FORM HELPERS
// ═══════════════════════════════════════════════════════════════
let selectedType = 'expense'; // default

function setType(type) {
  selectedType = type;
  const incBtn = document.getElementById('typeIncome');
  const expBtn = document.getElementById('typeExpense');
  incBtn.classList.remove('active-income', 'active-expense');
  expBtn.classList.remove('active-income', 'active-expense');
  if (type === 'income') {
    incBtn.classList.add('active-income');
  } else {
    expBtn.classList.add('active-expense');
  }
  populateCategories();
}

function populateCategories(selected = '') {
  const sel = document.getElementById('fCategory');
  const list = CATEGORIES[selectedType] || [];
  sel.innerHTML = '<option value="">Pilih…</option>' +
    list.map(c => `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`).join('');
}

function updateCurrencyPrefix() {
  const code = document.getElementById('fCurrency').value;
  const cfg  = CURRENCIES[code] || CURRENCIES.IDR;
  document.getElementById('currencyPrefix').textContent = cfg.symbol;
}

// ── Amount input: formatted display, raw numeric stored separately ──

/**
 * Strip formatting and return a plain JS number.
 *
 * The input always uses dots as thousand separators (matching IDR/KRW/JPY style)
 * and, for decimal currencies, a comma as the decimal separator.
 *   "1.000.000"  → 1000000
 *   "1.234,56"   → 1234.56
 *   "999"        → 999
 */
function parseAmountInput(val) {
  if (!val) return 0;
  const s = String(val).trim();
  // If comma present and it comes after the last dot → comma is decimal sep
  const lastDot   = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  let normalised;
  if (lastComma > lastDot) {
    // e.g. "1.234,56" – dots are thousands, comma is decimal
    normalised = s.replace(/\./g, '').replace(',', '.');
  } else {
    // e.g. "1.000.000" or "1.234" – dots are thousands only
    normalised = s.replace(/\./g, '').replace(/,/g, '');
  }
  return parseFloat(normalised) || 0;
}

/**
 * Format a raw number for display inside the amount text-input.
 *
 * All currencies use dot as the thousand separator.
 * Decimal currencies additionally show a comma and fraction digits.
 *   IDR/KRW/JPY:        1000000  → "1.000.000"
 *   USD/SGD/EUR/GBP:    1234.5   → "1.234,50"
 */
function formatAmountInput(num, currencyCode) {
  if (!num || isNaN(num) || num <= 0) return '';
  const cfg = CURRENCIES[currencyCode] || CURRENCIES.IDR;

  if (cfg.fractionDigits === 0) {
    // Integer currencies – dots only
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  // Decimal currencies – split integer and fraction, then join with comma
  const fixed   = num.toFixed(cfg.fractionDigits);
  const [intPart, fracPart] = fixed.split('.');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intFormatted},${fracPart}`;
}

/**
 * Live input handler: strip any character that is not a digit, dot, or comma.
 * Then immediately reformat the integer part with dot separators while the
 * user is still typing, so "2000" becomes "2.000" as they finish each group.
 */
function handleAmountInput(e) {
  const input = e.target;
  // Preserve cursor position
  const selStart = input.selectionStart;
  const before   = input.value;

  // 1. Allow only digits, dots, commas
  let cleaned = before.replace(/[^\d.,]/g, '');

  // 2. Parse the raw number from whatever is typed so far
  const raw  = parseAmountInput(cleaned);
  const code = document.getElementById('fCurrency').value;
  const cfg  = CURRENCIES[code] || CURRENCIES.IDR;

  // 3. If there's a valid positive number, reformat in place
  if (raw > 0) {
    // For integer currencies just reformat fully
    if (cfg.fractionDigits === 0) {
      cleaned = Math.round(raw).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    } else {
      // For decimal currencies: keep any trailing comma the user may be typing
      const hasTrailingComma = cleaned.endsWith(',') || cleaned.includes(',');
      if (hasTrailingComma) {
        // Reformat the integer part, keep comma + whatever fraction typed so far
        const commaIdx = cleaned.lastIndexOf(',');
        const intRaw   = cleaned.slice(0, commaIdx).replace(/\./g, '');
        const fracRaw  = cleaned.slice(commaIdx + 1);
        const intFmt   = parseInt(intRaw || '0', 10).toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        cleaned = `${intFmt},${fracRaw}`;
      } else {
        // No comma yet – just format the integer part
        const intFmt = Math.round(raw).toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        cleaned = intFmt;
      }
    }
  }

  if (input.value !== cleaned) {
    input.value = cleaned;
    // Attempt to restore cursor (best-effort)
    const diff = cleaned.length - before.length;
    try { input.setSelectionRange(selStart + diff, selStart + diff); } catch (_) {}
  }
}

/** On blur: apply the definitive full formatting (integer + fraction). */
function handleAmountBlur(e) {
  const input = e.target;
  const raw   = parseAmountInput(input.value);
  const code  = document.getElementById('fCurrency').value;
  input.value = raw > 0 ? formatAmountInput(raw, code) : '';
}

/** Currency dropdown changed: update symbol prefix and reformat existing value. */
function handleCurrencyChangeAmount() {
  updateCurrencyPrefix();
  const input = document.getElementById('fAmount');
  const raw   = parseAmountInput(input.value);
  const code  = document.getElementById('fCurrency').value;
  if (raw > 0) input.value = formatAmountInput(raw, code);
}

function resetForm() {
  editingId = null;
  document.getElementById('txForm').reset();
  document.getElementById('fDate').value = today();
  document.getElementById('fAmount').value = '';
  setType('expense');
  updateCurrencyPrefix();
  document.getElementById('btnSubmit').textContent = 'Simpan';
  document.getElementById('btnCancel').classList.add('hidden');
  clearFormError();
}

function showFormError(msg) {
  const el = document.getElementById('formError');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearFormError() {
  const el = document.getElementById('formError');
  el.textContent = '';
  el.classList.add('hidden');
}

// ═══════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════
let toastTimer = null;
function showToast(msg, duration = 2600) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.classList.add('hidden'), 280);
  }, duration);
}

// ═══════════════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════════════
function openModal(id) {
  pendingDelId = id;
  document.getElementById('modal').classList.add('open');
}
function closeModal() {
  pendingDelId = null;
  document.getElementById('modal').classList.remove('open');
}

// ═══════════════════════════════════════════════════════════════
// CRUD
// ═══════════════════════════════════════════════════════════════
function addTransaction(data) {
  transactions.unshift({ ...data, id: uid(), createdAt: Date.now() });
  saveData();
  renderAll();
  showToast('✅ Transaksi berhasil disimpan!');
}

function updateTransaction(id, data) {
  const idx = transactions.findIndex(t => t.id === id);
  if (idx === -1) return;
  transactions[idx] = { ...transactions[idx], ...data };
  saveData();
  renderAll();
  showToast('✏️ Transaksi berhasil diperbarui!');
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  renderAll();
  showToast('🗑️ Transaksi dihapus.');
}

// ═══════════════════════════════════════════════════════════════
// RENDER – SUMMARY CARDS (dashboard)
// ═══════════════════════════════════════════════════════════════

// Flag emoji per currency code
const CURRENCY_FLAGS = {
  IDR: '🇮🇩', USD: '🇺🇸', GBP: '🇬🇧',
  EUR: '🇪🇺', SGD: '🇸🇬', JPY: '🇯🇵', KRW: '🇰🇷',
};

function renderSummary() {
  // ── build totals by currency ──
  const totals = {};
  for (const t of transactions) {
    if (!totals[t.currency]) totals[t.currency] = { income: 0, expense: 0 };
    totals[t.currency][t.type] += Number(t.amount);
  }

  // ── IDR primary cards ──
  const idrEl     = document.getElementById('summarySection');
  const idrTotals = totals['IDR'] || { income: 0, expense: 0 };
  const idrNet    = idrTotals.income - idrTotals.expense;

  if (Object.keys(totals).length === 0) {
    // Welcome state
    idrEl.innerHTML = `
      <div class="idr-card" style="background:#FFF3C4;grid-column:1/-1">
        <span class="ic-icon">👋</span>
        <span class="ic-label">Selamat Datang</span>
        <span class="ic-value" style="font-size:0.95rem;color:#57606a">Belum ada transaksi</span>
        <span class="ic-sub">Yuk, mulai catat pemasukan atau pengeluaranmu!</span>
      </div>`;
    document.getElementById('foreignSection').classList.add('hidden');
    return;
  }

  idrEl.innerHTML = `
    <div class="idr-card" style="background:${idrNet >= 0 ? '#D6F5E3' : '#FFE0E0'}">
      <span class="ic-icon">💳</span>
      <span class="ic-label" style="color:${idrNet >= 0 ? '#2E7D52' : '#C0392B'}">Saldo Bersih</span>
      <span class="ic-value" style="color:${idrNet >= 0 ? '#2E7D52' : '#C0392B'}">${formatAmount(idrNet, 'IDR')}</span>
      <span class="ic-sub">Pemasukan − Pengeluaran</span>
    </div>
    <div class="idr-card" style="background:#D6F5E3">
      <span class="ic-icon">📈</span>
      <span class="ic-label" style="color:#2E7D52">Pemasukan</span>
      <span class="ic-value" style="color:#2E7D52">${formatAmount(idrTotals.income, 'IDR')}</span>
      <span class="ic-sub">Total Masuk</span>
    </div>
    <div class="idr-card" style="background:#FFE0E0">
      <span class="ic-icon">📉</span>
      <span class="ic-label" style="color:#C0392B">Pengeluaran</span>
      <span class="ic-value" style="color:#C0392B">${formatAmount(idrTotals.expense, 'IDR')}</span>
      <span class="ic-sub">Total Keluar</span>
    </div>`;

  // ── Foreign currency cards ──
  const foreignSection = document.getElementById('foreignSection');
  const foreignCards   = document.getElementById('foreignCards');
  const foreignCurs    = Object.keys(totals).filter(c => c !== 'IDR');

  if (foreignCurs.length === 0) {
    foreignSection.classList.add('hidden');
    return;
  }

  foreignSection.classList.remove('hidden');
  foreignCards.innerHTML = foreignCurs.map(cur => {
    const { income, expense } = totals[cur];
    const net      = income - expense;
    const netColor = net >= 0 ? '#2E7D52' : '#C0392B';
    const flag     = CURRENCY_FLAGS[cur] || '🌐';
    return `
      <div class="fc-card">
        <div class="fc-card-top">
          <span class="fc-flag">${flag}</span>
          <span class="fc-code">${cur}</span>
        </div>
        <span class="fc-net" style="color:${netColor}">${formatAmount(net, cur)}</span>
        <div class="fc-row">
          <span class="fc-inc">↑ ${formatAmount(income, cur)}</span>
          <span style="color:#e5e7eb">·</span>
          <span class="fc-exp">↓ ${formatAmount(expense, cur)}</span>
        </div>
      </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// RENDER – TRANSACTION TABLE
// ═══════════════════════════════════════════════════════════════
function getFilteredTransactions() {
  const search   = document.getElementById('searchInput').value.toLowerCase().trim();
  const typeF    = document.getElementById('filterType').value;
  const currencyF= document.getElementById('filterCurrency').value;

  return transactions.filter(t => {
    if (typeF     && t.type     !== typeF)     return false;
    if (currencyF && t.currency !== currencyF) return false;
    if (search) {
      const hay = `${t.date} ${t.category} ${t.description} ${t.currency}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}

function renderTable() {
  const tbody  = document.getElementById('txTableBody');
  const empty  = document.getElementById('txEmpty');
  const filtered = getFilteredTransactions();

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  // Sort by date desc (then by createdAt desc for same-day)
  const sorted = [...filtered].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  tbody.innerHTML = sorted.map(t => {
    const typeLabel  = t.type === 'income' ? '↑ Pemasukan' : '↓ Pengeluaran';
    const typeBadge  = `badge badge-${t.type}`;
    const amtClass   = `amount-${t.type}`;
    const sign       = t.type === 'income' ? '+' : '−';
    const amt        = formatAmount(t.amount, t.currency);
    const desc       = t.description ? escHtml(t.description) : '<span class="text-gray-300">—</span>';
    const dateDisp   = formatDateDisplay(t.date);

    return `
      <tr data-id="${t.id}">
        <td class="whitespace-nowrap text-xs text-gray-500">${dateDisp}</td>
        <td><span class="${typeBadge}">${typeLabel}</span></td>
        <td><span class="category-pill">${escHtml(t.category)}</span></td>
        <td class="text-xs max-w-[160px] truncate">${desc}</td>
        <td class="text-right ${amtClass} whitespace-nowrap">${sign} ${amt}</td>
        <td class="text-right whitespace-nowrap">
          <button class="btn-edit" data-id="${t.id}" title="Edit">✏️</button>
          <button class="btn-del"  data-id="${t.id}" title="Hapus">🗑️</button>
        </td>
      </tr>`;
  }).join('');
}

function formatDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════════════
// RENDER – CATEGORY BREAKDOWN
// ═══════════════════════════════════════════════════════════════
function renderCategoryBreakdown() {
  const el    = document.getElementById('categoryBreakdown');
  const empty = document.getElementById('catEmpty');

  // Only expenses
  const expenses = transactions.filter(t => t.type === 'expense');
  if (expenses.length === 0) {
    el.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  // Group by category – but note: currencies differ, so we track per-currency
  // For the bar chart display, we show IDR totals; for other currencies, list them
  // Approach: group by (category, currency) and show all entries
  const groups = {}; // key: `${cat}|${currency}` → total
  for (const t of expenses) {
    const key = `${t.category}|${t.currency}`;
    groups[key] = (groups[key] || 0) + Number(t.amount);
  }

  // Sort by raw amount within same currency → use a shared IDR-equivalent approximation
  // For display we just sort by count
  const entries = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  const max     = entries[0]?.[1] || 1;

  el.innerHTML = entries.map(([key, total], i) => {
    const [cat, cur] = key.split('|');
    const pct = Math.round((total / max) * 100);
    const color = CAT_COLORS[i % CAT_COLORS.length];
    return `
      <div class="cat-card">
        <span class="text-lg">${categoryEmoji(cat)}</span>
        <span class="cat-name">${escHtml(cat)}</span>
        <span class="cat-amount">${formatAmount(total, cur)} <span class="text-xs font-medium text-gray-400">${cur}</span></span>
        <div class="cat-bar-wrap">
          <div class="cat-bar-fill" style="width:${pct}%; background:${color}"></div>
        </div>
      </div>`;
  }).join('');
}

function categoryEmoji(cat) {
  const map = {
    'Makanan & Minuman': '🍜', 'Transportasi': '🚗', 'Belanja': '🛍️',
    'Tagihan & Utilitas': '💡', 'Kesehatan': '💊', 'Hiburan': '🎬',
    'Pendidikan': '📚', 'Tabungan': '🐷', 'Perjalanan': '✈️',
    'Perawatan Diri': '💇', 'Rumah Tangga': '🏠', 'Gaji': '💼',
    'Freelance': '💻', 'Investasi': '📈', 'Hadiah': '🎁',
    'Bonus': '🏆', 'Bisnis': '🏢', 'Lainnya': '📌',
  };
  return map[cat] || '📌';
}

// ═══════════════════════════════════════════════════════════════
// RENDER – DASHBOARD CHARTS (catChart + barChart)
// ═══════════════════════════════════════════════════════════════

// Chart instances for the two fixed dashboard charts
let dashCatChart = null;
let dashBarChart = null;

function renderDashboardCharts() {
  renderDashCatChart();
  renderDashBarChart();
}

function renderDashCatChart() {
  const canvas  = document.getElementById('catChart');
  const emptyEl = document.getElementById('catChartEmpty');
  if (!canvas) return;

  if (dashCatChart) { dashCatChart.destroy(); dashCatChart = null; }

  const expTx = transactions.filter(t => t.type === 'expense');
  if (expTx.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  const curCount = {};
  expTx.forEach(t => { curCount[t.currency] = (curCount[t.currency] || 0) + 1; });
  const dominantCur = Object.entries(curCount).sort((a, b) => b[1] - a[1])[0][0];
  const filtered    = expTx.filter(t => t.currency === dominantCur);
  const groups      = {};
  for (const t of filtered) groups[t.category] = (groups[t.category] || 0) + Number(t.amount);

  const entries = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  const labels  = entries.map(([k]) => k);
  const data    = entries.map(([, v]) => v);
  const colors  = labels.map((_, i) => CAT_COLORS[i % CAT_COLORS.length]);

  dashCatChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff', hoverOffset: 5 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: '"Plus Jakarta Sans"', size: 10 }, boxWidth: 10, padding: 8 },
        },
        tooltip: { callbacks: { label: ctx => ` ${formatAmount(ctx.parsed, dominantCur)}` } },
      },
    },
  });
}

function renderDashBarChart() {
  const canvas  = document.getElementById('barChart');
  const emptyEl = document.getElementById('barChartEmpty');
  if (!canvas) return;

  if (dashBarChart) { dashBarChart.destroy(); dashBarChart = null; }

  if (transactions.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  const curCount = {};
  for (const t of transactions) curCount[t.currency] = (curCount[t.currency] || 0) + 1;
  const dominantCur = Object.entries(curCount).sort((a, b) => b[1] - a[1])[0][0];
  const filtered    = transactions.filter(t => t.currency === dominantCur);

  const monthMap = {};
  for (const t of filtered) {
    const ym = t.date.slice(0, 7);
    if (!monthMap[ym]) monthMap[ym] = { income: 0, expense: 0 };
    monthMap[ym][t.type] += Number(t.amount);
  }

  const sortedMonths = Object.keys(monthMap).sort();
  const note = Object.keys(curCount).length > 1 ? ` (${dominantCur})` : '';

  dashBarChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: sortedMonths.map(ym => monthLabel(ym + '-01')),
      datasets: [
        { label: `Pemasukan${note}`, data: sortedMonths.map(ym => monthMap[ym].income),  backgroundColor: '#4CAF7D', borderRadius: 5, borderSkipped: false },
        { label: `Pengeluaran${note}`, data: sortedMonths.map(ym => monthMap[ym].expense), backgroundColor: '#FF6B6B', borderRadius: 5, borderSkipped: false },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { font: { family: '"Plus Jakarta Sans"', size: 10 }, boxWidth: 10 } },
        tooltip: { callbacks: { label: ctx => ` ${formatAmount(ctx.parsed.y, dominantCur)}` } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        y: { grid: { color: '#f0f0f0' }, ticks: { font: { size: 10 }, callback: v => formatAmount(v, dominantCur) } },
      },
    },
  });
}

// Legacy renderChart kept so existing chart-tab wiring doesn't throw if called
// (chart tabs are no longer in the HTML, but keeping this avoids breakage)
function renderChart() {
  renderDashCatChart();
  renderDashBarChart();
}

function renderMonthlyChart(canvas) {
  // Group by month – only IDR or first currency found, or aggregate IDR
  // Strategy: group income/expense per month (all currencies combined numerically
  // only makes sense for same currency; show IDR only or first dominant currency)
  // Better UX: show the currency that has the most transactions
  const currencyCount = {};
  for (const t of transactions) {
    currencyCount[t.currency] = (currencyCount[t.currency] || 0) + 1;
  }
  const dominantCur = Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0][0];

  const filtered = transactions.filter(t => t.currency === dominantCur);

  const monthMap = {}; // 'YYYY-MM' → { income: 0, expense: 0 }
  for (const t of filtered) {
    const ym = t.date.slice(0, 7);
    if (!monthMap[ym]) monthMap[ym] = { income: 0, expense: 0 };
    monthMap[ym][t.type] += Number(t.amount);
  }

  const sortedMonths = Object.keys(monthMap).sort();
  const labels  = sortedMonths.map(ym => monthLabel(ym + '-01'));
  const incomes  = sortedMonths.map(ym => monthMap[ym].income);
  const expenses = sortedMonths.map(ym => monthMap[ym].expense);

  const note = Object.keys(currencyCount).length > 1
    ? ` (${dominantCur})`
    : '';

  mainChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: `Pemasukan${note}`,
          data: incomes,
          backgroundColor: '#4CAF7D',
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: `Pengeluaran${note}`,
          data: expenses,
          backgroundColor: '#FF6B6B',
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { font: { family: '"Plus Jakarta Sans"', size: 11 }, boxWidth: 12 },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${formatAmount(ctx.parsed.y, dominantCur)}`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: {
          grid: { color: '#f0f0f0' },
          ticks: {
            font: { size: 10 },
            callback: v => formatAmount(v, dominantCur),
          },
        },
      },
    },
  });
}

function renderCategoryChart(canvas) {
  // Only expenses, dominant currency
  const expTx = transactions.filter(t => t.type === 'expense');
  if (expTx.length === 0) {
    document.getElementById('chartEmpty').classList.remove('hidden');
    return;
  }

  // Determine dominant currency among expenses
  const curCount = {};
  expTx.forEach(t => { curCount[t.currency] = (curCount[t.currency] || 0) + 1; });
  const dominantCur = Object.entries(curCount).sort((a, b) => b[1] - a[1])[0][0];

  const filtered = expTx.filter(t => t.currency === dominantCur);
  const groups = {};
  for (const t of filtered) {
    groups[t.category] = (groups[t.category] || 0) + Number(t.amount);
  }

  const entries = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  const labels  = entries.map(([k]) => k);
  const data    = entries.map(([, v]) => v);
  const colors  = labels.map((_, i) => CAT_COLORS[i % CAT_COLORS.length]);

  mainChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: { family: '"Plus Jakarta Sans"', size: 11 },
            boxWidth: 12,
            padding: 10,
          },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${formatAmount(ctx.parsed, dominantCur)}`,
          },
        },
      },
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// RENDER – ALL
// ═══════════════════════════════════════════════════════════════
function renderAll() {
  renderSummary();
  renderTable();
  renderCategoryBreakdown();
  renderChart();
}

// ═══════════════════════════════════════════════════════════════
// FORM SUBMIT
// ═══════════════════════════════════════════════════════════════
function handleFormSubmit(e) {
  e.preventDefault();
  clearFormError();

  const date     = document.getElementById('fDate').value.trim();
  const category = document.getElementById('fCategory').value.trim();
  const currency = document.getElementById('fCurrency').value;
  const amountRaw= document.getElementById('fAmount').value.trim();
  const desc     = document.getElementById('fDesc').value.trim();

  // Validation
  if (!date) return showFormError('Tanggal wajib diisi.');
  if (!category) return showFormError('Pilih kategori terlebih dahulu.');
  const amount = parseAmountInput(amountRaw); // parse formatted string → number
  if (!amount || amount <= 0) return showFormError('Jumlah harus lebih dari 0.');

  const data = { date, type: selectedType, category, currency, amount, description: desc };

  if (editingId) {
    updateTransaction(editingId, data);
  } else {
    addTransaction(data);
  }
  resetForm();
}

// ═══════════════════════════════════════════════════════════════
// EDIT / DELETE
// ═══════════════════════════════════════════════════════════════
function startEdit(id) {
  const t = transactions.find(t => t.id === id);
  if (!t) return;

  editingId = id;
  document.getElementById('fDate').value     = t.date;
  document.getElementById('fCurrency').value = t.currency;
  // Show formatted amount in the text input
  document.getElementById('fAmount').value   = formatAmountInput(t.amount, t.currency);
  document.getElementById('fDesc').value     = t.description || '';
  setType(t.type);
  // Populate categories then set value
  populateCategories(t.category);
  updateCurrencyPrefix();

  document.getElementById('btnSubmit').textContent = 'Perbarui';
  document.getElementById('btnCancel').classList.remove('hidden');

  // Scroll to form
  document.getElementById('txForm').closest('.card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ═══════════════════════════════════════════════════════════════
// CSV EXPORT
// ═══════════════════════════════════════════════════════════════
function exportCSV() {
  if (transactions.length === 0) {
    showToast('⚠️ Tidak ada data untuk diekspor.');
    return;
  }
  const headers = ['id', 'date', 'type', 'category', 'currency', 'amount', 'description'];
  const rows = transactions.map(t =>
    headers.map(h => {
      const val = t[h] === undefined ? '' : String(t[h]);
      // Escape commas/quotes
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(',')
  );
  const csv  = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `montra_${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`📤 Diekspor ${transactions.length} transaksi.`);
}

// ═══════════════════════════════════════════════════════════════
// CSV IMPORT
// ═══════════════════════════════════════════════════════════════
function importCSV(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      let text = e.target.result;
      // Strip BOM
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) throw new Error('File CSV kosong.');

      const headers = parseCSVLine(lines[0]);
      const required = ['date', 'type', 'category', 'currency', 'amount'];
      for (const r of required) {
        if (!headers.includes(r)) throw new Error(`Kolom "${r}" tidak ditemukan.`);
      }

      let imported = 0;
      let skipped  = 0;
      const newTx  = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const row  = {};
        headers.forEach((h, idx) => { row[h] = cols[idx] || ''; });

        const amount = parseFloat(row.amount);
        if (!row.date || !row.type || !row.category || !row.currency || isNaN(amount) || amount <= 0) {
          skipped++; continue;
        }
        if (!['income', 'expense'].includes(row.type)) { skipped++; continue; }
        if (!CURRENCIES[row.currency]) { skipped++; continue; }

        newTx.push({
          id: row.id || uid(),
          date: row.date,
          type: row.type,
          category: row.category,
          currency: row.currency,
          amount,
          description: row.description || '',
          createdAt: Date.now(),
        });
        imported++;
      }

      // Merge: avoid duplicates by id
      const existingIds = new Set(transactions.map(t => t.id));
      const unique = newTx.filter(t => !existingIds.has(t.id));
      transactions = [...unique, ...transactions];
      saveData();
      renderAll();
      showToast(`📥 Import berhasil: ${unique.length} transaksi ditambahkan.${skipped ? ` (${skipped} dilewati)` : ''}`, 3500);
    } catch (err) {
      showToast(`❌ Gagal import: ${err.message}`, 4000);
    }
  };
  reader.readAsText(file);
}

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      result.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

// ═══════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════
function initEvents() {
  // Form submit
  document.getElementById('txForm').addEventListener('submit', handleFormSubmit);

  // Type toggle
  document.getElementById('typeIncome').addEventListener('click', () => setType('income'));
  document.getElementById('typeExpense').addEventListener('click', () => setType('expense'));

  // Currency change → update prefix + reformat amount
  document.getElementById('fCurrency').addEventListener('change', handleCurrencyChangeAmount);

  // Amount input formatting
  document.getElementById('fAmount').addEventListener('input', handleAmountInput);
  document.getElementById('fAmount').addEventListener('blur',  handleAmountBlur);

  // Cancel edit
  document.getElementById('btnCancel').addEventListener('click', resetForm);

  // Table: edit / delete buttons (event delegation)
  document.getElementById('txTableBody').addEventListener('click', e => {
    const editBtn = e.target.closest('.btn-edit');
    const delBtn  = e.target.closest('.btn-del');
    if (editBtn) startEdit(editBtn.dataset.id);
    if (delBtn)  openModal(delBtn.dataset.id);
  });

  // Filters
  document.getElementById('searchInput').addEventListener('input', renderTable);
  document.getElementById('filterType').addEventListener('change', renderTable);
  document.getElementById('filterCurrency').addEventListener('change', renderTable);

  // Clear all
  document.getElementById('btnClearAll').addEventListener('click', () => {
    if (transactions.length === 0) { showToast('Tidak ada data untuk dihapus.'); return; }
    if (confirm('Hapus SEMUA transaksi? Tindakan ini tidak bisa dibatalkan.')) {
      transactions = [];
      saveData();
      renderAll();
      showToast('🗑️ Semua transaksi dihapus.');
    }
  });

  // Export
  document.getElementById('btnExport').addEventListener('click', exportCSV);

  // Import trigger
  document.getElementById('btnImport').addEventListener('click', () => {
    document.getElementById('importFile').value = '';
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', e => {
    if (e.target.files[0]) importCSV(e.target.files[0]);
  });

  // Modal
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target === document.getElementById('modal')) closeModal();
  });
  document.getElementById('modalConfirm').addEventListener('click', () => {
    if (pendingDelId) {
      deleteTransaction(pendingDelId);
      closeModal();
    }
  });

  // Chart tabs
  document.querySelectorAll('.chart-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active-tab'));
      btn.classList.add('active-tab');
      chartMode = btn.dataset.chart;
      renderChart();
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
function init() {
  loadData();
  initEvents();

  // Set default date
  document.getElementById('fDate').value = today();

  // Set default type
  setType('expense');
  updateCurrencyPrefix();

  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
