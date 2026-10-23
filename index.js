const mineflayer = require("mineflayer");

const bot = mineflayer.createBot({
  host: "easyplay.aternos.me",
  port: 62029,
  username: "AFKBOT",
  auth: "offline",
  version: false,
  checkTimeoutInterval: 60 * 1000
});

bot.on("login", () => {
  console.log("[+] تم تسجيل الدخول");
});

bot.on("spawn", () => {
  console.log("[+] البوت دخل السيرفر");

  setInterval(() => {
    if (!bot.entity) return;

    bot.setControlState("jump", true);
    setTimeout(() => bot.setControlState("jump", false), 500);
  }, 60 * 1000);
});

bot.on("kicked", (reason) => {
  console.log("[!] تم طرد البوت:");
  console.log(reason);
});

bot.on("error", (err) => {
  console.log("[!] خطأ:");
  console.log(err.message || err);
});

bot.on("end", (reason) => {
  console.log("[!] انقطع الاتصال:");
  console.log(reason);
  process.exit(1);
});
