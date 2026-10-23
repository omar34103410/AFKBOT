'use strict';

const mineflayer = require('mineflayer');

// ========== إعدادات البوت (مضبوطة كراك حصرياً لتجنب مايكروسوفت) ==========
const host = 'easyplay.aternos.me';
const port = 62029;
const USERNAME = 'AFKBOT';
const VERSION = '1.20.4'; 
const AUTH = 'offline'; // إجبار البوت على العمل بنظام الكراك قطعيّاً
const PASSWORD = 'pinkpin123';

const BASE_DELAY = 10000;  
const MAX_DELAY = 120000;  

let attempts = 0;

function connect() {
  console.log(`[+] الاتصال بـ ${host}:${port} باسم ${USERNAME} (auth=${AUTH})`);

  const options = {
    host,
    port,
    username: USERNAME,
    auth: AUTH,
    viewDistance: 'tiny',
    hideErrors: false,
  };
  if (VERSION) options.version = VERSION;

  const bot = mineflayer.createBot(options);

  let authSent = false;

  bot.once('spawn', () => {
    attempts = 0;
    console.log('[+] البوت ظهر في العالم');

    // إرسال التسجيل / الدخول بعد ثانيتين من ظهور البوت
    setTimeout(() => {
      if (PASSWORD && !authSent) {
        authSent = true;
        console.log('[+] إرسال أمر التسجيل /register...');
        bot.chat(`/register ${PASSWORD} ${PASSWORD}`);
        
        setTimeout(() => {
          console.log('[+] إرسال أمر تسجيل الدخول /login...');
          bot.chat(`/login ${PASSWORD}`);
        }, 2000);
      }
    }, 2000);
  });

  bot.on('death', () => {
    console.log('[!] مات البوت، سيعيد الظهور تلقائياً');
  });

  bot.on('messagestr', (msg) => {
    if (!PASSWORD) return;
    const m = msg.toLowerCase();
    if (m.includes('/register') && !authSent) {
      authSent = true;
      bot.chat(`/register ${PASSWORD} ${PASSWORD}`);
    } else if (m.includes('/login') && !authSent) {
      authSent = true;
      bot.chat(`/login ${PASSWORD}`);
    }
  });

  bot.on('kicked', (reason) => {
    const text = typeof reason === 'string' ? reason : JSON.stringify(reason);
    console.log('[!] تم الطرد:', text);
  });

  bot.on('error', (err) => console.log('[!] خطأ:', err.message));

  bot.once('end', (reason) => {
    authSent = false;
    attempts += 1;
    const delay = Math.min(BASE_DELAY * 2 ** (attempts - 1), MAX_DELAY);
    console.log(`[!] انقطع الاتصال (${reason}). إعادة المحاولة بعد ${delay / 1000} ثانية...`);
    setTimeout(connect, delay);
  });
}

process.on('uncaughtException', (e) => console.log('[!] خطأ غير متوقع:', e.message));
process.on('unhandledRejection', (e) => console.log('[!] وعد مرفوض:', e));

connect();
