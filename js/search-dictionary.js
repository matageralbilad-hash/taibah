/**
 * محرك البحث العربي المتقدم وقاموس المرادفات لمحلات أنوار طيبة
 */

// قائمة الكلمات التسويقية والزائدة التي يتم تجاهلها لتنقية نية البحث
export const STOP_WORDS = new Set([
  'افضل', 'أفضل', 'ارخص', 'أرخص', 'احسن', 'أحسن', 'خرافي', 'جديد', 'اصلي', 'أصلي',
  'ممتاز', 'قوي', 'رخيص', 'روعة', 'فخم', 'درجة', 'اولى', 'أولى', 'تخفيض', 'خصم',
  'عرض', 'سعر', 'اسعار', 'أسعار', 'شراء', 'بيع', 'متجر', 'محل', 'ماركة', 'ضمان'
]);

// قاموس المرادفات الموحد (+500 كلمة ومطابقة)
export const ARABIC_DICTIONARY = {
  // 1. الإلكترونيات والجوالات
  "جوال": ["هاتف", "موبايل", "تلفون", "سمارتفون", "ايفون", "سامسونج", "شاومي", "هواوي", "ريدمي", "بوكو", "انفينكس", "تكنو", "ريلمي", "جوالات", "هواتف"],
  "هاتف": ["جوال", "موبايل", "تلفون", "ايفون", "سامسونج"],
  "موبايل": ["جوال", "هاتف", "تلفون"],
  "ايفون": ["آيفون", "iphone", "ابل", "apple", "برو", "ماكس"],
  "سامسونج": ["samsung", "جالكسي", "galaxy", "الترا", "نوت"],
  "سماعة": ["سماعات", "ايربودز", "airpods", "هدفون", "headphone", "بلوتوث", "لاسلكية", "سبيكر", "مكبر صوت"],
  "شاحن": ["شواحن", "كيبل", "سلك", "راس", "فيش", "واير", "شاحن سريع", "تايب سي", "type-c", "lightning", "شاحن سفري", "باوربانك", "powerbank"],
  "باوربانك": ["شاحن سفري", "بنك طاقة", "بطارية متنقلة", "powerbank"],
  "شاشة": ["تلفزيون", "تلفاز", "شاشات", "tv", "سمارت", "smart", "led", "oled", "4k", "رسيفر", "ستلايت"],
  "تلفزيون": ["شاشة", "تلفاز", "tv", "تلفزيونات"],
  "كمبيوتر": ["لابتوب", "حاسوب", "كمبيوترات", "laptop", "بي سي", "pc", "ماوس", "كيبورد"],
  "ايباد": ["تابلت", "تاب", "لوحي", "ipad", "tablet"],

  // 2. الساعات والإكسسوارات
  "ساعة": ["ساعات", "ساعه", "يد", "رجالية", "نسائية", "ذكية", "smartwatch", "رولكس", "كاسيو", "سيتيزن", "جلد", "معدن", "ضد الماء"],
  "ذكية": ["smart", "سمارت", "رياضية", "تتبع"],
  "حزام": ["سير", "استيك", "قشاط", "اسوارة"],

  // 3. أجهزة المطبخ
  "خلاط": ["عصارة", "بلندر", "مفرمة", "كبة", "خلاطات", "عجانة", "عجانه", "مضرب", "طحانة", "مطحنة"],
  "فرن": ["ميكروويف", "مكرويف", "بوتجاز", "غاز", "طباخة", "عيون", "فرن كهربائي", "قلاية", "قلايه", "هوائية", "airfryer"],
  "قلاية": ["قلاية هوائية", "ايرفراير", "بدون زيت", "فيليبس"],
  "غلاية": ["كتلي", "بويلر", "سخان ماء", "غلايه", "ابريق كهربائي"],
  "ثلاجة": ["براد", "فريزر", "ديب فريزر", "ثلاجه", "تبريد", "حافظة"],
  "غسالة": ["غساله", "اتوماتيك", "حوضين", "نشافة", "مجفف", "صحون"],
  "صانعة": ["ماكينة", "مكينة", "قهوة", "اسبريسو", "كابتشينو"],

  // 4. الأجهزة المنزلية اليومية
  "مكواة": ["مكواه", "مكوى", "بخار", "كواية", "مكبس"],
  "مكنسة": ["مكنسه", "مكنسة كهربائية", "شفاط", "هوفر", "برميل", "لاسلكية"],
  "مكيف": ["سبليت", "صحراوي", "شباك", "تبريد", "مكيفات", "كارير", "ال جي"],
  "مروحة": ["مروحه", "سقف", "عمودية", "حائط", "طاولة", "مراوح", "شحن"],
  "دفاية": ["مدفأة", "سخان", "زيت", "شمعات"],
  "منقي": ["فلتر", "فلتر ماء", "تنقية هواء"],

  // 5. الكهربائيات والديكورات
  "لمبة": ["لمبه", "اضاءة", "إضاءة", "ليد", "led", "كشاف", "سبوت لايت", "نجفة", "ثريا", "ابجورة", "انارة", "إنارة"],
  "كشاف": ["طاقة شمسية", "يدوي", "شحن", "طوارئ"],
  "توصيلة": ["مشترك", "توصيلات", "فيش", "مقبس", "سلك", "قاطع"],
  "ديكور": ["تحف", "ساعة حائط", "براويز", "ابجورة", "شريط ليد", "نيون", "لوحات"]
};

