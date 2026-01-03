export class HUD {
    constructor(scene) {
        this.scene = scene;
        
        // Фон HUD (снизу)
        const hudBg = scene.add.graphics();
        hudBg.fillStyle(0x000000, 0.5);
        hudBg.fillRect(0, 500, 800, 100);
        hudBg.setScrollFactor(0);

        // Индикатор руля (верхняя панель)
        this.steerIndicatorBg = scene.add.rectangle(400, 30, 200, 10, 0x000000, 0.5).setScrollFactor(0);
        this.steerIndicator = scene.add.rectangle(400, 30, 4, 15, 0xffffff, 1).setScrollFactor(0);
        
        // Тахометр (RPM Bar)
        this.rpmBarBg = scene.add.rectangle(400, 560, 400, 20, 0x333333, 1).setScrollFactor(0);
        this.rpmBar = scene.add.rectangle(200, 560, 0, 20, 0xff0000, 1).setOrigin(0, 0.5).setScrollFactor(0);
        
        // Текстовая информация (Stats)
        this.statsText = scene.add.text(400, 530, '', {
            fontSize: '18px',
            fill: '#fff',
            fontFamily: 'monospace',
            fontWeight: 'bold'
        }).setOrigin(0.5).setScrollFactor(0);

        // Текстовая информация (Race Info) - сверху слева
        this.raceText = scene.add.text(20, 20, '', {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            stroke: '#000',
            strokeThickness: 3
        }).setScrollFactor(0);
    }

    update(car, input, raceState) {
        // Обновляем индикатор руля (-1..+1)
        const indicatorX = 400 + (input.steerAngle * 100);
        this.steerIndicator.x = indicatorX;

        // Скорость
        const velocity = car.body.velocity;
        const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
        const kmh = Math.round(speed * 10);

        // RPM
        const rpm = Math.round(car.state.rpm);
        const redline = 7500;
        const rpmRatio = Phaser.Math.Clamp(rpm / redline, 0, 1.1);
        
        this.rpmBar.width = 400 * Math.min(rpmRatio, 1);
        
        // Цвет тахометра (желтый к красной зоне)
        if (rpm > 6500) {
            this.rpmBar.setFillStyle(0xff0000);
        } else if (rpm > 4000) {
            this.rpmBar.setFillStyle(0xffff00);
        } else {
            this.rpmBar.setFillStyle(0x00ff00);
        }

        // Передача
        const gearText = input.gear === 0 ? 'N' : input.gear;

        // v_side (боковое скольжение)
        const vSide = car.state.v_side.toFixed(1);

        this.statsText.setText(
            `GEAR: ${gearText} | SPEED: ${kmh} KM/H | RPM: ${rpm} | V_SIDE: ${vSide}`
        );

        // Обновление Race Info
        if (raceState) {
            const lapStr = raceState.lap === 0 ? 'START!' : `LAP: ${raceState.lap}`;
            const timeStr = `TIME: ${raceState.currentLapTime.toFixed(2)}s`;
            const bestTime = raceState.bestLapTime === Infinity ? '--:--' : raceState.bestLapTime.toFixed(3) + 's';
            const bestStr = `BEST: ${bestTime}`;
            
            this.raceText.setText(`${lapStr}\n${timeStr}\n${bestStr}`);
        }
    }
}
