const $ = (selector, context = document) => context.querySelector(selector);

const els = {
  grid: $('#productGrid'),
  badge: $('#cartBadge'),
  btn: $('#cartButton'),
  overlay: $('#overlay'),
  modal: $('#cartModal'),
  close: $('#closeModal'),
  lines: $('#cartItems'),
  empty: $('#emptyState'),
  total: $('#grandTotal'),
  cont: $('#continueLink'),
  tab: $('#cartTab'),
  tabToggle: $('#cartTabToggle'),
  tabClose: $('#cartTabClose'),
  tabPanel: $('#cartTabPanel'),
  tabCount: $('#cartTabCount'),
  tabLines: $('#cartTabItems'),
  tabEmpty: $('#cartTabEmpty'),
  tabTotal: $('#cartTabTotal'),
  tabViewFull: $('#cartTabViewFull'),
};

const fmt = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const state = { items: [] };

function openModal() {
  if (els.tab && els.tab.classList.contains('open')) closeTab();
  els.overlay.classList.add('show');
  els.modal.classList.add('show');
  els.btn.setAttribute('aria-expanded', 'true');
  if (els.tabToggle) els.tabToggle.setAttribute('disabled', 'true');
  setTimeout(() => els.close.focus(), 0);
}

function closeModal() {
  els.overlay.classList.remove('show');
  els.modal.classList.remove('show');
  els.btn.setAttribute('aria-expanded', 'false');
  if (els.tabToggle) els.tabToggle.removeAttribute('disabled');
  els.btn.focus();
}

function updateBadge() {
  const n = state.items.reduce((sum, item) => sum + item.qty, 0);
  els.badge.textContent = n;
  els.badge.classList.toggle('show', n > 0);
  if (els.tabCount) {
    els.tabCount.textContent = n;
    els.tabCount.classList.toggle('show', n > 0);
  }
}

function buildRow(item) {
  const row = document.createElement('div');
  row.className = 'line';
  row.innerHTML = `
        <img src="${item.img}" alt="${item.name}" width="72" height="72" class="line-thumb">
        <div class="line-info">
            <h4>${item.name}</h4>
            <div class="muted-sm">${fmt.format(item.price)}</div>
            <button class="remove" data-id="${item.id}">Xóa</button>
        </div>
        <div class="line-actions">
            <div class="qty" role="group" aria-label="Số lượng">
                <button class="dec" data-id="${item.id}" aria-label="Giảm">−</button>
                <input type="text" inputmode="numeric" value="${item.qty}" aria-label="Số lượng hiện tại">
                <button class="inc" data-id="${item.id}" aria-label="Tăng">+</button>
            </div>
            <div class="line-total">${fmt.format(item.price * item.qty)}</div>
        </div>
    `;
  return row;
}

function renderView(view, totalValue) {
  const { lines, empty, total } = view;
  if (!lines) return;
  lines.innerHTML = '';
  if (state.items.length === 0) {
    if (empty) empty.hidden = false;
    if (total) total.textContent = fmt.format(0);
    return;
  }
  if (empty) empty.hidden = true;
  state.items.forEach((it) => {
    lines.appendChild(buildRow(it));
  });
  if (total) total.textContent = fmt.format(totalValue);
}

function render() {
  const totalValue = state.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  renderView({ lines: els.lines, empty: els.empty, total: els.total }, totalValue);
  renderView({ lines: els.tabLines, empty: els.tabEmpty, total: els.tabTotal }, totalValue);
  updateBadge();
}

function add(prod) {
  const existing = state.items.find((item) => item.id === prod.id);
  if (existing) existing.qty += 1;
  else state.items.push({ ...prod, qty: 1 });
  render();
  openModal();
}

function setQty(id, qty) {
  const item = state.items.find((it) => it.id === id);
  if (!item) return;
  item.qty = Math.max(1, Math.min(999, Number(qty) || 1));
  render();
}

function removeItem(id) {
  state.items = state.items.filter((it) => it.id !== id);
  render();
}

els.grid.addEventListener('click', (event) => {
  const btn = event.target.closest('.add');
  if (!btn) return;
  const item = event.target.closest('.item');
  if (!item) return;

  const rawPrice = item.dataset.price ? parseFloat(item.dataset.price.replace(/[^0-9.]/g, '')) : 90;
  const price = Math.round(rawPrice * 23000);
  const img = item.dataset.img || item.querySelector('img.main-image')?.src;
  const fallbackId = item.dataset.id || item.id || item.dataset.name || img || `sku-${Date.now()}`;

  add({
    id: String(fallbackId),
    name: item.dataset.name || item.querySelector('h4')?.textContent?.trim() || 'Sản phẩm',
    price,
    img,
  });
});

els.btn.addEventListener('click', openModal);
els.overlay.addEventListener('click', closeModal);
els.close.addEventListener('click', closeModal);
els.cont.addEventListener('click', (event) => {
  event.preventDefault();
  closeModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (els.modal.classList.contains('show')) {
    closeModal();
    return;
  }
  if (els.tab && els.tab.classList.contains('open')) closeTab();
});

const attachCartHandlers = (container) => {
  if (!container) return;
  container.addEventListener('click', (event) => {
    const target = event.target;
    if (target.classList.contains('inc')) setQty(target.dataset.id, (state.items.find((i) => i.id === target.dataset.id)?.qty || 1) + 1);
    if (target.classList.contains('dec')) setQty(target.dataset.id, (state.items.find((i) => i.id === target.dataset.id)?.qty || 1) - 1);
    if (target.classList.contains('remove')) removeItem(target.dataset.id);
  });

  container.addEventListener('input', (event) => {
    const input = event.target;
    if (input.tagName !== 'INPUT') return;
    const row = input.closest('.line');
    const id = row.querySelector('.inc').dataset.id;
    const newQty = input.value.replace(/\D/g, '');
    setQty(id, newQty);
  });
};

attachCartHandlers(els.lines);
attachCartHandlers(els.tabLines);

function openTab() {
  if (!els.tab) return;
  els.tab.classList.add('open');
  if (els.tabPanel) {
    els.tabPanel.hidden = false;
    setTimeout(() => els.tabPanel.focus(), 0);
  }
  if (els.tabToggle) els.tabToggle.setAttribute('aria-expanded', 'true');
}

function closeTab() {
  if (!els.tab) return;
  els.tab.classList.remove('open');
  if (els.tabPanel) els.tabPanel.hidden = true;
  if (els.tabToggle) {
    els.tabToggle.setAttribute('aria-expanded', 'false');
    els.tabToggle.focus();
  }
}

if (els.tabToggle) {
  els.tabToggle.addEventListener('click', () => {
    const expanded = els.tabToggle.getAttribute('aria-expanded') === 'true';
    if (expanded) closeTab();
    else openTab();
  });
}

if (els.tabClose) {
  els.tabClose.addEventListener('click', closeTab);
}

if (els.tabViewFull) {
  els.tabViewFull.addEventListener('click', () => {
    openModal();
    closeTab();
  });
}

render();
