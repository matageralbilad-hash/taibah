import { db, ref, onValue, push, set, serverTimestamp } from "./firebase-config.js";
import { aiSafeSearch } from "./search-dictionary.js";

// الحالة العامة للتطبيق
let allProducts = [];
let allBanners = [];
let cart = JSON.parse(localStorage.getItem('anwar_cart') || '[]');
let favorites = new Set(JSON.parse(localStorage.getItem('anwar_favs') || '[]'));

// تهيئة أيقونات Lucide
function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// نظام Toast للتنبيهات
export function showToast(message, isError = false) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (isError) toast.style.borderRightColor = '#EF4444';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2800);
}

// 1. شاشة البداية Intro مع localStorage للتخطي
function handleIntro() {
  const intro = document.getElementById('intro-screen');
  const hasSeenIntro = localStorage.getItem('anwar_intro_seen');
  
  if (hasSeenIntro) {
    intro.style.display = 'none';
  } else {
    setTimeout(() => {
      intro.classList.add('fade-out');
      localStorage.setItem('anwar_intro_seen', 'true');
      setTimeout(() => intro.style.display = 'none', 500);
    }, 2000);
  }
}

// 2. تحديث شارة السلة
function updateCartBadge() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById('cart-badge');
  badge.textContent = count;
  localStorage.setItem('anwar_cart', JSON.stringify(cart));
}

// 3. الاستماع اللحظي لبيانات Firebase
function initFirebaseListeners() {
  // جلب المنتجات
  const productsRef = ref(db, 'products');
  onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      allProducts = Object.entries(data).map(([id, val]) => ({ id, ...val })).filter(p => p.active !== false);
    } else {
      allProducts = [];
    }
    renderShelves();
    updateFavoritesView();
  });

  // جلب البانرات
  const bannersRef = ref(db, 'banners');
  onValue(bannersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      allBanners = Object.entries(data).map(([id, val]) => ({ id, ...val })).filter(b => b.active !== false);
      renderBanners();
    }
  });
}

// 4. رسم السلايدر
function renderBanners() {
  const track = document.getElementById('slider-track');
  if (allBanners.length === 0) return;

  track.innerHTML = allBanners.map((b, index) => `
    <div class="slide ${index === 0 ? 'active' : ''}">
      <img src="${b.image}" alt="${b.title || 'عرض'}" loading="lazy">
      <div class="slide-overlay">
        <h3>${b.title || ''}</h3>
      </div>
    </div>
  `).join('');
}

// 5. رسم بطاقة المنتج الفاخرة
function createProductCard(product) {
  const isFav = favorites.has(product.id);
  const hasSale = product.saleEnabled && Number(product.salePrice) > 0;
  const priceDisplay = hasSale ? product.salePrice : product.price;
  
  // أول 10 كلمات من الوصف
  const words = (product.description || '').split(' ');
  const shortDesc = words.slice(0, 10).join(' ') + (words.length > 10 ? '...' : '');

  return `
    <div class="product-card" data-id="${product.id}">
      <button class="fav-btn ${isFav ? 'active' : ''}" data-action="fav" data-id="${product.id}" aria-label="المفضلة">
        <i data-lucide="heart"></i>
      </button>
      <div class="product-img-wrap" data-action="open" data-id="${product.id}">
        <img src="${product.mainImage || (product.images && product.images[0]) || 'assets/LOGO.PNG'}" alt="${product.name}" loading="lazy">
      </div>
      <h4 class="product-title" data-action="open" data-id="${product.id}">${product.name}</h4>
      <p class="product-short-desc">${shortDesc}</p>
      <div class="product-pricing">
        <span class="current-price">${priceDisplay} ريال</span>
        ${hasSale ? `<span class="old-price">${product.price} ريال</span>` : ''}
      </div>
      <div class="card-actions">
        <button class="card-btn open" data-action="open" data-id="${product.id}">فتح</button>
        <button class="card-btn share" data-action="share" data-id="${product.id}" aria-label="مشاركة"><i data-lucide="share-2"></i></button>
      </div>
    </div>
  `;
}

