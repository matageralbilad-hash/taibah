/**
 * التطبيق الرئيسي لمحلات أنوار طيبة - متصل مباشرة بفايربيس الخاص بك
 */

// إعدادات فايربيس المباشرة الخاصة بك
var firebaseConfig = {
  apiKey: "AIzaSyAYA6S6xwjQcqP28M95QhCZiUg0QtIcDeY",
  authDomain: "taibah-79196.firebaseapp.com",
  databaseURL: "https://taibah-79196-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "taibah-79196",
  storageBucket: "taibah-79196.firebasestorage.app",
  messagingSenderId: "742194490140",
  appId: "1:742194490140:web:4862e4ff96ca3ed84628d9"
};

// تهيئة فايربيس
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
var db = firebase.database();

// الحالة العامة
var allProducts = [];
var allBanners = [];
var cart = JSON.parse(localStorage.getItem('taiba_cart') || '[]');
var favorites = new Set(JSON.parse(localStorage.getItem('taiba_favs') || '[]'));

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function showToast(msg) {
  var box = document.getElementById('toast-box');
  var toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.textContent = msg;
  box.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 2500);
}

// 1. شاشة البداية السريعة (تغلق تلقائياً بعد 1.5 ثانية)
function initIntro() {
  var intro = document.getElementById('intro-screen');
  setTimeout(function() {
    intro.classList.add('hide');
    setTimeout(function() { intro.style.display = 'none'; }, 400);
  }, 1500);
}

// 2. تحديث شارة السلة
function updateCartBadge() {
  var count = cart.reduce(function(acc, i) { return acc + i.qty; }, 0);
  document.getElementById('cart-counter').textContent = count;
  localStorage.setItem('taiba_cart', JSON.stringify(cart));
}

// 3. الاستماع لقاعدة بيانات فايربيس الحية
function listenFirebase() {
  // جلب المنتجات
  db.ref('products').on('value', function(snapshot) {
    var val = snapshot.val();
    allProducts = [];
    if (val) {
      Object.keys(val).forEach(function(k) {
        allProducts.push(Object.assign({ id: k }, val[k]));
      });
    }
    renderShelves();
  });

  // جلب البانرات
  db.ref('banners').on('value', function(snapshot) {
    var val = snapshot.val();
    if (val) {
      allBanners = Object.keys(val).map(function(k) { return val[k]; });
      renderBanners();
    }
  });
}

// 4. رسم البانرات
function renderBanners() {
  var track = document.getElementById('slider-track');
  if (allBanners.length === 0) return;

  track.innerHTML = allBanners.map(function(b, idx) {
    return `
      <div class="slide-item ${idx === 0 ? 'active' : ''}">
        <img src="${b.image}" alt="">
        <div class="slide-text">
          <h3>${b.title || ''}</h3>
        </div>
      </div>
    `;
  }).join('');
}

// 5. رسم بطاقة منتج
function buildProductCard(prod) {
  var isFav = favorites.has(prod.id);
  var hasSale = prod.saleEnabled && Number(prod.salePrice) > 0;
  var displayPrice = hasSale ? prod.salePrice : prod.price;

  // أول 10 كلمات من الوصف
  var words = (prod.description || '').split(' ');
  var shortDesc = words.slice(0, 10).join(' ') + (words.length > 10 ? '...' : '');

  var img = prod.mainImage || (prod.images && prod.images[0]) || 'assets/LOGO.PNG';

  return `
    <div class="product-card" data-id="${prod.id}">
      <button class="btn-fav ${isFav ? 'active' : ''}" onclick="toggleFavorite('${prod.id}')">
        <i data-lucide="heart"></i>
      </button>
      <div class="card-img-holder" onclick="openDetails('${prod.id}')">
        <img src="${img}" alt="${prod.name}">
      </div>
      <h4 class="card-title" onclick="openDetails('${prod.id}')">${prod.name}</h4>
      <p class="card-desc">${shortDesc}</p>
      <div class="card-pricing">
        <span class="price-main">${displayPrice} ريال</span>
        ${hasSale ? `<span class="price-sale-old">${prod.price} ريال</span>` : ''}
      </div>
      <div class="card-btns-row">
        <button class="btn-open" onclick="openDetails('${prod.id}')">افتح</button>
        <button class="btn-share" onclick="shareProduct('${prod.id}')"><i data-lucide="share-2"></i></button>
      </div>
    </div>
  `;
}

