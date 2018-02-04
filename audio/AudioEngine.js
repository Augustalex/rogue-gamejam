import library from './library.js'

export default function () {

    let loadedSongs = {};

    let songsPlaying = [];

    let currentAudioZone = { audioName: 'wind' };
    let currentAudioZoneSong = 'wind';

    return {
        getSongsPlaying: () => songsPlaying,
        load(song) {
            loadedSongs = new Audio(`./audio/${library[song]}`);
        },
        async play(song, { type = 'ambient', volume = 1 } = {}) {
            console.log('play', song);
            let audio = loadedSongs[song] || new Audio(`./audio/${library[song]}`);
            if (!loadedSongs[song]) {
                loadedSongs[song] = audio;
            }
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0.0;
            }
            let audioLoop = () => {
                if (currentAudioZoneSong === song) {
                    audio.currentTime = 0;
                    audio.play();
                }
                else {
                    audio.removeEventListener('ended', audioLoop);
                }
            };
            audio.addEventListener('ended', audioLoop);

            if (type === 'background') {
                if (songsPlaying.length) {
                    songsPlaying.forEach(s => {
                        let playingSong = loadedSongs[s];
                        let fade = setInterval(() => {
                            console.log('fade');
                            playingSong.volume = Math.max(playingSong.volume - 0.01, 0);
                            if (playingSong.volume === 0.0) {
                                clearInterval(fade);
                                playingSong.pause();
                                playingSong.currentTime = 0.0;
                            }
                        }, 200);
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

            if (type === 'background') {
                let fadeInVolume = 0;
                audio.volume = 0;
                let fadeIn = setInterval(() => {
                    audio.volume = Math.min(fadeInVolume += .01, volume);
                    if (audio.volume === volume) {
                        console.log('faded in');
                        clearInterval(fadeIn);
                    }
                }, 200);
            }
            else {
                audio.volume = volume;
            }
            await audio.play();
        },
        async changeSongIfNewZone({ layer, tileWidth, tileHeight }, { x, y, presentDimension }) {
            let layerPosX = Math.floor(x / tileWidth);
            let layerPosY = Math.floor(y / tileHeight);
            let audioZone = layer[layerPosY][layerPosX].audioZone;
            if (audioZone) {
                if (currentAudioZone.audioName !== audioZone.audioName) {
                    currentAudioZone = { ...audioZone };
                    currentAudioZoneSong = currentAudioZone.audioName;
                    await this.play(currentAudioZone.audioName, { type: 'background', volume: .5 });
                }

                if (currentAudioZone.past && !presentDimension && currentAudioZoneSong !== currentAudioZone.past) {
                    currentAudioZoneSong = currentAudioZone.past;
                    console.log('play past');
                    await this.play(currentAudioZone.past, { type: 'background', volume: .2 });
                }
                else if (currentAudioZone.present && presentDimension && currentAudioZoneSong !== currentAudioZone.present) {
                    currentAudioZoneSong = currentAudioZone.present;
                    await this.play(currentAudioZone.present, { type: 'background', volume: .2 });
                }
            }
        }
    }
}