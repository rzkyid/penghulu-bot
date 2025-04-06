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
    SlashCommandBuilder, 
    PermissionFlagsBits
} = require('discord.js');

const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus 
} = require('@discordjs/voice');

const PREFIX = 'ph';
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

// Register Slash Commands
client.on('ready', () => {
        client.application.commands.create(
        new SlashCommandBuilder()
        .setName('say')
        .setDescription('Bot akan mengirimkan pesan yang kamu ketik.')
        .addStringOption((option) =>
            option
                .setName('pesan')
                .setDescription('Ketik pesan yang akan dikirim oleh bot')
                .setRequired(true)
        )
    );
});

// Fitur mengirim pesan melalui bot
client.on('interactionCreate', async (interaction) => {
    // Pastikan hanya menangani Slash Command
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    // Periksa apakah user memiliki role dengan ID '1077457424736333844' atau admin
    const hasPermission = interaction.memberPermissions.has(PermissionFlagsBits.Administrator) ||
        interaction.member.roles.cache.has('1077457424736333844'); // Cek apakah pengguna memiliki role dengan ID ini

    if (!hasPermission) {
        return interaction.reply({ content: "Anda tidak memiliki izin untuk menggunakan perintah ini.", ephemeral: true });
    }
    
// Fitur /say untuk mengirim pesan melalui Bot
    if (interaction.commandName === 'say') {
        // Mendapatkan pesan dari opsi
        const pesan = interaction.options.getString('pesan');

        // Mengirimkan pesan
        await interaction.reply({ content: 'Pesan berhasil dikirim!', ephemeral: true });
        await interaction.channel.send(pesan); // Pesan dikirim ke channel tempat command digunakan

        const logChannel = client.channels.cache.get('1099916187044941914');
        if (logChannel) {
            logChannel.send(`[LOG] **${interaction.user.tag}** menggunakan /say: "${pesan}"`);
    }
    }  
});

// Menangani DM
client.on('messageCreate', async (message) => {
    // Cek jika pesan adalah DM dan bukan dari bot itu sendiri
    if (message.channel.type === 1 && !message.author.bot) { // DM memiliki tipe channel `1`
        if (!respondedUsers.has(message.author.id)) { // Jika user belum dibalas
            try {
                const userMention = message.author.toString(); // Menggunakan toString untuk mention user
                const response = `👋 Halo kak ${userMention}! Udah lama jadi jomblo? Ingin cepat dapat jodoh? langsung aja ke channel <#1284544825596837971> ❤️\n\nSemoga segera ketemu jodohnya ya! 😉`;
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

// Fitur surat cinta

const SURAT_CINTA_CHANNEL_ID = '1358293219036758027';

// Trigger kata "phsuratcinta"
client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase().includes('phsuratcinta')) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('tulis_surat_cinta')
                .setLabel('💌 Tulis Surat Cinta')
                .setStyle(ButtonStyle.Primary)
        );
        await message.channel.send({ content: 'Ingin mengirim surat cinta?', components: [row] });
    }
});

// Saat tombol ditekan
client.on('interactionCreate', async interaction => {
    if (interaction.isButton() && interaction.customId === 'tulis_surat_cinta') {
        const modal = new ModalBuilder()
            .setCustomId('form_surat_cinta')
            .setTitle('💌 Tulis Surat Cinta');

        const dariInput = new TextInputBuilder()
            .setCustomId('dari')
            .setLabel('Dari: (Kosongkan jika ingin anonim)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const untukInput = new TextInputBuilder()
            .setCustomId('untuk')
            .setLabel('Untuk: (Masukan User ID jika ingin mention)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const isiInput = new TextInputBuilder()
            .setCustomId('isi')
            .setLabel('Isi Surat:')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const gambarInput = new TextInputBuilder()
            .setCustomId('gambar')
            .setLabel('Link Gambar: (opsional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const modalRow1 = new ActionRowBuilder().addComponents(dariInput);
        const modalRow2 = new ActionRowBuilder().addComponents(untukInput);
        const modalRow3 = new ActionRowBuilder().addComponents(isiInput);
        const modalRow4 = new ActionRowBuilder().addComponents(gambarInput);

        modal.addComponents(modalRow1, modalRow2, modalRow3, modalRow4);
        await interaction.showModal(modal);
    }

// Saat form dikirim
if (interaction.isModalSubmit() && interaction.customId === 'form_surat_cinta') {
    const dari = interaction.fields.getTextInputValue('dari');
    const untuk = interaction.fields.getTextInputValue('untuk');
    const isi = interaction.fields.getTextInputValue('isi');
    const gambar = interaction.fields.getTextInputValue('gambar');

    const channel = interaction.guild.channels.cache.get(SURAT_CINTA_CHANNEL_ID);
    const logChannel = interaction.guild.channels.cache.get('1099916187044941914');

    if (!channel || !channel.isTextBased()) {
        return interaction.reply({ content: 'Channel surat cinta tidak ditemukan!', ephemeral: true });
    }

    // Cek apakah input adalah user ID yang valid
    let mentionText = untuk;
    const idPattern = /^\d{17,20}$/;

    if (idPattern.test(untuk)) {
        try {
            const member = await interaction.guild.members.fetch(untuk);
            if (member) mentionText = `<@${member.id}>`;
        } catch (err) {
            mentionText = untuk;
        }
    } else {
        const member = interaction.guild.members.cache.find(m => m.user.username.toLowerCase() === untuk.toLowerCase());
        if (member) {
            mentionText = `<@${member.id}>`;
        }
    }

    const text = `💌 Surat cinta untuk ${mentionText}`;
    const embed = new EmbedBuilder()
        .setColor('#AD1457')
        .setTitle('Isi surat:')
        .setDescription(isi)
        .setFooter({ text: `Surat cinta dari ${dari ? dari : 'Seseorang'} 💘` })
        .setTimestamp();

    if (gambar) embed.setImage(gambar);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('tulis_surat_cinta')
            .setLabel('💌 Tulis Surat Cinta')
            .setStyle(ButtonStyle.Primary)
    );

    await channel.send({ content: text, embeds: [embed], components: [row] });

    // Auto react ❤️
    await sentMessage.react('❤️');
    
    await interaction.reply({ content: '✅ Surat cintamu sudah terkirim!', ephemeral: true });

    // Kirim log (menggunakan info user asli)
    if (logChannel && logChannel.isTextBased()) {
        const logEmbed = new EmbedBuilder()
            .setTitle('📨 Log Surat Cinta')
            .setColor('#AD1457')
            .addFields(
                { name: 'Pengirim', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
                { name: 'Untuk', value: mentionText, inline: false },
                { name: 'Isi Surat', value: isi.length > 1000 ? isi.substring(0, 1000) + '...' : isi }
            )
            .setTimestamp();

        if (gambar) logEmbed.setImage(gambar);
        logChannel.send({ embeds: [logEmbed] });
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
                .setColor('#AD1457')
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
                    content: `${interaction.user} sedang **Cari Jodoh**.`,
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
                content: `Nih Photo Profile Couple buat kamu! Suka ga? ${message.author.toString()}? 👩‍❤️‍👨`,
                files: [girlImagePath, boyImagePath],
            });
        } catch (error) {
            console.error('Terjadi kesalahan saat mengirim gambar:', error);
            await message.channel.send('Maaf, terjadi kesalahan saat mencoba mengirim gambar.');
        }
    }
});


// Menambahkan custom status
const statusMessages = ['😞 Udah Lama Jomblo?', '💌 Lagi Cari Jodoh?', '📞 Hubungi Saya!'];
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