// 6. توزيع المنتجات على الرفوف الخمسة
function renderShelves() {
  const map = {
    'الأجهزة المنزلية اليومية': document.getElementById('shelf-home'),
    'الأجهزة الإلكترونية': document.getElementById('shelf-electronics'),
    'الساعات وغيرها': document.getElementById('shelf-watches'),
    'الكهربائيات': document.getElementById('shelf-electrical'),
    'أجهزة المطبخ': document.getElementById('shelf-kitchen')
  };

  Object.values(map).forEach(el => { if (el) el.innerHTML = ''; });

  allProducts.forEach(prod => {
    const cats = prod.categories || [];
    cats.forEach(cat => {
      if (map[cat]) {
        map[cat].insertAdjacentHTML('beforeend', createProductCard(prod));
      }
    });
  });

  refreshIcons();
}

// 7. فتح تفاصيل المنتج (Modal)
function openProductDetails(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;

  const modal = document.getElementById('product-modal');
  const container = document.getElementById('modal-content');
  const isOutOfStock = Number(product.stock) <= 0;
  const hasSale = product.saleEnabled && Number(product.salePrice) > 0;
  const currentPrice = hasSale ? product.salePrice : product.price;

  const images = product.images && product.images.length > 0 ? product.images : [product.mainImage || 'assets/LOGO.PNG'];

  container.innerHTML = `
    <div class="details-gallery">
      <div class="main-gallery-img">
        <img id="detail-main-img" src="${images[0]}" alt="${product.name}">
      </div>
      <div class="gallery-thumbs">
        ${images.map((img, i) => `
          <img src="${img}" class="thumb ${i === 0 ? 'active' : ''}" onclick="document.getElementById('detail-main-img').src='${img}'">
        `).join('')}
      </div>
    </div>
    <div class="details-info">
      <h2>${product.name}</h2>
      <div class="details-categories">
        ${(product.categories || []).map(c => `<span class="cat-pill">${c}</span>`).join('')}
      </div>
      <div class="details-price">
        <span class="current-price-lg">${currentPrice} ريال</span>
        ${hasSale ? `<span class="old-price-lg">${product.price} ريال</span>` : ''}
      </div>
      ${hasSale && product.saleExpiresAt ? `<div class="sale-timer"><i data-lucide="clock"></i> ينتهي العرض قريباً</div>` : ''}
      <p class="details-desc">${product.description || 'لا يوجد وصف تفصيلي.'}</p>
      
      <div class="stock-status ${isOutOfStock ? 'out' : 'in'}">
        ${isOutOfStock ? 'غير متوفر حالياً' : `متوفر في المخزون (${product.stock} حبة)`}
      </div>

      <div class="purchase-row">
        <div class="qty-control">
          <button id="qty-minus">-</button>
          <span id="qty-val">1</span>
          <button id="qty-plus">+</button>
        </div>
        <button id="add-to-cart-btn" class="btn-primary flex-1" ${isOutOfStock ? 'disabled' : ''}>
          إضافة إلى السلة
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  refreshIcons();

  // إدارة الكمية وإضافة المنتج للسلة
  let qty = 1;
  const qtyVal = document.getElementById('qty-val');
  document.getElementById('qty-plus').onclick = () => {
    if (qty < Number(product.stock)) {
      qty++;
      qtyVal.textContent = qty;
    } else {
      showToast('الكمية المطلوبة تتجاوز المتوفر بالمخزون', true);
    }
  };
  document.getElementById('qty-minus').onclick = () => {
    if (qty > 1) {
      qty--;
      qtyVal.textContent = qty;
    }
  };

  document.getElementById('add-to-cart-btn').onclick = () => {
    addToCart(product, qty);
    modal.classList.add('hidden');
  };
}

// 8. منطق السلة
function addToCart(product, quantity) {
  const existing = cart.find(item => item.id === product.id);
  const availableStock = Number(product.stock) || 1;

  if (existing) {
    if (existing.quantity + quantity > availableStock) {
      showToast('الكمية الإجمالية تتجاوز المخزون', true);
      return;
    }
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.saleEnabled ? Number(product.salePrice) : Number(product.price),
      image: product.mainImage || (product.images && product.images[0]) || '',
      quantity: quantity
    });
  }

  updateCartBadge();
  showToast('تمت إضافة المنتج إلى السلة');
}

function renderCart() {
  const container = document.getElementById('cart-items-container');
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="shopping-bag" class="empty-icon"></i>
        <p>السلة فارغة حالياً</p>
      </div>
    `;
    document.getElementById('cart-total-price').textContent = '0 ريال';
    refreshIcons();
    return;
  }

  let total = 0;
  container.innerHTML = cart.map((item, index) => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    return `
      <div class="cart-row">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <span class="cart-item-price">${item.price} ريال</span>
          <div class="cart-qty-ctrl">
            <button onclick="window.changeCartQty(${index}, -1)">-</button>
            <span>${item.quantity}</span>
            <button onclick="window.changeCartQty(${index}, 1)">+</button>
          </div>
        </div>
        <button class="cart-del-btn" onclick="window.removeCartItem(${index})"><i data-lucide="trash-2"></i></button>
      </div>
    `;
  }).join('');

  document.getElementById('cart-total-price').textContent = `${total} ريال`;
  refreshIcons();
}

