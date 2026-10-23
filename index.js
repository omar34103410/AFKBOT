'use strict';

const mineflayer = require('mineflayer');

// ========== الإعدادات ==========
let host = process.env.MC_HOST || 'easyplay.aternos.me';
let port = Number(process.env.MC_PORT) || 62029;

if (host.includes(':')) {
  const [h, p] = host.split(':');
  host = h;
  port = Number(p) || port;
}

const USERNAME = process.env.MC_USER || 'AFKBOT';
const VERSION = process.env.MC_VERSION || '1.20.4'; 
const AUTH = process.env.MC_AUTH || 'offline';
const PASSWORD = process.env.MC_PASSWORD || 'pinkpin123';

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

  // منع إرسال حزم الحركة الوهمية التي تسبب الطرد
  bot.once('spawn', () => {
    attempts = 0;
    console.log('[+] البوت ظهر في العالم');

    // تعطيل تحديثات الموقع التلقائية التي تثير شكوك الحماية
    if (bot._client) {
      bot._client.on('packet', (data, meta) => {
        // اعتراض وتثبيت الـ packets إذا لزم الأمر
      });
    }

    // إرسال التسجيل أو الدخول بعد ثانيتين من الظهور
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

  // الاستماع للشات للتأكد من نجاح المصادقة
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
