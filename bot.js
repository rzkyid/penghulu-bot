require('dotenv').config();

const express = require('express');
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const PREFIX = process.env.PREFIX;
const TOKEN = process.env.TOKEN;
const PORT = process.env.PORT || 3000;

const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Fungsi untuk membuat tombol
const createFormButton = () => {
    const button = new ButtonBuilder()
        .setCustomId('form_jodoh') // ID tombol untuk interaksi
        .setLabel('Isi Form Cari Jodoh')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);
    return row;
};

// Fungsi untuk mengirim form kepada pengguna
const sendForm = async (interaction) => {
    // Menanggapi interaksi dengan defer terlebih dahulu
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.user;
    const dmChannel = await user.createDM();

    const embed = new EmbedBuilder()
        .setColor('#FF00FF')
        .setTitle('Form Cari Jodoh')
        .setDescription(
            'Silakan isi form berikut untuk melanjutkan.\nSetiap jawaban akan digunakan untuk mencari pasangan yang cocok.'
        )
        .setTimestamp();

    // Kirimkan DM ke user
    await dmChannel.send({ embeds: [embed] });

    const questions = [
        'Nama: ',
        'Umur: ',
        'Jenis Kelamin: ',
        'Agama: ',
        'Domisili: ',
        'Kesibukan: ',
        'Hobi: ',
        'Tipe Ideal: ',
    ];

    let userData = {};
    for (const question of questions) {
        const filter = (response) => response.author.id === user.id;
        const msg = await dmChannel.send(question);
        const collected = await dmChannel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
        const answer = collected.first().content;
        userData[question] = answer;
    }

    const resultEmbed = new EmbedBuilder()
        .setColor('#FF00FF')
        .setTitle('Hasil Form Cari Jodoh')
        .setDescription(
            `Berikut adalah hasil form kamu:\n\n**Nama**: ${userData['Nama: ']}\n**Umur**: ${userData['Umur: ']}\n**Jenis Kelamin**: ${userData['Jenis Kelamin: ']}\n**Agama**: ${userData['Agama: ']}\n**Domisili**: ${userData['Domisili: ']}\n**Kesibukan**: ${userData['Kesibukan: ']}\n**Hobi**: ${userData['Hobi: ']}\n**Tipe Ideal**: ${userData['Tipe Ideal: ']}`
        )
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();

    // Kirim hasil ke channel atau DM
    await interaction.followUp({ embeds: [resultEmbed] });
};

// Ketika bot siap
client.once('ready', () => {
    console.log('Bot is ready!');
});

// Ketika ada interaksi (tombol diklik)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'form_jodoh') {
        try {
            await sendForm(interaction);
        } catch (error) {
            console.error('Error handling interaction:', error);
            await interaction.followUp({ content: 'Maaf, terjadi kesalahan saat memproses permintaan Anda.', ephemeral: true });
        }
    }
});

// Ketika bot menerima pesan untuk menampilkan tombol
client.on('messageCreate', async (message) => {
    if (message.content === `${PREFIX}carijodoh`) {
        const row = createFormButton();
        await message.reply({ content: 'Klik tombol berikut untuk mengisi form Cari Jodoh:', components: [row] });
    }
});

// Menjaga aplikasi tetap hidup dengan server Express
app.get('/', (req, res) => {
    res.send('Bot is running!');
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

// Login bot
client.login(TOKEN);
