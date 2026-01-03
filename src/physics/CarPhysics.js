import { config } from "../config.js";

export class CarPhysics {
    /**
     * @param {Car} car 
     * @param {Input} input 
     * @param {number} dt 
     */
    static update(car, input, dt) {
        const p = config.carPhysics;
        const body = car.body;
        const dtSec = dt / 1000;

        // 1. Состояние из Matter -> Local state (для расчетов)
        // Но по ТЗ "Источник истины — car.state.vel и car.state.angVel (не Matter)".
        // Значит мы работаем с car.state, а в конце пишем в Matter.
        
        let { vel, angVel, pos, angle } = car.state;

        // 2. Векторы направления
        const forward = { x: Math.cos(angle), y: Math.sin(angle) };
        const right = { x: -Math.sin(angle), y: Math.cos(angle) };

        // 3. Локальные скорости
        const v_forward = vel.x * forward.x + vel.y * forward.y;
        const v_side = vel.x * right.x + vel.y * right.y;

        // 4. Рулевое управление
        // steerAngle уже управляется в Input.js (от -1 до 1)
        // Но нам нужно ограничить его maxSteerDeg и скоростью поворота.
        // Хотя Input.js уже делает плавный поворот, переведем его в радианы для физики.
        const currentSteerRad = input.steerAngle * Phaser.Math.DegToRad(p.maxSteerDeg);

        // 5. Двигатель и RPM
        // Расчет RPM на основе скорости колес (упрощенно v_forward)
        const wheelCircumference = 2 * Math.PI * (p.wheelRadius / 100); // мастабируем для реальности? нет, оставим в пикселях/метрах
        const wheelRPM = (v_forward / (2 * Math.PI * p.wheelRadius)) * 60 * 10; // множитель для наглядности
        
        const gear = Phaser.Math.Clamp(input.gear, 0, p.gearRatios.length - 1);
        const gearRatio = p.gearRatios[gear];
        
        // Target RPM
        let targetRPM = p.idleRPM;
        if (gear > 0) {
            targetRPM = Math.abs(wheelRPM) * gearRatio * p.finalDrive + p.idleRPM;
        } else {
            // В нейтрали RPM растет от газа
            targetRPM = p.idleRPM + input.throttle * (p.redlineRPM - p.idleRPM);
        }

        // Плавное изменение RPM
        car.state.rpm = Phaser.Math.Linear(car.state.rpm, targetRPM, p.rpmResponse);
        car.state.rpm = Phaser.Math.Clamp(car.state.rpm, p.idleRPM, p.redlineRPM + 500);

        // Ограничитель (limiter)
        let engineForce = 0;
        if (car.state.rpm < p.redlineRPM) {
            // Простая кривая крутящего момента: пик на 4000-6000
            const rpmNorm = (car.state.rpm - p.idleRPM) / (p.redlineRPM - p.idleRPM);
            const torqueMult = 0.5 + 0.5 * Math.sin(rpmNorm * Math.PI); // Больше в середине
            engineForce = input.throttle * p.maxDriveForce * torqueMult;
        } else {
            // Limiter: срез тяги
            engineForce = 0;
            if (Math.random() > 0.5) car.state.rpm -= 200; // Дерганье стрелки
        }

        // Тяга приложена к задней оси (RWD)
        const driveForce = engineForce * (gearRatio > 0 ? 1 : 0);
        
        // 6. Шины и боковые силы (F_lat)
        const mu_rear = input.handbrake ? p.muRear * p.muRearHandbrakeMult : p.muRear;
        const mu_front = p.muFront;
        
        const mass = body.mass;
        const frictionLimitFront = mu_front * mass * 0.5;
        const frictionLimitRear = mu_rear * mass * 0.5;

        // Боковая скорость на осях
        const vSideFront = v_side + angVel * 30;
        const vSideRear = v_side - angVel * 30;

        // Скольжение передней оси (с учетом поворота колес)
        // Проекция скорости на ось, перпендикулярную колесу
        const slipSideFront = (vSideFront * Math.cos(currentSteerRad)) - (v_forward * Math.sin(currentSteerRad));
        const slipSideRear = vSideRear;

        let fLatFront = -slipSideFront * p.C_lat;
        let fLatRear = -slipSideRear * p.C_lat;

        // Ограничение сцеплением
        fLatFront = Phaser.Math.Clamp(fLatFront, -frictionLimitFront, frictionLimitFront);
        fLatRear = Phaser.Math.Clamp(fLatRear, -frictionLimitRear, frictionLimitRear);

        // 7. Итоговые силы
        const totalFwd = driveForce - (input.brake * p.brakeForce);
        
        // Момент вращения: передняя боковая сила создает момент через плечо
        // (учитываем, что сила fLatFront направлена под углом колеса)
        const torque = (fLatFront * Math.cos(currentSteerRad) * 30) - (fLatRear * 30);

        // 8. Интеграция (Эйлер)
        // Линейное ускорение (локальное)
        const acc_fwd = totalFwd / mass;
        const acc_side = (fLatFront + fLatRear) / mass;

        // Перевод ускорений в глобальные координаты
        const globalAccX = forward.x * acc_fwd + right.x * acc_side;
        const globalAccY = forward.y * acc_fwd + right.y * acc_side;

        // Обновление скорости
        vel.x += globalAccX;
        vel.y += globalAccY;

        // Драг (сопротивление воздуха/трение)
        vel.x *= (1 - p.linearDrag);
        vel.y *= (1 - p.linearDrag);

        // Угловая скорость
        angVel += torque / (mass * 150); // Уменьшили момент инерции для лучшего поворота
        angVel *= (1 - p.angularDamping);

        // 9. Синхронизация с Matter
        car.scene.matter.body.setVelocity(body, vel);
        car.scene.matter.body.setAngularVelocity(body, angVel);

        // Сохраняем состояние обратно в car.state (Matter обновит позицию и угол сам)
        car.state.vel = { x: body.velocity.x, y: body.velocity.y };
        car.state.angVel = body.angularVelocity;
        car.state.v_side = v_side; // для HUD

        // Сброс
        if (input.isResetPressed) {
            car.reset();
        }
    }
}
