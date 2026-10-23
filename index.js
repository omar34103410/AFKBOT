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
const AUTH = process.env.MC_AUTH || 'offline'; // فرض وضع الكراك
const PASSWORD = process.env.MC_PASSWORD || 'pinkpin123'; // كلمة السر لـ /login و /register

const BASE_DELAY = 10000;  
const MAX_DELAY = 120000;  

const rand = (min, max) => Math.floor(Math.random() * (max - min)) + min;

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

  const timers = new Set();
  let stopped = false;
  let activityStarted = false;
  let lastAuthChat = 0;

  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      if (!stopped) fn();
    }, ms);
    timers.add(t);
    return t;
  };

  const stop = () => {
    stopped = true;
    timers.forEach(clearTimeout);
    timers.clear();
  };

  const loop = (fn, min, max) => {
    const run = () => {
      if (!bot.entity) return later(run, 2000); 
      try { fn(); } catch (e) { console.log('[!] خطأ في النشاط:', e.message); }
      later(run, rand(min, max));
    };
    later(run, rand(min, max));
  };

  const startActivity = () => {
    if (activityStarted) return;
    activityStarted = true;

    // 1. تنفيذ أمر التسجيل / الدخول فور ظهور البوت بثوانٍ معدودة
    setTimeout(() => {
      if (PASSWORD) {
        console.log('[+] إرسال أمر التسجيل /register...');
        bot.chat(`/register ${PASSWORD} ${PASSWORD}`);
        
        // إرسال /login كاحتياط بعد ثانيتين إذا كان الحساب مسجلاً مسبقاً
        setTimeout(() => {
          console.log('[+] إرسال أمر تسجيل الدخول /login...');
          bot.chat(`/login ${PASSWORD}`);
        }, 2000);
      }
    }, 2000);

    // 2. تفعيل وضع البقاء الآمن (تأرجح اليد فقط بدون أي مشي أو حركة تسبب طرد)
    setTimeout(() => {
      console.log('[+] تفعيل البقاء (بدون حركة إحداثيات لمنع الطرد)...');
      loop(() => {
        try {
          bot.swingArm('right');
        } catch (e) {}
      }, 20000, 40000);
    }, 6000);
  };

  bot.on('login', () => console.log('[+] تم تسجيل الدخول بنجاح (كراك)'));

  bot.on('spawn', () => {
    attempts = 0; 
    console.log('[+] البوت ظهر في العالم');
    startActivity();
  });

  bot.on('death', () => {
    console.log('[!] مات البوت، سيعيد الظهور تلقائياً');
    bot.clearControlStates();
  });

  // الاستماع للشات كاحتياط إضافي إذا طلب السيرفر ذلك صراحة
  bot.on('messagestr', (msg) => {
    if (!PASSWORD) return;
    const now = Date.now();
    if (now - lastAuthChat < 3000) return;
    const m = msg.toLowerCase();
    if (m.includes('/register')) {
      lastAuthChat = now;
      bot.chat(`/register ${PASSWORD} ${PASSWORD}`);
      console.log('[+] تم إرسال /register عبر الشات');
    } else if (m.includes('/login')) {
      lastAuthChat = now;
      bot.chat(`/login ${PASSWORD}`);
      console.log('[+] تم إرسال /login عبر الشات');
    }
  });

  bot.on('kicked', (reason) => {
    const text = typeof reason === 'string' ? reason : JSON.stringify(reason);
    console.log('[!] تم الطرد:', text);
  });

  bot.on('error', (err) => console.log('[!] خطأ:', err.message));

  bot.once('end', (reason) => {
    stop();
    attempts += 1;
    const delay = Math.min(BASE_DELAY * 2 ** (attempts - 1), MAX_DELAY);
    console.log(`[!] انقطع الاتصال (${reason}). إعادة المحاولة بعد ${delay / 1000} ثانية...`);
    setTimeout(connect, delay);
  });
}

process.on('uncaughtException', (e) => console.log('[!] خطأ غير متوقع:', e.message));
process.on('unhandledRejection', (e) => console.log('[!] وعد مرفوض:', e));

connect();
