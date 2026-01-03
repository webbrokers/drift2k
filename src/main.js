import { config } from './config.js';

window.addEventListener('load', () => {
    const game = new Phaser.Game(config);
    console.log('Phaser Game Started');
});
