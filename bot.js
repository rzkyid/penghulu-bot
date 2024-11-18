require('dotenv').config();

const express = require('express');
const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    InteractionType,
} = require('discord.js');

const PREFIX = process.env.PREFIX;
const TOKEN = process.env.TOKEN;
const PORT = process.env.PORT || 3000;

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
        .setCustomId('form_jodoh_start') // ID tombol untuk interaksi
        .setLabel('Isi Form Cari Jodoh')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);
    return row;
};

// Fungsi untuk membuat modal pertama
const createFirstModal = () => {
    const modal = new ModalBuilder()
        .setCustomId('form_modal_step1')
        .setTitle('Form Cari Jodoh - Bagian 1');

    // Input fields modal pertama
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

    const agamaInput = new TextInputBuilder()
        .setCustomId('agama')
        .setLabel('Agama Anda')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const domisiliInput = new TextInputBuilder()
        .setCustomId('domisili')
        .setLabel('Domisili Anda')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(namaInput),
        new ActionRowBuilder().addComponents(umurInput),
        new ActionRowBuilder().addComponents(genderInput),
        new ActionRowBuilder().addComponents(agamaInput),
        new ActionRowBuilder().addComponents(domisiliInput)
    );

    return modal;
};

// Fungsi untuk membuat modal kedua
const createSecondModal = () => {
    const modal = new ModalBuilder()
        .setCustomId('form_modal_step2')
        .setTitle('Form Cari Jodoh - Bagian 2');

    // Input fields modal kedua
    const kesibukanInput = new TextInputBuilder()
        .setCustomId('kesibukan')
        .setLabel('Kesibukan Anda')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const hobiInput = new TextInputBuilder()
        .setCustomId('hobi')
        .setLabel('Hobi Anda')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const tipeIdealInput = new TextInputBuilder()
        .setCustomId('tipe_ideal')
        .setLabel('Tipe Ideal Anda')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(kesibukanInput),
        new ActionRowBuilder().addComponents(hobiInput),
        new ActionRowBuilder().addComponents(tipeIdealInput)
    );

    return modal;
};

// Objek untuk menyimpan data sementara pengguna
const userDataStore = {};

// Ketika bot siap
client.once('ready', () => {
    console.log('Bot is ready!');
});

// Ketika tombol diklik
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'form_jodoh_start') {
            const modal = createFirstModal();
            await interaction.showModal(modal);
        }
    } else if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'form_modal_step1') {
            // Ambil data dari modal pertama
            const nama = interaction.fields.getTextInputValue('nama');
            const umur = interaction.fields.getTextInputValue('umur');
            const gender = interaction.fields.getTextInputValue('gender');
            const agama = interaction.fields.getTextInputValue('agama');
            const domisili = interaction.fields.getTextInputValue('domisili');

            // Simpan data ke userDataStore
            userDataStore[interaction.user.id] = {
                nama,
                umur,
                gender,
                agama,
                domisili,
            };

            // Tampilkan modal kedua
            const modal = createSecondModal();
            await interaction.showModal(modal);
        } else if (interaction.customId === 'form_modal_step2') {
            // Ambil data dari modal kedua
            const kesibukan = interaction.fields.getTextInputValue('kesibukan');
            const hobi = interaction.fields.getTextInputValue('hobi');
            const tipeIdeal = interaction.fields.getTextInputValue('tipe_ideal');

            // Ambil data sebelumnya dari userDataStore
            const userData = userDataStore[interaction.user.id] || {};

            // Tambahkan data baru
            userData.kesibukan = kesibukan;
            userData.hobi = hobi;
            userData.tipeIdeal = tipeIdeal;

            // Hapus data sementara dari store (opsional)
            delete userDataStore[interaction.user.id];

            // Buat embed hasil
            const embed = new EmbedBuilder()
                .setColor('#FF00FF')
                .setTitle('Hasil Form Cari Jodoh')
                .setDescription(
                    `**Nama**: ${userData.nama}\n` +
                    `**Umur**: ${userData.umur}\n` +
                    `**Jenis Kelamin**: ${userData.gender}\n` +
                    `**Agama**: ${userData.agama}\n` +
                    `**Domisili**: ${userData.domisili}\n` +
                    `**Kesibukan**: ${userData.kesibukan}\n` +
                    `**Hobi**: ${userData.hobi}\n` +
                    `**Tipe Ideal**: ${userData.tipeIdeal}`
                )
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp()
                .setAuthor({
                    name: interaction.user.username,
                    iconURL: interaction.user.displayAvatarURL(),
                })
                .setFooter({
                    text: 'Semoga beruntung menemukan pasangan ideal!',
                });

            // Kirim hasil embed ke channel
            await interaction.reply({ embeds: [embed] });
        }
    }
});

// Ketika bot menerima perintah untuk menampilkan tombol
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
