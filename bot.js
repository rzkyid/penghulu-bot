require('dotenv').config();

const express = require('express');
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require('discord.js');
const PREFIX = process.env.PREFIX;
const TOKEN = process.env.TOKEN;
const PORT = process.env.PORT || 3000; // Port default 3000 jika tidak ada di .env

const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Fungsi untuk membuat tombol
const createFormButton = () => {
    const button = new ButtonBuilder()
        .setCustomId('form_jodoh_start')
        .setLabel('Isi Form Cari Jodoh')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);
    return row;
};

// Fungsi untuk membuat modal
const createFormModal = () => {
    const modal = new ModalBuilder()
        .setCustomId('form_modal')
        .setTitle('Form Cari Jodoh');

    const namaInput = new TextInputBuilder()
        .setCustomId('nama')
        .setLabel('Nama Anda')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const umurInput = new TextInputBuilder()
        .setCustomId('umur')
        .setLabel('Umur Anda')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const genderInput = new TextInputBuilder()
        .setCustomId('gender')
        .setLabel('Jenis Kelamin (Pria/Wanita)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const hobiInput = new TextInputBuilder()
        .setCustomId('hobi')
        .setLabel('Hobi Anda')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const tipeIdealInput = new TextInputBuilder()
        .setCustomId('tipe_ideal')
        .setLabel('Tipe Ideal Anda')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(namaInput),
        new ActionRowBuilder().addComponents(umurInput),
        new ActionRowBuilder().addComponents(genderInput),
        new ActionRowBuilder().addComponents(hobiInput),
        new ActionRowBuilder().addComponents(tipeIdealInput)
    );

    return modal;
};

const userDataStore = {};

// Ketika bot siap
client.once('ready', () => {
    console.log('Bot is ready!');
});

// Ketika tombol diklik
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'form_jodoh_start') {
            // Menampilkan modal pertama
            const modal = createFormModal();
            await interaction.showModal(modal);
        }
    } else if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'form_modal') {
            const nama = interaction.fields.getTextInputValue('nama');
            const umur = interaction.fields.getTextInputValue('umur');
            const gender = interaction.fields.getTextInputValue('gender');
            const hobi = interaction.fields.getTextInputValue('hobi');
            const tipeIdeal = interaction.fields.getTextInputValue('tipe_ideal');

            // Simpan data pengguna
            userDataStore[interaction.user.id] = { nama, umur, gender, hobi, tipeIdeal };

            // Kirim hasil formulir dalam bentuk embed
            const embed = new EmbedBuilder()
                .setColor('#FF00FF')
                .setTitle('Hasil Form Cari Jodoh')
                .setDescription(
                    `**Nama**: ${nama}\n**Umur**: ${umur}\n` +
                    `**Jenis Kelamin**: ${gender}\n**Hobi**: ${hobi}\n` +
                    `**Tipe Ideal**: ${tipeIdeal}`
                )
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Semoga beruntung!' });

            await interaction.reply({ embeds: [embed] });
        }
    }
});

// Ketika bot menerima pesan untuk menampilkan tombol
client.on('messageCreate', async (message) => {
    if (message.content === `${PREFIX}carijodoh`) {
        const row = createFormButton();
        await message.reply({ content: 'Klik tombol berikut untuk memulai form Cari Jodoh:', components: [row] });
    }
});

// Menjalankan Express server untuk port
app.get('/', (req, res) => {
    res.send('Bot is running on port ' + PORT);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Login bot
client.login(TOKEN);
