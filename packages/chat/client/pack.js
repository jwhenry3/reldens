/**
 *
 * Reldens - Chat Client Package.
 *
 */

const { ChatUi } = require('./chat-ui');
const { ChatConst } = require('../constants');
const { Logger, EventsManager } = require('@reldens/utils');

class Chat
{

    constructor()
    {
        this.joinRooms = [ChatConst.CHAT_GLOBAL];
        // chat messages are global for all rooms so we use the generic event for every joined room:
        EventsManager.on('reldens.joinedRoom', (room, gameManager) => {
            this.listenMessages(room, gameManager);
        });
        EventsManager.on('reldens.preloadUiScene', (preloadScene) => {
            preloadScene.load.html('uiChat', 'assets/features/chat/templates/ui-chat.html');
            preloadScene.load.html('uiChatMessage', 'assets/features/chat/templates/message.html');
        });
        EventsManager.on('reldens.createUiScene', (preloadScene) => {
            this.uiCreate = new ChatUi(preloadScene);
            this.uiCreate.createUi();
        });
    }

    listenMessages(room, gameManager)
    {
        room.onMessage((message) => {
            if(message.act !== ChatConst.CHAT_ACTION){
                return;
            }
            let uiScene = gameManager.gameEngine.uiScene;
            if(!{}.hasOwnProperty.call(uiScene, 'uiChat')){
                Logger.error('Chat interface not found.');
                return;
            }
            let readPanel = uiScene.uiChat.getChildByProperty('id', ChatConst.CHAT_MESSAGES);
            if(!readPanel){
                Logger.error('Chat UI not found.');
                return;
            }
            let messageTemplate = uiScene.cache.html.get('uiChatMessage');
            let output = gameManager.gameEngine.parseTemplate(messageTemplate, {
                from: message[ChatConst.CHAT_FROM],
                color: ChatConst.colors[message.t],
                message: message[ChatConst.CHAT_MESSAGE]
            });
            readPanel.innerHTML += output;
            readPanel.scrollTo(0, readPanel.scrollHeight);
        });
    }

}

module.exports.Chat = Chat;
