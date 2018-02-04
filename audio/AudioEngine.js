import library from './library.js'

export default function () {

    let loadedSongs = {};

    let songsPlaying = [];

    let currentAudio = null;

    return {
        getSongsPlaying: () => songsPlaying,
        load(song) {
            loadedSongs = new Audio(`./audio/${library[song]}`);
        },
        async play(song, { type = 'ambient', volume = 1 } = {}) {
            let audio = loadedSongs[song] || new Audio(`./audio/${library[song]}`);
            if (!loadedSongs[song]) {
                loadedSongs[song] = audio;
            }
            audio.volume = volume;
            if (type === 'background') {
                if (songsPlaying.length) {
                    songsPlaying.forEach(s => {
                        let playingSong = loadedSongs[s];
                        playingSong.pause();
                        playingSong.currentTime = 0.0;
                    });
                }

                songsPlaying.push(song);
                audio.addEventListener('pause', () => {
                    let index = songsPlaying.indexOf(song);
                    if (index >= 0) {
                        songsPlaying.splice(index, 1);
                    }
                });
            }
            try {
                await audio.play();
            }
            catch (ex) {
                setTimeout(async () => {
                    await audio.play();
                });
            }
        },
        async changeSongIfNewZone({ layer, tileWidth, tileHeight }, { x, y }) {
            let layerPosX = Math.floor(x / tileWidth);
            let layerPosY = Math.floor(y / tileHeight);
            let audioZone = layer[layerPosY][layerPosX].audioZone;
            if (audioZone) {
                if (currentAudio !== audioZone.audioName) {
                    currentAudio = audioZone.audioName;
                    await this.play(currentAudio, { type: 'background', volume: .5 });
                }
            }
        }
    }
}