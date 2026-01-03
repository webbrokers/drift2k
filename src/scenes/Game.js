import { Car } from "../entities/Car.js";
import { Input } from "../systems/Input.js";
import { CarPhysics } from "../physics/CarPhysics.js";
import { HUD } from "../ui/HUD.js";
import { Track } from "../track/Track.js";
import { Storage } from "../storage/Storage.js";

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        
        // Состояние гонки
        this.raceState = {
            lap: 0,
            startTime: 0,
            lapStartTime: 0,
            currentLapTime: 0,
            bestLapTime: Storage.getBestLap(),
            checkpointsPassed: new Set(),
            totalCheckpoints: 2 // cp1, cp2
        };
    }

    create() {
        const worldSize = 4000;

        // Добавляем тайловый фон (сетка)
        this.background = this.add.tileSprite(0, 0, worldSize, worldSize, 'background');
        this.background.setOrigin(0, 0);

        // Создаем мир Matter
        this.matter.world.setBounds(0, 0, worldSize, worldSize);

        // Инициализация трассы
        this.track = new Track(this);

        // Слой для следов резины (RenderTexture)
        this.tracksLayer = this.add.renderTexture(0, 0, worldSize, worldSize);
        this.tracksLayer.setDepth(0); // Под машиной, но над фоном (фон обычно -1 или 0)
        this.background.setDepth(-1);

        // Инициализация систем
        this.carInput = new Input(this);
        // Спавним машину в удобном месте для старта
        this.car = new Car(this, 2500, 2750); 
        this.hud = new HUD(this);

        // Ретро-эффект: Слой шума (Scanlines/Noise)
        this.noiseOverlay = this.add.tileSprite(0, 0, 800, 600, 'noise');
        this.noiseOverlay.setOrigin(0, 0);
        this.noiseOverlay.setScrollFactor(0);
        this.noiseOverlay.setDepth(100); // Поверх всего
        this.noiseOverlay.setAlpha(0.3);
        this.noiseOverlay.setBlendMode(Phaser.BlendModes.ADD);

        // Настройка коллизий (сенсоры чекпоинтов)
        this.setupCollisions();

        // Настройка камеры
        this.cameras.main.setBounds(0, 0, worldSize, worldSize);
        
        console.log('Game Scene: Трасса создана. Система кругов инициализирована.');
    }

    setupCollisions() {
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;
                
                // Проверяем столкновение машины с сенсорами
                const carBody = bodyA.label === 'car' ? bodyA : (bodyB.label === 'car' ? bodyB : null);
                const sensorBody = bodyA.isSensor ? bodyA : (bodyB.isSensor ? bodyB : null);

                if (carBody && sensorBody) {
                    this.handleSensorContact(sensorBody.label);
                }

                // Штраф за удар об стену
                const wallBody = bodyA.label === 'wall' ? bodyA : (bodyB.label === 'wall' ? bodyB : null);
                if (carBody && wallBody) {
                    this.handleWallCollision(pair);
                }
            });
        });
    }

    handleSensorContact(label) {
        if (label === 'finish') {
            // Проверяем, пройдены ли все чекпоинты
            if (this.raceState.checkpointsPassed.size >= this.raceState.totalCheckpoints) {
                this.completeLap();
            } else if (this.raceState.lap === 0) {
                // Первый проезд через финиш - старт гонки
                this.startRace();
            }
        } else if (label.startsWith('cp')) {
            this.raceState.checkpointsPassed.add(label);
            console.log(`Checkpoint reached: ${label}`);
        }
    }

    startRace() {
        this.raceState.lap = 1;
        this.raceState.startTime = this.time.now;
        this.raceState.lapStartTime = this.time.now;
        this.raceState.checkpointsPassed.clear();
        console.log('Race started!');
    }

    completeLap() {
        const now = this.time.now;
        const lapTime = (now - this.raceState.lapStartTime) / 1000;
        
        if (lapTime < this.raceState.bestLapTime) {
            this.raceState.bestLapTime = lapTime;
            Storage.saveBestLap(lapTime);
            console.log('New Record Saved!');
        }

        console.log(`Lap ${this.raceState.lap} completed: ${lapTime.toFixed(3)}s`);
        
        this.raceState.lap++;
        this.raceState.lapStartTime = now;
        this.raceState.checkpointsPassed.clear();
    }

    handleWallCollision(pair) {
        // Вычисляем силу удара на основе относительной скорости
        // В Matter.js можно оценить через накопленный импульс или разницу скоростей
        const speed = Math.sqrt(this.car.body.velocity.x**2 + this.car.body.velocity.y**2);
        
        if (speed > 5) {
            console.log('Strong collision! Speed:', speed);
            // Визуальный эффект (вспышка или тряска камеры)
            this.cameras.main.shake(100, 0.005);
            
            // Опциональный штраф: небольшое замедление (имитация повреждения)
            // или просто физический отскок (уже есть в Matter)
        }
    }

    update(time, delta) {
        // Обновление ввода
        this.carInput.update(delta);

        // Обновление физики
        CarPhysics.update(this.car, this.carInput, delta);

        // Обновление сущности и визуала
        this.car.update(this.carInput);

        // Обновление времени текущего круга
        if (this.raceState.lap > 0) {
            this.raceState.currentLapTime = (this.time.now - this.raceState.lapStartTime) / 1000;
        }

        // Обновление камеры (Lerp + Look Ahead)
        this.updateCamera(delta);

        // Обновление HUD
        this.hud.update(this.car, this.carInput, this.raceState);

        // Обновление следов резины
        this.updateTireTracks();

        // Обновление ретро-эффекта (смещение шума)
        this.noiseOverlay.tilePositionX = Math.random() * 4;
        this.noiseOverlay.tilePositionY = Math.random() * 4;
    }

    updateTireTracks() {
        const vel = this.car.body.velocity;
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        const vSide = Math.abs(this.car.state.v_side);

        // Условия для появления следов: сильное боковое скольжение и скорость
        if (vSide > 2.5 && speed > 3) {
            const wheelPositions = this.car.getWheelPositions();
            
            // Рисуем маленькие черные квадраты на RenderTexture
            wheelPositions.forEach(pos => {
                // Рисуем на текстуре
                this.tracksLayer.drawFrame('car', null, pos.x, pos.y); 
                // Но лучше использовать просто заливку цветом через внутренний graphics или draw
            });

            // Для простоты используем draw с цветом
            const trackGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            trackGraphics.fillStyle(0x000000, 0.2); 
            wheelPositions.forEach(pos => {
                trackGraphics.fillRect(pos.x - 4, pos.y - 4, 8, 8);
            });
            this.tracksLayer.draw(trackGraphics);
            trackGraphics.destroy();
        }
    }

    updateCamera(delta) {
        const cam = this.cameras.main;
        const carBody = this.car.body;
        
        // Коэффициенты для настройки поведения
        const lerpFactor = 0.05; // Плавность следования
        const lookAheadFactor = 20; // Насколько сильно камера "заглядывает" вперед (в секундах или пикселях от скорости)

        // Целевая позиция - позиция машины + смещение по вектору скорости
        const targetX = carBody.position.x + carBody.velocity.x * lookAheadFactor;
        const targetY = carBody.position.y + carBody.velocity.y * lookAheadFactor;

        // Применяем lerp для плавного перемещения
        // Используем метод scrollX/scrollY для управления камерой
        // Центрируем камеру (вычитаем половину ширины/высоты экрана)
        const targetScrollX = targetX - cam.width / 2;
        const targetScrollY = targetY - cam.height / 2;

        cam.scrollX = Phaser.Math.Linear(cam.scrollX, targetScrollX, lerpFactor);
        cam.scrollY = Phaser.Math.Linear(cam.scrollY, targetScrollY, lerpFactor);
    }
}
