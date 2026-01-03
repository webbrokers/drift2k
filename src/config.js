import { Storage } from "./storage/Storage.js";
import { Boot } from "./scenes/Boot.js";
import { Game } from "./scenes/Game.js";

const defaultCarPhysics = {
  // Трение и сцепление
  muFront: 0.9,
  muRear: 0.8,
  muRearHandbrakeMult: 0.3,
  C_lat: 0.8, // Повысили для лучшего "зацепа" и реакции

  // Рулевое управление
  maxSteerDeg: 35,
  steerRateDegPerSec: 100,
  steerReturnDegPerSec: 120,

  // Тяга и тормоза
  maxDriveForce: 0.15,
  brakeForce: 0.1,
  linearDrag: 0.012,
  angularDamping: 0.3,

  // Двигатель и трансмиссия
  gearRatios: [0, 3.5, 2.3, 1.6, 1.2, 1.0], // 0 - N, 1..5 - передачи
  finalDrive: 3.5,
  wheelRadius: 15,
  idleRPM: 800,
  redlineRPM: 7500,
  rpmResponse: 0.15,
};

export const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#1b1464",
  parent: "phaser-example",
  physics: {
    default: "matter",
    matter: {
      gravity: { y: 0 },
      debug: true,
    },
  },
  carPhysics: Storage.getPhysicsParams(defaultCarPhysics),
  scene: [Boot, Game],
};
