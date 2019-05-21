import Item from './Item.js';

export default function ItemFactoryDispatcher(storeDeps) {
    let { localStore, store } = storeDeps

    return {
        createItem({ controllerId, x, y, ability }) {
            console.log('CREATE ITEM DISPATCH', x, y)
            let itemState = Item.createState({ controllerId, x, y, ability })
            store.dispatch('createItem', itemState);
        }
    }
}