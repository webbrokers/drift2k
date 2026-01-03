export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Создаем текстуру сетки для фона
        const gridSize = 256;
        const graphics = this.make.graphics();
        
        // Фон плитки
        graphics.fillStyle(0x1a1a2e, 1);
        graphics.fillRect(0, 0, gridSize, gridSize);
        
        // Линии сетки
        graphics.lineStyle(2, 0x16213e, 1);
        graphics.strokeRect(0, 0, gridSize, gridSize);
        
        // Центральная точка для ориентира (опционально)
        graphics.fillStyle(0x0f3460, 0.5);
        graphics.fillCircle(gridSize / 2, gridSize / 2, 4);
        
        graphics.generateTexture('background', gridSize, gridSize);

        // Создаем заглушку для игрока (машинки)
        graphics.clear();
        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(0, 0, 40, 20);
        graphics.generateTexture('car', 40, 20);

        // Создаем текстуру шума для ретро-эффекта
        graphics.clear();
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const gray = Math.floor(Math.random() * 50) + 200; // Светло-серый шум
                graphics.fillStyle(Phaser.Display.Color.GetColor(gray, gray, gray), 0.1);
                graphics.fillRect(i, j, 1, 1);
            }
        }
        graphics.generateTexture('noise', 4, 4);
    }

    create() {
        console.log('Boot Scene: Ресурсы загружены, переход в Game...');
        this.scene.start('Game');
    }
}