// 6. توزيع المنتجات على الرفوف الـ 5
function renderShelves() {
  var shelves = {
    'الأجهزة المنزلية اليومية': document.getElementById('shelf-home'),
    'الأجهزة الإلكترونية': document.getElementById('shelf-electronics'),
    'الساعات وغيرها': document.getElementById('shelf-watches'),
    'الكهربائيات': document.getElementById('shelf-electrical'),
    'أجهزة المطبخ': document.getElementById('shelf-kitchen')
  };

  Object.values(shelves).forEach(function(el) { if (el) el.innerHTML = ''; });

  allProducts.forEach(function(prod) {
    (prod.categories || []).forEach(function(cat) {
      if (shelves[cat]) {
        shelves[cat].insertAdjacentHTML('beforeend', buildProductCard(prod));
      }
    });
  });

  refreshIcons();
}

// 7. فتح تفاصيل المنتج
window.openDetails = function(id) {
  var prod = allProducts.find(function(p) { return p.id === id; });
  if (!prod) return;

  var body = document.getElementById('product-detail-body');
  var hasSale = prod.saleEnabled && Number(prod.salePrice) > 0;
  var displayPrice = hasSale ? prod.salePrice : prod.price;
  var images = prod.images && prod.images.length > 0 ? prod.images : [prod.mainImage || 'assets/LOGO.PNG'];

  body.innerHTML = `
    <div style="text-align:center; margin-bottom:12px;">
      <img id="detail-active-img" src="${images[0]}" style="width:100%; height:200px; object-fit:cover; border-radius:12px;">
      <div style="display:flex; gap:8px; margin-top:8px; overflow-x:auto;">
        ${images.map(function(im) {
          return `<img src="${im}" onclick="document.getElementById('detail-active-img').src='${im}'" style="width:48px; height:48px; border-radius:8px; object-fit:cover; cursor:pointer;">`;
        }).join('')}
      </div>
    </div>
    <h3 style="margin-bottom:6px;">${prod.name}</h3>
    <div style="margin-bottom:8px;">
      <span style="font-size:1.1rem; font-weight:800; color:#60A5FA;">${displayPrice} ريال</span>
      ${hasSale ? `<span style="text-decoration:line-through; color:#64748B; margin-right:8px;">${prod.price} ريال</span>` : ''}
    </div>
    <p style="font-size:0.85rem; color:#CBD5E1; margin-bottom:12px;">${prod.description || ''}</p>
    ${prod.notes ? `<p style="font-size:0.75rem; color:#F59E0B; margin-bottom:12px;">ملاحظة: ${prod.notes}</p>` : ''}
    
    <div style="display:flex; align-items:center; gap:12px; margin-top:16px;">
      <div style="display:flex; align-items:center; background:#0A1E4A; border-radius:8px; padding:4px 10px; gap:12px;">
        <button onclick="changeModalQty(-1)" style="background:none; border:none; color:#FFF; font-size:1.2rem; cursor:pointer;">-</button>
        <span id="modal-qty-val" style="font-weight:700;">1</span>
        <button onclick="changeModalQty(1)" style="background:none; border:none; color:#FFF; font-size:1.2rem; cursor:pointer;">+</button>
      </div>
      <button onclick="confirmAddToCart('${prod.id}')" class="btn-action buy" style="flex:1;">إضافة إلى السلة</button>
    </div>
  `;

  document.getElementById('product-modal').classList.remove('hidden');
  refreshIcons();
};

var modalCurrentQty = 1;
window.changeModalQty = function(d) {
  modalCurrentQty += d;
  if (modalCurrentQty < 1) modalCurrentQty = 1;
  document.getElementById('modal-qty-val').textContent = modalCurrentQty;
};

window.confirmAddToCart = function(id) {
  var prod = allProducts.find(function(p) { return p.id === id; });
  if (!prod) return;

  var existing = cart.find(function(i) { return i.id === id; });
  if (existing) {
    existing.qty += modalCurrentQty;
  } else {
    cart.push({
      id: prod.id,
      name: prod.name,
      price: prod.saleEnabled ? Number(prod.salePrice) : Number(prod.price),
      img: prod.mainImage || (prod.images && prod.images[0]) || 'assets/LOGO.PNG',
      qty: modalCurrentQty
    });
  }

  updateCartBadge();
  document.getElementById('product-modal').classList.add('hidden');
  modalCurrentQty = 1;
  showToast('تمت إضافة المنتج إلى السلة بنجاح');
};

