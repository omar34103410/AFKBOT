const mineflayer = require("mineflayer");

const options = {
  host: "easyplay.aternos.me",
  port: 62029,
  username: "AFKBOT",
  auth: "microsoft",
  version: false,
  checkTimeoutInterval: 60 * 1000
};

let bot;
let reconnecting = false;

function createBot() {
  reconnecting = false;

  bot = mineflayer.createBot(options);

  bot.once("login", () => {
    console.log("[+] تم تسجيل الدخول بنجاح");
  });

  bot.once("spawn", () => {
    console.log("[+] البوت دخل العالم");

    // منع الطرد بسبب AFK
    setInterval(() => {
      if (!bot.entity) return;

      bot.setControlState("jump", true);
      setTimeout(() => bot.setControlState("jump", false), 500);
    }, 60 * 1000);
  });

  bot.on("kicked", (reason) => {
    console.log("[!] تم طرد البوت من السيرفر:");
    console.log(reason);
  });

  bot.on("error", (err) => {
    console.log("[!] حدث خطأ:");
    console.log(err.message || err);
  });

  bot.on("end", (reason) => {
    console.log("[!] انقطع الاتصال:");
    console.log(reason);

    if (reconnecting) return;
    reconnecting = true;

    console.log("[+] إعادة المحاولة بعد 30 ثانية...");
    setTimeout(() => {
      try {
        bot.end();
      } catch (e) {}

      createBot();
    }, 30 * 1000);
  });
}

createBot();
