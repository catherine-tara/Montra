/* ── Montra – script.js ── */
'use strict';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const STORAGE_KEY  = 'montra_transactions';
const SETTINGS_KEY = 'montra_settings';

const CURRENCIES = {
  IDR: { symbol: 'Rp',  locale: 'id-ID', fractionDigits: 0 },
  USD: { symbol: '$',   locale: 'en-US', fractionDigits: 2 },
  KRW: { symbol: '₩',  locale: 'ko-KR', fractionDigits: 0 },
  JPY: { symbol: '¥',  locale: 'ja-JP', fractionDigits: 0 },
  SGD: { symbol: 'S$', locale: 'en-SG', fractionDigits: 2 },
  EUR: { symbol: '€',  locale: 'de-DE', fractionDigits: 2 },
  GBP: { symbol: '£',  locale: 'en-GB', fractionDigits: 2 },
};

// Categories: canonical `id` value is always what gets stored on a
// transaction (regardless of UI language) — `en` is only a display label.
const CATEGORIES = {
  income: [
    { id: 'Gaji', en: 'Salary' },
    { id: 'Freelance', en: 'Freelance' },
    { id: 'Investasi', en: 'Investment' },
    { id: 'Hadiah', en: 'Gift' },
    { id: 'Bonus', en: 'Bonus' },
    { id: 'Bisnis', en: 'Business' },
    { id: 'Lainnya', en: 'Other' },
  ],
  expense: [
    { id: 'Makanan & Minuman', en: 'Food & Drink' },
    { id: 'Transportasi', en: 'Transport' },
    { id: 'Belanja', en: 'Shopping' },
    { id: 'Tagihan & Utilitas', en: 'Bills & Utilities' },
    { id: 'Kesehatan', en: 'Health' },
    { id: 'Hiburan', en: 'Entertainment' },
    { id: 'Pendidikan', en: 'Education' },
    { id: 'Tabungan', en: 'Savings' },
    { id: 'Perjalanan', en: 'Travel' },
    { id: 'Perawatan Diri', en: 'Self Care' },
    { id: 'Rumah Tangga', en: 'Household' },
    { id: 'Lainnya', en: 'Other' },
  ],
};

// Consistent colour palette for categories (brand orange leads, then accents)
const CAT_COLORS = [
  '#FF7A1A', '#4CAF7D', '#FF6B6B', '#FFD966', '#54C6EB',
  '#FF6B9D', '#9ED36A', '#FFA07A', '#70C1B3', '#B5838D',
  '#E9C46A', '#2A9D8F',
];