// 8. المفضلة
window.toggleFavorite = function(id) {
  if (favorites.has(id)) {
    favorites.delete(id);
    showToast('تمت إزالة المنتج من المفضلة');
  } else {
    favorites.add(id);
    showToast('تمت إضافة المنتج إلى المفضلة');
  }
  localStorage.setItem('taiba_favs', JSON.stringify(Array.from(favorites)));
  renderShelves();
};

// 9. مشاركة المنتج
window.shareProduct = function(id) {
  var url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: 'محلات أنوار طيبة', url: url });
  } else {
    navigator.clipboard.writeText(url);
    showToast('تم نسخ الرابط بنجاح');
  }
};

// 10. تشغيل البحث
function setupSearch() {
  var input = document.getElementById('store-search-input');
  var clearBtn = document.getElementById('clear-search');
  var sec = document.getElementById('search-section');
  var grid = document.getElementById('search-grid');
  var empty = document.getElementById('search-empty');
  var home = document.getElementById('page-content');

  input.addEventListener('input', function() {
    var q = input.value.trim();
    if (q) {
      clearBtn.classList.remove('hidden');
      home.classList.add('hidden');
      sec.classList.remove('hidden');

      // استدعاء دالة البحث aiSafeSearch الصارمة
      var matchedIds = aiSafeSearch(allProducts, q);
      var matchedProducts = allProducts.filter(function(p) { return matchedIds.includes(p.id); });

      if (matchedProducts.length > 0) {
        empty.classList.add('hidden');
        grid.innerHTML = matchedProducts.map(buildProductCard).join('');
      } else {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
      }
      refreshIcons();
    } else {
      clearBtn.classList.add('hidden');
      sec.classList.add('hidden');
      home.classList.remove('hidden');
    }
  });

  clearBtn.onclick = function() {
    input.value = '';
    clearBtn.classList.add('hidden');
    sec.classList.add('hidden');
    home.classList.remove('hidden');
  };

  document.getElementById('close-search-sec').onclick = clearBtn.onclick;
}

