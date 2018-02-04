import library from './library.js'

export default function () {

    let loadedSongs = {};

    let audioState = {
        currentZone: { audioName: 'wind' },
        currentSong: 'wind',
        currentAudio: null
    };

    return {
        load,
        play,
        async changeSongIfNewZone({ layer, tileWidth, tileHeight }, { x, y, presentDimension }) {
            let layerPosX = Math.floor(x / tileWidth);
            let layerPosY = Math.floor(y / tileHeight);
            let audioZone = layer[layerPosY][layerPosX].audioZone;
            if (audioZone) {
                let newSong;
                let args;
                if (audioState.currentZone.audioName !== audioZone.audioName) {
                    newSong = audioZone.audioName;
                }

                if (audioState.currentZone.past && !presentDimension && audioState.currentSong !== audioState.currentZone.past) {
                    newSong = audioState.currentZone.past;
                    args = { volume: .08 }
                }
                else if (audioState.currentZone.present && presentDimension && audioState.currentSong !== audioState.currentZone.present) {
                    newSong = audioState.currentZone.present;
                }

                if (newSong) {
                    await changeZone(audioZone, newSong, args);
                }
            }
        }
    };

    async function play(song, { type = 'ambient', volume = 1 } = {}) {
        let audio = load(song);
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0.0;
        }

        audio.volume = volume;
        await audio.play();
    }

    function load(song) {
        loadedSongs[song] = loadedSongs[song] || new Audio(`./audio/${library[song]}`);
        return loadedSongs[song];
    }

    async function changeZone(newZone, song, { type = 'background', volume = 1 } = {}) {
        let currentAudio = audioState.currentAudio;
        if (currentAudio) {
            fadeOut(currentAudio, song);
        }

        let newAudio = load(song);
        audioState.currentAudio = newAudio;
        audioState.currentZone = newZone;
        audioState.currentSong = song;
        await fadeIn(newAudio, song, volume);
    }

    function fadeOut(audio, song) {
        let volume = audio.volume;

        let fade = setInterval(() => {
            audio.volume = Math.max(audio.volume - (volume * .01), 0);
            if (audio.volume === 0.0) {
                clearInterval(fade);
                audio.pause();
                audio.currentTime = 0.0;
            }
        }, 20);
    }

    async function fadeIn(audio, song, targetVolume) {
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0.0;
        }
        audio.volume = 0;
        await audio.play();

        let fadeInVolume = 0;
        let fadeIn = setInterval(() => {
            audio.volume = Math.min(fadeInVolume += (targetVolume * .01), targetVolume);
            if (audio.volume >= targetVolume) {
                audio.volume = targetVolume;
                clearInterval(fadeIn);
            }
        }, 20);
    }
}