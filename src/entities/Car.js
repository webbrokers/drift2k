export class Car {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Создаем тело Matter
        this.body = scene.matter.add.rectangle(x, y, 70, 35, {
            frictionAir: 0, // Мы сами считаем drag
            mass: 1,
            label: 'car'
        });

        this.graphics = scene.add.graphics();
        
        // Внутреннее состояние для физики
        this.state = {
            vel: { x: 0, y: 0 },
            angVel: 0,
            rpm: 800,
            gear: 0,
            v_side: 0,
            angle: 0
        };

        this.steerAngle = 0;
    }

    update(input) {
        // Синхронизируем базовые данные из Matter для CarPhysics (позиция, угол)
        this.state.pos = { x: this.body.position.x, y: this.body.position.y };
        this.state.angle = this.body.angle;

        this.steerAngle = input.steerAngle;
        this.draw();
    }

    reset() {
        this.scene.matter.body.setPosition(this.body, { x: 400, y: 300 });
        this.scene.matter.body.setAngle(this.body, 0);
        this.scene.matter.body.setVelocity(this.body, { x: 0, y: 0 });
        this.scene.matter.body.setAngularVelocity(this.body, 0);
        
        this.state.vel = { x: 0, y: 0 };
        this.state.angVel = 0;
        this.state.rpm = 800;
        this.state.v_side = 0;
    }

    draw() {
        this.graphics.clear();
        
        const { x, y } = this.body.position;
        const angle = this.body.angle;
        
        this.graphics.save();
        this.graphics.translateCanvas(x, y);
        this.graphics.rotateCanvas(angle);
        
        // Отрисовка кузова (70x35)
        this.graphics.fillStyle(0xff0000, 1);
        this.graphics.fillRect(-35, -17.5, 70, 35);
        this.graphics.lineStyle(2, 0xffffff, 1);
        this.graphics.strokeRect(-35, -17.5, 70, 35);

        // Отрисовка колес (примерно 15x8)
        const wheelW = 15;
        const wheelH = 8;
        const wheelOffsetX = 20;
        const wheelOffsetY = 15;

        this.graphics.fillStyle(0x333333, 1);
        
        // Задние колеса (статичные)
        this.graphics.fillRect(-wheelOffsetX - wheelW / 2, -wheelOffsetY - wheelH / 2, wheelW, wheelH);
        this.graphics.fillRect(-wheelOffsetX - wheelW / 2, wheelOffsetY - wheelH / 2, wheelW, wheelH);

        // Передние колеса (поворачиваются на steerAngle)
        // Визуально ограничим угол отрисовки до 30 градусов для стиля
        const visualSteer = this.steerAngle * Phaser.Math.DegToRad(30);
        this.drawSteerableWheel(wheelOffsetX, -wheelOffsetY, wheelW, wheelH, visualSteer);
        this.drawSteerableWheel(wheelOffsetX, wheelOffsetY, wheelW, wheelH, visualSteer);
        
        this.graphics.restore();
    }

    drawSteerableWheel(lx, ly, w, h, angle) {
        this.graphics.save();
        this.graphics.translateCanvas(lx, ly);
        this.graphics.rotateCanvas(angle);
        this.graphics.fillRect(-w / 2, -h / 2, w, h);
        this.graphics.restore();
    }

    getWheelPositions() {
        const { x, y } = this.body.position;
        const angle = this.body.angle;
        
        const wheelOffsetX = 20;
        const wheelOffsetY = 15;
        const visualSteer = this.steerAngle * Phaser.Math.DegToRad(30);

        const wheels = [
            // Задние левое и правое
            { lx: -wheelOffsetX, ly: -wheelOffsetY, steer: 0 },
            { lx: -wheelOffsetX, ly: wheelOffsetY, steer: 0 },
            // Передние левое и правое
            { lx: wheelOffsetX, ly: -wheelOffsetY, steer: visualSteer },
            { lx: wheelOffsetX, ly: wheelOffsetY, steer: visualSteer }
        ];

        return wheels.map(w => {
            // Поворот локальной точки колеса относительно центра машины
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            
            const gx = x + (w.lx * cosA - w.ly * sinA);
            const gy = y + (w.lx * sinA + w.ly * cosA);
            
            return { x: gx, y: gy };
        });
    }
}
