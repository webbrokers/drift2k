import { config } from "../config.js";

export class Input {
    constructor(scene) {
        this.scene = scene;
        const p = config.carPhysics;
        
        this.keys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            
            upAlt: Phaser.Input.Keyboard.KeyCodes.UP,
            downAlt: Phaser.Input.Keyboard.KeyCodes.DOWN,
            leftAlt: Phaser.Input.Keyboard.KeyCodes.LEFT,
            rightAlt: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            ctrl: Phaser.Input.Keyboard.KeyCodes.CTRL,
            
            gearUp: Phaser.Input.Keyboard.KeyCodes.E,
            gearDown: Phaser.Input.Keyboard.KeyCodes.Q, // Изменил на Q для удобства, т.к. D - руль
            
            reset: Phaser.Input.Keyboard.KeyCodes.R
        });

        this.steerAngle = 0; // -1 to 1
        this.maxSteer = 1;
        
        // Переводим град/сек в долю/сек (-1..1)
        this.steerSpeed = p.steerRateDegPerSec / p.maxSteerDeg;
        this.returnSpeed = p.steerReturnDegPerSec / p.maxSteerDeg;

        this.throttle = 0;
        this.brake = 0;
        this.handbrake = false;
        this.gear = 1; // Начинаем с первой передачи для удобства
    }

    update(dt) {
        const dtSeconds = dt / 1000;

        // Steering logic
        const left = this.keys.left.isDown || this.keys.leftAlt.isDown;
        const right = this.keys.right.isDown || this.keys.rightAlt.isDown;

        if (left) {
            this.steerAngle -= this.steerSpeed * dtSeconds;
        } else if (right) {
            this.steerAngle += this.steerSpeed * dtSeconds;
        } else {
            // Return to zero
            if (this.steerAngle > 0) {
                this.steerAngle -= this.returnSpeed * dtSeconds;
                if (this.steerAngle < 0) this.steerAngle = 0;
            } else if (this.steerAngle < 0) {
                this.steerAngle += this.returnSpeed * dtSeconds;
                if (this.steerAngle > 0) this.steerAngle = 0;
            }
        }

        this.steerAngle = Phaser.Math.Clamp(this.steerAngle, -this.maxSteer, this.maxSteer);

        // Throttle/Brake
        this.throttle = (this.keys.up.isDown || this.keys.upAlt.isDown) ? 1 : 0;
        this.brake = (this.keys.down.isDown || this.keys.downAlt.isDown) ? 1 : 0;
        this.handbrake = this.keys.space.isDown;

        // Gear Shifting
        if (Phaser.Input.Keyboard.JustDown(this.keys.shift) || Phaser.Input.Keyboard.JustDown(this.keys.gearUp)) {
            if (this.gear < config.carPhysics.gearRatios.length - 1) {
                this.gear++;
            }
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.ctrl) || Phaser.Input.Keyboard.JustDown(this.keys.gearDown)) {
            if (this.gear > 0) {
                this.gear--;
            }
        }
        
        // Reset
        this.isResetPressed = Phaser.Input.Keyboard.JustDown(this.keys.reset);
    }
}