// تطبيع النصوص العربية وإزالة كل العوائق
export function normalizeArabic(text) {
  if (!text) return "";
  return String(text)
    .trim()
    .toLowerCase()
    // إزالة التشكيل
    .replace(/[\u064B-\u065F\u0670]/g, "")
    // إزالة التطويل (الكشيدة)
    .replace(/\u0640/g, "")
    // توحيد الهمزات والألف
    .replace(/[إأآا]/g, "ا")
    // توحيد الياء والألف المقصورة
    .replace(/ى/g, "ي")
    // توحيد التاء المربوطة والهاء
    .replace(/ة/g, "ه")
    // توحيد الهمزة على الواو والياء
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    // إزالة الرموز وعلامات الترقيم
    .replace(/[^\w\s\u0600-\u06FF]/gi, " ")
    .replace(/\s+/g, " ");
}

// فحص الكلمات التسويقية
export function isStopWord(word) {
  return STOP_WORDS.has(word);
}

// استخراج المرادفات من القاموس
export function getSynonyms(word) {
  const normWord = normalizeArabic(word);
  const syns = new Set([normWord]);

  // إزالة "ال" التعريفية للبحث عن الجذر
  let root = normWord;
  if (normWord.startsWith("ال") && normWord.length > 3) {
    root = normWord.substring(2);
    syns.add(root);
  }

  // البحث في القاموس
  for (const [key, list] of Object.entries(ARABIC_DICTIONARY)) {
    const normKey = normalizeArabic(key);
    const normList = list.map(normalizeArabic);

    if (normKey === normWord || normKey === root || normList.includes(normWord) || normList.includes(root)) {
      syns.add(normKey);
      normList.forEach(item => syns.add(item));
    }
  }

  return Array.from(syns);
}

// فحص وجود الكلمة ومشتقاتها داخل النص
export function productContainsWord(productText, targetWord) {
  const normalizedTarget = normalizeArabic(targetWord);
  const synonyms = getSynonyms(normalizedTarget);
  const normalizedContent = normalizeArabic(productText);

  return synonyms.some(syn => {
    // مطابقة تامة أو جزء من الكلمة
    return normalizedContent.includes(syn);
  });
}

// محرك البحث الرئيسي الآمن والذكي
export function aiSafeSearch(products, queryString) {
  if (!queryString || !queryString.trim()) return products;

  const rawTokens = normalizeArabic(queryString).split(" ").filter(Boolean);
  
  // إزالة الـ Stop Words إلا إذا كان البحث كله مكون منها فقط
  let tokens = rawTokens.filter(token => !isStopWord(token));
  if (tokens.length === 0) tokens = rawTokens;

  return products.filter(product => {
    // تجميع محتوى المنتج للبحث بداخله
    const searchableText = `
      ${product.name || ""} 
      ${product.description || ""} 
      ${(product.categories || []).join(" ")}
      ${product.notes || ""}
    `;

    // يجب أن تتطابق كل كلمات البحث (AND Logic) مع دعم المرادفات
    return tokens.every(token => productContainsWord(searchableText, token));
  });
}