// ═══════════════════════════════════════════════════════════════
// I18N
// ═══════════════════════════════════════════════════════════════
const I18N = {
  id: {
    tagline: 'Keuangan Pribadi',
    nav_dashboard: 'Dashboard',
    nav_transactions: 'Daftar Transaksi',
    nav_add: 'Tambah',
    import: 'Import',
    export: 'Export',
    settings: '⚙️ Pengaturan',
    your_name: 'Nama Kamu',
    name_placeholder: 'Masukkan nama',
    save: 'Simpan',
    language: 'Bahasa',
    reset_all: '🗑️ Hapus Semua Data',
    idr_summary: 'Ringkasan Utama (IDR)',
    other_currencies: 'Mata Uang Lain',
    chart_category: '🏷️ Kategori',
    chart_category_sub: 'Pengeluaran',
    chart_monthly: '📈 Bulanan',
    chart_monthly_sub: 'Pemasukan vs Pengeluaran',
    chart_empty: 'Belum ada data',
    category_breakdown_title: '🏷️ Pengeluaran per Kategori',
    category_empty: 'Belum ada pengeluaran.',
    add_tx_title: '➕ Tambah Transaksi',
    date: 'Tanggal',
    type: 'Jenis',
    income_btn: '↑ Pemasukan',
    expense_btn: '↓ Pengeluaran',
    category: 'Kategori',
    choose: 'Pilih…',
    currency: 'Mata Uang',
    amount: 'Jumlah',
    desc: 'Keterangan',
    desc_optional: '(opsional)',
    desc_placeholder: 'Mis. Gaji bulan Juni…',
    submit_save: 'Simpan',
    submit_update: 'Perbarui',
    cancel: 'Batal',
    history_title: '🧾 Riwayat Transaksi',
    search_placeholder: '🔍 Cari…',
    filter_all_type: 'Semua Jenis',
    filter_all_currency: 'Semua Mata Uang',
    clear_all: 'Hapus Semua',
    th_date: 'Tanggal',
    th_type: 'Jenis',
    th_category: 'Kategori',
    th_desc: 'Keterangan',
    th_amount: 'Jumlah',
    tx_empty: 'Belum ada transaksi. Yuk, mulai catat! 🎉',
    modal_title: 'Hapus Transaksi?',
    modal_sub: 'Tindakan ini tidak bisa dibatalkan.',
    modal_cancel: 'Batal',
    modal_confirm: 'Hapus',
    welcome_title: 'Selamat Datang',
    welcome_sub: 'Belum ada transaksi',
    welcome_desc: 'Yuk, mulai catat pemasukan atau pengeluaranmu!',
    net_balance: 'Saldo Bersih',
    net_balance_sub: 'Pemasukan − Pengeluaran',
    total_income: 'Pemasukan',
    total_income_sub: 'Total Masuk',
    total_expense: 'Pengeluaran',
    total_expense_sub: 'Total Keluar',
    toast_saved: '✅ Transaksi berhasil disimpan!',
    toast_updated: '✏️ Transaksi berhasil diperbarui!',
    toast_deleted: '🗑️ Transaksi dihapus.',
    toast_name_saved: name => `Senang berkenalan denganmu, ${name} 🧡`,
    toast_export_empty: '⚠️ Tidak ada data untuk diekspor.',
    toast_export_done: n => `📤 Diekspor ${n} transaksi.`,
    toast_import_done: (n, skip) => `📥 Import berhasil: ${n} transaksi ditambahkan.${skip ? ` (${skip} dilewati)` : ''}`,
    toast_import_fail: msg => `❌ Gagal import: ${msg}`,
    toast_clear_empty: 'Tidak ada data untuk dihapus.',
    toast_clear_confirm: 'Hapus SEMUA transaksi? Tindakan ini tidak bisa dibatalkan.',
    toast_cleared: '🗑️ Semua transaksi dihapus.',
    err_date: 'Tanggal wajib diisi.',
    err_category: 'Pilih kategori terlebih dahulu.',
    err_amount: 'Jumlah harus lebih dari 0.',
    reset_confirm: 'Reset Montra?\n\nIni akan menghapus semua transaksi, nama, dan pengaturan kamu.',
    name_alert: 'Masukkan nama kamu terlebih dahulu.',
    greeting_hello: name => (name ? `Hai, ${name}! 👋` : 'Hai! 👋'),
    greeting_has_tx: 'Semangat terus catat keuanganmu, sedikit demi sedikit ✨',
    greeting_no_tx: 'Belum ada transaksi. Yuk mulai catat hari ini! 🚀',
  },
  en: {
    tagline: 'Personal Finance',
    nav_dashboard: 'Dashboard',
    nav_transactions: 'Transaction List',
    nav_add: 'Add',
    import: 'Import',
    export: 'Export',
    settings: '⚙️ Settings',
    your_name: 'Your Name',
    name_placeholder: 'Enter your name',
    save: 'Save',
    language: 'Language',
    reset_all: '🗑️ Reset All Data',
    idr_summary: 'Main Summary (IDR)',
    other_currencies: 'Other Currencies',
    chart_category: '🏷️ Category',
    chart_category_sub: 'Expenses',
    chart_monthly: '📈 Monthly',
    chart_monthly_sub: 'Income vs Expense',
    chart_empty: 'No data yet',
    category_breakdown_title: '🏷️ Spending by Category',
    category_empty: 'No expenses yet.',
    add_tx_title: '➕ Add Transaction',
    date: 'Date',
    type: 'Type',
    income_btn: '↑ Income',
    expense_btn: '↓ Expense',
    category: 'Category',
    choose: 'Choose…',
    currency: 'Currency',
    amount: 'Amount',
    desc: 'Description',
    desc_optional: '(optional)',
    desc_placeholder: 'E.g. June salary…',
    submit_save: 'Save',
    submit_update: 'Update',
    cancel: 'Cancel',
    history_title: '🧾 Transaction History',
    search_placeholder: '🔍 Search…',
    filter_all_type: 'All Types',
    filter_all_currency: 'All Currencies',
    clear_all: 'Clear All',
    th_date: 'Date',
    th_type: 'Type',
    th_category: 'Category',
    th_desc: 'Description',
    th_amount: 'Amount',
    tx_empty: 'No transactions yet. Start tracking! 🎉',
    modal_title: 'Delete Transaction?',
    modal_sub: 'This action cannot be undone.',
    modal_cancel: 'Cancel',
    modal_confirm: 'Delete',
    welcome_title: 'Welcome',
    welcome_sub: 'No transactions yet',
    welcome_desc: 'Start tracking your income or expenses!',
    net_balance: 'Net Balance',
    net_balance_sub: 'Income − Expense',
    total_income: 'Income',
    total_income_sub: 'Total In',
    total_expense: 'Expense',
    total_expense_sub: 'Total Out',
    toast_saved: '✅ Transaction saved!',
    toast_updated: '✏️ Transaction updated!',
    toast_deleted: '🗑️ Transaction deleted.',
    toast_name_saved: name => `Nice to meet you, ${name} 🧡`,
    toast_export_empty: '⚠️ No data to export.',
    toast_export_done: n => `📤 Exported ${n} transactions.`,
    toast_import_done: (n, skip) => `📥 Import successful: ${n} transactions added.${skip ? ` (${skip} skipped)` : ''}`,
    toast_import_fail: msg => `❌ Import failed: ${msg}`,
    toast_clear_empty: 'No data to clear.',
    toast_clear_confirm: 'Delete ALL transactions? This cannot be undone.',
    toast_cleared: '🗑️ All transactions deleted.',
    err_date: 'Date is required.',
    err_category: 'Please choose a category.',
    err_amount: 'Amount must be greater than 0.',
    reset_confirm: 'Reset Montra?\n\nThis will delete all transactions, your name, and settings.',
    name_alert: 'Please enter your name first.',
    greeting_hello: name => (name ? `Hi, ${name}! 👋` : 'Hi there! 👋'),
    greeting_has_tx: 'Keep tracking your money, step by step ✨',
    greeting_no_tx: 'No transactions yet. Start today! 🚀',
  },
};

