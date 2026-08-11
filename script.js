/* ── Montra – script.js ── */
'use strict';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const STORAGE_KEY      = 'montra_transactions';
const SETTINGS_KEY     = 'montra_settings';
const PEOPLE_KEY       = 'montra_people';
const SPLITBILLS_KEY   = 'montra_splitbills';
const SETTLEMENTS_KEY  = 'montra_settlements';

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
  '#2EC4B6', '#FF6FA0', '#5EEAD4', '#F472B6', '#0F9488',
  '#FDA4AF', '#34D399', '#C084FC', '#60A5FA', '#FBBF24',
  '#A78BFA', '#94A3B8',
];

// ═══════════════════════════════════════════════════════════════
// I18N
// ═══════════════════════════════════════════════════════════════
const I18N = {
  id: {
    tagline: 'Keuangan Pribadi',
    nav_dashboard: 'Dashboard',
    nav_transactions: 'Riwayat Transaksi',
    nav_splitbill: 'Split Bill',
    nav_add: 'Tambah',
    import: 'Import',
    export: 'Export',
    settings: 'Pengaturan',
    your_name: 'Nama Kamu',
    name_placeholder: 'Masukkan nama',
    save: 'Simpan',
    language: 'Bahasa',
    reset_all: '🗑️ Hapus Semua Data',
    idr_summary: 'Ringkasan Utama (IDR)',
    other_currencies: 'Mata Uang Lain',
    chart_category: 'Kategori',
    chart_category_sub: 'Pengeluaran',
    chart_monthly: 'Bulanan',
    chart_monthly_sub: 'Pemasukan vs Pengeluaran',
    chart_empty: 'Belum ada data',
    category_breakdown_title: 'Pengeluaran per Kategori',
    category_empty: 'Belum ada pengeluaran.',
    add_tx_title: 'Tambah Transaksi',
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
    history_title: 'Riwayat Transaksi',
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

    // ── Split Bill ──
    people_title: 'Teman',
    people_sub: 'Tambahkan orang yang biasa split bill sama kamu',
    person_placeholder: 'Nama teman…',
    add: 'Tambah',
    people_empty: 'Belum ada teman. Tambahkan dulu ya!',
    person_delete_confirm: name => `Hapus "${name}" dari daftar teman?`,
    person_name_alert: 'Masukkan nama teman terlebih dahulu.',
    person_exists_alert: 'Nama itu sudah ada di daftar teman.',
    add_bill_title: 'Tambah Split Bill',
    bill_title_label: 'Judul',
    bill_title_placeholder: 'Mis. Makan malam di…',
    paid_by: 'Dibayar Oleh',
    subtotal_label: 'Subtotal (sebelum pajak)',
    subtotal_short: 'Subtotal',
    tax_label: 'Pajak / PPN (%)',
    tax_short: 'Pajak',
    service_label: 'Service Charge (%)',
    service_short: 'Service',
    total_label: 'Total',
    split_mode_label: 'Metode Split',
    split_equal: 'Rata',
    split_custom: 'Custom',
    participants_label: 'Peserta / Split Ke',
    participants_empty: 'Tambahkan teman terlebih dahulu di atas.',
    custom_sum_hint: (sum, total, currency) => `Total custom: ${formatAmount(sum, currency)} — Saran total: ${formatAmount(total, currency)}`,
    bill_list_title: 'Daftar Split Bill',
    bills_empty: 'Belum ada split bill.',
    settle_title: 'Ringkasan & Pelunasan',
    settle_sub: 'Gabungan saldo dari semua split bill di atas',
    settle_empty: 'Semua sudah lunas! 🎉',
    settle_pay_btn: '✅ Sudah Bayar',
    settle_arrow_label: name => `bayar ke ${name}`,
    err_bill_paidby: 'Pilih siapa yang bayar.',
    err_bill_subtotal: 'Subtotal harus lebih dari 0.',
    err_bill_participants: 'Pilih minimal 1 peserta.',
    err_bill_custom_sum: 'Isi nominal untuk setiap peserta yang dipilih.',
    toast_bill_saved: '✅ Split bill berhasil disimpan!',
    toast_bill_updated: '✏️ Split bill berhasil diperbarui!',
    toast_bill_deleted: '🗑️ Split bill dihapus.',
    toast_settled: '✅ Pelunasan dicatat!',
    bill_delete_confirm: 'Hapus split bill ini? Tindakan ini tidak bisa dibatalkan.',
    paid_by_pill: name => `💰 ${name} bayar`,
    nav_lunas: 'Riwayat Lunas',
    lunas_title: 'Riwayat Split Bill Lunas',
    lunas_sub: 'Split bill yang sudah ditandai lunas, dipindah ke sini biar daftar utama tetap ringkas',
    lunas_empty: 'Belum ada split bill yang ditandai lunas.',
    mark_lunas_btn: '✅ Tandai Lunas',
    unmark_lunas_btn: '↩️ Batalkan',
    bill_lunas_pill: 'Lunas',
    toast_bill_settled: '✅ Split bill ditandai lunas & dipindah ke Riwayat Lunas.',
    toast_bill_unsettled: '↩️ Split bill dikembalikan ke daftar aktif.',
    self_tag: '(Kamu)',
    self_delete_blocked_alert: 'Ini adalah kamu sendiri (nama diambil dari Pengaturan). Untuk mengubahnya, edit "Nama Kamu" di Pengaturan.',
    filter_month: 'Bulan',
    filter_or: 'atau',
    filter_from: 'Dari',
    filter_to: 'Sampai',
    show_all_months: 'Semua Waktu',
    export_filtered_btn: '📤 Export Hasil Ini',
    toast_export_filtered_empty: '⚠️ Tidak ada transaksi pada rentang ini untuk diekspor.',
    settlement_history_title: 'Riwayat Pelunasan',
    settlement_history_sub: 'Semua yang sudah ditandai "Sudah Bayar" — hapus di sini kalau ada yang salah tandai',
    settlement_history_empty: 'Belum ada riwayat pelunasan.',
    settlement_delete_confirm: 'Hapus catatan pelunasan ini? Saldo terkait akan muncul lagi di Ringkasan & Pelunasan.',
    toast_settlement_deleted: '🗑️ Riwayat pelunasan dihapus, saldo diperbarui.',
    export_modal_title: 'Export Transaksi',
    export_modal_sub: 'Pilih data yang mau diekspor ke CSV.',
    export_scope_all: 'Semua Data',
    export_scope_month: 'Pilih Bulan',
    export_scope_range: 'Rentang Tanggal',
    export_confirm_btn: '📤 Export',
    export_scope_month_alert: 'Pilih bulan terlebih dahulu.',
    export_scope_range_alert: 'Isi minimal salah satu tanggal (Dari / Sampai).',
  },
  en: {
    tagline: 'Personal Finance',
    nav_dashboard: 'Dashboard',
    nav_transactions: 'Transaction History',
    nav_splitbill: 'Split Bill',
    nav_add: 'Add',
    import: 'Import',
    export: 'Export',
    settings: 'Settings',
    your_name: 'Your Name',
    name_placeholder: 'Enter your name',
    save: 'Save',
    language: 'Language',
    reset_all: '🗑️ Reset All Data',
    idr_summary: 'Main Summary (IDR)',
    other_currencies: 'Other Currencies',
    chart_category: 'Category',
    chart_category_sub: 'Expenses',
    chart_monthly: 'Monthly',
    chart_monthly_sub: 'Income vs Expense',
    chart_empty: 'No data yet',
    category_breakdown_title: 'Spending by Category',
    category_empty: 'No expenses yet.',
    add_tx_title: 'Add Transaction',
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
    history_title: 'Transaction History',
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

    // ── Split Bill ──
    people_title: 'Friends',
    people_sub: 'Add people you usually split bills with',
    person_placeholder: 'Friend\'s name…',
    add: 'Add',
    people_empty: 'No friends yet. Add one first!',
    person_delete_confirm: name => `Remove "${name}" from your friends list?`,
    person_name_alert: 'Please enter a name first.',
    person_exists_alert: 'That name is already in your friends list.',
    add_bill_title: 'Add Split Bill',
    bill_title_label: 'Title',
    bill_title_placeholder: 'E.g. Dinner at…',
    paid_by: 'Paid By',
    subtotal_label: 'Subtotal (before tax)',
    subtotal_short: 'Subtotal',
    tax_label: 'Tax / VAT (%)',
    tax_short: 'Tax',
    service_label: 'Service Charge (%)',
    service_short: 'Service',
    total_label: 'Total',
    split_mode_label: 'Split Method',
    split_equal: 'Equal',
    split_custom: 'Custom',
    participants_label: 'Participants / Split With',
    participants_empty: 'Add friends first, above.',
    custom_sum_hint: (sum, total, currency) => `Custom total: ${formatAmount(sum, currency)} — Suggested total: ${formatAmount(total, currency)}`,
    bill_list_title: 'Split Bill List',
    bills_empty: 'No split bills yet.',
    settle_title: 'Summary & Settle Up',
    settle_sub: 'Combined balance across all split bills above',
    settle_empty: 'All settled up! 🎉',
    settle_pay_btn: '✅ Mark Paid',
    settle_arrow_label: name => `pays ${name}`,
    err_bill_paidby: 'Please choose who paid.',
    err_bill_subtotal: 'Subtotal must be greater than 0.',
    err_bill_participants: 'Choose at least 1 participant.',
    err_bill_custom_sum: 'Enter an amount for every selected participant.',
    toast_bill_saved: '✅ Split bill saved!',
    toast_bill_updated: '✏️ Split bill updated!',
    toast_bill_deleted: '🗑️ Split bill deleted.',
    toast_settled: '✅ Payment recorded!',
    bill_delete_confirm: 'Delete this split bill? This cannot be undone.',
    paid_by_pill: name => `💰 ${name} paid`,
    nav_lunas: 'Settled History',
    lunas_title: 'Settled Split Bills',
    lunas_sub: 'Split bills marked as settled are moved here to keep the main list short',
    lunas_empty: 'No settled split bills yet.',
    mark_lunas_btn: '✅ Mark Settled',
    unmark_lunas_btn: '↩️ Undo',
    bill_lunas_pill: 'Settled',
    toast_bill_settled: '✅ Split bill marked settled & moved to Settled History.',
    toast_bill_unsettled: '↩️ Split bill moved back to the active list.',
    self_tag: '(You)',
    self_delete_blocked_alert: 'This is you (name taken from Settings). To change it, edit "Your Name" in Settings.',
    filter_month: 'Month',
    filter_or: 'or',
    filter_from: 'From',
    filter_to: 'To',
    show_all_months: 'All Time',
    export_filtered_btn: '📤 Export This View',
    toast_export_filtered_empty: '⚠️ No transactions in this range to export.',
    settlement_history_title: 'Settlement History',
    settlement_history_sub: 'Everything marked "Paid" — delete here if something was marked by mistake',
    settlement_history_empty: 'No settlement history yet.',
    settlement_delete_confirm: 'Delete this settlement record? The related balance will reappear in Summary & Settle Up.',
    toast_settlement_deleted: '🗑️ Settlement record deleted, balances updated.',
    export_modal_title: 'Export Transactions',
    export_modal_sub: 'Choose what to export to CSV.',
    export_scope_all: 'All Data',
    export_scope_month: 'Choose Month',
    export_scope_range: 'Date Range',
    export_confirm_btn: '📤 Export',
    export_scope_month_alert: 'Please choose a month first.',
    export_scope_range_alert: 'Fill in at least one date (From / To).',
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
let settings      = { userName: '', language: 'id', selfPersonId: null };

// Split bill state
let people        = [];   // [{ id, name }]
let splitBills    = [];   // [{ id, title, date, currency, paidBy, subtotal, taxPct, servicePct,
                           //    taxAmt, serviceAmt, total, splitMode, participantIds, customShares, createdAt }]
let settlements   = [];   // [{ id, fromId, toId, amount, currency, date, createdAt }]
let editingBillId = null;
let billSplitMode = 'equal'; // 'equal' | 'custom'

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

function savePeople() {
  localStorage.setItem(PEOPLE_KEY, JSON.stringify(people));
}
function loadPeople() {
  try {
    const raw = localStorage.getItem(PEOPLE_KEY);
    people = raw ? JSON.parse(raw) : [];
  } catch {
    people = [];
  }
}

function saveSplitBills() {
  localStorage.setItem(SPLITBILLS_KEY, JSON.stringify(splitBills));
}
function loadSplitBills() {
  try {
    const raw = localStorage.getItem(SPLITBILLS_KEY);
    splitBills = raw ? JSON.parse(raw) : [];
  } catch {
    splitBills = [];
  }
}

function saveSettlements() {
  localStorage.setItem(SETTLEMENTS_KEY, JSON.stringify(settlements));
}
function loadSettlements() {
  try {
    const raw = localStorage.getItem(SETTLEMENTS_KEY);
    settlements = raw ? JSON.parse(raw) : [];
  } catch {
    settlements = [];
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

  const btnBillSubmit = document.getElementById('btnBillSubmit');
  if (btnBillSubmit) {
    btnBillSubmit.textContent = editingBillId ? t('submit_update') : t('submit_save');
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

// Generic live-formatting handler for a text amount input tied to a currency <select>.
function handleAmountInputGeneric(e, currencySelectId) {
  const input = e.target;
  const selStart = input.selectionStart;
  const before   = input.value;

  let cleaned = before.replace(/[^\d.,]/g, '');

  const raw  = parseAmountInput(cleaned);
  const code = document.getElementById(currencySelectId).value;
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

function handleAmountBlurGeneric(e, currencySelectId) {
  const input = e.target;
  const raw   = parseAmountInput(input.value);
  const code  = document.getElementById(currencySelectId).value;
  input.value = raw > 0 ? formatAmountInput(raw, code) : '';
}

function handleAmountInput(e) { handleAmountInputGeneric(e, 'fCurrency'); }
function handleAmountBlur(e) { handleAmountBlurGeneric(e, 'fCurrency'); }

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
      <div class="idr-card" style="background:#D9F7EF;grid-column:1/-1">
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
  const month     = document.getElementById('filterMonth')?.value || '';
  const fromDate  = document.getElementById('filterFrom')?.value || '';
  const toDate    = document.getElementById('filterTo')?.value || '';
  const useRange  = !!(fromDate || toDate);

  return transactions.filter(t => {
    if (typeF     && t.type     !== typeF)     return false;
    if (currencyF && t.currency !== currencyF) return false;
    if (useRange) {
      if (fromDate && t.date < fromDate) return false;
      if (toDate   && t.date > toDate)   return false;
    } else if (month && !t.date.startsWith(month)) {
      return false;
    }
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
  renderSplitBill();
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
function exportCSV(list = null, opts = {}) {
  const rowsSource = list || transactions;
  if (rowsSource.length === 0) {
    showToast(opts.emptyMsg || t('toast_export_empty'));
    return;
  }
  const headers = ['id', 'date', 'type', 'category', 'currency', 'amount', 'description'];
  const rows = rowsSource.map(tx =>
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
  a.download = `montra_${opts.filenameSuffix || today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(t('toast_export_done', rowsSource.length));
}

function exportFilteredCSV() {
  const filtered = getFilteredTransactions();
  const month    = document.getElementById('filterMonth')?.value || '';
  const fromDate = document.getElementById('filterFrom')?.value || '';
  const toDate   = document.getElementById('filterTo')?.value || '';
  let suffix = today();
  if (fromDate || toDate) suffix = `${fromDate || 'awal'}_sd_${toDate || 'akhir'}`;
  else if (month) suffix = month;
  exportCSV(filtered, { emptyMsg: t('toast_export_filtered_empty'), filenameSuffix: suffix });
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
// SPLIT BILL – people (friends)
// ═══════════════════════════════════════════════════════════════
function personName(pid) {
  const p = people.find(p => p.id === pid);
  return p ? p.name : (settings.language === 'en' ? '(removed)' : '(dihapus)');
}

function personInitials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function personColor(pid) {
  let hash = 0;
  const s = String(pid);
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return CAT_COLORS[Math.abs(hash) % CAT_COLORS.length];
}

// Keep a "self" person in sync with the name set in Pengaturan/Settings,
// so the user never has to add themselves manually to the Split Bill friends list.
function syncSelfPerson() {
  const name = (settings.userName || '').trim();
  if (!name) return;

  if (settings.selfPersonId) {
    const existingSelf = people.find(p => p.id === settings.selfPersonId);
    if (existingSelf) {
      if (existingSelf.name !== name) {
        existingSelf.name = name;
        savePeople();
      }
      return;
    }
  }

  // No self person yet (first time, or it was somehow removed) — reuse a
  // matching name if one already exists, otherwise create a new one.
  const match = people.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (match) {
    match.isSelf = true;
    settings.selfPersonId = match.id;
    savePeople();
  } else {
    const newPerson = { id: uid(), name, isSelf: true };
    people.push(newPerson);
    settings.selfPersonId = newPerson.id;
    savePeople();
  }
  saveSettings();
}

function addPerson(name) {
  const trimmed = name.trim();
  if (!trimmed) { alert(t('person_name_alert')); return false; }
  if (people.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
    alert(t('person_exists_alert'));
    return false;
  }
  people.push({ id: uid(), name: trimmed });
  savePeople();
  renderSplitBill();
  return true;
}

function deletePerson(id) {
  const p = people.find(p => p.id === id);
  if (!p) return;
  if (id === settings.selfPersonId) {
    alert(t('self_delete_blocked_alert'));
    return;
  }
  if (!confirm(t('person_delete_confirm', p.name))) return;
  people = people.filter(p => p.id !== id);
  savePeople();
  renderSplitBill();
}

function renderPeopleList() {
  const el    = document.getElementById('peopleList');
  const empty = document.getElementById('peopleEmpty');
  if (!el) return;

  if (people.length === 0) {
    el.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  el.innerHTML = people.map(p => {
    const isSelf = p.id === settings.selfPersonId;
    return `
    <span class="person-chip ${isSelf ? 'is-self' : ''}" data-id="${p.id}">
      <span class="avatar-chip" style="background:${personColor(p.id)}">${personInitials(p.name)}</span>
      ${escHtml(p.name)}
      ${isSelf ? `<span class="person-self-tag">${t('self_tag')}</span>` : `<button type="button" class="person-chip-del" data-id="${p.id}" title="Hapus">&times;</button>`}
    </span>`;
  }).join('');
}

function renderPaidBySelect() {
  const sel = document.getElementById('bPaidBy');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = `<option value="">${t('choose')}</option>` +
    people.map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join('');
  if (people.some(p => p.id === current)) sel.value = current;
}

// ═══════════════════════════════════════════════════════════════
// SPLIT BILL – form: totals + participants
// ═══════════════════════════════════════════════════════════════
function getBillFormTotals() {
  const subtotal   = parseAmountInput(document.getElementById('bSubtotal').value);
  const taxPct     = parseFloat(document.getElementById('bTaxPct').value) || 0;
  const servicePct = parseFloat(document.getElementById('bServicePct').value) || 0;
  const taxAmt     = subtotal * (taxPct / 100);
  const serviceAmt = subtotal * (servicePct / 100);
  const total      = subtotal + taxAmt + serviceAmt;
  return { subtotal, taxPct, servicePct, taxAmt, serviceAmt, total };
}

function updateBillTotalPreview() {
  const currency = document.getElementById('bCurrency').value;
  const { subtotal, taxAmt, serviceAmt, total } = getBillFormTotals();
  document.getElementById('bSubtotalPreview').textContent = formatAmount(subtotal, currency);
  document.getElementById('bTaxPreview').textContent      = formatAmount(taxAmt, currency);
  document.getElementById('bServicePreview').textContent  = formatAmount(serviceAmt, currency);
  document.getElementById('bTotalPreview').textContent    = formatAmount(total, currency);
  updateParticipantsPreview();
}

function setBillSplitMode(mode) {
  billSplitMode = mode;
  const eqBtn  = document.getElementById('splitEqual');
  const cusBtn = document.getElementById('splitCustom');
  eqBtn.classList.toggle('active-income', mode === 'equal');
  cusBtn.classList.toggle('active-expense', mode === 'custom');
  document.getElementById('participantsList').classList.toggle('mode-custom', mode === 'custom');
  updateParticipantsPreview();
}

function getCheckedParticipantIds() {
  return Array.from(document.querySelectorAll('#participantsList .participantChk:checked')).map(cb => cb.value);
}

function renderParticipantsList(preselectedIds = null, customValues = null) {
  const wrap  = document.getElementById('participantsList');
  const empty = document.getElementById('participantsEmpty');
  if (!wrap) return;

  if (people.length === 0) {
    wrap.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  const checkedSet = preselectedIds ? new Set(preselectedIds) : null;

  wrap.innerHTML = people.map(p => {
    const checked = checkedSet ? checkedSet.has(p.id) : true;
    const customVal = customValues && customValues[p.id] !== undefined
      ? formatAmountInput(customValues[p.id], document.getElementById('bCurrency').value)
      : '';
    return `
      <div class="participant-row ${checked ? '' : 'is-unchecked'}" data-person="${p.id}">
        <label class="participant-check">
          <input type="checkbox" class="participantChk" value="${p.id}" ${checked ? 'checked' : ''} />
          <span class="avatar-chip" style="background:${personColor(p.id)}">${personInitials(p.name)}</span>
          <span class="participant-name">${escHtml(p.name)}</span>
        </label>
        <span class="participant-share" data-person="${p.id}">—</span>
        <input type="text" class="form-input participant-custom-input" data-person="${p.id}"
               inputmode="decimal" autocomplete="off" placeholder="0" value="${customVal}" />
      </div>`;
  }).join('');

  wrap.classList.toggle('mode-custom', billSplitMode === 'custom');
  updateParticipantsPreview();
}

function updateParticipantsPreview() {
  const wrap = document.getElementById('participantsList');
  if (!wrap) return;
  const currency = document.getElementById('bCurrency').value;
  const { total } = getBillFormTotals();
  const checkedIds = getCheckedParticipantIds();

  wrap.querySelectorAll('.participant-row').forEach(row => {
    const pid = row.dataset.person;
    row.classList.toggle('is-unchecked', !checkedIds.includes(pid));
  });

  if (billSplitMode === 'equal') {
    const n = checkedIds.length || 1;
    const per = total / n;
    wrap.querySelectorAll('.participant-share').forEach(el => {
      const pid = el.dataset.person;
      el.textContent = checkedIds.includes(pid) ? formatAmount(per, currency) : '—';
    });
    document.getElementById('customSumHint').classList.add('hidden');
  } else {
    let sum = 0;
    wrap.querySelectorAll('.participant-custom-input').forEach(input => {
      const pid = input.dataset.person;
      if (checkedIds.includes(pid)) sum += parseAmountInput(input.value);
    });
    const hint = document.getElementById('customSumHint');
    hint.textContent = t('custom_sum_hint', sum, total, currency);
    hint.classList.remove('hidden');
  }
}

// ═══════════════════════════════════════════════════════════════
// SPLIT BILL – compute shares / CRUD
// ═══════════════════════════════════════════════════════════════

// A bill is "fully settled" once every non-payer participant has been
// individually marked as paid — this is derived, never stored separately,
// so there is only ever one source of truth for who has and hasn't paid.
function isBillFullySettled(bill) {
  const paid = bill.paidParticipants || [];
  return bill.participantIds.every(pid => pid === bill.paidBy || paid.includes(pid));
}

// Bulk-mark every participant on a single bill as paid/unpaid (the
// "Tandai Lunas" / "Batalkan" buttons in the Daftar Split Bill / Riwayat Lunas lists).
function toggleBillSettled(id, settled) {
  const bill = splitBills.find(b => b.id === id);
  if (!bill) return;
  bill.paidParticipants = settled
    ? bill.participantIds.filter(pid => pid !== bill.paidBy)
    : [];
  saveSplitBills();
  renderSplitBill();
  showToast(settled ? t('toast_bill_settled') : t('toast_bill_unsettled'));
}

function computeBillShares(bill) {
  if (bill.splitMode === 'custom' && bill.customShares) {
    return { ...bill.customShares };
  }
  const n = bill.participantIds.length || 1;
  const per = bill.total / n;
  const shares = {};
  bill.participantIds.forEach(pid => { shares[pid] = per; });
  return shares;
}

function resetBillForm() {
  editingBillId = null;
  document.getElementById('billForm').reset();
  document.getElementById('bDate').value = today();
  document.getElementById('bTaxPct').value = 11;
  document.getElementById('bServicePct').value = 0;
  document.getElementById('bSubtotal').value = '';
  setBillSplitMode('equal');
  renderPaidBySelect();
  renderParticipantsList();
  updateBillTotalPreview();
  document.getElementById('btnBillSubmit').textContent = t('submit_save');
  document.getElementById('btnBillCancel').classList.add('hidden');
  clearBillFormError();
}

function showBillFormError(msg) {
  const el = document.getElementById('billFormError');
  el.textContent = msg;
  el.classList.remove('hidden');
}
function clearBillFormError() {
  const el = document.getElementById('billFormError');
  el.textContent = '';
  el.classList.add('hidden');
}

function handleBillFormSubmit(e) {
  e.preventDefault();
  clearBillFormError();

  const title       = document.getElementById('bTitle').value.trim();
  const date        = document.getElementById('bDate').value.trim();
  const currency    = document.getElementById('bCurrency').value;
  const paidBy      = document.getElementById('bPaidBy').value;
  const { subtotal, taxPct, servicePct, taxAmt, serviceAmt, total } = getBillFormTotals();
  const participantIds = getCheckedParticipantIds();

  if (!date) return showBillFormError(t('err_date'));
  if (!paidBy) return showBillFormError(t('err_bill_paidby'));
  if (!subtotal || subtotal <= 0) return showBillFormError(t('err_bill_subtotal'));
  if (participantIds.length === 0) return showBillFormError(t('err_bill_participants'));

  let splitMode = billSplitMode;
  let customShares = null;
  let finalTotal = total;

  if (splitMode === 'custom') {
    customShares = {};
    let sum = 0;
    let ok = true;
    document.querySelectorAll('#participantsList .participant-custom-input').forEach(input => {
      const pid = input.dataset.person;
      if (!participantIds.includes(pid)) return;
      const val = parseAmountInput(input.value);
      if (!val || val <= 0) ok = false;
      customShares[pid] = val;
      sum += val;
    });
    if (!ok || Object.keys(customShares).length === 0) {
      return showBillFormError(t('err_bill_custom_sum'));
    }
    finalTotal = sum;
  }

  const data = {
    title, date, currency, paidBy,
    subtotal, taxPct, servicePct, taxAmt, serviceAmt,
    total: finalTotal,
    splitMode, participantIds, customShares,
  };

  if (editingBillId) {
    const idx = splitBills.findIndex(b => b.id === editingBillId);
    if (idx !== -1) {
      // Prune paid-status to participants who are still on the bill (and not the payer)
      const prevPaid = splitBills[idx].paidParticipants || [];
      const prunedPaid = prevPaid.filter(pid => participantIds.includes(pid) && pid !== paidBy);
      splitBills[idx] = { ...splitBills[idx], ...data, paidParticipants: prunedPaid };
    }
    saveSplitBills();
    renderSplitBill();
    showToast(t('toast_bill_updated'));
  } else {
    splitBills.unshift({ ...data, id: uid(), createdAt: Date.now(), paidParticipants: [] });
    saveSplitBills();
    renderSplitBill();
    showToast(t('toast_bill_saved'));
  }
  resetBillForm();
}

function startEditBill(id) {
  const bill = splitBills.find(b => b.id === id);
  if (!bill) return;

  editingBillId = id;
  document.getElementById('bTitle').value    = bill.title || '';
  document.getElementById('bDate').value     = bill.date;
  document.getElementById('bCurrency').value = bill.currency;
  document.getElementById('bSubtotal').value = formatAmountInput(bill.subtotal, bill.currency);
  document.getElementById('bTaxPct').value   = bill.taxPct;
  document.getElementById('bServicePct').value = bill.servicePct;

  renderPaidBySelect();
  document.getElementById('bPaidBy').value = bill.paidBy;

  setBillSplitMode(bill.splitMode || 'equal');
  renderParticipantsList(bill.participantIds, bill.splitMode === 'custom' ? bill.customShares : null);
  updateBillTotalPreview();

  document.getElementById('btnBillSubmit').textContent = t('submit_update');
  document.getElementById('btnBillCancel').classList.remove('hidden');

  document.getElementById('billForm').closest('.card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function deleteBill(id) {
  if (!confirm(t('bill_delete_confirm'))) return;
  splitBills = splitBills.filter(b => b.id !== id);
  saveSplitBills();
  renderSplitBill();
  showToast(t('toast_bill_deleted'));
}

// ═══════════════════════════════════════════════════════════════
// SPLIT BILL – render bills list
// ═══════════════════════════════════════════════════════════════
function billRowBreakdownHtml(bill) {
  const shares = computeBillShares(bill);
  const paid = bill.paidParticipants || [];
  return bill.participantIds.map(pid => {
    const isPayer = pid === bill.paidBy;
    const isPaid  = isPayer || paid.includes(pid);
    let label;
    if (isPayer)   label = settings.language === 'en' ? 'already paid' : 'sudah bayar (pemilik)';
    else if (isPaid) label = settings.language === 'en' ? '✅ paid' : '✅ sudah lunas';
    else           label = settings.language === 'en' ? `owes ${personName(bill.paidBy)}` : `harus bayar ke ${personName(bill.paidBy)}`;
    return `
      <div class="bill-breakdown-item ${isPaid ? 'is-paid' : ''}">
        <span>${escHtml(personName(pid))} — ${label}</span>
        <b>${formatAmount(shares[pid] || 0, bill.currency)}</b>
      </div>`;
  }).join('');
}

function billRowAvatarsHtml(bill) {
  return bill.participantIds.map(pid => `
    <span class="avatar-chip" style="background:${personColor(pid)}" title="${escHtml(personName(pid))}">${personInitials(personName(pid))}</span>
  `).join('');
}

function sortedBills(list) {
  return [...list].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

function renderBillsList() {
  const el    = document.getElementById('billsList');
  const empty = document.getElementById('billsEmpty');
  if (!el) return;

  const active = splitBills.filter(b => !isBillFullySettled(b));

  if (active.length === 0) {
    el.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  el.innerHTML = sortedBills(active).map(bill => `
      <div class="bill-row" data-id="${bill.id}">
        <div class="bill-row-top">
          <div>
            <div class="bill-row-title">${escHtml(bill.title || (settings.language === 'en' ? 'Untitled bill' : 'Split bill tanpa judul'))}</div>
            <div class="bill-row-date">${formatDateDisplay(bill.date)}</div>
          </div>
          <div class="bill-row-total">${formatAmount(bill.total, bill.currency)}</div>
        </div>
        <div class="bill-row-meta">
          <span class="bill-paidby-pill">${t('paid_by_pill', personName(bill.paidBy))}</span>
          <span class="bill-participants-mini">${billRowAvatarsHtml(bill)}</span>
          <div class="bill-row-actions">
            <button class="btn-success billSettleBtn" data-id="${bill.id}" title="${t('mark_lunas_btn')}">${t('mark_lunas_btn')}</button>
            <button class="btn-edit billEditBtn" data-id="${bill.id}" title="Edit">✏️</button>
            <button class="btn-del billDelBtn" data-id="${bill.id}" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="bill-row-breakdown">${billRowBreakdownHtml(bill)}</div>
      </div>`).join('');
}

function renderLunasList() {
  const el    = document.getElementById('lunasList');
  const empty = document.getElementById('lunasEmpty');
  if (!el) return;

  const settled = splitBills.filter(b => isBillFullySettled(b));

  if (settled.length === 0) {
    el.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  el.innerHTML = sortedBills(settled).map(bill => `
      <div class="bill-row is-settled" data-id="${bill.id}">
        <div class="bill-row-top">
          <div>
            <div class="bill-row-title">${escHtml(bill.title || (settings.language === 'en' ? 'Untitled bill' : 'Split bill tanpa judul'))}</div>
            <div class="bill-row-date">${formatDateDisplay(bill.date)}</div>
          </div>
          <div class="bill-row-total">${formatAmount(bill.total, bill.currency)}</div>
        </div>
        <div class="bill-row-meta">
          <span class="bill-lunas-pill">✅ ${t('bill_lunas_pill')}</span>
          <span class="bill-paidby-pill">${t('paid_by_pill', personName(bill.paidBy))}</span>
          <span class="bill-participants-mini">${billRowAvatarsHtml(bill)}</span>
          <div class="bill-row-actions">
            <button class="btn-outline text-sm py-1 billUnsettleBtn" data-id="${bill.id}">${t('unmark_lunas_btn')}</button>
            <button class="btn-del billDelBtn" data-id="${bill.id}" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="bill-row-breakdown">${billRowBreakdownHtml(bill)}</div>
      </div>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// SPLIT BILL – balances & settle up
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// SPLIT BILL – balances & settle up
//
// Single source of truth: each bill tracks exactly which participants
// have paid (bill.paidParticipants). There is no separate balance ledger
// that can drift out of sync with that — "Sudah Bayar" on a summary row
// and "Tandai Lunas" on a bill both just flip that same per-bill flag,
// so they can never double-count or contradict each other.
//
// Uses PAIRWISE netting: debts only cancel between the exact same two
// people (e.g. if A owes B for one bill and B owes A for another, those
// cancel out). Debt is never routed through a third person to minimize
// transaction count — that's more "optimal" on paper but produces
// payments that don't map back to who actually shared which bill, which
// is confusing. Pairwise keeps every suggested payment traceable to real
// shared bills.
// ═══════════════════════════════════════════════════════════════
function computeRawPairwiseDebts() {
  // raw[currency][fromId][toId] = amount fromId owes toId (directional, un-netted)
  const raw = {};
  function add(cur, from, to, amt) {
    if (!raw[cur]) raw[cur] = {};
    if (!raw[cur][from]) raw[cur][from] = {};
    raw[cur][from][to] = (raw[cur][from][to] || 0) + amt;
  }

  splitBills.forEach(bill => {
    const shares = computeBillShares(bill);
    const paid = bill.paidParticipants || [];
    Object.entries(shares).forEach(([pid, amt]) => {
      if (pid === bill.paidBy) return;
      if (paid.includes(pid)) return; // this participant already settled up for this bill
      add(bill.currency, pid, bill.paidBy, amt);
    });
  });

  return raw;
}

function simplifyPairwise(rawCur) {
  const EPS = 0.5;
  const people = new Set();
  Object.keys(rawCur).forEach(f => {
    people.add(f);
    Object.keys(rawCur[f]).forEach(tt => people.add(tt));
  });
  const arr = Array.from(people);
  const txns = [];

  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const A = arr[i], B = arr[j];
      const aToB = rawCur[A]?.[B] || 0;
      const bToA = rawCur[B]?.[A] || 0;
      const net = aToB - bToA;
      if (net > EPS) txns.push({ from: A, to: B, amount: net });
      else if (net < -EPS) txns.push({ from: B, to: A, amount: -net });
    }
  }
  return txns;
}

// Paying off a net (from → to) amount settles every bill that contributed
// to that pairwise balance in either direction — marks the relevant
// participant paid on each one. Logs exactly which (bill, participant)
// flags were flipped, so it can be undone precisely later.
function addSettlement(fromId, toId, amount, currency) {
  const affected = [];

  splitBills.forEach(bill => {
    if (bill.currency !== currency) return;
    const paid = bill.paidParticipants || [];

    if (bill.paidBy === toId && bill.participantIds.includes(fromId) && !paid.includes(fromId)) {
      bill.paidParticipants = [...paid, fromId];
      affected.push({ billId: bill.id, participantId: fromId });
    }
  });

  splitBills.forEach(bill => {
    if (bill.currency !== currency) return;
    const paid = bill.paidParticipants || [];
    if (bill.paidBy === fromId && bill.participantIds.includes(toId) && !paid.includes(toId)) {
      bill.paidParticipants = [...paid, toId];
      affected.push({ billId: bill.id, participantId: toId });
    }
  });

  saveSplitBills();
  settlements.push({ id: uid(), fromId, toId, amount, currency, date: today(), createdAt: Date.now(), affected });
  saveSettlements();
  renderSplitBill();
  showToast(t('toast_settled'));
}

// Precisely reverses exactly the (bill, participant) flags a settlement
// flipped — never re-adds a debt that was already independently settled.
function deleteSettlement(id) {
  const s = settlements.find(x => x.id === id);
  if (!s) return;
  if (!confirm(t('settlement_delete_confirm'))) return;

  (s.affected || []).forEach(({ billId, participantId }) => {
    const bill = splitBills.find(b => b.id === billId);
    if (bill) bill.paidParticipants = (bill.paidParticipants || []).filter(pid => pid !== participantId);
  });
  saveSplitBills();

  settlements = settlements.filter(x => x.id !== id);
  saveSettlements();
  renderSplitBill();
  showToast(t('toast_settlement_deleted'));
}

function renderSettlementHistory() {
  const el    = document.getElementById('settlementHistoryList');
  const empty = document.getElementById('settlementHistoryEmpty');
  if (!el) return;

  if (settlements.length === 0) {
    el.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  const sorted = [...settlements].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  el.innerHTML = sorted.map(s => `
    <div class="settle-row" style="background:#f7f8fa">
      <span class="settle-flow" style="color:#57606a">
        ${escHtml(personName(s.fromId))} <span class="arrow" style="color:#2EC4B6">→</span> ${escHtml(personName(s.toId))}
        <span style="font-weight:500;color:#9ca3af;font-size:0.68rem;margin-left:0.3rem">${formatDateDisplay(s.date)}</span>
      </span>
      <span class="settle-amount" style="color:#2D3436">${formatAmount(s.amount, s.currency)}</span>
      <button type="button" class="btn-del settlementDelBtn" data-id="${s.id}" title="Hapus">🗑️</button>
    </div>`).join('');
}

function renderSettleList() {
  const el    = document.getElementById('settleList');
  const empty = document.getElementById('settleEmpty');
  if (!el) return;

  const raw = computeRawPairwiseDebts();
  const currencies = Object.keys(raw).filter(cur => simplifyPairwise(raw[cur]).length > 0);

  if (currencies.length === 0) {
    el.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  el.innerHTML = currencies.map(cur => {
    const txns = simplifyPairwise(raw[cur]);
    const rows = txns.map(txn => `
      <div class="settle-row" data-from="${txn.from}" data-to="${txn.to}" data-amount="${txn.amount}" data-currency="${cur}">
        <span class="settle-flow">
          ${escHtml(personName(txn.from))} <span class="arrow">→</span> ${escHtml(personName(txn.to))}
        </span>
        <span class="settle-amount">${formatAmount(txn.amount, cur)}</span>
        <button type="button" class="btn-success settleBtn">${t('settle_pay_btn')}</button>
      </div>`).join('');
    const label = Object.keys(raw).length > 1 ? `<div class="settle-currency-label">${cur}</div>` : '';
    return `<div class="settle-currency-group">${label}${rows}</div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// SPLIT BILL – render all
// ═══════════════════════════════════════════════════════════════
function renderSplitBill() {
  if (!document.getElementById('splitbill')) return;
  renderPeopleList();
  renderPaidBySelect();

  // Rebuild the participant checklist (e.g. after a friend is added/removed)
  // while preserving whatever the user had already selected/typed in the form.
  // If there were no rows yet (fresh/empty form), default to "everyone selected".
  const hadRows = document.querySelectorAll('#participantsList .participant-row').length > 0;
  const currentChecked = hadRows ? getCheckedParticipantIds() : null;
  const currentCustom = {};
  document.querySelectorAll('#participantsList .participant-custom-input').forEach(inp => {
    const v = parseAmountInput(inp.value);
    if (v > 0) currentCustom[inp.dataset.person] = v;
  });
  renderParticipantsList(
    currentChecked,
    Object.keys(currentCustom).length ? currentCustom : null
  );

  renderBillsList();
  renderLunasList();
  renderSettleList();
  renderSettlementHistory();
  updateBillCurrencyPrefix();
}

function updateBillCurrencyPrefix() {
  const sel = document.getElementById('bCurrency');
  const prefixEl = document.getElementById('bCurrencyPrefix');
  if (!sel || !prefixEl) return;
  const cfg = CURRENCIES[sel.value] || CURRENCIES.IDR;
  prefixEl.textContent = cfg.symbol;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT MODAL – choose all / month / date range before exporting
// ═══════════════════════════════════════════════════════════════
function openExportModal() {
  if (!document.getElementById('exportMonthInput').value) {
    document.getElementById('exportMonthInput').value = today().slice(0, 7);
  }
  document.getElementById('exportModal').classList.add('open');
}
function closeExportModal() {
  document.getElementById('exportModal').classList.remove('open');
}

function handleExportModalConfirm() {
  const scopeMonth = document.getElementById('exportScopeMonth').checked;
  const scopeRange = document.getElementById('exportScopeRange').checked;

  if (scopeMonth) {
    const month = document.getElementById('exportMonthInput').value;
    if (!month) { alert(t('export_scope_month_alert')); return; }
    const list = transactions.filter(tx => tx.date.startsWith(month));
    exportCSV(list, { emptyMsg: t('toast_export_filtered_empty'), filenameSuffix: month });
  } else if (scopeRange) {
    const from = document.getElementById('exportFromInput').value;
    const to   = document.getElementById('exportToInput').value;
    if (!from && !to) { alert(t('export_scope_range_alert')); return; }
    const list = transactions.filter(tx => (!from || tx.date >= from) && (!to || tx.date <= to));
    exportCSV(list, { emptyMsg: t('toast_export_filtered_empty'), filenameSuffix: `${from || 'awal'}_sd_${to || 'akhir'}` });
  } else {
    exportCSV();
  }
  closeExportModal();
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
      syncSelfPerson();
      renderGreeting();
      renderSplitBill();
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
      localStorage.removeItem(PEOPLE_KEY);
      localStorage.removeItem(SPLITBILLS_KEY);
      localStorage.removeItem(SETTLEMENTS_KEY);
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

  // Month vs custom date-range are mutually exclusive ("bulan ATAU tanggal")
  document.getElementById('filterMonth').addEventListener('change', () => {
    document.getElementById('filterFrom').value = '';
    document.getElementById('filterTo').value = '';
    renderTable();
  });
  document.getElementById('filterFrom').addEventListener('change', () => {
    document.getElementById('filterMonth').value = '';
    renderTable();
  });
  document.getElementById('filterTo').addEventListener('change', () => {
    document.getElementById('filterMonth').value = '';
    renderTable();
  });
  document.getElementById('btnShowAllMonths').addEventListener('click', () => {
    document.getElementById('filterMonth').value = '';
    document.getElementById('filterFrom').value = '';
    document.getElementById('filterTo').value = '';
    renderTable();
  });
  document.getElementById('btnExportFiltered').addEventListener('click', exportFilteredCSV);

  document.getElementById('btnClearAll').addEventListener('click', () => {
    if (transactions.length === 0) { showToast(t('toast_clear_empty')); return; }
    if (confirm(t('toast_clear_confirm'))) {
      transactions = [];
      saveData();
      renderAll();
      showToast(t('toast_cleared'));
    }
  });

  document.getElementById('btnExport').addEventListener('click', openExportModal);
  document.getElementById('exportModalCancel').addEventListener('click', closeExportModal);
  document.getElementById('exportModal').addEventListener('click', e => {
    if (e.target === document.getElementById('exportModal')) closeExportModal();
  });
  document.getElementById('exportModalConfirm').addEventListener('click', handleExportModalConfirm);
  document.getElementById('exportMonthInput').addEventListener('focus', () => {
    document.getElementById('exportScopeMonth').checked = true;
  });
  document.getElementById('exportFromInput').addEventListener('focus', () => {
    document.getElementById('exportScopeRange').checked = true;
  });
  document.getElementById('exportToInput').addEventListener('focus', () => {
    document.getElementById('exportScopeRange').checked = true;
  });

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

  // Sidebar nav: switch views (only the clicked page shows), highlight link, close drawer
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      const targetId = link.getAttribute('href')?.replace('#', '');
      if (targetId) {
        document.querySelectorAll('.view-panel').forEach(panel => {
          panel.classList.toggle('is-active', panel.id === targetId);
        });
      }

      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });

      closeSidebar();
    });
  });

  initSettingsEvents();
  initSplitBillEvents();
}

function initSplitBillEvents() {
  // People
  document.getElementById('btnAddPerson').addEventListener('click', () => {
    const input = document.getElementById('personName');
    if (addPerson(input.value)) input.value = '';
  });
  document.getElementById('personName').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.target;
      if (addPerson(input.value)) input.value = '';
    }
  });
  document.getElementById('peopleList').addEventListener('click', e => {
    const delBtn = e.target.closest('.person-chip-del');
    if (delBtn) deletePerson(delBtn.dataset.id);
  });

  // Bill form
  document.getElementById('billForm').addEventListener('submit', handleBillFormSubmit);
  document.getElementById('btnBillCancel').addEventListener('click', resetBillForm);

  document.getElementById('bCurrency').addEventListener('change', () => {
    updateBillCurrencyPrefix();
    const input = document.getElementById('bSubtotal');
    const raw = parseAmountInput(input.value);
    const code = document.getElementById('bCurrency').value;
    if (raw > 0) input.value = formatAmountInput(raw, code);
    updateBillTotalPreview();
  });

  document.getElementById('bSubtotal').addEventListener('input', e => {
    handleAmountInputGeneric(e, 'bCurrency');
    updateBillTotalPreview();
  });
  document.getElementById('bSubtotal').addEventListener('blur', e => {
    handleAmountBlurGeneric(e, 'bCurrency');
    updateBillTotalPreview();
  });

  document.getElementById('bTaxPct').addEventListener('input', updateBillTotalPreview);
  document.getElementById('bServicePct').addEventListener('input', updateBillTotalPreview);

  document.getElementById('splitEqual').addEventListener('click', () => setBillSplitMode('equal'));
  document.getElementById('splitCustom').addEventListener('click', () => setBillSplitMode('custom'));

  document.getElementById('participantsList').addEventListener('change', e => {
    if (e.target.classList.contains('participantChk')) updateParticipantsPreview();
  });
  document.getElementById('participantsList').addEventListener('input', e => {
    if (e.target.classList.contains('participant-custom-input')) {
      handleAmountInputGeneric(e, 'bCurrency');
      updateParticipantsPreview();
    }
  });
  document.getElementById('participantsList').addEventListener('blur', e => {
    if (e.target.classList.contains('participant-custom-input')) {
      handleAmountBlurGeneric(e, 'bCurrency');
      updateParticipantsPreview();
    }
  }, true);

  // Bills list actions (active list)
  document.getElementById('billsList').addEventListener('click', e => {
    const editBtn   = e.target.closest('.billEditBtn');
    const delBtn    = e.target.closest('.billDelBtn');
    const settleBtn = e.target.closest('.billSettleBtn');
    if (editBtn)   startEditBill(editBtn.dataset.id);
    if (delBtn)    deleteBill(delBtn.dataset.id);
    if (settleBtn) toggleBillSettled(settleBtn.dataset.id, true);
  });

  // Riwayat Lunas (settled) list actions
  document.getElementById('lunasList').addEventListener('click', e => {
    const delBtn      = e.target.closest('.billDelBtn');
    const unsettleBtn = e.target.closest('.billUnsettleBtn');
    if (delBtn)      deleteBill(delBtn.dataset.id);
    if (unsettleBtn) toggleBillSettled(unsettleBtn.dataset.id, false);
  });

  // Settle list "Sudah Bayar"
  document.getElementById('settleList').addEventListener('click', e => {
    const btn = e.target.closest('.settleBtn');
    if (!btn) return;
    const row = btn.closest('.settle-row');
    addSettlement(row.dataset.from, row.dataset.to, parseFloat(row.dataset.amount), row.dataset.currency);
  });

  // Settlement history — undo a mistaken "Sudah Bayar"
  document.getElementById('settlementHistoryList').addEventListener('click', e => {
    const delBtn = e.target.closest('.settlementDelBtn');
    if (delBtn) deleteSettlement(delBtn.dataset.id);
  });
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
function init() {
  loadSettings();
  loadData();
  loadPeople();
  loadSplitBills();
  loadSettlements();
  syncSelfPerson();
  initEvents();
  applyTranslations();

  document.getElementById('fDate').value = today();
  document.getElementById('bDate').value = today();
  document.getElementById('filterMonth').value = today().slice(0, 7);

  setType('expense');
  updateCurrencyPrefix();

  renderPaidBySelect();
  renderParticipantsList();
  setBillSplitMode('equal');
  updateBillCurrencyPrefix();
  updateBillTotalPreview();

  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
