const { Client, Intents, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { PREFIX, TOKEN } = require('./config'); // Sesuaikan dengan token bot Anda

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES] });

// Fungsi untuk membuat tombol
const createFormButton = () => {
    const button = new MessageButton()
        .setCustomId('form_jodoh')  // ID tombol untuk interaksi
        .setLabel('Isi Form Cari Jodoh')  // Ganti label tombol
        .setStyle('PRIMARY');
    
    const row = new MessageActionRow().addComponents(button);
    return row;
};

// Fungsi untuk mengirim form kepada pengguna
const sendForm = async (interaction) => {
    // Kirimkan DM kepada user untuk mengisi form
    const user = interaction.user;
    const dmChannel = await user.createDM();

    const embed = new MessageEmbed()
        .setColor('#FF00FF')
        .setTitle('Form Cari Jodoh')  // Ganti judul
        .setDescription('Silakan isi form berikut untuk melanjutkan.\nSetiap jawaban akan digunakan untuk mencari pasangan yang cocok.')
        .setTimestamp();

    // Mengirim embed
    await dmChannel.send({ embeds: [embed] });

    // Tanyakan informasi kepada pengguna
    const questions = [
        'Nama: ',
        'Umur: ',
        'Jenis Kelamin: ',
        'Agama: ',
        'Domisili: ',
        'Kesibukan: ',
        'Hobi: ',
        'Tipe Ideal: '
    ];

    let userData = {};
    for (const question of questions) {
        const filter = (response) => response.author.id === user.id; // Filter hanya untuk user ini
        const msg = await dmChannel.send(question);
        const collected = await dmChannel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
        const answer = collected.first().content;
        userData[question] = answer;
    }

    // Kirim hasil dalam bentuk embed
    const resultEmbed = new MessageEmbed()
        .setColor('#FF00FF')
        .setTitle('Hasil Form Cari Jodoh')  // Ganti judul
        .setDescription(`Berikut adalah hasil form kamu: \n\n**Nama**: ${userData['Nama: ']}\n**Umur**: ${userData['Umur: ']}\n**Jenis Kelamin**: ${userData['Jenis Kelamin: ']}\n**Agama**: ${userData['Agama: ']}\n**Domisili**: ${userData['Domisili: ']}\n**Kesibukan**: ${userData['Kesibukan: ']}\n**Hobi**: ${userData['Hobi: ']}\n**Tipe Ideal**: ${userData['Tipe Ideal: ']}`)
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();

    // Kirim hasil ke channel atau ke DM
    await interaction.reply({ embeds: [resultEmbed] });

    // Tag user dan beri reaksi love otomatis
    await interaction.react('❤️');
};

// Ketika bot siap
client.once('ready', () => {
    console.log('Bot is ready!');
});

// Ketika ada interaksi (tombol diklik)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'form_jodoh') {
        // Menampilkan form kepada user
        await sendForm(interaction);
    }
});

// Ketika bot menerima pesan untuk menampilkan tombol
client.on('messageCreate', async (message) => {
    if (message.content === `${PREFIX}carijodoh`) {  // Ganti perintah di sini
        const row = createFormButton();
        await message.reply({ content: 'Klik tombol berikut untuk mengisi form Cari Jodoh:', components: [row] });
    }
});

// Ketika pengguna mengetik perintah lainnya, pastikan tombol tetap muncul di pesan awal
client.on('messageCreate', async (message) => {
    if (message.content === `${PREFIX}carijodoh` && !message.author.bot) {  // Ganti perintah di sini
        const row = createFormButton();
        await message.channel.send({ content: 'Klik tombol berikut untuk mengisi form Cari Jodoh:', components: [row] });
    }
});

// Login bot
client.login(TOKEN);