function t(key, ...args) {
  const dict = I18N[settings.language] || I18N.id;
  const val = dict[key] ?? I18N.id[key] ?? key;
  return typeof val === 'function' ? val(...args) : val;
}

function categoryLabel(catId) {
  const all = [...CATEGORIES.income, ...CATEGORIES.expense];
  const found = all.find(c => c.id === catId);
  if (!found) return catId;
  return settings.language === 'en' ? found.en : found.id;
}

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
let transactions = [];
let editingId     = null;
let pendingDelId  = null;
let settings      = { userName: '', language: 'id' };

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
    const formatted = Math.abs(num)
      .toFixed(0)
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${cfg.symbol}${formatted}`;
  }

  const formatted = new Intl.NumberFormat(cfg.locale, {
    minimumFractionDigits: cfg.fractionDigits,
    maximumFractionDigits: cfg.fractionDigits,
  }).format(Math.abs(num));

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
  const [y, m] = dateStr.split('-');
  const namesId = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const namesEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const names = settings.language === 'en' ? namesEn : namesId;
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

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) settings = { ...settings, ...JSON.parse(raw) };
  } catch {
    settings = { userName: '', language: 'id' };
  }
}

// ═══════════════════════════════════════════════════════════════
// I18N APPLICATION
// ═══════════════════════════════════════════════════════════════
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  document.title = settings.language === 'en'
    ? 'Montra – Personal Finance Tracker'
    : 'Montra – Pencatat Transaksi Pribadi';

  document.getElementById('langID')?.classList.toggle('active', settings.language === 'id');
  document.getElementById('langEN')?.classList.toggle('active', settings.language === 'en');

  const btnSubmit = document.getElementById('btnSubmit');
  if (btnSubmit) {
    btnSubmit.textContent = editingId ? t('submit_update') : t('submit_save');
  }

  populateCategories(document.getElementById('fCategory')?.value || '');
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
  sel.innerHTML = `<option value="">${t('choose')}</option>` +
    list.map(c => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${categoryLabel(c.id)}</option>`).join('');
}

