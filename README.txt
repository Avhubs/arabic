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

ملاحظة: المساعد في صفحة /page/ask/ تجريبي بإجابات مدمجة وليس متصلًا بنموذج AI مباشر.
