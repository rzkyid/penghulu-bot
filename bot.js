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
        .setCustomId('form_jodoh') // ID tombol untuk interaksi
        .setLabel('Isi Form Cari Jodoh')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);
    return row;
};

// Fungsi untuk membuat modal (popup form)
const createFormModal = () => {
    const modal = new ModalBuilder()
        .setCustomId('form_modal')
        .setTitle('Form Cari Jodoh');

    // Input fields
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
        .setLabel('Jenis Kelamin')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Pria/Wanita')
        .setRequired(true);

    const agamaInput = new TextInputBuilder()
        .setCustomId('agama')
        .setLabel('Agama')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const domisiliInput = new TextInputBuilder()
        .setCustomId('domisili')
        .setLabel('Domisili')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const hobbiesInput = new TextInputBuilder()
        .setCustomId('hobi')
        .setLabel('Hobi Anda')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const tipeIdealInput = new TextInputBuilder()
        .setCustomId('tipe_ideal')
        .setLabel('Tipe Ideal')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    // Tambahkan input fields ke modal
    modal.addComponents(
        new ActionRowBuilder().addComponents(namaInput),
        new ActionRowBuilder().addComponents(umurInput),
        new ActionRowBuilder().addComponents(genderInput),
        new ActionRowBuilder().addComponents(agamaInput),
        new ActionRowBuilder().addComponents(domisiliInput),
        new ActionRowBuilder().addComponents(hobbiesInput),
        new ActionRowBuilder().addComponents(tipeIdealInput)
    );

    return modal;
};

// Ketika bot siap
client.once('ready', () => {
    console.log('Bot is ready!');
});

// Ketika tombol diklik
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'form_jodoh') {
            const modal = createFormModal();
            await interaction.showModal(modal);
        }
    } else if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'form_modal') {
            // Ambil data dari modal
            const nama = interaction.fields.getTextInputValue('nama');
            const umur = interaction.fields.getTextInputValue('umur');
            const gender = interaction.fields.getTextInputValue('gender');
            const agama = interaction.fields.getTextInputValue('agama');
            const domisili = interaction.fields.getTextInputValue('domisili');
            const hobi = interaction.fields.getTextInputValue('hobi');
            const tipeIdeal = interaction.fields.getTextInputValue('tipe_ideal');

            // Buat embed hasil
            const embed = new EmbedBuilder()
                .setColor('#FF00FF')
                .setTitle('Hasil Form Cari Jodoh')
                .setDescription(
                    `**Nama**: ${nama}\n**Umur**: ${umur}\n**Jenis Kelamin**: ${gender}\n**Agama**: ${agama}\n**Domisili**: ${domisili}\n**Hobi**: ${hobi}\n**Tipe Ideal**: ${tipeIdeal}`
                )
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp()
                .setAuthor({
                    name: `${interaction.user.username}`,
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
