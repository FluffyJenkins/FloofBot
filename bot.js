const Discord = require('discord.js');
const client = new Discord.Client();
const botToken = require("./token");

const COMMAND_TRIGGER = ">";

let myID;

let roles = [];

let _commands = {
    "setavatartype": {
        "help": "Owner only command!\nUsed to change my avatar image!\nUsage:'" + COMMAND_TRIGGER + "setAvatarType halloween'",
        "process": function (msg, commands) {

            if (!commands[1]) {
                msg.channel.send(_commands[commands[0].toLowerCase()].help);
            } else {
                if (isUserOwner(msg.member)) {
                    client.user.setAvatar('./' + commands[1] + '.png')
                        .then(function () {
                            msg.channel.send("Changed Avatar to " + commands[1]);
                        })
                        .catch(function (e) {
                            msg.channel.send("I don't feel so good\n" + e);
                        });
                }
            }
        }
    },
    "createrole": {
        "help": "Mod only command!\nUsed to create a new notification role\nUsage:'" + COMMAND_TRIGGER + "createRole CatLovers'",
        "process": function (msg, commands) {

            if (!commands[1]) {
                msg.channel.send(_commands[commands[0].toLowerCase()].help);
            } else {
                if (isUserMod(msg.member)) {

                    let roleName = msg.content.slice(commands[0].length + 2);

                    msg.guild.createRole({
                        name: roleName + "*",
                        mentionable: true
                    })
                        .then(function (role) {
                            msg.channel.send(`Created new notification role with name ${role.name}`);
                            refreshRoles();
                        })
                        .catch(console.error);
                }
            }
        }
    },
    "removerole": {
        "help": "Mod only command!\nUsed to remove a notification role\nUsage:'" + COMMAND_TRIGGER + "removeRole CatLovers'",
        "process": function (msg, commands) {

            if (!commands[1]) {
                msg.channel.send(_commands[commands[0].toLowerCase()].help);
            } else {
                if (isUserMod(msg.member)) {
                    let roleName = msg.content.slice(commands[0].length + 2);
                    let foundRole = getRole(roleName, true);
                    if (!foundRole) {
                        msg.channel.send(`Can't find role with name ` + roleName);
                    } else {
                        foundRole.delete("Notification Role deleted by " + msg.member.user.username)
                            .then(function (role) {
                                msg.channel.send(`Removed notification role with name ${role.name}`);
                                refreshRoles();
                            })
                            .catch(console.error);
                    }

                }
            }
        }
    },
    "optin": {
        "help": "Used to opt into a notification role.\nRole can be partially typed. E.G brook for Brooklyn99.\nUsage: '" + COMMAND_TRIGGER + "optin brook'",
        "process": function (msg, commands) {
            if (!commands[1]) {
                msg.channel.send(_commands[commands[0].toLowerCase()].help);
            } else {
                let tempCommands = commands;
                tempCommands.shift();
                if (tempCommands.length !== 0) {
                    tempCommands.forEach(function (tc) {
                        let found = false;
                        roles.forEach(function (role) {
                            if (role.name.toLowerCase().search(tc.toLowerCase()) !== -1) {
                                if (isUserInRole(msg.member, role.id)) {
                                    msg.reply("You have already opted into that role!");
                                    found = true;
                                }
                                else {
                                    msg.member.addRole(role.id, "Optin");
                                    msg.reply("You have now opted into " + role.name);
                                    found = true;
                                }
                            }
                        });
                        if (!found) {
                            msg.reply("That role does not exist!");
                        }
                    });
                }
            }
        }
    },
    "optout": {
        "help": "Used to opt out of a notification role.\nRole can be partially typed. E.G brook for Brooklyn99.\nUsage: '" + COMMAND_TRIGGER + "optout brook'",
        "process": function (msg, commands) {
            if (!commands[1]) {
                msg.channel.send(_commands[commands[0].toLowerCase()].help);
            } else {
                let tempCommands = commands;
                tempCommands.shift();
                if (tempCommands.length !== 0) {
                    tempCommands.forEach(function (tc) {
                        let found = false;
                        roles.forEach(function (role) {
                            if (role.name.toLowerCase().search(tc.toLowerCase()) !== -1) {
                                if (!isUserInRole(msg.member, role.id)) {
                                    msg.reply("You are not opted into that role!");
                                    found = true;
                                }
                                else {
                                    msg.member.removeRole(role.id, "Optout");
                                    msg.reply("You have now opted out of " + role.name);
                                    found = true;
                                }
                            }
                        });
                        if (!found) {
                            msg.reply("That role does not exist!");
                        }
                    });
                }
            }
        }
    },
    "roles": {
        "help": "Used to get the available notification roles and the ones you are currently in.\nUsage: '" + COMMAND_TRIGGER + "roles'",
        "process": function (msg, commands) {
            let reply = "**These are roles you can opt into!**\n```";
            roles.forEach(function (role) {
                reply += role.name + "\n";
            });
            let reply2 = "";
            roles.forEach(function (role) {
                role.members.forEach(function (member) {
                    if (member.id === msg.author.id) {
                        reply2 += role.name + "\n";
                    }
                });
            });
            if (!!reply2) {
                reply += "```\n**These are roles you are already in**\n```" + reply2;
            }
            reply += "```";
            msg.channel.send(reply);
        }
    },
    "help": {
        "help": "Displays the help text.\nUsage: '" + COMMAND_TRIGGER + "help'",
        "process": function (msg, commands) {
            if (!_commands.hasOwnProperty(commands[1])) {
                let reply = "**Help:**\n```";
                Object.keys(_commands).forEach(function (command) {
                    reply += "\"" + command + "\": " + _commands[command].help + "\n\n";
                });
                reply += "```";
                msg.channel.send(reply);
            } else {
                let reply = "**Help:**\n```";
                reply += "\"" + commands[1] + "\": " + _commands[commands[1]].help + "\n\n";
                reply += "```";
                msg.channel.send(reply);
            }
        }
    },
    "ping": {
        "help": "Replies Pong.\nUsage: '>ping'", "process": function (msg, commands) {
            msg.channel.send('Pong.');
        }
    },
    "goodbot": {
        "help": "Makes FloofBot happy\nUsage:'" + COMMAND_TRIGGER + "goodbot'",
        "process": function (msg, commands) {
            let responses = [`Thank you ${msg.member.displayName}`, `<3`, `And I love you too random citizen`, `**purrs**`, `And you are a good human ${msg.member.displayName} or so I hear anyway`, `good human **pats**`];
            msg.channel.send(responses[randomIntFromInterval(0, responses.length)]);
        }
    },
    "badbot": {
        "help": "Makes FloofBot pissed off\nUsage:'" + COMMAND_TRIGGER + "badbot'",
        "process": function (msg, commands) {
            let responses = [`Well fuck you too ${msg.member.displayName}`, `</3`, `#TalkToTheHand`, `**growls**`, `Sorry what was that? I can't hear people with an IQ lower than 2`, `No.`];
            msg.channel.send(responses[randomIntFromInterval(0, responses.length)]);
        }
    },
};

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function isUserOwner(user) {
    let returnlet = false;
    let owners = ["131853004352520192"];
    owners.forEach(function (owner) {
        if (user.id === owner) {
            returnlet = true;
        }
    });
    return returnlet;
}

