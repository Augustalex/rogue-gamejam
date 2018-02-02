import library from './library.js'

export default function () {

    return {
        play(song) {
            let audio = new Audio(`./audio/${library[song]}`);
            audio.play();
        }
    }
}