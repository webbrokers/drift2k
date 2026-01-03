import { Storage } from "./storage/Storage.js";

const defaultCarPhysics = {
  // Трение и сцепление
  muFront: 0.9,
  muRear: 0.8,
  muRearHandbrakeMult: 0.4,
  C_lat: 0.5, // Коэффициент латеральной силы

  // Рулевое управление
  maxSteerDeg: 40,
  steerRateDegPerSec: 150,
  steerReturnDegPerSec: 100,

  // Тяга и тормоза
  maxDriveForce: 0.05,
  brakeForce: 0.03,
  linearDrag: 0.005,
  angularDamping: 0.1,

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
