# Do'st AI — ishga tushirish qo'llanmasi

Bu loyiha brauzerda ishlaydigan, OpenAI yoki Gemini API orqali javob beradigan kichik web-ilova. API kalitlari brauzerga yuborilmaydi; ular serverning maxfiy Environment Variables bo'limida saqlanadi.

## Muhim
- Bu ZIP tayyor loyiha kodi, hali internetga joylangan sayt emas.
- OpenAI/Gemini API kaliti va hosting akkaunti kerak. API ishlatilishi provayder tarifiga qarab pul talab qilishi mumkin.
- API kalitini ChatGPT suhbatiga yubormang va `public` papkaga yozmang.
- Kirish paroli bitta shaxsiy foydalanuvchi uchun mo'ljallangan. Kuchli parol tanlang.
- Suhbat tarixi hozircha aynan shu brauzer qurilmasining localStorage xotirasida saqlanadi; serverlar orasida sinxronlanmaydi.

## Eng oson yo'l: Node.js qo'llaydigan hostingga joylash
1. ZIP faylni kompyuterda oching.
2. GitHub akkauntingizga kiring va yangi **Private** repository yarating.
3. ZIP ichidagi fayllarni repository'ga yuklang.
4. Node.js web service yaratadigan hostingda shu GitHub repository'ni ulang.
5. Build command: `npm install`
6. Start command: `npm start`
7. Hosting sozlamasidagi **Environment Variables** bo'limiga quyidagilarni qo'shing:
   - `APP_PASSWORD` = o'zingiz tanlagan kuchli maxfiy parol
   - `SESSION_SECRET` = uzun tasodifiy maxfiy matn
   - `OPENAI_API_KEY` = OpenAI API kalitingiz (OpenAI ishlatmoqchi bo'lsangiz)
   - `GEMINI_API_KEY` = Gemini API kalitingiz (Gemini ishlatmoqchi bo'lsangiz)
   - `OPENAI_MODEL` = `gpt-6.2-sol` (ixtiyoriy, standart qiymat)
   - `GEMINI_MODEL` = `gemini-3.8-flash` (ixtiyoriy, standart qiymat)
8. Deploy tugagach, hosting bergan HTTPS havolani oching va `APP_PASSWORD` paroli bilan kiring.

Hosting xizmatlarining bepul tariflari, uyqu rejimi va cheklovlari o'zgarishi mumkin. Deploydan oldin hostingning joriy narxlarini tekshiring.

## API kalitlarini olish
- OpenAI: https://platform.openai.com/api-keys
- Gemini: https://aistudio.google.com/app/apikey

Kalitlarni faqat hostingdagi Environment Variables bo'limiga kiriting. Ularni HTML, GitHub public repository yoki chatga joylamang.

## Lokal sinash (kompyuterda)
Node.js 20 yoki yangirog'ini o'rnating, loyiha papkasida terminal oching:
```bash
npm install
```
`.env.example` faylidan `.env` nusxa yarating va maxfiy qiymatlarni kiriting. Keyin:
```bash
npm start
```
Brauzerda `http://localhost:3000` ni oching.

## Hozirgi imkoniyatlar va chegaralar
- OpenAI va Gemini orasida tanlash.
- O'zbek tilida chat va hikoya so'rash.
- Kirish paroli.
- Brauzer ichida chat tarixini saqlash.
- Qurilma/brauzer qo'llasa ovozli matnga aylantirish va javobni ovoz chiqarib o'qish.
- Ovozli suhbat sifati va o'zbek tilini tanish brauzerga bog'liq.
- Bu versiyada server tomonida chat tarixi bazasi, ko'p foydalanuvchili akkauntlar yoki avtomatik API fallback yo'q.
