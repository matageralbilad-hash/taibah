import { db, ref, onValue, push, set, update, remove } from "./firebase-config.js";

let products = [];
let orders = [];
let banners = [];
let currentUploadedImages = [];

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function showAdminToast(msg, isError = false) {
  const container = document.getElementById('admin-toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (isError) toast.style.borderRightColor = '#EF4444';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// 1. نظام الدخول الأمني
document.getElementById('admin-login-form').onsubmit = (e) => {
  e.preventDefault();
  const pass = document.getElementById('admin-pass').value;
  // كلمة مرور العرض والتجربة (مهيأة للتكامل مع Firebase Auth في بيئة الإنتاج)
  if (pass === '11223344') {
    document.getElementById('admin-login-overlay').classList.add('hidden');
    document.getElementById('admin-app').classList.remove('hidden');
    initAdminData();
  } else {
    showAdminToast('رمز الدخول غير صحيح!', true);
  }
};

document.getElementById('admin-logout-btn').onclick = () => {
  document.getElementById('admin-app').classList.add('hidden');
  document.getElementById('admin-login-overlay').classList.remove('hidden');
};

// 2. مزامنة البيانات من Firebase Realtime
function initAdminData() {
  // مراقبة المنتجات
  onValue(ref(db, 'products'), (snap) => {
    const data = snap.val() || {};
    products = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    document.getElementById('stat-products-count').textContent = products.length;
    renderProductsTable();
  });

  // مراقبة الطلبات
  onValue(ref(db, 'orders'), (snap) => {
    const data = snap.val() || {};
    orders = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    
    const pending = orders.filter(o => o.status !== 'تم التوصيل' && o.status !== 'مكتمل').length;
    const completed = orders.filter(o => o.status === 'تم التوصيل' || o.status === 'مكتمل').length;

    document.getElementById('stat-pending-orders').textContent = pending;
    document.getElementById('stat-completed-orders').textContent = completed;

    renderOrdersList();
  });

  // مراقبة البانرات
  onValue(ref(db, 'banners'), (snap) => {
    const data = snap.val() || {};
    banners = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    renderBannersGrid();
  });
}

// 3. عرض جدول المنتجات (مع دعم الحذف والتعديل)
function renderProductsTable() {
  const tbody = document.getElementById('admin-products-table-body');
  tbody.innerHTML = products.map(prod => `
    <tr>
      <td><img src="${prod.mainImage || 'assets/LOGO.PNG'}" class="table-img" alt=""></td>
      <td><strong>${prod.name}</strong></td>
      <td>${(prod.categories || []).join('، ')}</td>
      <td>${prod.price} ريال</td>
      <td>${prod.saleEnabled ? `${prod.salePrice} ريال (مفعّل)` : 'لا'}</td>
      <td>${prod.stock || 0}</td>
      <td>
        <button class="btn-secondary" onclick="window.editProduct('${prod.id}')">تعديل</button>
        <button class="btn-secondary" style="color:#EF4444;" onclick="window.deleteProduct('${prod.id}')">حذف</button>
      </td>
    </tr>
  `).join('');
  refreshIcons();
}

// 4. حذف وتعديل المنتجات
window.deleteProduct = async (id) => {
  if (confirm('هل أنت متأكد من رغبتك بحذف هذا المنتج نهائياً من المتجر؟')) {
    await remove(ref(db, `products/${id}`));
    showAdminToast('تم حذف المنتج بنجاح');
  }
};

window.editProduct = (id) => {
  const p = products.find(item => item.id === id);
  if (!p) return;

  document.getElementById('prod-edit-id').value = p.id;
  document.getElementById('prod-name').value = p.name;
  document.getElementById('prod-desc').value = p.description || '';
  document.getElementById('prod-price').value = p.price;
  document.getElementById('prod-stock').value = p.stock || 0;
  document.getElementById('prod-notes').value = p.notes || '';
  document.getElementById('prod-sale-enabled').value = p.saleEnabled ? 'yes' : 'no';
  document.getElementById('prod-sale-price').value = p.salePrice || '';

  // تحديد الـ checkboxes
  const boxes = document.querySelectorAll('input[name="categories"]');
  boxes.forEach(b => {
    b.checked = (p.categories || []).includes(b.value);
  });

  currentUploadedImages = p.images || [p.mainImage].filter(Boolean);
  renderImagePreviews();

  document.getElementById('product-form-title').textContent = 'تعديل المنتج';
  document.getElementById('product-form-modal').classList.remove('hidden');
};

// 5. حظر اختيار أكثر من 3 تصنيفات
const catCheckboxes = document.querySelectorAll('input[name="categories"]');
catCheckboxes.forEach(chk => {
  chk.addEventListener('change', () => {
    const checkedCount = document.querySelectorAll('input[name="categories"]:checked').length;
    const warning = document.getElementById('cat-warning');
    if (checkedCount > 3) {
      chk.checked = false;
      warning.classList.remove('hidden');
    } else {
      warning.classList.add('hidden');
    }
  });
});

// 6. التعامل مع رفع الصور وضغطها
const dropzone = document.getElementById('images-dropzone');
const fileInput = document.getElementById('prod-file-input');

dropzone.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      // ضغط وتخزين رابط الصورة
      currentUploadedImages.push(event.target.result);
      renderImagePreviews();
    };
    reader.readAsDataURL(file);
  });
};