window.changeCartQty = (index, delta) => {
  const item = cart[index];
  const prod = allProducts.find(p => p.id === item.id);
  const maxStock = prod ? Number(prod.stock) : 99;

  if (item.quantity + delta > maxStock) {
    showToast('لا يمكن طلب كمية أكثر من المتوفر', true);
    return;
  }
  item.quantity += delta;
  if (item.quantity <= 0) {
    cart.splice(index, 1);
  }
  updateCartBadge();
  renderCart();
};

window.removeCartItem = (index) => {
  cart.splice(index, 1);
  updateCartBadge();
  renderCart();
  showToast('تم حذف المنتج من السلة');
};

// 9. البحث والربط مع القاموس
function initSearch() {
  const searchInput = document.getElementById('main-search-input');
  const searchSection = document.getElementById('search-results-section');
  const homeContent = document.getElementById('home-main-content');
  const grid = document.getElementById('search-results-grid');
  const emptyState = document.getElementById('search-empty-state');
  const countEl = document.getElementById('search-results-count');
  const clearBtn = document.getElementById('clear-search-btn');

  let debounceTimer;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value;

    if (query.trim()) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }

    debounceTimer = setTimeout(() => {
      if (!query.trim()) {
        searchSection.classList.add('hidden');
        homeContent.classList.remove('hidden');
        return;
      }

      // تشغيل محرك البحث العربي المطابق للقاموس
      const results = aiSafeSearch(allProducts, query);

      homeContent.classList.add('hidden');
      searchSection.classList.remove('hidden');

      if (results.length > 0) {
        emptyState.classList.add('hidden');
        countEl.textContent = `نتائج البحث (${results.length})`;
        grid.innerHTML = results.map(createProductCard).join('');
      } else {
        grid.innerHTML = '';
        countEl.textContent = 'نتائج البحث (0)';
        emptyState.classList.remove('hidden');
      }
      refreshIcons();
    }, 200);
  });

  clearBtn.onclick = () => {
    searchInput.value = '';
    clearBtn.classList.add('hidden');
    searchSection.classList.add('hidden');
    homeContent.classList.remove('hidden');
  };

  document.getElementById('close-search-btn').onclick = clearBtn.onclick;
}