function updateCurrencyPrefix() {
  const code = document.getElementById('fCurrency').value;
  const cfg  = CURRENCIES[code] || CURRENCIES.IDR;
  document.getElementById('currencyPrefix').textContent = cfg.symbol;
}

// ── Amount input: formatted display, raw numeric stored separately ──

function parseAmountInput(val) {
  if (!val) return 0;
  const s = String(val).trim();
  const lastDot   = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  let normalised;
  if (lastComma > lastDot) {
    normalised = s.replace(/\./g, '').replace(',', '.');
  } else {
    normalised = s.replace(/\./g, '').replace(/,/g, '');
  }
  return parseFloat(normalised) || 0;
}

function formatAmountInput(num, currencyCode) {
  if (!num || isNaN(num) || num <= 0) return '';
  const cfg = CURRENCIES[currencyCode] || CURRENCIES.IDR;

  if (cfg.fractionDigits === 0) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  const fixed   = num.toFixed(cfg.fractionDigits);
  const [intPart, fracPart] = fixed.split('.');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intFormatted},${fracPart}`;
}

function handleAmountInput(e) {
  const input = e.target;
  const selStart = input.selectionStart;
  const before   = input.value;

  let cleaned = before.replace(/[^\d.,]/g, '');

  const raw  = parseAmountInput(cleaned);
  const code = document.getElementById('fCurrency').value;
  const cfg  = CURRENCIES[code] || CURRENCIES.IDR;

  if (raw > 0) {
    if (cfg.fractionDigits === 0) {
      cleaned = Math.round(raw).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    } else {
      const hasTrailingComma = cleaned.endsWith(',') || cleaned.includes(',');
      if (hasTrailingComma) {
        const commaIdx = cleaned.lastIndexOf(',');
        const intRaw   = cleaned.slice(0, commaIdx).replace(/\./g, '');
        const fracRaw  = cleaned.slice(commaIdx + 1);
        const intFmt   = parseInt(intRaw || '0', 10).toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        cleaned = `${intFmt},${fracRaw}`;
      } else {
        const intFmt = Math.round(raw).toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        cleaned = intFmt;
      }
    }
  }

  if (input.value !== cleaned) {
    input.value = cleaned;
    const diff = cleaned.length - before.length;
    try { input.setSelectionRange(selStart + diff, selStart + diff); } catch (_) {}
  }
}

function handleAmountBlur(e) {
  const input = e.target;
  const raw   = parseAmountInput(input.value);
  const code  = document.getElementById('fCurrency').value;
  input.value = raw > 0 ? formatAmountInput(raw, code) : '';
}

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
  document.getElementById('btnSubmit').textContent = t('submit_save');
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
  showToast(t('toast_saved'));
}

function updateTransaction(id, data) {
  const idx = transactions.findIndex(t => t.id === id);
  if (idx === -1) return;
  transactions[idx] = { ...transactions[idx], ...data };
  saveData();
  renderAll();
  showToast(t('toast_updated'));
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  renderAll();
  showToast(t('toast_deleted'));
}

// ═══════════════════════════════════════════════════════════════
// RENDER – GREETING
// ═══════════════════════════════════════════════════════════════
function renderGreeting() {
  const helloEl = document.getElementById('greetingHello');
  const subEl   = document.getElementById('greetingSub');
  const dateEl  = document.getElementById('dashDate');
  if (!helloEl || !subEl) return;

  helloEl.textContent = t('greeting_hello', settings.userName?.trim() || '');
  subEl.textContent = transactions.length > 0 ? t('greeting_has_tx') : t('greeting_no_tx');

  if (dateEl) {
    const locale = settings.language === 'en' ? 'en-US' : 'id-ID';
    dateEl.textContent = new Date().toLocaleDateString(locale, {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// RENDER – SUMMARY CARDS (dashboard)
// ═══════════════════════════════════════════════════════════════
const CURRENCY_FLAGS = {
  IDR: '🇮🇩', USD: '🇺🇸', GBP: '🇬🇧',
  EUR: '🇪🇺', SGD: '🇸🇬', JPY: '🇯🇵', KRW: '🇰🇷',
};

function renderSummary() {
  const totals = {};
  for (const t of transactions) {
    if (!totals[t.currency]) totals[t.currency] = { income: 0, expense: 0 };
    totals[t.currency][t.type] += Number(t.amount);
  }

  const idrEl     = document.getElementById('summarySection');
  const idrTotals = totals['IDR'] || { income: 0, expense: 0 };
  const idrNet    = idrTotals.income - idrTotals.expense;

  if (Object.keys(totals).length === 0) {
    idrEl.innerHTML = `
      <div class="idr-card" style="background:#FFE8D1;grid-column:1/-1">
        <span class="ic-icon">👋</span>
        <span class="ic-label">${t('welcome_title')}</span>
        <span class="ic-value" style="font-size:0.95rem;color:#57606a">${t('welcome_sub')}</span>
        <span class="ic-sub">${t('welcome_desc')}</span>
      </div>`;
    document.getElementById('foreignSection').classList.add('hidden');
    return;
  }

  idrEl.innerHTML = `
    <div class="idr-card" style="background:${idrNet >= 0 ? '#D6F5E3' : '#FFE0E0'}">
      <span class="ic-icon">💳</span>
      <span class="ic-label" style="color:${idrNet >= 0 ? '#2E7D52' : '#C0392B'}">${t('net_balance')}</span>
      <span class="ic-value" style="color:${idrNet >= 0 ? '#2E7D52' : '#C0392B'}">${formatAmount(idrNet, 'IDR')}</span>
      <span class="ic-sub">${t('net_balance_sub')}</span>
    </div>
    <div class="idr-card" style="background:#D6F5E3">
      <span class="ic-icon">📈</span>
      <span class="ic-label" style="color:#2E7D52">${t('total_income')}</span>
      <span class="ic-value" style="color:#2E7D52">${formatAmount(idrTotals.income, 'IDR')}</span>
      <span class="ic-sub">${t('total_income_sub')}</span>
    </div>
    <div class="idr-card" style="background:#FFE0E0">
      <span class="ic-icon">📉</span>
      <span class="ic-label" style="color:#C0392B">${t('total_expense')}</span>
      <span class="ic-value" style="color:#C0392B">${formatAmount(idrTotals.expense, 'IDR')}</span>
      <span class="ic-sub">${t('total_expense_sub')}</span>
    </div>`;

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
  const search    = document.getElementById('searchInput').value.toLowerCase().trim();
  const typeF     = document.getElementById('filterType').value;
  const currencyF = document.getElementById('filterCurrency').value;

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

  const sorted = [...filtered].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  tbody.innerHTML = sorted.map(tx => {
    const typeLabel  = tx.type === 'income' ? t('income_btn') : t('expense_btn');
    const typeBadge  = `badge badge-${tx.type}`;
    const amtClass   = `amount-${tx.type}`;
    const sign       = tx.type === 'income' ? '+' : '−';
    const amt        = formatAmount(tx.amount, tx.currency);
    const desc       = tx.description ? escHtml(tx.description) : '<span class="text-gray-300">—</span>';
    const dateDisp   = formatDateDisplay(tx.date);

    return `
      <tr data-id="${tx.id}">
        <td class="whitespace-nowrap text-xs text-gray-500">${dateDisp}</td>
        <td><span class="${typeBadge}">${typeLabel}</span></td>
        <td><span class="category-pill">${escHtml(categoryLabel(tx.category))}</span></td>
        <td class="text-xs max-w-[160px] truncate">${desc}</td>
        <td class="text-right ${amtClass} whitespace-nowrap">${sign} ${amt}</td>
        <td class="text-right whitespace-nowrap">
          <button class="btn-edit" data-id="${tx.id}" title="Edit">✏️</button>
          <button class="btn-del"  data-id="${tx.id}" title="Delete">🗑️</button>
        </td>
      </tr>`;
  }).join('');
}

function formatDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const monthsId = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const monthsEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const months = settings.language === 'en' ? monthsEn : monthsId;
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

  const expenses = transactions.filter(t => t.type === 'expense');
  if (expenses.length === 0) {
    el.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  const groups = {};
  for (const t of expenses) {
    const key = `${t.category}|${t.currency}`;
    groups[key] = (groups[key] || 0) + Number(t.amount);
  }

  const entries = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  const max     = entries[0]?.[1] || 1;

  el.innerHTML = entries.map(([key, total], i) => {
    const [cat, cur] = key.split('|');
    const pct = Math.round((total / max) * 100);
    const color = CAT_COLORS[i % CAT_COLORS.length];
    return `
      <div class="cat-card">
        <span class="text-lg">${categoryEmoji(cat)}</span>
        <span class="cat-name">${escHtml(categoryLabel(cat))}</span>
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
  const labels  = entries.map(([k]) => categoryLabel(k));
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
        { label: `${t('income_btn').replace('↑ ', '')}${note}`, data: sortedMonths.map(ym => monthMap[ym].income),  backgroundColor: '#4CAF7D', borderRadius: 5, borderSkipped: false },
        { label: `${t('expense_btn').replace('↓ ', '')}${note}`, data: sortedMonths.map(ym => monthMap[ym].expense), backgroundColor: '#FF6B6B', borderRadius: 5, borderSkipped: false },
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