// 11. السلة والشراء
function renderCart() {
  var body = document.getElementById('cart-items-body');
  if (cart.length === 0) {
    body.innerHTML = '<p style="text-align:center; padding:20px; color:#94A3B8;">سلة الشراء فارغة</p>';
    document.getElementById('cart-total-val').textContent = '0 ريال';
    return;
  }

  var total = 0;
  body.innerHTML = cart.map(function(item, idx) {
    total += item.price * item.qty;
    return `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; background:#0A1E4A; padding:8px; border-radius:10px;">
        <img src="${item.img}" style="width:45px; height:45px; border-radius:8px; object-fit:cover;">
        <div style="flex:1;">
          <h5 style="font-size:0.85rem;">${item.name}</h5>
          <span style="font-size:0.8rem; color:#60A5FA;">${item.price} ريال</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button onclick="changeCartItemQty(${idx}, -1)" style="padding:2px 8px;">-</button>
          <span>${item.qty}</span>
          <button onclick="changeCartItemQty(${idx}, 1)" style="padding:2px 8px;">+</button>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('cart-total-val').textContent = total + ' ريال';
}

window.changeCartItemQty = function(idx, d) {
  cart[idx].qty += d;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  updateCartBadge();
  renderCart();
};

// 12. تجهيز الطلب وإرساله لـ Firebase
function submitOrder(type, data) {
  if (cart.length === 0) return;

  var total = cart.reduce(function(acc, i) { return acc + (i.price * i.qty); }, 0);
  var orderData = {
    customerName: data.name || "عميل استلام من المحل",
    phone: data.phone || "بدون هاتف",
    location: data.location || "تريم - السوق - عمائر باهاني",
    type: type,
    items: cart,
    total: total,
    status: type === 'pickup' ? 'تم حجز الكمية' : 'قيد التجهيز للتوصيل',
    deliveryTime: "سيحدده المسؤول قريباً",
    timestamp: Date.now()
  };

  db.ref('orders').push(orderData).then(function(res) {
    // حفظ الطلب محلياً للمشتريات السابقة
    var myOrders = JSON.parse(localStorage.getItem('taiba_my_orders') || '[]');
    myOrders.push(res.key);
    localStorage.setItem('taiba_my_orders', JSON.stringify(myOrders));

    cart = [];
    updateCartBadge();
    document.getElementById('checkout-modal').classList.add('hidden');
    document.getElementById('cart-modal').classList.add('hidden');

    if (type === 'pickup') {
      showToast('موقع المحل: تريم-السوق - عمائر باهاني. تم حجز الكمية بنجاح!');
    } else {
      showToast('تم تأكيد الطلب، جارٍ تجهيزه للتوصيل!');
    }
  });
}

// تشغيل كل الوظائف عند فتح الصفحة
document.addEventListener('DOMContentLoaded', function() {
  initIntro();
  updateCartBadge();
  listenFirebase();
  setupSearch();

  // أزرار الخانات الخمس
  document.getElementById('bnav-home').onclick = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  document.getElementById('bnav-cart').onclick = function() {
    renderCart();
    document.getElementById('cart-modal').classList.remove('hidden');
  };

  document.getElementById('bnav-favs').onclick = function() {
    var favGrid = document.getElementById('favs-grid');
    var favProds = allProducts.filter(function(p) { return favorites.has(p.id); });
    favGrid.innerHTML = favProds.map(buildProductCard).join('');
    document.getElementById('favs-modal').classList.remove('hidden');
    refreshIcons();
  };

  document.getElementById('bnav-contact').onclick = function() {
    document.getElementById('about-modal').classList.remove('hidden');
  };

  document.getElementById('bnav-about').onclick = function() {
    document.getElementById('about-modal').classList.remove('hidden');
  };

  // إغلاق النوافذ
  document.getElementById('close-prod-modal').onclick = function() { document.getElementById('product-modal').classList.add('hidden'); };
  document.getElementById('close-cart-modal').onclick = function() { document.getElementById('cart-modal').classList.add('hidden'); };
  document.getElementById('close-checkout-modal').onclick = function() { document.getElementById('checkout-modal').classList.add('hidden'); };
  document.getElementById('close-favs-modal').onclick = function() { document.getElementById('favs-modal').classList.add('hidden'); };
  document.getElementById('close-about-modal').onclick = function() { document.getElementById('about-modal').classList.add('hidden'); };
  document.getElementById('close-history-modal').onclick = function() { document.getElementById('history-modal').classList.add('hidden'); };

  // خيارات الشراء
  document.getElementById('btn-checkout-start').onclick = function() {
    if (cart.length === 0) { showToast('السلة فارغة!'); return; }
    document.getElementById('checkout-modal').classList.remove('hidden');
  };

  var tabPickup = document.getElementById('tab-opt-pickup');
  var tabDel = document.getElementById('tab-opt-del');
  var viewPickup = document.getElementById('view-pickup');
  var viewDel = document.getElementById('view-delivery');

  tabPickup.onclick = function() {
    tabPickup.classList.add('active');
    tabDel.classList.remove('active');
    viewPickup.classList.remove('hidden');
    viewDel.classList.add('hidden');
  };

  tabDel.onclick = function() {
    tabDel.classList.add('active');
    tabPickup.classList.remove('active');
    viewDel.classList.remove('hidden');
    viewPickup.classList.add('hidden');
  };

  document.getElementById('confirm-pickup-btn').onclick = function() {
    submitOrder('pickup', {});
  };

  document.getElementById('delivery-order-form').onsubmit = function(e) {
    e.preventDefault();
    submitOrder('delivery', {
      name: document.getElementById('del-name').value,
      phone: document.getElementById('del-phone').value,
      location: document.getElementById('del-loc').value
    });
  };

  // عرض المشتريات السابقة
  document.getElementById('btn-my-orders').onclick = function() {
    var myIds = JSON.parse(localStorage.getItem('taiba_my_orders') || '[]');
    var box = document.getElementById('history-items-body');
    document.getElementById('history-modal').classList.remove('hidden');

    if (myIds.length === 0) {
      box.innerHTML = '<p style="text-align:center; padding:15px; color:#94A3B8;">لا توجد مشتريات سابقة مسجلة</p>';
      return;
    }

    db.ref('orders').once('value', function(snap) {
      var orders = snap.val() || {};
      box.innerHTML = myIds.map(function(id) {
        var o = orders[id];
        if (!o) return '';
        return `
          <div style="background:#0A1E4A; padding:10px; border-radius:10px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <strong>طلب #${id.slice(-5)}</strong>
              <span style="color:#60A5FA;">${o.total} ريال</span>
            </div>
            <p style="font-size:0.8rem; color:#CBD5E1;">الحالة: <strong>${o.status}</strong></p>
            <p style="font-size:0.75rem; color:#F59E0B;">موعد التوصيل المتوقع: ${o.deliveryTime || 'قيد المراجعة'}</p>
          </div>
        `;
      }).join('');
    });
  };
});
