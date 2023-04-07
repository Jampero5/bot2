const {
  Client,
  MessageEmbed,
  MessageActionRow,
  MessageButton,
} = require("discord.js");
const config = require("./config");
const Enmap = require("enmap");

const database = new Enmap({
  name: "database",
  autoEnsure: {
    votes: [],
  },
});

const client = new Client({
  intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS"],
});

client.on("messageCreate", async function (message) {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.startsWith(config.prefix)) return;

  const [command, ...args] = message.content
    .slice(config.prefix.length)
    .split(" ");
  if (command.toLowerCase() === "hyväksy") {
    const id = args[0];
    if (!id) return message.reply("ℹ️ Viestin ID");
    let msg;
    try {
      msg = await client.channels.cache
        .get(config.kasittelyChannel)
        .messages.fetch(id);
    } catch (x) {
      return message.reply("**❌ Viestiä ei löydy**");
    }
    //message.reply("✅ **Hyväksyit hakemuksen**");
    database.set(id, true, "accepted");
    if (msg) {
     
      database.set(database.get(msg.id, "user"), {
        lastMessage: Date.now(),
      });
      console.log(database.get(msg.id, "user"))
	  client.users.fetch(database.get(msg.id, "user"), false).then((user) => {
      user.send({
          embeds: [
            new MessageEmbed({
              color: "GREEN",
              title: "Hakemus hyväksytty",
              description: `Hakemuksesi on hyväksytty. Tervetuloa pohjolaan!\n🚩 Tulos: **✅ ${
                database.get(msg.id, "votes").filter((x) => x.yes === true)
                  .length
              } ❌ ${
                database.get(msg.id, "votes").filter((x) => x.yes === false)
                  .length
              }**`,

			 author: {
		name: 'Pohjola',
		},
		
		thumbnail: {
			url: "https://cdn.discordapp.com/attachments/814685002482712576/816708776882864168/Webp.net-resizeimage_7.png",
		},
		
		timestamp: new Date(),
		
		footer: {
		text: 'Pohjola©',
		icon_url: 'https://cdn.discordapp.com/attachments/814685002482712576/816708776882864168/Webp.net-resizeimage_7.png',
	},
			 
            }),
          ],
		  })
        })
        .catch(() => {console.log("En voinut lähettää viestiä");});
		 msg.delete();
    }
    message.guild.channels.cache.get(config.acceptedChannel).send({
      embeds: [
        new MessageEmbed({
          color: "GREEN",
          title: "Hakemus hyväksytty",
          description: `Henkilön ${msg.author.tag} hakemus hyväksyttiin ${
            message.author.tag
          } toimesta\n💬 **Hakemus:** ${database.get(
            msg.id,
            "content"
          )} \n🚩 Tulos: **✅ ${
            database.get(msg.id, "votes").filter((x) => x.yes === true).length
          } ❌ ${
            database.get(msg.id, "votes").filter((x) => x.yes === false).length
          }**`,
        }),
      ],
    });
  } else if (command.toLowerCase() === "hylkää") {
    const id = args[0];
    if (!id) return message.reply("ℹ️ Please provide Message ID");
    let msg;
    try {
      msg = await client.channels.cache
        .get(config.kasittelyChannel)
        .messages.fetch(id);
    } catch (x) {
      return message.reply("**❌ That message doesn't exist!**");
    }
    message.reply("❌ **Declined suggestion!**");
    database.set(id, true, "declined");
    if (msg) {
      database.set(database.get(msg.id, "user"), {
        lastMessage: Date.now(),
      });
      console.log(database.get(msg.id, "user"))
	  client.users.fetch(database.get(msg.id, "user"), false).then((user) => {
		  console.log(database.get(msg.id, "votes").filter((x) => x.yes === false).length)
      user.send({
          embeds: [
            new MessageEmbed({
              color: "RED",
              title: "Hakemus hylätty",
              description: `Hakemuksesi hylättiin\n🚩 Tulos: **✅ ${
                database.get(msg.id, "votes").filter((x) => x.yes === true)
                  .length
              } ❌ ${
                database.get(msg.id, "votes").filter((x) => x.yes === false)
                  .length
              }**`,
			  
			  
			  
            }),
          ],
        })
	  })
        .catch(() => {console.log("En voinut lähettää viestiä");});
		 msg.delete();
    }
    message.guild.channels.cache.get(config.rejectChannel).send({
      embeds: [
        new MessageEmbed({
          color: "RED",
          title: "Declined",
          description: `Henkilön ${msg.author.tag} hakemus hylättiin ${
            message.author.tag
          } toimesta\n💬 **Hakemus:** ${database.get(
            msg.id,
            "content"
          )} \n🚩 Tulos: **✅ ${
            database.get(msg.id, "votes").filter((x) => x.yes === true).length
          } ❌ ${
            database.get(msg.id, "votes").filter((x) => x.yes === false).length
          }**`,
        }),
      ],
    });
  }
});

