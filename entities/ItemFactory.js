import utils from "../utils.js";
import Item from './Item.js';

const { genId, rand255, rHue, rColor } = utils;

export default function ({ controllerId }) {

    return {
        createItem
    };

    function createItem(itemDeps, itemState) {
        console.log('CREATE ITEM LOCAL')
        return Item(itemDeps, itemState);
    }
}