// 10. إتمام الطلب الآمن (Order Safety)
async function submitOrder(type, customerData) {
  if (cart.length === 0) {
    showToast('السلة فارغة!', true);
    return;
  }

  // إعادة حساب الإجمالي من المنتجات الأصلية منعاً للتلاعب
  let verifiedTotal = 0;
  const verifiedItems = [];

  for (const cItem of cart) {
    const original = allProducts.find(p => p.id === cItem.id);
    if (!original || original.stock < cItem.quantity) {
      showToast(`عذراً، المنتج "${cItem.name}" غير متوفر بالكمية المطلوبة`, true);
      return;
    }
    const realPrice = original.saleEnabled ? Number(original.salePrice) : Number(original.price);
    verifiedTotal += realPrice * cItem.quantity;
    verifiedItems.push({
      productId: original.id,
      name: original.name,
      price: realPrice,
      quantity: cItem.quantity
    });
  }

  const orderData = {
    customerName: customerData.name,
    phone: customerData.phone,
    location: customerData.location || "استلام من المحل - تريم",
    type: type, // 'pickup' أو 'delivery'
    items: verifiedItems,
    total: verifiedTotal,
    status: type === 'pickup' ? 'تم حجز الكمية' : 'جديد',
    createdAt: serverTimestamp(),
    deliveryTime: "سيتم تحديده قريباً من الإدارة"
  };

  try {
    const ordersRef = ref(db, 'orders');
    const newOrderRef = push(ordersRef);
    await set(newOrderRef, orderData);

    // حفظ رقم الطلب في المشتريات السابقة محلياً
    const myOrders = JSON.parse(localStorage.getItem('anwar_my_orders') || '[]');
    myOrders.push(newOrderRef.key);
    localStorage.setItem('anwar_my_orders', JSON.stringify(myOrders));

    // تفريغ السلة
    cart = [];
    updateCartBadge();
    document.getElementById('checkout-modal').classList.add('hidden');
    document.getElementById('cart-modal').classList.add('hidden');

    if (type === 'pickup') {
      showToast('تم حجز الكمية بنجاح! موقعنا: تريم - عمائر باهاني');
    } else {
      showToast('تم تأكيد الطلب! جارٍ تجهيز طلبك للتوصيل');
    }
  } catch (err) {
    showToast('تعذر إرسال الطلب، تحقق من الاتصال بالإنترنت', true);
  }
}

