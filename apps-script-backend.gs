/**
 * ===========================================================
 *  БЕКЕНД ДЛЯ TELEGRAM MINI APP "КНИГАРНЯ"
 * ===========================================================
 *
 * ЯК ПІДКЛЮЧИТИ (10-15 хвилин):
 *
 * 1. Створи нову Google Таблицю (sheets.google.com → Пуста таблиця)
 *
 * 2. Перейменуй перший лист на "Books" і зроби в ньому заголовки
 *    в першому рядку (саме такими словами, з великої літери):
 *
 *    id | name | author | price | oldPrice | category | cover | badge
 *
 *    Приклад рядка:
 *    1  | Безнадія | Колін Гувер | 410 | | Романи | https://... | 
 *
 *    (oldPrice і badge можна залишати порожніми якщо не потрібні)
 *    (cover — пряме посилання на картинку, наприклад завантажену
 *     в Google Drive з відкритим доступом "Будь-хто з посиланням")
 *
 * 3. Додай другий лист, назви його "Orders" і зроби заголовки:
 *
 *    Дата | Ім'я | Телефон | Адреса | Оплата | Товари | Сума | Telegram
 *
 *    Цей лист бекенд буде заповнювати сам — нічого вписувати не треба.
 *
 * 4. У меню таблиці: Розширення → Apps Script
 *
 * 5. Видали весь код-заглушку який там є, і встав замість нього
 *    увесь код з цього файлу.
 *
 * 6. Натисни "Розгорнути" (Deploy) → "Нове розгортання" (New deployment)
 *    → тип: "Веб-додаток" (Web app)
 *    → Виконати від імені: "Я" (Me)
 *    → Хто має доступ: "Будь-хто" (Anyone)
 *    → Розгорнути (Deploy)
 *
 * 7. Скопіюй URL який видасть Google (виглядає як
 *    https://script.google.com/macros/s/AKfycb.../exec)
 *
 * 8. Встав цей URL у файл bookstore-miniapp.html в рядок:
 *    const API_URL = "ВСТАВ_СЮДИ_URL_APPS_SCRIPT";
 *
 * Готово — Mini App тепер бере книги з таблиці і записує
 * замовлення в лист "Orders".
 *
 * Щоб додати нову книгу — просто додай новий рядок в лист "Books".
 * Код переписувати не треба.
 * ===========================================================
 */

const BOOKS_SHEET_NAME = "Books";
const ORDERS_SHEET_NAME = "Orders";

/**
 * GET-запит — повертає список книг у форматі JSON.
 * Викликається з Mini App при відкритті каталогу.
 */
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(BOOKS_SHEET_NAME);

  if (!sheet) {
    return jsonResponse({ error: "Лист 'Books' не знайдено" });
  }

  const data = sheet.getDataRange().getValues();
  const headers = data.shift().map(h => String(h).trim());

  const books = data
    .filter(row => row[0] !== "") // пропускаємо порожні рядки
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i];
      });
      return obj;
    });

  return jsonResponse(books);
}

/**
 * POST-запит — приймає замовлення з Mini App і записує
 * його новим рядком у лист "Orders".
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action !== "order") {
      return jsonResponse({ status: "ignored" });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(ORDERS_SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(ORDERS_SHEET_NAME);
      sheet.appendRow(["Дата", "Ім'я", "Телефон", "Адреса", "Оплата", "Товари", "Сума", "Telegram"]);
    }

    const itemsText = (data.items || [])
      .map(i => `${i.name} x${i.qty} (${i.price}₴)`)
      .join("; ");

    sheet.appendRow([
      new Date(),
      data.name || "",
      data.phone || "",
      data.address || "",
      data.payment || "",
      itemsText,
      data.total || 0,
      data.telegram || ""
    ]);

    return jsonResponse({ status: "ok" });

  } catch (err) {
    return jsonResponse({ status: "error", message: String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
