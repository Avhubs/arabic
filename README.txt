دار القصيد — موقع متعدد الصفحات
================================

هيكل المشروع:
public/
  index.html                 الصفحة الرئيسية
  page/
    poem/index.html          /page/poem/
    discover/index.html      /page/discover/
    ask/index.html           /page/ask/
  _redirects                 إعداد Netlify للمسارات غير الموجودة

روابط الصفحات:
  /
  /page/poem/
  /page/discover/
  /page/ask/

Netlify:
- اجعل Publish directory = public
- Build command = فارغ
- لا تحتاج إلى framework أو build step.

ملاحظة: المساعد في صفحة /page/ask/ موصول بواجهة Gemini API (المفتاح في page/ask/index.html داخل window.CHAT_CONFIG)
مع محرك احتياطي محلي يعمل تلقائيًا عند تعذّر الاتصال أو تجاوز الحد.
تنبيه أمني: أي مفتاح داخل صفحة (client-side) يمكن لغيرك استخدامه — فعّل قيود HTTP referrer على المفتاح في Google Cloud،
أو استخدم وسيطًا (proxy) على الخادم قبل النشر العام.
