require('dotenv').config();

const express = require('express');
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

const path = require('path');
const PREFIX = process.env.PREFIX;
const TOKEN = process.env.TOKEN;
const PORT = process.env.PORT || 3000;
const RESULT_CHANNEL_ID = '1284544825596837971'; // ID channel tujuan

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

    const row = new ActionRowBuilder().addComponents(button);
    return row;
};

// Fungsi membuat modal form
const createModal = () => {
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
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const tipeIdealInput = new TextInputBuilder()
        .setCustomId('tipe_ideal')
        .setLabel('Tipe Ideal Anda')
        .setStyle(TextInputStyle.Paragraph)
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

// Ketika bot siap
client.once('ready', () => {
    console.log('Bot is ready!');
});

// Ketika tombol diklik
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'form_jodoh_start') {
            const modal = createModal();
            await interaction.showModal(modal);
        }
    } else if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'form_modal') {
            await interaction.deferReply({ ephemeral: true }); // Tanggapi sementara

            const nama = interaction.fields.getTextInputValue('nama');
            const umur = interaction.fields.getTextInputValue('umur');
            const gender = interaction.fields.getTextInputValue('gender');
            const hobi = interaction.fields.getTextInputValue('hobi');
            const tipeIdeal = interaction.fields.getTextInputValue('tipe_ideal');

            const embed = new EmbedBuilder()
                .setColor('#FF00FF')
                .setTitle('Halo perkenalkan saya')
                .setDescription(
                    `**Nama**: ${nama}\n**Umur**: ${umur}\n` +
                    `**Jenis Kelamin**: ${gender}\n**Hobi**: ${hobi}\n**Tipe Ideal**: ${tipeIdeal}`
                )
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Yang tertarik DM ya!' });

            const row = createFormButton();

            const channel = client.channels.cache.get(RESULT_CHANNEL_ID);
            if (channel) {
                const sentMessage = await channel.send({
                    content: `${interaction.user} sedang <@&1052133998375227462>.`,
                    embeds: [embed],
                    components: [row],
                });

                // Tambahkan reaksi love
                await sentMessage.react('❤️');
            } else {
                console.error('Channel not found!');
            }

            // Jawab interaksi agar tidak kedaluwarsa
            await interaction.followUp({ content: 'Form berhasil dikirim!', ephemeral: true });
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
    const filePath = path.join(__dirname, 'index.html');
    res.sendFile(filePath);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Menambahkan custom status
const statusMessages = ["💌 Cari Jodoh?", "📞 Hubungi Saya!"];
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
client.login(TOKEN);