client.on("ready", function () {
  console.log(`${client.user.username} is now ready.`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== config.suggestChannel) return;

	const userData = database.get(message.author.id);

  if (userData && Date.now() - userData.lastMessage < 86400000) {
    message.delete();
    message.author
      .send(
        `⏰ Odotathan **24 tuntia** ennen uuden hakemuksen lähettämistä.`
      )
      .catch(() => {});
    return;
  }
  
  console.log(database.some((r) => r.user === message.author.id))
  
  if (database.some((r) => r.user === message.author.id)) {
    message.delete();
    message.author
      .send(
        `Sinulla on käsittelyssä oleva hakemus.`
      )
      .catch(() => {});
    return;
  }
  
  
 

  const buttons = [
    new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId(`yes_${message.id}`)
        .setEmoji("✅")
        .setStyle("SUCCESS"),
      new MessageButton()
        .setCustomId(`no_${message.id}`)
        .setEmoji("❌")
        .setStyle("DANGER")
    ),
  ];
  
  

  const embed = new MessageEmbed()
  
	.setColor("BLUE")
          .setTitle(`Whitelist hakemus`)
          .setDescription(message.content)
          .setFooter(`POHJOLA`, `https://cdn.discordapp.com/attachments/814685002482712576/816708776882864168/Webp.net-resizeimage_7.png`)
		  .setTimestamp()
		  .setThumbnail("https://cdn.discordapp.com/attachments/814685002482712576/816708776882864168/Webp.net-resizeimage_7.png")
		  .setAuthor('Pohjola')

  const msg = await message.guild.channels.cache.get(config.kasittelyChannel).send({
    embeds: [embed],
    components: buttons,
  });
  
  msg.react("✅");

  database.set(msg.id, {
    user: message.author.id,
    content: message.content,
    votes: [],
    approved: false,
    declined: false,
  });
  
  message.delete();

  message.author
    .send({
      embeds: [
        new MessageEmbed({
          title: "Hakemus vastaanotettu",
          description: `Whitelist hakemuksesi on vastaanotettu. \nHakemuksesi äänestää Pohjolan yhteisön jäsenet.\nKiitos mielenkiinnostasi Pohjolaa kohtaan! \n\nKäsittelemme hakemuksesi mahdollisimman pian.`,
		  author: {
		name: 'Pohjola',
		},

		
		thumbnail: {
		url: 'https://cdn.discordapp.com/attachments/814685002482712576/816708776882864168/Webp.net-resizeimage_7.png',
	},

		timestamp: new Date(),
		
		footer: {
		text: 'Pohjola©',
		icon_url: 'https://cdn.discordapp.com/attachments/814685002482712576/816708776882864168/Webp.net-resizeimage_7.png',
	},
        }),
      ],
    })
    .catch(() => {});
});

