/**
 *
 * Reldens - MessageActions
 *
 * Server side messages actions.
 *
 */

const { ChatManager } = require('./manager');
const { Cleaner } = require('./cleaner');
const { ChatConst } = require('../constants');
const { GameConst } = require('../../game/constants');

class ChatMessageActions
{

    parseMessageAndRunActions(room, data, playerSchema)
    {
        if(data.act === ChatConst.CHAT_ACTION){
            let dataMessage = data[ChatConst.CHAT_MESSAGE];
            if(dataMessage.trim().replace('#', '').replace('@', '').length > 0){
                let message = Cleaner.cleanMessage(dataMessage);
                let messageData = {
                    act: ChatConst.CHAT_ACTION,
                    m: message,
                    f: playerSchema.username,
                    t: ChatConst.CHAT_TYPE_NORMAL
                };
                room.broadcast(messageData);
                ChatManager.saveMessage(message, playerSchema, {}, false).catch((err) => {
                    console.log('ERROR - Chat save error:', err);
                });
            }
        }
        if(data.act === GameConst.CLIENT_JOINED && room.config.get('feature/chat/messages/broadcast_join')){
            let sentText = `${playerSchema.username} has joined ${room.roomName}.`;
            room.broadcast({act: ChatConst.CHAT_ACTION, m: sentText, f: 'System', t: ChatConst.CHAT_TYPE_SYSTEM});
            ChatManager.saveMessage(room.roomName, playerSchema, false, ChatConst.CHAT_JOINED)
                .catch((err) => {
                    console.log('ERROR - Joined room chat save error:', err);
                });
        }
    }

}

module.exports.ChatMessageActions = new ChatMessageActions();
