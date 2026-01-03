import { config } from "../config.js";
import { Storage } from "../storage/Storage.js";

export class SettingsUI {
    constructor(scene) {
        this.scene = scene;
        this.createModal();
    }

    createModal() {
        // Создаем контейнер для модального окна
        this.overlay = document.createElement('div');
        this.overlay.id = 'settings-overlay';
        this.overlay.style.display = 'none';
        this.overlay.innerHTML = `
            <div id="settings-modal">
                <h2>Настройки физики</h2>
                <div class="settings-grid">
                    ${this.generateInputs()}
                </div>
                <div class="settings-actions">
                    <button id="save-settings">Сохранить</button>
                    <button id="close-settings">Закрыть</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);

        // Обработчики кнопок
        document.getElementById('save-settings').onclick = () => this.save();
        document.getElementById('close-settings').onclick = () => this.hide();
    }

    generateInputs() {
        const p = config.carPhysics;
        const labels = {
            muFront: 'Сцепление перед (0..1)',
            muRear: 'Сцепление зад (0..1)',
            muRearHandbrakeMult: 'Множитель ручника',
            C_lat: 'Коэфф. боковой силы',
            maxSteerDeg: 'Макс. угол руля (град)',
            steerRateDegPerSec: 'Скорость руля (град/с)',
            maxDriveForce: 'Мощность двигателя',
            brakeForce: 'Сила торможения',
            linearDrag: 'Сопротивление воздуха',
            angularDamping: 'Угловое затухание',
            idleRPM: 'Холостые обороты',
            redlineRPM: 'Красная зона RPM'
        };

        return Object.entries(labels).map(([key, label]) => `
            <div class="setting-item">
                <label for="setting-${key}">${label}</label>
                <input type="number" id="setting-${key}" step="0.01" value="${p[key]}">
            </div>
        `).join('');
    }

    save() {
        const p = config.carPhysics;
        const inputs = document.querySelectorAll('#settings-modal input');
        
        inputs.forEach(input => {
            const key = input.id.replace('setting-', '');
            p[key] = parseFloat(input.value);
        });

        // Сохраняем в localStorage
        Storage.savePhysicsParams(p);
        
        console.log('Настройки сохранены:', p);
        this.hide();
    }

    show() {
        this.overlay.style.display = 'flex';
        this.scene.scene.pause();
    }

    hide() {
        this.overlay.style.display = 'none';
        this.scene.scene.resume();
    }
}
