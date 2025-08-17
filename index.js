require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const GIFEncoder = require('gifencoder');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // لعبة روليت: !روليت
    if (message.content.trim() === '!روليت') {
        let members = await message.guild.members.fetch();
        let players = members
            .filter(m => !m.user.bot)
            .map(m => m.user.username);

        if (players.length < 2) {
            message.reply('يجب أن يكون هناك لاعبان أو أكثر!');
            return;
        }

        // إعدادات العجلة
        const size = 400;
        const radius = size / 2;
        const encoder = new GIFEncoder(size, size);
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');

        const filePath = path.join(__dirname, 'wheel.gif');
        const stream = encoder.createWriteStream();
        encoder.start();
        encoder.setRepeat(0);
        encoder.setDelay(40);
        encoder.setQuality(10);

        // عدد الدورات/الفريمات
        const rounds = 30 + Math.floor(Math.random() * 15);
        let winnerIndex = Math.floor(Math.random() * players.length);

        for (let i = 0; i < rounds; i++) {
            let angle = (2 * Math.PI * ((i / rounds) * players.length + winnerIndex)) / players.length;
            ctx.clearRect(0, 0, size, size);

            // رسم القطاعات
            for (let j = 0; j < players.length; j++) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(radius, radius);
                ctx.arc(
                    radius, radius, radius,
                    (2 * Math.PI * j) / players.length,
                    (2 * Math.PI * (j + 1)) / players.length,
                    false
                );
                ctx.closePath();
                ctx.fillStyle = j % 2 === 0 ? '#FFCC00' : '#00BFFF';
                ctx.fill();
                ctx.restore();

                // كتابة اسم اللاعب
                ctx.save();
                ctx.translate(radius, radius);
                ctx.rotate(((2 * Math.PI * (j + 0.5)) / players.length) + angle);
                ctx.textAlign = "center";
                ctx.font = "bold 18px Arial";
                ctx.fillStyle = "#222";
                ctx.fillText(players[j], radius * 0.72, 0);
                ctx.restore();
            }

            // رسم المؤشر
            ctx.save();
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.moveTo(radius, 20);
            ctx.lineTo(radius - 12, 45);
            ctx.lineTo(radius + 12, 45);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            encoder.addFrame(ctx);
        }

        encoder.finish();

        // حفظ وإرسال الملف
        const out = fs.createWriteStream(filePath);
        stream.pipe(out);
        out.on('finish', async () => {
            const attachment = new AttachmentBuilder(filePath);
            await message.channel.send({ content: "🎡 عجلة الحظ تدور... من الفائز؟", files: [attachment] });
            await message.channel.send(`🏆 الفائز هو: **${players[winnerIndex]}**! مبروك`);
            fs.unlinkSync(filePath); // حذف الملف بعد الإرسال
        });
    }

    // أضف هنا باقي الألعاب أو الأوامر حسب الطلب مستقبلاً.
});

client.login(process.env.BOT_TOKEN);