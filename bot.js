require('dotenv').config();

const express = require('express');
const path = require('path');
const {
    Client,
    GatewayIntentBits,
    ActivityType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    InteractionType,
} = require('discord.js');

const PREFIX = process.env.PREFIX || "!";
const TOKEN = process.env.TOKEN;
const PORT = process.env.PORT || 3000;
const RESULT_CHANNEL_ID = '1284544825596837971';

if (!TOKEN) {
    console.error('Error: Discord bot token (TOKEN) is missing in the .env file.');
    process.exit(1);
}

const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Fungsi membuat tombol
const createFormButton = () => {
    const button = new ButtonBuilder()
        .setCustomId('form_jodoh_start')
        .setLabel('Isi Form Cari Jodoh')
        .setStyle(ButtonStyle.Primary);

    return new ActionRowBuilder().addComponents(button);
};

// Fungsi membuat modal form
const createModal = () => {
    const modal = new ModalBuilder()
        .setCustomId('form_modal')
        .setTitle('Form Cari Jodoh');

    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('nama')
                .setLabel('Nama Anda')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('umur')
                .setLabel('Umur Anda')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('gender')
                .setLabel('Jenis Kelamin (Pria/Wanita)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('hobi')
                .setLabel('Hobi Anda')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('tipe_ideal')
                .setLabel('Tipe Ideal Anda')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
        )
    );

    return modal;
};

// Ketika bot siap
client.once('ready', () => {
    console.log('[ BOT READY ] Bot is ready and running!');
});

// Ketika tombol diklik atau modal disubmit
client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isButton() && interaction.customId === 'form_jodoh_start') {
            const modal = createModal();
            await interaction.showModal(modal);
        } else if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'form_modal') {
            await interaction.deferReply({ ephemeral: true });

            const nama = interaction.fields.getTextInputValue('nama');
            const umur = interaction.fields.getTextInputValue('umur');
            const gender = interaction.fields.getTextInputValue('gender');
            const hobi = interaction.fields.getTextInputValue('hobi');
            const tipeIdeal = interaction.fields.getTextInputValue('tipe_ideal');

            const embed = new EmbedBuilder()
                .setColor('#FF00FF')
                .setTitle('Halo, perkenalkan saya!')
                .setDescription(
                    `**Nama**: ${nama}\n**Umur**: ${umur}\n**Jenis Kelamin**: ${gender}\n` +
                    `**Hobi**: ${hobi}\n**Tipe Ideal**: ${tipeIdeal}`
                )
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Yang tertarik, DM ya!' });

            const channel = client.channels.cache.get(RESULT_CHANNEL_ID);
            if (channel) {
                const sentMessage = await channel.send({
                    content: `${interaction.user} sedang <@&1052133998375227462>.`,
                    embeds: [embed],
                    components: [row],
                });
                
            await sentMessage.react('❤️');
            await interaction.followUp({ content: 'Form berhasil dikirim!', ephemeral: true });
        }
     catch (error) {
        console.error('Error handling interaction:', error);
    }
});

// Ketika pesan dikirim untuk memulai form
client.on('messageCreate', async (message) => {
    if (message.content === `${PREFIX}carijodoh`) {
        const row = createFormButton();
        await message.channel.send({
            content: 'Klik tombol berikut untuk memulai form Cari Jodoh:',
            components: [row],
        });
    }
});

// Server untuk status bot
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`[ SERVER READY ] Running on http://localhost:${PORT}`);
});

// Menambahkan custom status
const statusMessages = ['💌 Cari Jodoh?', '📞 Hubungi Saya!'];
const statusTypes = ['dnd', 'idle'];
let currentStatusIndex = 0;

function updateStatus() {
    const currentStatus = statusMessages[currentStatusIndex];
    client.user.setPresence({
        activities: [{ name: currentStatus, type: ActivityType.Custom }],
        status: statusTypes[currentStatusIndex % statusTypes.length],
    });
    console.log('[ STATUS ] Updated status to:', currentStatus);
    currentStatusIndex = (currentStatusIndex + 1) % statusMessages.length;
}

// Memulai proses status update
client.once('ready', () => {
    setInterval(updateStatus, 10000);
    updateStatus();
});

// Login bot
client.login(TOKEN).catch((err) => {
    console.error('Error logging in:', err);
    process.exit(1);
});
