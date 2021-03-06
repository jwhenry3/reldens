/**
 *
 * Reldens - Inventory Server Package
 *
 */

const { ItemsServer, ItemBase, ItemGroup, ItemsConst } = require('@reldens/items-system');
const { ModelsManager } = require('@reldens/items-system/lib/server/storage/models-manager');
const { EventsManager } = require('@reldens/utils');
const { PackInterface } = require('../../features/server/pack-interface');
const { InventoryMessageActions } = require('./message-actions');

class InventoryPack extends PackInterface
{

    setupPack()
    {
        this.inventoryModelsManager = new ModelsManager();
        EventsManager.on('reldens.serverReady', async (event) => {
            let configProcessor = event.serverManager.configManager.processor;
            if(!{}.hasOwnProperty.call(configProcessor, 'inventory')){
                configProcessor.inventory = {};
            }
            await this.loadItemsFullList(configProcessor);
            await this.loadGroupsFullList(configProcessor);
        });
        // eslint-disable-next-line no-unused-vars
        EventsManager.on('reldens.createPlayerAfter', async (client, authResult, currentPlayer, room) => {
            // create player inventory:
            currentPlayer.inventory = await this.createInventory(client, currentPlayer, room);
            // @NOTE: here we send the groups data to generate the player interface instead of set them in the current
            // player inventory because for this specific implementation we don't need recursive groups lists in the
            // server for each player.
            room.send(client, {
                act: ItemsConst.ACTION_SET_GROUPS,
                owner: currentPlayer.inventory.manager.getOwnerId(),
                groups: room.config.get('inventory/groups/groupBaseData')
            });
        });
        // when the client sent a message to any room it will be checked by all the global messages defined:
        EventsManager.on('reldens.roomsMessageActionsGlobal', (roomMessageActions) => {
            roomMessageActions.inventory = InventoryMessageActions;
        });
    }

    async loadItemsFullList(configProcessor)
    {
        // use the inventory models manager to get the items list loaded:
        let itemsModelsList = await this.inventoryModelsManager.models.item.query();
        if(itemsModelsList.length){
            let itemsList = {};
            let inventoryClasses = configProcessor.get('server/customClasses/inventory/items');
            for(let itemModel of itemsModelsList){
                let itemClass = ItemBase;
                if({}.hasOwnProperty.call(inventoryClasses, itemModel.key)){
                    itemClass = inventoryClasses[itemModel.key];
                }
                itemsList[itemModel.key] = {class: itemClass, data: itemModel};
            }
            configProcessor.inventory.items = {itemsModels: itemsModelsList, itemsList};
        }
    }

    async loadGroupsFullList(configProcessor)
    {
        // use the inventory models manager to get the items list loaded:
        let groupModelsList = await this.inventoryModelsManager.models.group.query();
        if(groupModelsList.length){
            let groupList = {};
            let groupBaseData = {};
            let inventoryClasses = configProcessor.get('server/customClasses/inventory/groups');
            for(let groupModel of groupModelsList){
                let groupClass = ItemGroup;
                if({}.hasOwnProperty.call(inventoryClasses, groupModel.key)){
                    groupClass = inventoryClasses[groupModel.key];
                }
                groupList[groupModel.key] = {class: groupClass, data: groupModel};
                let {id, key, label, description, sort} = groupModel;
                groupBaseData[key] = {id, key, label, description, sort};
            }
            configProcessor.inventory.groups = {groupModels: groupModelsList, groupList, groupBaseData};
        }
    }

    async createInventory(client, playerSchema, room)
    {
        // @TODO: improve (remove all methods defined here, create a proper wrapper class).
        // wrap the client:
        let clientWrapper = {
            send: (data) => {
                room.send(client, data);
            },
            broadcast: (data) => {
                room.broadcast(data);
            }
        };
        // @TODO: implement playerSchema.persistData() (see onExecutedItem(item) in ModelsManager class), and test.
        // eslint-disable-next-line no-unused-vars
        playerSchema.persistData = async (params) => {
            // persist data in player:
            await room.savePlayerState(playerSchema.sessionId);
            await room.savePlayerStats(playerSchema, client);
        };
        let serverProps = {
            owner: playerSchema,
            client: clientWrapper,
            persistence: true,
            ownerIdProperty: 'player_id'
        };
        let inventoryClasses = room.config.get('server/customClasses/inventory/items');
        if(inventoryClasses){
            serverProps.itemClasses = inventoryClasses;
        }
        let groupClasses = room.config.get('server/customClasses/inventory/groups');
        if(groupClasses){
            serverProps.groupClasses = groupClasses;
        }
        let inventoryServer = new ItemsServer(serverProps);
        // broadcast player sessionId to share animations:
        inventoryServer.client.sendTargetProps.broadcast.push('sessionId');
        // for now I will load all the items here and then create instances for later assign them to their owner:
        await inventoryServer.dataServer.loadOwnerItems();
        inventoryServer.createItemInstance = (key, qty) => {
            let result = false;
            let itemData = room.config.get('inventory/items/itemsList/'+key);
            if(itemData){
                let itemProps = Object.assign({}, itemData['data'], {
                    manager: inventoryServer.manager,
                    item_id: itemData['data'].id,
                    qty: (typeof qty !== 'undefined') ? qty : 1
                });
                result = new itemData['class'](itemProps);
            }
            return result;
        };
        return inventoryServer;
    }

}

module.exports.InventoryPack = InventoryPack;