function renderChart() {
  renderDashboardCharts();
}

// ═══════════════════════════════════════════════════════════════
// RENDER – ALL
// ═══════════════════════════════════════════════════════════════
function renderAll() {
  renderGreeting();
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

  const date      = document.getElementById('fDate').value.trim();
  const category  = document.getElementById('fCategory').value.trim();
  const currency  = document.getElementById('fCurrency').value;
  const amountRaw = document.getElementById('fAmount').value.trim();
  const desc      = document.getElementById('fDesc').value.trim();

  if (!date) return showFormError(t('err_date'));
  if (!category) return showFormError(t('err_category'));
  const amount = parseAmountInput(amountRaw);
  if (!amount || amount <= 0) return showFormError(t('err_amount'));

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
  document.getElementById('fAmount').value   = formatAmountInput(t.amount, t.currency);
  document.getElementById('fDesc').value     = t.description || '';
  setType(t.type);
  populateCategories(t.category);
  updateCurrencyPrefix();

  document.getElementById('btnSubmit').textContent = I18N[settings.language]?.submit_update || I18N.id.submit_update;
  document.getElementById('btnCancel').classList.remove('hidden');

  document.getElementById('txForm').closest('.card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ═══════════════════════════════════════════════════════════════
// CSV EXPORT
// ═══════════════════════════════════════════════════════════════
function exportCSV() {
  if (transactions.length === 0) {
    showToast(t('toast_export_empty'));
    return;
  }
  const headers = ['id', 'date', 'type', 'category', 'currency', 'amount', 'description'];
  const rows = transactions.map(tx =>
    headers.map(h => {
      const val = tx[h] === undefined ? '' : String(tx[h]);
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
  showToast(t('toast_export_done', transactions.length));
}

// ═══════════════════════════════════════════════════════════════
// CSV IMPORT
// ═══════════════════════════════════════════════════════════════
function importCSV(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      let text = e.target.result;
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) throw new Error('Empty CSV file.');

      const headers = parseCSVLine(lines[0]);
      const required = ['date', 'type', 'category', 'currency', 'amount'];
      for (const r of required) {
        if (!headers.includes(r)) throw new Error(`Column "${r}" not found.`);
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

      const existingIds = new Set(transactions.map(t => t.id));
      const unique = newTx.filter(t => !existingIds.has(t.id));
      transactions = [...unique, ...transactions];
      saveData();
      renderAll();
      showToast(t('toast_import_done', unique.length, skipped), 3500);
    } catch (err) {
      showToast(t('toast_import_fail', err.message), 4000);
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
// SIDEBAR DRAWER (mobile)
// ═══════════════════════════════════════════════════════════════
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS EVENTS
// ═══════════════════════════════════════════════════════════════
function initSettingsEvents() {
  const userNameInput = document.getElementById('userName');
  const saveNameBtn    = document.getElementById('saveName');
  const resetBtn       = document.getElementById('resetData');
  const langID         = document.getElementById('langID');
  const langEN         = document.getElementById('langEN');

  if (userNameInput) userNameInput.value = settings.userName || '';

  if (saveNameBtn) {
    saveNameBtn.addEventListener('click', () => {
      const name = userNameInput.value.trim();
      if (!name) {
        alert(t('name_alert'));
        return;
      }
      settings.userName = name;
      saveSettings();
      renderGreeting();
      showToast(t('toast_name_saved', name));
    });
  }

  if (langID) langID.addEventListener('click', () => setLanguage('id'));
  if (langEN) langEN.addEventListener('click', () => setLanguage('en'));

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const confirmed = confirm(t('reset_confirm'));
      if (!confirmed) return;
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SETTINGS_KEY);
      location.reload();
    });
  }
}

function setLanguage(lang) {
  if (settings.language === lang) return;
  settings.language = lang;
  saveSettings();
  applyTranslations();
  renderAll();
}

// ═══════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════
function initEvents() {
  document.getElementById('txForm').addEventListener('submit', handleFormSubmit);

  document.getElementById('typeIncome').addEventListener('click', () => setType('income'));
  document.getElementById('typeExpense').addEventListener('click', () => setType('expense'));

  document.getElementById('fCurrency').addEventListener('change', handleCurrencyChangeAmount);

  document.getElementById('fAmount').addEventListener('input', handleAmountInput);
  document.getElementById('fAmount').addEventListener('blur',  handleAmountBlur);

  document.getElementById('btnCancel').addEventListener('click', resetForm);

  document.getElementById('txTableBody').addEventListener('click', e => {
    const editBtn = e.target.closest('.btn-edit');
    const delBtn  = e.target.closest('.btn-del');
    if (editBtn) startEdit(editBtn.dataset.id);
    if (delBtn)  openModal(delBtn.dataset.id);
  });

  document.getElementById('searchInput').addEventListener('input', renderTable);
  document.getElementById('filterType').addEventListener('change', renderTable);
  document.getElementById('filterCurrency').addEventListener('change', renderTable);

  document.getElementById('btnClearAll').addEventListener('click', () => {
    if (transactions.length === 0) { showToast(t('toast_clear_empty')); return; }
    if (confirm(t('toast_clear_confirm'))) {
      transactions = [];
      saveData();
      renderAll();
      showToast(t('toast_cleared'));
    }
  });

  document.getElementById('btnExport').addEventListener('click', exportCSV);

  document.getElementById('btnImport').addEventListener('click', () => {
    document.getElementById('importFile').value = '';
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', e => {
    if (e.target.files[0]) importCSV(e.target.files[0]);
  });

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

  // Sidebar drawer
  document.getElementById('btnHamburger').addEventListener('click', openSidebar);
  document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });

  // Close drawer + highlight active link when a nav item is tapped
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      closeSidebar();
    });
  });

  initSettingsEvents();
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
function init() {
  loadSettings();
  loadData();
  initEvents();
  applyTranslations();

  document.getElementById('fDate').value = today();

  setType('expense');
  updateCurrencyPrefix();

  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
