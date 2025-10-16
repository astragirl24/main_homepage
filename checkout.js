const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

const orderContainer = document.querySelector(".order-items");
const items = () => Array.from(orderContainer.querySelectorAll(".order-item"));

const subtotalValue = document.getElementById("subtotalValue");
const shippingValue = document.getElementById("shippingValue");
const totalValue = document.getElementById("totalValue");
const discountValue = document.getElementById("discountValue");
const discountRow = document.querySelector(".discount-row");
const shippingRadios = document.querySelectorAll('input[name="shipping"]');
const discountInput = document.getElementById("discountCode");
const discountFeedback = document.querySelector(".discount-feedback");
const applyDiscountBtn = document.getElementById("applyDiscount");
const payButton = document.getElementById("payNow");

const DISCOUNT_CODES = {
  LDIEZONE: { type: "percentage", value: 0.1, message: "Giảm 10% toàn bộ đơn hàng" },
  NHON25: { type: "flat", value: 25000, message: "Giảm trực tiếp 25.000 VND" },
  FREESHIP: { type: "shipping", value: true, message: "Miễn phí vận chuyển" },
};

let activeDiscount = null;

const sanitizeQuantity = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
};

const getSelectedShipping = () => {
  const selected = Array.from(shippingRadios).find((radio) => radio.checked);
  if (!selected) {
    return { cost: 0, label: "" };
  }
  const cost = Number.parseInt(selected.value, 10) || 0;
  return { cost, label: selected.dataset.label || "" };
};

const formatCurrency = (amount) =>
  `${currencyFormatter.format(Math.max(0, Math.round(amount)))} VND`;

const updateTotals = () => {
  let subtotal = 0;
  items().forEach((item) => {
    const quantityInput = item.querySelector('input[type="number"]');
    const quantity = sanitizeQuantity(quantityInput.value);
    quantityInput.value = quantity;

    const price = Number.parseInt(item.dataset.price, 10) || 0;
    subtotal += price * quantity;
  });

  let { cost: shippingBase } = getSelectedShipping();
  if (items().length === 0) {
    shippingBase = 0;
  }

  let shipping = shippingBase;
  let discountAmount = 0;

  if (activeDiscount) {
    switch (activeDiscount.type) {
      case "percentage":
        discountAmount += subtotal * activeDiscount.value;
        break;
      case "flat":
        discountAmount += activeDiscount.value;
        break;
      case "shipping":
        discountAmount += shippingBase;
        shipping = 0;
        break;
      default:
        break;
    }
  }

  if (discountAmount > subtotal + shipping) {
    discountAmount = subtotal + shipping;
  }

  const total = subtotal + shipping - discountAmount;

  subtotalValue.textContent = formatCurrency(subtotal);
  shippingValue.textContent = formatCurrency(shipping);
  totalValue.textContent = formatCurrency(total);

  if (discountAmount > 0) {
    discountRow.classList.remove("hidden");
    discountValue.textContent = `-${formatCurrency(discountAmount)}`;
  } else {
    discountRow.classList.add("hidden");
    discountValue.textContent = "-0 VND";
  }

  payButton.disabled = total <= 0;
};

const handleQuantityButton = (button) => {
  const container = button.closest(".quantity-control");
  if (!container) return;
  const input = container.querySelector('input[type="number"]');
  const direction = button.dataset.direction;
  const current = sanitizeQuantity(input.value);
  if (direction === "increase") {
    input.value = current + 1;
  } else if (direction === "decrease") {
    input.value = Math.max(1, current - 1);
  }
  updateTotals();
};

const removeItem = (button) => {
  const item = button.closest(".order-item");
  if (!item) return;
  item.classList.add("removed");
  window.setTimeout(() => {
    item.remove();
    updateTotals();
  }, 200);
};

const clearDiscountMessage = () => {
  discountFeedback.textContent = "";
  discountFeedback.classList.remove("success", "error");
};

const setDiscountMessage = (message, type) => {
  discountFeedback.textContent = message;
  discountFeedback.classList.remove("success", "error");
  if (type) {
    discountFeedback.classList.add(type);
  }
};

const applyDiscount = () => {
  const code = discountInput.value.trim().toUpperCase();

  if (!code) {
    activeDiscount = null;
    clearDiscountMessage();
    updateTotals();
    return;
  }

  const discount = DISCOUNT_CODES[code];
  if (!discount) {
    activeDiscount = null;
    setDiscountMessage("Mã giảm giá không hợp lệ.", "error");
    updateTotals();
    return;
  }

  activeDiscount = { code, ...discount };
  setDiscountMessage(discount.message, "success");
  updateTotals();
};

const handleShippingChange = (event) => {
  if (!(event.target instanceof HTMLInputElement)) return;
  if (event.target.name !== "shipping") return;
  updateTotals();
};

const handlePay = () => {
  const { label } = getSelectedShipping();
  const summaryLines = items().map((item) => {
    const title = item.querySelector("h3")?.textContent || "Sản phẩm";
    const quantity = sanitizeQuantity(
      item.querySelector('input[type="number"]').value
    );
    return `• ${title} x${quantity}`;
  });

  const totalText = totalValue.textContent;
  const message = [
    "Xác nhận thanh toán",
    ...summaryLines,
    `Phương thức vận chuyển: ${label}`,
    `Tổng thanh toán: ${totalText}`,
  ].join("\n");

  window.alert(message);
};

orderContainer.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLButtonElement) {
    if (target.classList.contains("qty-btn")) {
      handleQuantityButton(target);
    }
    if (target.classList.contains("remove-item")) {
      removeItem(target);
    }
  }
});

orderContainer.addEventListener("change", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.type === "number") {
    target.value = sanitizeQuantity(target.value);
    updateTotals();
  }
});

shippingRadios.forEach((radio) => radio.addEventListener("change", handleShippingChange));

applyDiscountBtn.addEventListener("click", applyDiscount);

discountInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    applyDiscount();
  }
});

payButton.addEventListener("click", handlePay);

updateTotals();
