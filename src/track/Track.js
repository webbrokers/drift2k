export class Track {
    constructor(scene) {
        this.scene = scene;
        this.walls = [];
        this.checkpoints = [];
        
        this.createTrackLines();
    }

    createTrackLines() {
        const { world } = this.scene.matter;

        // Создаем границы трассы (стены)
        // Простая трасса в виде прямоугольника с закругленными углами или сложная форма
        // В данном случае сделаем прямоугольное кольцо 3000x2000 в центре мира 4000x4000
        
        const centerX = 2000;
        const centerY = 2000;
        const width = 3000;
        const height = 2000;
        const thickness = 100;
        const wallColor = 0x555555;

        // Внешние стены
        this.addWall(centerX, centerY - height/2, width + thickness, thickness, wallColor); // Top
        this.addWall(centerX, centerY + height/2, width + thickness, thickness, wallColor); // Bottom
        this.addWall(centerX - width/2, centerY, thickness, height + thickness, wallColor); // Left
        this.addWall(centerX + width/2, centerY, thickness, height + thickness, wallColor); // Right

        // Внутренние стены (остров в центре)
        const innerWidth = 2000;
        const innerHeight = 1000;
        this.addWall(centerX, centerY - innerHeight/2, innerWidth + thickness, thickness, wallColor); // Inner Top
        this.addWall(centerX, centerY + innerHeight/2, innerWidth + thickness, thickness, wallColor); // Inner Bottom
        this.addWall(centerX - innerWidth/2, centerY, thickness, innerHeight + thickness, wallColor); // Inner Left
        this.addWall(centerX + innerWidth/2, centerY, thickness, innerHeight + thickness, wallColor); // Inner Right

        // Добавляем финиш и чекпоинты (сенсоры)
        // Финишная черта внизу справа
        this.addCheckpoint(centerX + 500, centerY + (height + innerHeight) / 4, 20, (height - innerHeight) / 2, 'finish', 0x00ff00);
        
        // Чекпоинты по кругу против часовой стрелки (или по часовой)
        // CP1: Слева
        this.addCheckpoint(centerX - 500, centerY + (height + innerHeight) / 4, 20, (height - innerHeight) / 2, 'cp1', 0xffff00);
        // CP2: Сверху
        this.addCheckpoint(centerX, centerY - (height + innerHeight) / 4, 20, (height - innerHeight) / 2, 'cp2', 0xffff00);
    }

    addWall(x, y, w, h, color) {
        const wall = this.scene.matter.add.rectangle(x, y, w, h, {
            isStatic: true,
            label: 'wall',
            friction: 0.5,
            restitution: 0.1
        });
        
        const rect = this.scene.add.rectangle(x, y, w, h, color);
        this.walls.push({ body: wall, visual: rect });
        return wall;
    }

    addCheckpoint(x, y, w, h, label, color) {
        const cp = this.scene.matter.add.rectangle(x, y, w, h, {
            isStatic: true,
            isSensor: true,
            label: label
        });

        // Визуальное отображение сенсора (полупрозрачное)
        const rect = this.scene.add.rectangle(x, y, w, h, color, 0.3);
        this.checkpoints.push({ body: cp, visual: rect, label: label });
        return cp;
    }
}