// 11. المستمعات العامة للأحداث والتنقل
document.addEventListener('DOMContentLoaded', () => {
  handleIntro();
  updateCartBadge();
  initFirebaseListeners();
  initSearch();

  // النقر داخل بطاقات المنتجات
  document.addEventListener('click', (e) => {
    const openTrigger = e.target.closest('[data-action="open"]');
    if (openTrigger) {
      const id = openTrigger.getAttribute('data-id');
      openProductDetails(id);
      return;
    }

    const favTrigger = e.target.closest('[data-action="fav"]');
    if (favTrigger) {
      const id = favTrigger.getAttribute('data-id');
      if (favorites.has(id)) {
        favorites.delete(id);
        favTrigger.classList.remove('active');
        showToast('تمت إزالة المنتج من المفضلة');
      } else {
        favorites.add(id);
        favTrigger.classList.add('active');
        showToast('تمت إضافة المنتج إلى المفضلة');
      }
      localStorage.setItem('anwar_favs', JSON.stringify(Array.from(favorites)));
      return;
    }

    const shareTrigger = e.target.closest('[data-action="share"]');
    if (shareTrigger) {
      const id = shareTrigger.getAttribute('data-id');
      const prod = allProducts.find(p => p.id === id);
      const url = window.location.href;
      if (navigator.share) {
        navigator.share({
          title: prod ? prod.name : 'محلات أنوار طيبة',
          text: `شاهد هذا المنتج الرائع من محلات أنوار طيبة: ${prod ? prod.name : ''}`,
          url: url
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url);
        showToast('تم نسخ رابط المنتج');
      }
      return;
    }
  });

  // التنقل السفلي (Bottom Navigation)
  document.getElementById('nav-cart').onclick = () => {
    renderCart();
    document.getElementById('cart-modal').classList.remove('hidden');
  };

  document.getElementById('nav-favorites').onclick = () => {
    updateFavoritesView();
    document.getElementById('favorites-modal').classList.remove('hidden');
  };

  document.getElementById('nav-contact').onclick = () => {
    document.getElementById('contact-modal').classList.remove('hidden');
  };

  document.getElementById('close-cart-btn').onclick = () => {
    document.getElementById('cart-modal').classList.add('hidden');
  };

  document.getElementById('close-modal-btn').onclick = () => {
    document.getElementById('product-modal').classList.add('hidden');
  };

  document.getElementById('close-fav-btn').onclick = () => {
    document.getElementById('favorites-modal').classList.add('hidden');
  };

  document.getElementById('close-contact-btn').onclick = () => {
    document.getElementById('contact-modal').classList.add('hidden');
  };

  // شاشة الدفع
  document.getElementById('open-checkout-btn').onclick = () => {
    if (cart.length === 0) return;
    document.getElementById('checkout-modal').classList.remove('hidden');
  };

  document.getElementById('close-checkout-btn').onclick = () => {
    document.getElementById('checkout-modal').classList.add('hidden');
  };

  // تبديل خيارات الاستلام
  const tabPickup = document.getElementById('tab-pickup');
  const tabDelivery = document.getElementById('tab-delivery');
  const pickupView = document.getElementById('pickup-view');
  const deliveryView = document.getElementById('delivery-view');

  tabPickup.onclick = () => {
    tabPickup.classList.add('active');
    tabDelivery.classList.remove('active');
    pickupView.classList.remove('hidden');
    deliveryView.classList.add('hidden');
  };

  tabDelivery.onclick = () => {
    tabDelivery.classList.add('active');
    tabPickup.classList.remove('active');
    deliveryView.classList.remove('hidden');
    pickupView.classList.add('hidden');
  };

  // إرسال طلب المحل
  document.getElementById('pickup-form').onsubmit = (e) => {
    e.preventDefault();
    submitOrder('pickup', {
      name: document.getElementById('pickup-name').value,
      phone: document.getElementById('pickup-phone').value,
      location: "استلام المحل: تريم - عمائر باهاني"
    });
  };

  // إرسال طلب الموصل
  document.getElementById('delivery-form').onsubmit = (e) => {
    e.preventDefault();
    submitOrder('delivery', {
      name: document.getElementById('del-name').value,
      phone: document.getElementById('del-phone').value,
      location: `${document.getElementById('del-area').value} - ${document.getElementById('del-notes').value}`
    });
  };

  // عرض المشتريات السابقة
  document.getElementById('view-orders-history-btn').onclick = loadOrdersHistory;
  document.getElementById('close-history-btn').onclick = () => {
    document.getElementById('history-modal').classList.add('hidden');
  };
});

// تحديث وعرض المفضلة
function updateFavoritesView() {
  const container = document.getElementById('favorites-grid');
  if (!container) return;
  const favItems = allProducts.filter(p => favorites.has(p.id));

  if (favItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: span 2;">
        <i data-lucide="heart-off" class="empty-icon"></i>
        <p>لا توجد منتجات في المفضلة بعد</p>
      </div>
    `;
  } else {
    container.innerHTML = favItems.map(createProductCard).join('');
  }
  refreshIcons();
}

// استعلام المشتريات السابقة
function loadOrdersHistory() {
  const myOrderIds = JSON.parse(localStorage.getItem('anwar_my_orders') || '[]');
  const container = document.getElementById('history-container');
  const historyModal = document.getElementById('history-modal');

  historyModal.classList.remove('hidden');

  if (myOrderIds.length === 0) {
    container.innerHTML = `<p class="empty-state">لا توجد طلبات سابقة مسجلة على هذا الجهاز.</p>`;
    return;
  }

  container.innerHTML = '<p style="text-align:center; padding:15px;">جارٍ تحميل سجل الطلبات...</p>';

  const ordersRef = ref(db, 'orders');
  onValue(ordersRef, (snapshot) => {
    const data = snapshot.val() || {};
    const relevant = myOrderIds.map(id => ({ id, ...data[id] })).filter(o => o.customerName);

    if (relevant.length === 0) {
      container.innerHTML = `<p class="empty-state">لم نجد طلبات سابقة مرتبطة.</p>`;
      return;
    }

    container.innerHTML = relevant.map(order => `
      <div class="history-card">
        <div class="history-head">
          <span>طلب رقم: #${order.id.slice(-5)}</span>
          <span class="status-badge ${order.status}">${order.status}</span>
        </div>
        <p><strong>الإجمالي:</strong> ${order.total} ريال</p>
        <p><strong>نوع الاستلام:</strong> ${order.type === 'pickup' ? 'استلام من المحل' : 'توصيل عبر موصل'}</p>
        <p class="history-del-time"><strong>موعد التوصيل:</strong> ${order.deliveryTime || 'قيد المعالجة'}</p>
      </div>
    `).join('');
  }, { onlyOnce: true });
}