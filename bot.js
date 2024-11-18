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
        // Ketika tombol ditekan
        if (interaction.isButton() && interaction.customId === 'form_jodoh_start') {
            const modal = createModal();
            await interaction.showModal(modal); // Modal langsung dikirim tanpa deferReply
            return; // Hentikan eksekusi di sini
        }

        // Ketika modal di-submit
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'form_modal') {
            const nama = interaction.fields.getTextInputValue('nama');
            const umur = interaction.fields.getTextInputValue('umur');
            const gender = interaction.fields.getTextInputValue('gender');
            const hobi = interaction.fields.getTextInputValue('hobi');
            const tipeIdeal = interaction.fields.getTextInputValue('tipe_ideal');

            // Buat embed hasil form
            const embed = new EmbedBuilder()
                .setColor('#FF00FF')
                .setTitle('Halo, perkenalkan saya!')
                .setDescription(
                    `**Nama**: ${nama}\n**Umur**: ${umur}\n` +
                    `**Jenis Kelamin**: ${gender}\n**Hobi**: ${hobi}\n**Tipe Ideal**: ${tipeIdeal}`
                )
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Yang tertarik, DM ya!' });

            // Kirim hasil form ke channel tujuan
            const channel = client.channels.cache.get(RESULT_CHANNEL_ID);
            if (!channel) {
                console.error('Error: Channel tidak ditemukan.');
                await interaction.reply({ content: 'Gagal mengirim form. Channel tidak ditemukan.', ephemeral: true });
                return;
            }

            const sentMessage = await channel.send({
                content: `${interaction.user} sedang <@&1052133998375227462>.`,
                embeds: [embed],
                components: [createFormButton()],
            });

            // Tambahkan reaksi love
            await sentMessage.react('❤️');

            // Tanggapi interaksi untuk menghindari timeout
            await interaction.reply({ content: 'Form berhasil dikirim!', ephemeral: true });
        }
    } catch (error) {
        console.error('Error handling interaction:', error);

        // Tanggapi error jika interaksi belum ditangani
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'Terjadi kesalahan saat memproses interaksi Anda.', ephemeral: true });
        }
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
const statusMessages = ["👀 Sedang Memantau", "👥 Warga Gang Desa"];
const statusTypes = [ 'dnd', 'idle'];
let currentStatusIndex = 0;
let currentTypeIndex = 0;

async function login() {
  try {
    await client.login(process.env.TOKEN);
    console.log('\x1b[36m[ LOGIN ]\x1b[0m', `\x1b[32mLogged in as: ${client.user.tag} ✅\x1b[0m`);
    console.log('\x1b[36m[ INFO ]\x1b[0m', `\x1b[35mBot ID: ${client.user.id} \x1b[0m`);
    console.log('\x1b[36m[ INFO ]\x1b[0m', `\x1b[34mConnected to ${client.guilds.cache.size} server(s) \x1b[0m`);
  } catch (error) {
    console.error('\x1b[31m[ ERROR ]\x1b[0m', 'Failed to log in:', error);
    process.exit(1);
  }
}

function updateStatus() {
  const currentStatus = statusMessages[currentStatusIndex];
  const currentType = statusTypes[currentTypeIndex];
  client.user.setPresence({
    activities: [{ name: currentStatus, type: ActivityType.Custom }],
    status: currentType,
  });
  console.log('\x1b[33m[ STATUS ]\x1b[0m', `Updated status to: ${currentStatus} (${currentType})`);
  currentStatusIndex = (currentStatusIndex + 1) % statusMessages.length;
  currentTypeIndex = (currentTypeIndex + 1) % statusTypes.length;
}

function heartbeat() {
  setInterval(() => {
    console.log('\x1b[35m[ HEARTBEAT ]\x1b[0m', `Bot is alive at ${new Date().toLocaleTimeString()}`);
  }, 30000);
}

client.once('ready', () => {
  console.log('\x1b[36m[ INFO ]\x1b[0m', `\x1b[34mPing: ${client.ws.ping} ms \x1b[0m`);
  updateStatus();
  setInterval(updateStatus, 10000);
  heartbeat();
});

// Login bot
client.login(TOKEN).catch((err) => {
    console.error('Error logging in:', err);
    process.exit(1);
});
