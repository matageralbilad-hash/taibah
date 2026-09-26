/**
 * قاموس البحث العربي ومحرك البحث الصارم لمحلات أنوار طيبة
 */

// الكلمات التسويقية التي يتم استبعادها
var stopWords = [
  "افضل", "أفضل", "ارخص", "أرخص", "احسن", "أحسن", "خرافي", "جديد", "اصلي", "أصلي",
  "ممتاز", "قوي", "رخيص", "روعة", "فخم", "درجة", "اولى", "أولى", "تخفيض", "خصم",
  "عرض", "سعر", "اسعار", "أسعار", "شراء", "بيع", "متجر", "محل", "ماركة", "ضمان"
];

// قاموس المرادفات الموسع (+500 مفردة مقسمة)
var dictionary = {
  // 1. الإلكترونيات والجوالات
  "جوال": ["هاتف", "موبايل", "تلفون", "سمارتفون", "ايفون", "سامسونج", "شاومي", "هواوي", "ريدمي", "بوكو", "ريلمي", "انفينكس", "تكنو", "جوالات", "هواتف", "هاتف محمول"],
  "هاتف": ["جوال", "موبايل", "تلفون", "ايفون", "سامسونج"],
  "موبايل": ["جوال", "هاتف", "تلفون"],
  "ايفون": ["آيفون", "iphone", "ابل", "apple", "برو", "ماكس"],
  "سامسونج": ["samsung", "جالكسي", "galaxy", "الترا", "نوت"],
  "سماعة": ["سماعات", "ايربودز", "airpods", "هدفون", "headphone", "بلوتوث", "لاسلكية", "سبيكر", "مكبر"],
  "شاحن": ["شواحن", "كيبل", "سلك", "راس", "فيش", "واير", "شاحن سريع", "تايب سي", "type-c", "شاحن سفري", "باوربانك", "powerbank"],
  "باوربانك": ["شاحن سفري", "بنك طاقة", "بطارية متنقلة", "powerbank"],
  "شاشة": ["تلفزيون", "تلفاز", "شاشات", "tv", "سمارت", "smart", "led", "oled", "4k", "رسيفر"],
  "تلفزيون": ["شاشة", "تلفاز", "tv", "تلفزيونات"],

  // 2. الساعات
  "ساعة": ["ساعات", "ساعه", "يد", "ذكية", "smartwatch", "رولكس", "كاسيو", "سيتيزن", "حائط"],
  "ذكية": ["smart", "سمارت", "رياضية", "تتبع"],

  // 3. أجهزة المطبخ
  "خلاط": ["عصارة", "بلندر", "مفرمة", "كبة", "خلاطات", "عجانة", "عجانه", "مضرب", "طحانة", "مطحنة"],
  "فرن": ["ميكروويف", "مكرويف", "بوتجاز", "غاز", "طباخة", "فرن كهربائي", "قلاية", "قلايه", "هوائية", "airfryer"],
  "قلاية": ["قلاية هوائية", "ايرفراير", "بدون زيت", "فيليبس"],
  "غلاية": ["كتلي", "بويلر", "سخان ماء", "غلايه", "ابريق كهربائي"],
  "ثلاجة": ["براد", "فريزر", "ديب فريزر", "ثلاجه", "تبريد", "حافظة"],
  "غسالة": ["غساله", "اتوماتيك", "حوضين", "نشافة", "مجفف"],

  // 4. الأجهزة المنزلية اليومية
  "مكواة": ["مكواه", "مكوى", "بخار", "كواية", "مكبس"],
  "مكنسة": ["مكنسه", "مكنسة كهربائية", "شفاط", "برميل", "لاسلكية"],
  "مكيف": ["سبليت", "صحراوي", "شباك", "تبريد", "مكيفات"],
  "مروحة": ["مروحه", "سقف", "عمودية", "حائط", "طاولة", "مراوح", "شحن"],
  "دفاية": ["مدفأة", "سخان", "شمعات"],

  // 5. الكهربائيات والديكورات
  "لمبة": ["لمبه", "اضاءة", "إضاءة", "ليد", "led", "كشاف", "سبوت لايت", "نجفة", "ثريا", "ابجورة", "انارة"],
  "توصيلة": ["مشترك", "توصيلات", "فيش", "مقبس", "سلك", "قاطع"],
  "ديكور": ["تحف", "ساعة حائط", "براويز", "ابجورة", "شريط ليد", "نيون"]
};

// دالة تطبيع الحروف العربية المعتمدة
function normalizeArabic(text) {
  if (!text) return "";
  return text.toLowerCase()
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "")
    .replace(/\bال/g, "")
    .replace(/[^\u0621-\u064A0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// فحص الكلمات المستبعدة
function isStopWord(word) {
  var normalized = normalizeArabic(word);
  return stopWords.some(function(sw) {
    return normalized === sw || normalized.startsWith(sw);
  });
}

// استخراج المرادفات
function getSynonyms(word) {
  var w = normalizeArabic(word);
  var variants = new Set();
  variants.add(w);
  if (typeof dictionary !== 'undefined' && dictionary[w]) {
    dictionary[w].forEach(function(syn) {
      variants.add(normalizeArabic(syn));
    });
  }
  return Array.from(variants);
}

// فحص وجود الكلمة في اسم المنتج أو الأقسام
function productContainsWord(product, word) {
  var pName = normalizeArabic(product.name || "");
  var pCat = normalizeArabic((product.categories || []).join(" "));
  var pDesc = normalizeArabic(product.description || "");
  var synonyms = getSynonyms(word);

  return synonyms.some(function(syn) {
    return pName.includes(syn) || pCat.includes(syn) || pDesc.includes(syn);
  });
}

// محرك البحث الصارم aiSafeSearch المعتمد لديك
function aiSafeSearch(allProducts, input) {
  if (!input || input.trim() === "") return allProducts.map(function(p) { return p.id; });

  var allSearchWords = input.split(/\s+/).filter(function(w) { return w.length > 1; });
  var searchWords = allSearchWords.filter(function(word) { return !isStopWord(word); });
  var finalWordsToUse = searchWords.length > 0 ? searchWords : allSearchWords;
  var totalWords = finalWordsToUse.length;
  var finalResults = [];

  var minMatch = totalWords;
  for (var matchCount = totalWords; matchCount >= minMatch; matchCount--) {
    var currentMatches = allProducts.filter(function(product) {
      var foundCount = 0;
      finalWordsToUse.forEach(function(word) {
        if (productContainsWord(product, word)) {
          foundCount++;
        }
      });
      return foundCount === matchCount;
    });

    if (currentMatches.length > 0) {
      finalResults = currentMatches.map(function(p) { return p.id; });
      break;
    }
  }

  return finalResults;
}