client.on("interactionCreate", async function (interaction) {
  if (!interaction.isButton()) return;
  const id = interaction.customId;
  const msgId = interaction.message.id;
  if (!database.get(msgId)) return;
  if (database.get(msgId, "votes").find((x) => x.user === interaction.user.id))
    return interaction.reply({
      content: "❌ Olet **äänestänyt** jo kyseisen hakemuksen",
      ephemeral: true,
    }).catch(err => {});
  if (id.startsWith("accept")) {
    let msg;
    try {
      msg = await client.channels.cache
        .get(config.kasittelyChannel)
        .messages.fetch(id.split("_")[1]);
    } catch (x) {
      return message.reply("**❌ Cant find request**");
    }

	
    //interaction.reply("✅ **Hyväksyit hakemuksen**", { ephemeral: true });
	
	console.log(database.get(msg.id, "user"))
	  interaction.guild.members.fetch(database.get(msg.id, "user"), false).then((user) => {
		 user.roles.add(config.roleAddOnRequest).catch(() => {});
	  })
	
    database.set(msg.id, true, "accepted");
    if (msg) {
      interaction.message.delete();
      database.set(database.get(msg.id, "user"), {
        lastMessage: Date.now(),
      });
	  
	   const no = database.get(msg.id, "votes").filter((x) => x.yes === false).length;
	  const yes = database.get(msg.id, "votes").filter((x) => x.yes === true).length;
      console.log(database.get(msg.id, "user"))
	  client.users.fetch(database.get(msg.id, "user"), false).then((user) => {
      user.send({
          embeds: [
            new MessageEmbed({
              color: "GREEN",
              title: "Hakemus hyväksytty",
              description: `Hakemuksesi on hyväksytty. Tervetuloa Pohjolaan!\n🚩 Tulos: **✅ ${
                yes
              } ❌ ${
                no
              }**`,
			  
			  author: {
		name: 'Pohjola',
		},

		
		thumbnail: {
		url: 'https://cdn.discordapp.com/attachments/814685002482712576/816708776882864168/Webp.net-resizeimage_7.png',
	},

		timestamp: new Date(),

		footer: {
		text: 'Pohjola©',
		icon_url: 'https://cdn.discordapp.com/attachments/814685002482712576/816708776882864168/Webp.net-resizeimage_7.png',
	},
			  
            }),
          ],
	  })
        })
       .catch(() => {console.log("En voinut lähettää viestiä");});
		
		//await interaction.guild.members.cache.get.roles.add(config.roleAddOnRequest).catch(() => {});
		 msg.delete();
    }
	
	//console.log("joo")
	
		//await client.users.cache.get(database.get(msg.id, "user")).roles.add(config.roleAddOnRequest).catch(() => {});
	
    interaction.guild.channels.cache.get(config.acceptedChannel).send({
      embeds: [
        new MessageEmbed({
          color: "GREEN",
          title: "Hakemus hyväksytty",
          description: `Henkilön <@${database.get(
            msg.id,
            "user"
          )}> hakemus hyväksyttiin ${
            interaction.user.tag
          } toimesta\n💬 **Hakemus:** ${database.get(
            msg.id,
            "content"
          )} \n🚩 Tulos: **✅ ${
            database.get(msg.id, "votes").filter((x) => x.yes === true).length
          } ❌ ${
            database.get(msg.id, "votes").filter((x) => x.yes === false).length
          }**`,
		  
		  author: {
		name: 'Pohjola',
		},

		
		thumbnail: {
		url: 'https://cdn.discordapp.com/attachments/814685002482712576/816708776882864168/Webp.net-resizeimage_7.png',
	},

		timestamp: new Date(),
		
		footer: {
		text: 'Pohjola©',
		icon_url: 'https://cdn.discordapp.com/attachments/814685002482712576/816708776882864168/Webp.net-resizeimage_7.png',
	},
		  
        }),
      ],
    }).catch(err => {});
	database.delete(msg.id);
  } else if (id.startsWith("decline")) {
    let msg;
    try {
      msg = await client.channels.cache
        .get(config.kasittelyChannel)
        .messages.fetch(id.split("_")[1]);
    } catch (x) {
      //return message.reply("**❌ Hakemusta ei löydy?**");
    }
	

    //interaction.reply("❌ **Hylkäsit hakemuksen!**", { ephemeral: true });
    
    if (msg) {
      interaction.message.delete();
      
      database.set(msg.author.id, {
        lastMessage: Date.now(),
		
      });
	  const no = database.get(msg.id, "votes").filter((x) => x.yes === false).length;
	  const yes = database.get(msg.id, "votes").filter((x) => x.yes === true).length;
	  //console.log(database.get(msg.id, "user"))
	  client.users.fetch(database.get(msg.id, "user"), false).then((user) => {
		   //console.log(database.get(msg.id, "votes").filter((x) => x.yes === false).length)
      user.send({
          embeds: [
            new MessageEmbed({
              color: "RED",
              title: "Hakemus hylätty",
              description: `Hakemuksesi hylättiin. \n🚩 Tulos: **✅ ${
                yes
              } ❌ ${
                no
              }**`,
			  
			  author: {
		name: 'Pohjola',
		},

		
		thumbnail: {
		url: 'https://cdn.discordapp.com/attachments/814685002482712576/816708776882864168/Webp.net-resizeimage_7.png',
	},

		timestamp: new Date(),
		
		footer: {
		text: 'Pohjola©',
		icon_url: 'https://cdn.discordapp.com/attachments/814685002482712576/816708776882864168/Webp.net-resizeimage_7.png',
	},
			  
            }),
          ],
        })
        .catch(() => {console.log("En voinut lähettää viestiä");});
		});
		database.set(msg.id, true, "declined");
		msg.delete();
    }
    interaction.guild.channels.cache.get(config.rejectChannel).send({
      embeds: [
        new MessageEmbed({
          color: "RED",
          title: "Hakemus hylätty",
          description: `Henkilön <@${database.get(
            msg.id,
            "user"
          )}> hakemus hylättiin ${
            interaction.user.tag
          } toimesta\n💬 **Hakemus:** ${database.get(
            msg.id,
            "content"
          )} \n🚩 Tulos: **✅ ${
            database.get(msg.id, "votes").filter((x) => x.yes === true).length
          } ❌ ${
            database.get(msg.id, "votes").filter((x) => x.yes === false).length
          }**`,
		  
		  author: {
		name: 'Pohjola',
		},

		
		thumbnail: {
		url: 'https://cdn.discordapp.com/attachments/814685002482712576/816708776882864168/Webp.net-resizeimage_7.png',
	},

		timestamp: new Date(),
		
		footer: {
		text: 'Pohjola©',
		icon_url: 'https://cdn.discordapp.com/attachments/814685002482712576/816708776882864168/Webp.net-resizeimage_7.png',
	},
        }),
      ],
    }).catch(err => {});
	  database.delete(msg.id);
  }
  if (id.startsWith("yes")) {
    database.push(
      msgId,
      {
        user: interaction.user.id,
        yes: true,
      },
      "votes"
    );
	
	interaction.reply({
      content: "ℹ️ Äänestit **✅ KYLLÄ**.",
      ephemeral: true,
    }).catch(err => {}); 
	
	
    if (
      database.get(msgId, "votes").filter((x) => x.yes === true).length + database.get(msgId, "votes").filter((x) => x.yes === false).length ===
config.requiredAmountVotesForAdmin
    ) {
      const buttons = [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId(`accept_${interaction.message.id}`)
            .setEmoji("✅")
            .setStyle("SUCCESS"),
          new MessageButton()
            .setCustomId(`decline_${interaction.message.id}`)
            .setEmoji("❌")
            .setStyle("DANGER")
        ),
      ];
      const admin = new MessageEmbed().setDescription(
        `🔗 [Paina tästä mennäksesi alkuperäiseen viestiin](${
          interaction.message.url
        }) \n💬 **Hakemus:** ${database.get(
          interaction.message.id,
          "content"
        )} \n🚩 Tulos: **✅ ${
          database.get(msgId, "votes").filter((x) => x.yes === true).length
        } ❌ ${
          database.get(msgId, "votes").filter((x) => x.yes === false).length
        }**`
      );
      client.channels.cache
        .get(config.adminChannel)
        .send({ embeds: [admin], components: buttons });
    }
  } else if (id.startsWith("no")) {
    database.push(
      msgId,
      {
        user: interaction.user.id,
        yes: false,
      },
      "votes"
    );
	
	//try {

	interaction.reply({
      content: "ℹ️ Äänestit **❌ EI**.",
      ephemeral: true,
    }).catch(err => {}); 
	//} catch (c) {
	//	console.log("kusi")
	//}
   // interaction.reply({
    //  content: "ℹ️ Äänestit **❌ EI**.",
   //   ephemeral: true,
   // });
	
	
	
	if (
      database.get(msgId, "votes").filter((x) => x.yes === true).length + database.get(msgId, "votes").filter((x) => x.yes === false).length ===
config.requiredAmountVotesForAdmin
    ) {
      const buttons = [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId(`accept_${interaction.message.id}`)
            .setEmoji("✅")
            .setStyle("SUCCESS"),
          new MessageButton()
            .setCustomId(`decline_${interaction.message.id}`)
            .setEmoji("❌")
            .setStyle("DANGER")
        ),
      ];
      const admin = new MessageEmbed().setDescription(
        `🔗 [Paina tästä mennäksesi alkuperäiseen viestiin](${
          interaction.message.url
        }) \n💬 **Hakemus:** ${database.get(
          interaction.message.id,
          "content"
        )} \n🚩 Tulos: **✅ ${
          database.get(msgId, "votes").filter((x) => x.yes === true).length
        } ❌ ${
          database.get(msgId, "votes").filter((x) => x.yes === false).length
        }**`
      );
      client.channels.cache
        .get(config.adminChannel)
        .send({ embeds: [admin], components: buttons });
    }
	
	
  }
});

client.login(config.token);
