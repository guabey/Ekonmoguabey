const { ActivityType } = require("discord.js")
const { loadCommands } = require("../../Handlers/commandHandler");
const djs = require('mzrdjs');

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        client.user.setActivity({ name: 'Guabey Tarafından Yönetiliyorum Discord gua01', type: ActivityType.Streaming, url: "" });

        try {
            loadCommands(client).then(() => djs.slashBuilder);
        } catch (error) {
            console.log(error);
        };
    },
};
