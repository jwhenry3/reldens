/**
 *
 * Reldens - Enemy
 *
 * This is an example object class, it extends from the MultipleObject class and then define the specific parameters for
 * the behavior and animations.
 * The main point here is that this is just and example, and you could even create several Enemies and make them run any
 * kind of actions at any time. Here you can see a simple message but it could do literally anything.
 *
 */

const { EnemyObject } = require('reldens/packages/objects/server/enemy-object');
const { MultipleObject } = require('reldens/packages/objects/server/multiple');

class Enemy2 extends MultipleObject
{

    constructor(props)
    {
        super(props);
        this.classInstance = EnemyObject;
        this.respawn = true;
    }

}

module.exports.Enemy2 = Enemy2;
