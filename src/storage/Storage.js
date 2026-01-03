/**
 * Класс для работы с локальным хранилищем (localStorage).
 * Позволяет сохранять и загружать игровые данные.
 */
export class Storage {
    static KEYS = {
        BEST_LAP: 'drift2k_best_lap',
        PHYSICS_PARAMS: 'drift2k_physics_params'
    };

    /**
     * Сохраняет значение в localStorage.
     * @param {string} key Ключ.
     * @param {any} data Данные для сохранения.
     */
    static save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Ошибка при сохранении в Storage:', e);
        }
    }

    /**
     * Загружает значение из localStorage.
     * @param {string} key Ключ.
     * @param {any} defaultValue Значение по умолчанию.
     * @returns {any} Загруженные данные или значение по умолчанию.
     */
    static load(key, defaultValue) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Ошибка при загрузке из Storage:', e);
            return defaultValue;
        }
    }

    /**
     * Сохраняет лучшее время круга.
     * @param {number} time Время в секундах.
     */
    static saveBestLap(time) {
        this.save(this.KEYS.BEST_LAP, time);
    }

    /**
     * Получает лучшее время круга.
     * @returns {number} Время в секундах (Infinity если нет рекорда).
     */
    static getBestLap() {
        return this.load(this.KEYS.BEST_LAP, Infinity);
    }

    /**
     * Сохраняет параметры физики и управления.
     * @param {Object} params Объект с параметрами.
     */
    static savePhysicsParams(params) {
        this.save(this.KEYS.PHYSICS_PARAMS, params);
    }

    /**
     * Получает сохраненные параметры физики.
     * @param {Object} defaultParams Параметры по умолчанию.
     * @returns {Object} Загруженные или стандартные параметры.
     */
    static getPhysicsParams(defaultParams) {
        return this.load(this.KEYS.PHYSICS_PARAMS, defaultParams);
    }
}