function isUserMod(user) {
    let returnlet = false;
    user.roles.forEach(function (role) {
        if (role.id === "392643875484991488") {
            returnlet = true;
        }
    });
    return returnlet;
}

function isUserInRole(user, roleID) {
    let returnlet = false;
    user.roles.forEach(function (role) {
        if (role.id === roleID) {
            returnlet = true;
        }
    });
    return returnlet;
}

function getRole(roleName, strict) {
    let returnlet = false;
    roles.forEach(function (role) {
        if ((!strict && role.name.toLowerCase().search(roleName.toLowerCase()) !== -1) ||
            (strict && role.name.toLowerCase() === roleName.toLowerCase() + "*") && !returnlet) {
            returnlet = role;
        }
    });
    return returnlet;
}

function refreshRoles() {
    roles = [];
    client.guilds.forEach(function (guild, snowflake) {
        if (guild.name === "The Ministry Of Memes") {
            guild.roles.forEach(function (role, id) {
                if (role.name.endsWith("*")) {
                    roles.push(role);
                }
            });
        }
    });
}

client.on('ready', function () {
    console.log(`Logged in as ${client.user.tag}!`);
    myID = client.user.id;
    refreshRoles();
});

client.on('message', function (msg) {
    if (msg.author.id === myID) {
        console.log("aborting so don't get triggered by myself!");
        return;
    }
    let msgText = msg.content;
    console.log(msgText);
    if (msgText.indexOf(COMMAND_TRIGGER) === 0) {
        let commands = msgText.slice(1).split(" ");
        if (_commands.hasOwnProperty(commands[0].toLowerCase()) && msg.channel.name === "bot-command") {
            if (_commands[commands[0].toLowerCase()].hasOwnProperty("process")) {
                _commands[commands[0].toLowerCase()].process(msg, commands);
            }
        }
    }

});

client.login(botToken);