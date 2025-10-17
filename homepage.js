const $ = (selector, context = document) => context.querySelector(selector);

const els = {
  grid: $('#productGrid'),
  badge: $('#cartBadge'),
  btn: $('#cartButton'),
  overlay: $('#overlay'),
  modal: $('#cartModal'),
  close: $('#closeModal'),
  list: $('#cartList'),
  empty: $('#emptyState'),
  total: $('#grandTotal'),
  cont: $('#continueLink'),
};

const fmt = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const state = { items: [] };

function openModal() {
  els.overlay.classList.add('show');
  els.modal.classList.add('show');
  els.btn.setAttribute('aria-expanded', 'true');
  setTimeout(() => els.close.focus(), 0);
}

function closeModal() {
  els.overlay.classList.remove('show');
  els.modal.classList.remove('show');
  els.btn.setAttribute('aria-expanded', 'false');
  els.btn.focus();
}

function updateBadge() {
  const n = state.items.reduce((sum, item) => sum + item.qty, 0);
  els.badge.textContent = n;
  els.badge.classList.toggle('show', n > 0);
}

function render() {
  els.list.innerHTML = '';
  if (state.items.length === 0) {
    els.list.appendChild(els.empty);
    els.empty.style.display = 'block';
  } else {
    els.empty.style.display = 'none';
    state.items.forEach((it) => {
      const row = document.createElement('div');
      row.className = 'line';
      row.innerHTML = `
                <img src="${it.img}" alt="${it.name}" width="72" height="72" style="border-radius:8px; object-fit:cover">
                <div>
                    <h4>${it.name}</h4>
                    <div class="muted-sm">${fmt.format(it.price)}</div>
                    <button class="remove" data-id="${it.id}">Xóa</button>
                </div>
                <div style="display:grid; gap:6px; justify-items:end">
                    <div class="qty" role="group" aria-label="Số lượng">
                        <button class="dec" data-id="${it.id}" aria-label="Giảm">−</button>
                        <input type="text" inputmode="numeric" value="${it.qty}" aria-label="Số lượng hiện tại">
                        <button class="inc" data-id="${it.id}" aria-label="Tăng">+</button>
                    </div>
                    <div class="line-total">${fmt.format(it.price * it.qty)}</div>
                </div>
            `;
      els.list.appendChild(row);
    });
  }
  const total = state.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  els.total.textContent = fmt.format(total);
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

  const price = item.dataset.price ? Number(item.dataset.price.replace('$', '')) * 23000 : 2070000;
  const img = item.dataset.img || item.querySelector('img.main-image').src;
  const fallbackId = item.dataset.id || item.id || item.dataset.name || img;

  add({
    id: String(fallbackId),
    name: item.dataset.name,
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
  if (event.key === 'Escape') closeModal();
});

els.list.addEventListener('click', (event) => {
  const target = event.target;
  if (target.classList.contains('inc')) setQty(target.dataset.id, (state.items.find((i) => i.id === target.dataset.id)?.qty || 1) + 1);
  if (target.classList.contains('dec')) setQty(target.dataset.id, (state.items.find((i) => i.id === target.dataset.id)?.qty || 1) - 1);
  if (target.classList.contains('remove')) removeItem(target.dataset.id);
});

els.list.addEventListener('input', (event) => {
  const input = event.target;
  if (input.tagName !== 'INPUT') return;
  const row = input.closest('.line');
  const id = row.querySelector('.inc').dataset.id;
  const newQty = input.value.replace(/\D/g, '');
  setQty(id, newQty);
});

render();
