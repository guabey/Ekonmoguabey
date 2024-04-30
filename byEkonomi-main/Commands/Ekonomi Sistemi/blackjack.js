console.log(Discord.MessageEmbed)
const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const mzrdb = require('croxydb');

function kartçek() {
  const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  return cards[Math.floor(Math.random() * cards.length)];
}

function hesapla(hand) {
  let value = 0;
  let hasAce = false;

  for (const card of hand) {
    if (card === 'A') {
      hasAce = true;
      value += 11;
    } else if (['K', 'Q', 'J'].includes(card)) {
      value += 10;
    } else {
      value += parseInt(card);
    }
  }

  if (hasAce && value > 21) {
    value -= 10;
  }

  return value;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bj')
    .setDescription('Blackjack Oynarsınız')
    .addIntegerOption(option => option
      .setName('miktar')
      .setDescription('Oynamak İstediğiniz Miktarı Yazınız')
      .setRequired(true)),

  async execute(interaction) {
    const user = interaction.user;
    const miktar = interaction.options.getInteger('miktar');

    await interaction.deferReply({ ephemeral: false });

    const bakiye = mzrdb.get(`mzrbakiye.${user.id}`) || 0;

    if (miktar > bakiye) {
      const embed = new Discord.MessageEmbed()
        .setColor(9807270)
        .setDescription('Yeterli paranız yok.');
      return interaction.reply({ embeds: [embed] });
    }

    const oyuncu = [kartçek(), kartçek()];
    const krupiyerkart = kartçek();
    const krupiyer = [krupiyerkart];
    let oyuncudeğer = hesapla(oyuncu);
    let botdeğer = hesapla(krupiyer);

    const embed = new Discord.MessageEmbed()
  .setColor('#0099ff')
  .setTitle('---BlackJack---')
  .addFields(
    { name: 'Oyuncunun Kartları', value: 'Değer', inline: true },
    { name: 'Krupiyenin Kartları', value: 'Değer', inline: true }
  );

    const oyuncumeşaz = await interaction.reply({ embeds: [embed] });
    await oyuncumeşaz.react('👊');
    await oyuncumeşaz.react('🛑');

    const filter = (reaction, user) => ['👊', '🛑'].includes(reaction.emoji.name) && user.id === interaction.user.id;
    const collector = oyuncumeşaz.createReactionCollector({ filter, time: 30000 });

    collector.on('collect', async (reaction) => {
      if (reaction.emoji.name === '👊') {
        const newCard = kartçek();
        oyuncu.push(newCard);
        oyuncudeğer = hesapla(oyuncu);

        if (oyuncudeğer > 21) {
          collector.stop('burst');
        } else {
          const embed = new Discord.MessageEmbed()
            .setColor(9807270)
            .setTitle('---BlackJack---')
            .addFields(
              { name: 'Oyuncunun Kartları', value: ` ${oyuncu.join(' ')}\nToplam: ${oyuncudeğer}`, inline: true },
              { name: 'Krupiyenin Kartları', value: ` ${krupiyerkart} ?`, inline: true }
            );
          await oyuncumeşaz.edit({ embeds: [embed] });
        }
      } else if (reaction.emoji.name === '🛑') {
        collector.stop('stand');
      }
    });

    collector.on('end', async (collected, reason) => {
      while (botdeğer < 17) {
        const newCard = kartçek();
        krupiyer.push(newCard);
        botdeğer = hesapla(krupiyer);
      }

      const botsonuç = `Krupiye kartları: ${krupiyer.join(', ')} (Toplam: ${botdeğer})`;
      const oyuncusonuç = `Oyuncu kartları: ${oyuncu.join(', ')} (Toplam: ${oyuncudeğer})`;
      const resultEmbed = new Discord.MessageEmbed().setTitle('Blackjack Sonuçları');

      if (reason === 'burst') {
        resultEmbed.setColor(15548997).setDescription(`El patladı! Kaybettiniz.\n\n${botsonuç}\n\n${oyuncusonuç}`);
        mzrdb.add(`mzrbakiye.${user.id}`, -miktar);
      } else if (reason === 'stand') {
        if (botdeğer > 21 || botdeğer < oyuncudeğer) {
          resultEmbed.setColor(5763719).setDescription(`Kazandınız!\n\n${botsonuç}\n\n${oyuncusonuç}`);
          mzrdb.add(`mzrbakiye.${user.id}`, miktar);
        } else if (botdeğer > oyuncudeğer) {
          resultEmbed.setColor(15548997).setDescription(`Kaybettiniz.\n\n${botsonuç}\n\n${oyuncusonuç}`);
          mzrdb.add(`mzrbakiye.${user.id}`, -miktar);
        } else {
          resultEmbed.setColor(15105570).setDescription(`Berabere.\n\n${botsonuç}\n\n${oyuncusonuç}`);
        }
      }

      interaction.channel.send({ embeds: [resultEmbed] });
    });
  },
};