<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>لوحة التحكم | محلات أنوار طيبة</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>

  <style>
    :root {
      --bg: #000B1E;
      --card: #0A1E4A;
      --blue: #2563EB;
      --text: #FFF;
      --border: rgba(255,255,255,0.1);
    }
    * { box-sizing: border-box; margin:0; padding:0; font-family:'Cairo',sans-serif; }
    body { background: var(--bg); color: var(--text); direction: rtl; }
    .hidden { display: none !important; }

    /* شاشة الدخول */
    .login-box {
      position: fixed; inset:0; background: radial-gradient(circle, #071E54, #000814);
      display:flex; align-items:center; justify-content:center; z-index:9999;
    }
    .login-card {
      background: var(--card); padding:30px; border-radius:16px; border:1px solid var(--border);
      width: 90%; max-width: 360px; text-align: center;
    }
    .login-card input {
      width:100%; padding:12px; margin:15px 0; border-radius:8px; border:1px solid var(--border);
      background:#031435; color:#FFF; font-size:1rem; text-align:center;
    }

    /* تخطيط الإدارة */
    .admin-nav {
      display: flex; gap: 8px; padding: 12px; background: #031435; border-bottom: 1px solid var(--border);
      overflow-x: auto;
    }
    .admin-nav button {
      background: none; border: 1px solid var(--border); color: #94A3B8; padding: 8px 14px;
      border-radius: 8px; cursor: pointer; white-space: nowrap; font-weight: 700;
    }
    .admin-nav button.active { background: var(--blue); color: #FFF; border-color: var(--blue); }

    .main-admin { padding: 16px; }
    .btn-add { background: var(--blue); color: #FFF; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; margin-bottom: 14px; }
    
    .prod-table { width: 100%; border-collapse: collapse; background: var(--card); border-radius: 10px; overflow: hidden; }
    .prod-table th, .prod-table td { padding: 10px; border-bottom: 1px solid var(--border); font-size: 0.85rem; text-align: right; }
    .prod-table img { width: 44px; height: 44px; border-radius: 6px; object-fit: cover; }

    /* Modal Form */
    .modal-admin { position: fixed; inset:0; background: rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:10000; }
    .form-card { background: var(--card); padding: 20px; border-radius: 14px; width: 92%; max-width: 450px; max-height: 90vh; overflow-y: auto; }
    .form-card input, .form-card select, .form-card textarea { width: 100%; padding: 10px; margin-bottom: 10px; border-radius: 8px; border: 1px solid var(--border); background:#020E26; color:#FFF; }
  </style>
</head>
<body>

  <!-- شاشة الدخول بكلمة المرور 11223344 -->
  <div id="login-box" class="login-box">
    <div class="login-card">
      <img src="assets/LOGO.PNG" style="height:48px; margin-bottom:12px;" onerror="this.src='https://placehold.co/120x45/001A3F/FFF?text=أنوار+طيبة'">
      <h3>محلات أنوار طيبة - الإدارة</h3>
      <input type="password" id="admin-pass-input" placeholder="أدخل كلمة المرور (11223344)">
      <button class="btn-add" style="width:100%;" id="admin-login-btn">تسجيل الدخول</button>
    </div>
  </div>

  <div id="admin-panel" class="hidden">
    <!-- الشريط العلوي والتنقل بين الأقسام الـ 3 المحددة -->
    <nav class="admin-nav">
      <button class="active" id="tab-p">1. المنتجات والإضافة</button>
      <button id="tab-b">2. إضافة صور (البانرات)</button>
      <button id="tab-o">3. الموصلين والطلبات</button>
      <a href="index.html" target="_blank" style="margin-right:auto; color:#38BDF8; text-decoration:none; padding:8px;">عرض المتجر</a>
    </nav>

    <main class="main-admin">
      <!-- القسم 1: المنتجات -->
      <section id="sec-products">
        <button class="btn-add" id="btn-open-add-modal">+ إضافة منتج جديد</button>
        <table class="prod-table">
          <thead>
            <tr>
              <th>الصورة</th>
              <th>الاسم</th>
              <th>السعر</th>
              <th>الخيارات</th>
            </tr>
          </thead>
          <tbody id="admin-prod-tbody"></tbody>
        </table>
      </section>

      <!-- القسم 2: البانرات -->
      <section id="sec-banners" class="hidden">
        <h3>سلايدر الصفحة الرئيسية</h3>
        <div style="background:var(--card); padding:14px; border-radius:10px; margin:12px 0;">
          <input type="text" id="banner-title" placeholder="عنوان البانر" style="width:100%; padding:8px; margin-bottom:8px; border-radius:6px; background:#020E26; color:#FFF; border:1px solid var(--border);">
          <input type="file" id="banner-file" style="margin-bottom:8px;">
          <button class="btn-add" id="upload-banner-btn">رفع البانر</button>
        </div>
        <div id="banners-list-admin"></div>
      </section>

      <!-- القسم 3: الموصلين والطلبات -->
      <section id="sec-orders" class="hidden">
        <h3>إدارة الطلبات والموصلين</h3>
        <div id="admin-orders-container"></div>
      </section>
    </main>
  </div>

  <!-- نافذة إضافة وتعديل المنتج -->
  <div id="admin-modal" class="modal-admin hidden">
    <div class="form-card">
      <h3 style="margin-bottom:12px;">إضافة / تعديل منتج</h3>
      <input type="hidden" id="edit-prod-id">
      
      <label>اسم المنتج:</label>
      <input type="text" id="p-name" required placeholder="مثال: ساعة ذكية مقاومة للماء">

      <label>الوصف:</label>
      <textarea id="p-desc" rows="3" placeholder="اكتب وصف ومواصفات المنتج"></textarea>

      <label>النوع (اختر من 1 إلى 3 فقط كحد أقصى):</label>
      <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;" id="cat-checkboxes">
        <label><input type="checkbox" value="الأجهزة المنزلية اليومية"> الأجهزة المنزلية اليومية</label>
        <label><input type="checkbox" value="الأجهزة الإلكترونية"> الأجهزة الإلكترونية</label>
        <label><input type="checkbox" value="الساعات وغيرها"> الساعات وغيرها</label>
        <label><input type="checkbox" value="الكهربائيات"> الكهربائيات</label>
        <label><input type="checkbox" value="أجهزة المطبخ"> أجهزة المطبخ</label>
      </div>

      <label>السعر (ريال):</label>
      <input type="number" id="p-price" required>

      <label>هل هنالك عرض؟</label>
      <select id="p-sale-toggle">
        <option value="no">لا</option>
        <option value="yes">نعم</option>
      </select>

      <div id="sale-details" class="hidden">
        <label>سعر العرض:</label>
        <input type="number" id="p-sale-price">
        <label>مدة العرض:</label>
        <select id="p-sale-duration">
          <option value="1 ساعة">1 ساعة</option>
          <option value="ساعتان">ساعتان</option>
          <option value="5 ساعات">5 ساعات</option>
          <option value="يوم">يوم</option>
          <option value="يومان">يومان</option>
          <option value="أسبوع">أسبوع</option>
          <option value="شهر">شهر</option>
          <option value="إلى الأبد">إلى الأبد</option>
        </select>
      </div>

      <label>رفع الصور من ImageKit (اختر صور متعددة):</label>
      <input type="file" id="p-images-file" multiple>
      <div id="upload-status" style="font-size:0.8rem; color:#38BDF8; margin-bottom:8px;"></div>

      <label>ملاحظات:</label>
      <input type="text" id="p-notes" placeholder="ملاحظات تظهر للعميل">

      <div style="display:flex; gap:10px; margin-top:14px;">
        <button class="btn-add" style="flex:1;" id="save-prod-btn">حفظ المنتج</button>
        <button class="btn-add" style="background:#64748B;" id="close-modal-btn">إلغاء</button>
      </div>
    </div>
  </div>

  <script>
    // إعدادات Firebase الخاصة بك
    var firebaseConfig = {
      apiKey: "AIzaSyAYA6S6xwjQcqP28M95QhCZiUg0QtIcDeY",
      authDomain: "taibah-79196.firebaseapp.com",
      databaseURL: "https://taibah-79196-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "taibah-79196",
      storageBucket: "taibah-79196.firebasestorage.app",
      messagingSenderId: "742194490140",
      appId: "1:742194490140:web:4862e4ff96ca3ed84628d9"
    };
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    var db = firebase.database();

    // إعدادات ImageKit الخاصة بك
    var IK_ENDPOINT = "https://upload.imagekit.io/api/v1/files/upload";
    var IK_PRIVATE = "private_2Hrx1ZE4YUHcuNTGxDhKvUcewp8=";

    var uploadedImageUrls = [];

    // التحقق من الدخول (11223344)
    document.getElementById('admin-login-btn').onclick = function() {
      var pass = document.getElementById('admin-pass-input').value;
      if (pass === '11223344') {
        document.getElementById('login-box').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        initAdminData();
      } else {
        alert('كلمة المرور غير صحيحة!');
      }
    };

    // منع اختيار أكثر من 3 تصنيفات
    var boxes = document.querySelectorAll('#cat-checkboxes input');
    boxes.forEach(function(b) {
      b.onchange = function() {
        var checked = document.querySelectorAll('#cat-checkboxes input:checked').length;
        if (checked > 3) {
          b.checked = false;
          alert('الحد الأقصى هو 3 تصنيفات فقط لكل منتج!');
        }
      };
    });

    document.getElementById('p-sale-toggle').onchange = function(e) {
      if (e.target.value === 'yes') {
        document.getElementById('sale-details').classList.remove('hidden');
      } else {
        document.getElementById('sale-details').classList.add('hidden');
      }
    };

    // رفع الصور إلى ImageKit
    document.getElementById('p-images-file').onchange = function(e) {
      var files = Array.from(e.target.files);
      var status = document.getElementById('upload-status');
      uploadedImageUrls = [];
      status.textContent = 'جارٍ رفع الصور إلى ImageKit...';

      var uploadPromises = files.map(function(file) {
        var formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);

        return fetch(IK_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(IK_PRIVATE + ':')
          },
          body: formData
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data && data.url) {
            uploadedImageUrls.push(data.url);
          }
        });
      });

      Promise.all(uploadPromises).then(function() {
        status.textContent = 'تم رفع ' + uploadedImageUrls.length + ' صور بنجاح!';
      }).catch(function() {
        status.textContent = 'فشل الرفع، تم التحويل للروابط البديلة.';
      });
    };

    // مزامنة وعرض بيانات الإدارة
    function initAdminData() {
      // جلب المنتجات
      db.ref('products').on('value', function(snap) {
        var data = snap.val() || {};
        var tbody = document.getElementById('admin-prod-tbody');
        tbody.innerHTML = Object.keys(data).map(function(k) {
          var p = data[k];
          return `
            <tr>
              <td><img src="${p.mainImage || 'assets/LOGO.PNG'}"></td>
              <td><strong>${p.name}</strong></td>
              <td>${p.price} ريال</td>
              <td>
                <button onclick="editProduct('${k}')" style="color:#38BDF8; background:none; border:none; cursor:pointer;">تعديل</button> | 
                <button onclick="deleteProduct('${k}')" style="color:#EF4444; background:none; border:none; cursor:pointer;">حذف</button>
              </td>
            </tr>
          `;
        }).join('');
      });

      // جلب الطلبات
      db.ref('orders').on('value', function(snap) {
        var data = snap.val() || {};
        var container = document.getElementById('admin-orders-container');
        container.innerHTML = Object.keys(data).map(function(k) {
          var o = data[k];
          return `
            <div style="background:var(--card); padding:12px; border-radius:10px; margin-bottom:10px; border:1px solid var(--border);">
              <div style="display:flex; justify-content:space-between;">
                <strong>طلب #${k.slice(-5)} - ${o.customerName}</strong>
                <span style="color:#38BDF8;">${o.total} ريال</span>
              </div>
              <p>الهاتف: ${o.phone} | العنوان: ${o.location}</p>
              <p>النوع: ${o.type === 'pickup' ? 'استلام من المحل' : 'موصل'}</p>
              
              <div style="margin-top:8px; display:flex; gap:10px;">
                <select onchange="updateOrderStatus('${k}', this.value)" style="padding:6px; background:#000B1E; color:#FFF; border-radius:6px;">
                  <option value="جديد" ${o.status==='جديد'?'selected':''}>جديد</option>
                  <option value="تم حجز الكمية" ${o.status==='تم حجز الكمية'?'selected':''}>تم حجز الكمية</option>
                  <option value="قيد التجهيز للتوصيل" ${o.status==='قيد التجهيز للتوصيل'?'selected':''}>قيد التجهيز للتوصيل</option>
                  <option value="خرج للتوصيل" ${o.status==='خرج للتوصيل'?'selected':''}>خرج للتوصيل</option>
                  <option value="تم التوصيل" ${o.status==='تم التوصيل'?'selected':''}>تم التوصيل</option>
                </select>
                <button onclick="setDeliveryPrompt('${k}')" style="padding:6px 12px; background:var(--blue); border:none; color:#FFF; border-radius:6px; cursor:pointer;">تحديد موعد التوصيل</button>
              </div>
              <small style="color:#F59E0B; margin-top:4px; display:block;">الموعد المحدد: ${o.deliveryTime || 'غير محدد'}</small>
            </div>
          `;
        }).join('');
      });
    }

    // حفظ المنتج
    document.getElementById('save-prod-btn').onclick = function() {
      var checkedCats = Array.from(document.querySelectorAll('#cat-checkboxes input:checked')).map(function(c) { return c.value; });
      if (checkedCats.length === 0) {
        alert('يجب اختيار قسم واحد على الأقل!');
        return;
      }

      var id = document.getElementById('edit-prod-id').value;
      var isSale = document.getElementById('p-sale-toggle').value === 'yes';

      var prodData = {
        name: document.getElementById('p-name').value,
        description: document.getElementById('p-desc').value,
        categories: checkedCats,
        price: Number(document.getElementById('p-price').value),
        saleEnabled: isSale,
        salePrice: isSale ? Number(document.getElementById('p-sale-price').value) : null,
        saleDuration: isSale ? document.getElementById('p-sale-duration').value : null,
        notes: document.getElementById('p-notes').value,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : ['assets/LOGO.PNG'],
        mainImage: uploadedImageUrls[0] || 'assets/LOGO.PNG'
      };

      if (id) {
        db.ref('products/' + id).update(prodData);
      } else {
        db.ref('products').push(prodData);
      }

      document.getElementById('admin-modal').classList.add('hidden');
      alert('تم حفظ المنتج بنجاح في المتجر!');
    };

    window.deleteProduct = function(id) {
      if (confirm('هل أنت متأكد من حذف المنتج؟')) {
        db.ref('products/' + id).remove();
      }
    };

    window.updateOrderStatus = function(id, val) {
      db.ref('orders/' + id).update({ status: val });
    };

    window.setDeliveryPrompt = function(id) {
      var time = prompt('أدخل موعد التوصيل للعميل (مثال: اليوم بين 6:00 - 8:00 مساءً):');
      if (time) {
        db.ref('orders/' + id).update({ deliveryTime: time });
      }
    };

    // التنقل بين الأقسام الـ 3
    document.getElementById('tab-p').onclick = function() {
      document.getElementById('sec-products').classList.remove('hidden');
      document.getElementById('sec-banners').classList.add('hidden');
      document.getElementById('sec-orders').classList.add('hidden');
      this.classList.add('active');
      document.getElementById('tab-b').classList.remove('active');
      document.getElementById('tab-o').classList.remove('active');
    };
    document.getElementById('tab-b').onclick = function() {
      document.getElementById('sec-products').classList.add('hidden');
      document.getElementById('sec-banners').classList.remove('hidden');
      document.getElementById('sec-orders').classList.add('hidden');
      this.classList.add('active');
      document.getElementById('tab-p').classList.remove('active');
      document.getElementById('tab-o').classList.remove('active');
    };
    document.getElementById('tab-o').onclick = function() {
      document.getElementById('sec-products').classList.add('hidden');
      document.getElementById('sec-banners').classList.add('hidden');
      document.getElementById('sec-orders').classList.remove('hidden');
      this.classList.add('active');
      document.getElementById('tab-p').classList.remove('active');
      document.getElementById('tab-b').classList.remove('active');
    };

    document.getElementById('btn-open-add-modal').onclick = function() {
      document.getElementById('edit-prod-id').value = '';
      document.getElementById('admin-modal').classList.remove('hidden');
    };
    document.getElementById('close-modal-btn').onclick = function() {
      document.getElementById('admin-modal').classList.add('hidden');
    };
  </script>
</body>
</html>
