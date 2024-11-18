const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const PREFIX = process.env.PREFIX;
const TOKEN = process.env.TOKEN;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

const userDataStore = {};

// Fungsi untuk membuat tombol
const createFormButton = () => {
    const button = new ButtonBuilder()
        .setCustomId('form_jodoh_start')
        .setLabel('Isi Form Cari Jodoh')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);
    return row;
};

// Mengumpulkan data dengan tombol
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        const userId = interaction.user.id;
        
        // Mulai form
        if (interaction.customId === 'form_jodoh_start') {
            const embed = new EmbedBuilder()
                .setColor('#FF00FF')
                .setTitle('Form Cari Jodoh - Bagian 1')
                .setDescription('Silakan jawab beberapa pertanyaan untuk melanjutkan.');

            await interaction.reply({ embeds: [embed], ephemeral: true });

            // Menyimpan data sementara untuk bagian pertama
            userDataStore[userId] = {};

            // Kirim pertanyaan pertama
            const firstStep = await interaction.user.send("Nama: ");
            const collectedName = await interaction.user.dmChannel.awaitMessages({ max: 1 });
            userDataStore[userId].nama = collectedName.first().content;

            const secondStep = await interaction.user.send("Umur: ");
            const collectedAge = await interaction.user.dmChannel.awaitMessages({ max: 1 });
            userDataStore[userId].umur = collectedAge.first().content;

            const thirdStep = await interaction.user.send("Jenis Kelamin (Pria/Wanita): ");
            const collectedGender = await interaction.user.dmChannel.awaitMessages({ max: 1 });
            userDataStore[userId].gender = collectedGender.first().content;

            const fourthStep = await interaction.user.send("Agama: ");
            const collectedReligion = await interaction.user.dmChannel.awaitMessages({ max: 1 });
            userDataStore[userId].agama = collectedReligion.first().content;

            const fifthStep = await interaction.user.send("Domisili: ");
            const collectedLocation = await interaction.user.dmChannel.awaitMessages({ max: 1 });
            userDataStore[userId].domisili = collectedLocation.first().content;

            // Setelah data terkumpul, lanjutkan ke bagian kedua
            const embedStep2 = new EmbedBuilder()
                .setColor('#FF00FF')
                .setTitle('Form Cari Jodoh - Bagian 2')
                .setDescription('Silakan jawab beberapa pertanyaan untuk melanjutkan.');

            await interaction.user.send({ embeds: [embedStep2] });

            const sixthStep = await interaction.user.send("Kesibukan: ");
            const collectedOccupation = await interaction.user.dmChannel.awaitMessages({ max: 1 });
            userDataStore[userId].kesibukan = collectedOccupation.first().content;

            const seventhStep = await interaction.user.send("Hobi: ");
            const collectedHobby = await interaction.user.dmChannel.awaitMessages({ max: 1 });
            userDataStore[userId].hobi = collectedHobby.first().content;

            const eighthStep = await interaction.user.send("Tipe Ideal: ");
            const collectedIdealType = await interaction.user.dmChannel.awaitMessages({ max: 1 });
            userDataStore[userId].tipeIdeal = collectedIdealType.first().content;

            // Setelah form selesai, tampilkan hasilnya
            const resultEmbed = new EmbedBuilder()
                .setColor('#FF00FF')
                .setTitle('Hasil Form Cari Jodoh')
                .setDescription(`
                    **Nama**: ${userDataStore[userId].nama}\n
                    **Umur**: ${userDataStore[userId].umur}\n
                    **Jenis Kelamin**: ${userDataStore[userId].gender}\n
                    **Agama**: ${userDataStore[userId].agama}\n
                    **Domisili**: ${userDataStore[userId].domisili}\n
                    **Kesibukan**: ${userDataStore[userId].kesibukan}\n
                    **Hobi**: ${userDataStore[userId].hobi}\n
                    **Tipe Ideal**: ${userDataStore[userId].tipeIdeal}
                `)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp();

            await interaction.user.send({ embeds: [resultEmbed] });
            delete userDataStore[userId];
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

// Login bot
client.login(TOKEN);
