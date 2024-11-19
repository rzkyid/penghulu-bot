require('dotenv').config();
const path = require('path');
const express = require('express');
const fs = require('fs');
const {
    Client,
    GatewayIntentBits,
    Partials,
    ActivityType, 
    MessageAttachment,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    InteractionType,
} = require('discord.js');

const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus 
} = require('@discordjs/voice');

const PREFIX = process.env.PREFIX;
const TOKEN = process.env.TOKEN;
const PORT = process.env.PORT || 3000;
const RESULT_CHANNEL_ID = '1284544825596837971'; // ID channel tujuan

const app = express();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel], // Membantu bot mendeteksi DM
});

// Set untuk melacak user yang sudah dibalas
const respondedUsers = new Set();

// Server untuk status bot
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'index.html');
    res.sendFile(filePath);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Menangani DM
client.on('messageCreate', async (message) => {
    // Cek jika pesan adalah DM dan bukan dari bot itu sendiri
    if (message.channel.type === 1 && !message.author.bot) { // DM memiliki tipe channel `1`
        if (!respondedUsers.has(message.author.id)) { // Jika user belum dibalas
            try {
                const userTag = message.author.tag; // Tag user pengirim DM
                const response = `👋 Halo kak! Udah lama jadi jomblo? Ingin cepat dapat jodoh? langsung aja ke channel <#1284544825596837971> ❤️\n\nSemoga cepat ketemu jodohnya ya! 😉`;
                
                await message.reply(response); // Balas ke DM
                respondedUsers.add(message.author.id); // Tandai user sudah dibalas
                console.log(`DM diterima dari ${userTag}, bot membalas.`);
            } catch (error) {
                console.error('Gagal merespons DM:', error);
            }
        } else {
            console.log(`User ${message.author.tag} sudah dibalas sebelumnya, tidak mengirim ulang.`);
        }
    }
});

// Untuk menyimpan status player
let player;
let connection;

// Fungsi untuk memutar audio di voice channel
async function playAudio(channel) {
    try {
        const audioPath = path.join(__dirname, 'audio', 'nikah.mp3');
        connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        player = createAudioPlayer();
        connection.subscribe(player);

        const playResource = () => {
            const resource = createAudioResource(audioPath, {
                inlineVolume: true,
            });
            resource.volume.setVolume(0.08); // Atur volume ke 8%
            player.play(resource);
        };

        playResource();

        player.on(AudioPlayerStatus.Idle, () => {
            console.log('Audio selesai, memulai ulang...');
            playResource();
        });

        player.on('error', (error) => {
            console.error('Kesalahan pada audio player:', error);
        });

        connection.on('error', (error) => {
            console.error('Kesalahan pada koneksi voice channel:', error);
        });

        console.log('Audio sedang diputar di voice channel.');
    } catch (error) {
        console.error('Gagal memutar audio:', error);
    }
}

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
                .setTitle('Halo, perkenalkan saya!')
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
    if (message.content.startsWith(`${PREFIX}join`)) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            message.reply('Anda harus berada di voice channel untuk menggunakan perintah ini.');
            return;
        }

        await playAudio(voiceChannel);
        message.reply('Pak Penghulu telah bergabung ke channel.');
    }

    if (message.content.startsWith(`${PREFIX}leave`)) {
        if (connection) {
            connection.destroy();
            connection = null;
            player = null;
            message.reply('Pak Penghulu telah keluar dari voice channel.');
        } else {
            message.reply('Pak Penghulu tidak berada di voice channel.');
        }
    }

    if (message.content === `${PREFIX}carijodoh`) {
        const row = createFormButton();
        await message.channel.send({
            content: 'Klik tombol berikut untuk memulai form Cari Jodoh:',
            components: [row],
        });
    }
});

// Ketika pesan dikirim untuk perintah bot
client.on('messageCreate', async (message) => {
    // ... kode lainnya tetap

    // Path folder gambar lokal
    const girlsFolder = path.join(__dirname, 'couple_images', 'girls');
    const boysFolder = path.join(__dirname, 'couple_images', 'boys');

    // Perintah untuk mengirim gambar pasangan
    if (message.content.startsWith(`${PREFIX}couple`)) {
        try {
            // Baca file dari folder girls dan boys
            const girlFiles = fs.readdirSync(girlsFolder);
            const boyFiles = fs.readdirSync(boysFolder);

            // Pastikan kedua folder memiliki jumlah file yang sama
            if (girlFiles.length !== boyFiles.length) {
                await message.channel.send('Jumlah gambar cewek dan cowok tidak sama! Periksa folder pasangan.');
                return;
            }

            // Pastikan urutan file di kedua folder sama (urutan yang diinginkan)
            girlFiles.sort();
            boyFiles.sort();

            // Ambil gambar pertama sesuai urutan
            const randomIndex = Math.floor(Math.random() * girlFiles.length);
            const girlImagePath = path.join(girlsFolder, girlFiles[randomIndex]);
            const boyImagePath = path.join(boysFolder, boyFiles[randomIndex]);

            // Kirim kedua gambar ke channel
            await message.reply({
                content: `👩‍❤️‍👨 **Ini Photo Profile Couple buat kamu!**`,
                files: [girlImagePath, boyImagePath],
            });
        } catch (error) {
            console.error('Terjadi kesalahan saat mengirim gambar:', error);
            await message.channel.send('Maaf, terjadi kesalahan saat mencoba mengirim gambar.');
        }
    }
});


// Menambahkan custom status
const statusMessages = ['💌 Lagi Cari Jodoh?', '📞 Hubungi Saya!'];
const statusTypes = ['online'];
let currentStatusIndex = 0;
let currentTypeIndex = 0;

async function login() {
  try {
    await client.login(TOKEN);
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
  console.log('\x1b[33m[ STATUS ]\x1b[0m', `Updated status to: ${currentStatus} - ${currentType}`);

  // Next status
  currentStatusIndex = (currentStatusIndex + 1) % statusMessages.length;
  currentTypeIndex = (currentTypeIndex + 1) % statusTypes.length;
}

setInterval(updateStatus, 10000); // Ubah status setiap 10 detik
login();