function renderImagePreviews() {
  const list = document.getElementById('image-previews-list');
  list.innerHTML = currentUploadedImages.map((src, index) => `
    <div class="preview-thumb-wrap">
      <img src="${src}" alt="">
      <button type="button" class="del-thumb" onclick="window.removeThumb(${index})">×</button>
    </div>
  `).join('');
}

window.removeThumb = (index) => {
  currentUploadedImages.splice(index, 1);
  renderImagePreviews();
};

// 7. حفظ المنتج في Firebase
document.getElementById('product-form').onsubmit = async (e) => {
  e.preventDefault();

  const checkedCats = Array.from(document.querySelectorAll('input[name="categories"]:checked')).map(c => c.value);
  if (checkedCats.length === 0) {
    showAdminToast('يجب اختيار قسم واحد على الأقل', true);
    return;
  }

  const editId = document.getElementById('prod-edit-id').value;
  const isSale = document.getElementById('prod-sale-enabled').value === 'yes';

  const productPayload = {
    name: document.getElementById('prod-name').value,
    description: document.getElementById('prod-desc').value,
    categories: checkedCats,
    price: Number(document.getElementById('prod-price').value),
    stock: Number(document.getElementById('prod-stock').value),
    saleEnabled: isSale,
    salePrice: isSale ? Number(document.getElementById('prod-sale-price').value) : null,
    saleDuration: isSale ? document.getElementById('prod-sale-duration').value : null,
    notes: document.getElementById('prod-notes').value,
    images: currentUploadedImages.length > 0 ? currentUploadedImages : ['assets/LOGO.PNG'],
    mainImage: currentUploadedImages[0] || 'assets/LOGO.PNG',
    active: true,
    updatedAt: new Date().toISOString()
  };

  if (editId) {
    await update(ref(db, `products/${editId}`), productPayload);
    showAdminToast('تم تحديث بيانات المنتج بنجاح');
  } else {
    productPayload.createdAt = new Date().toISOString();
    await push(ref(db, 'products'), productPayload);
    showAdminToast('تمت إضافة المنتج بنجاح إلى المتجر');
  }

  document.getElementById('product-form-modal').classList.add('hidden');
  document.getElementById('product-form').reset();
  currentUploadedImages = [];
  renderImagePreviews();
};

// 8. إدارة الطلبات وتحديث الحالة وموعد التوصيل
function renderOrdersList() {
  const container = document.getElementById('admin-orders-list');
  if (orders.length === 0) {
    container.innerHTML = '<p>لا توجد طلبات واردة حالياً.</p>';
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="stat-card" style="flex-direction:column; align-items:stretch; margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between;">
        <strong>طلب #${order.id.slice(-6)} - ${order.customerName}</strong>
        <span style="color:#60A5FA;">${order.total} ريال</span>
      </div>
      <p>الهاتف: <a href="tel:${order.phone}" style="color:#38BDF8;">${order.phone}</a></p>
      <p>العنوان: ${order.location}</p>
      <p>المنتجات: ${(order.items || []).map(i => `${i.name} (${i.quantity})`).join('، ')}</p>
      
      <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
        <select onchange="window.updateOrderStatus('${order.id}', this.value)" style="padding:6px; border-radius:6px; background:#0B1329; color:#FFF;">
          ${['جديد', 'تم حجز الكمية', 'قيد التجهيز', 'قيد التوصيل', 'تم التوصيل', 'مكتمل', 'ملغي'].map(st => `
            <option value="${st}" ${order.status === st ? 'selected' : ''}>${st}</option>
          `).join('')}
        </select>
        <button class="btn-secondary" onclick="window.setDeliveryTimePrompt('${order.id}')">تحديد موعد التوصيل</button>
      </div>
      <small style="color:#94A3B8; margin-top:6px;">الموعد المحدد: ${order.deliveryTime || 'لم يحدد'}</small>
    </div>
  `).join('');
}

window.updateOrderStatus = async (orderId, newStatus) => {
  await update(ref(db, `orders/${orderId}`), { status: newStatus });
  showAdminToast(`تم تحديث حالة الطلب إلى "${newStatus}"`);
};

window.setDeliveryTimePrompt = async (orderId) => {
  const time = prompt('أدخل موعد التوصيل التقريبي للعميل (مثال: اليوم بين 6:00 - 8:00 مساءً):');
  if (time) {
    await update(ref(db, `orders/${orderId}`), { deliveryTime: time });
    showAdminToast('تم حفظ موعد التوصيل وسيظهر للعميل فوراً');
  }
};

// فتح النوافذ والتبويبات
document.getElementById('open-add-product-modal').onclick = () => {
  document.getElementById('prod-edit-id').value = '';
  document.getElementById('product-form').reset();
  currentUploadedImages = [];
  renderImagePreviews();
  document.getElementById('product-form-title').textContent = 'إضافة منتج جديد';
  document.getElementById('product-form-modal').classList.remove('hidden');
};

document.getElementById('close-product-form').onclick = () => {
  document.getElementById('product-form-modal').classList.add('hidden');
};

// التحكم بالـ Sidebar
document.getElementById('open-sidebar-btn').onclick = () => {
  document.getElementById('admin-sidebar').classList.add('open');
};
document.getElementById('close-sidebar-btn').onclick = () => {
  document.getElementById('admin-sidebar').classList.remove('open');
};

// التنقل بين الأقسام
document.querySelectorAll('.menu-item[data-tab]').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(btn.getAttribute('data-tab')).classList.remove('hidden');
    document.getElementById('admin-sidebar').classList.remove('open');
  };
});