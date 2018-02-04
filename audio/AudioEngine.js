import library from './library.js'

export default function () {

    let loadedSongs = {};

    return {
        load(song) {
            loadedSongs = new Audio(`./audio/${library[song]}`);
        },
        play(song) {
            let audio = loadedSongs[song] || new Audio(`./audio/${library[song]}`);
            audio.play();
        }
    }
}