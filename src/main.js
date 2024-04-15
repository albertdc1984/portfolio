import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDIalogue, setCamScale } from "./utils";

let dancing = false;
let audio = document.querySelector(".audio");
audio.addEventListener("pause", () => (dancing = false));

k.loadSprite("spritesheet", "./spritesheet.png", {
  sliceX: 39,
  sliceY: 31,
  anims: {
    "idle-down": 948,
    "walk-down": { from: 948, to: 951, loop: true, speed: 8 },
    "idle-side": 987,
    "walk-side": { from: 987, to: 990, loop: true, speed: 8 },
    "idle-up": 1026,
    "walk-up": { from: 1026, to: 1029, loop: true, speed: 8 },
    "dancing-down": { from: 1182, to: 1185, loop: true, speed: 8 },
    "boy-walk-down": { from: 944, to: 947, loop: true, speed: 8 },
  },
});

k.loadSprite("map", "./map2.png");

k.setBackground(k.Color.fromHex("#000531"), 0.5);

k.scene("main", async () => {
  const mapData = await (await fetch("./map.json")).json();
  const layers = mapData.layers;

  const map = k.add([k.sprite("map"), k.pos(0), k.scale(scaleFactor)]);

  const player = k.make([
    k.sprite("spritesheet", { anim: "idle-down" }),
    k.area({
      shape: new k.Rect(k.vec2(0, 3), 10, 10),
    }),
    k.body(),
    k.anchor("center"),
    k.pos(),
    k.scale(scaleFactor),
    {
      speed: 250,
      direction: "down",
      isInDialogue: false,
    },
    "player",
  ]);

  const player2 = k.make([
    k.sprite("spritesheet", { anim: "boy-walk-down" }),
    k.area({
      shape: new k.Rect(k.vec2(0, 3), 10, 10),
    }),
    k.body(),
    k.anchor("center"),
    k.pos(),
    k.scale(scaleFactor),
    {
      speed: 250,
      direction: "down",
      isInDialogue: false,
    },
    "player2",
  ]);

  for (const layer of layers) {
    if (layer.name === "boundaries") {
      for (const boundary of layer.objects) {
        map.add([
          k.area({
            shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
          }),
          k.body({ isStatic: true }),
          k.pos(boundary.x, boundary.y),
          boundary.name,
        ]);

        if (boundary.name) {
          player.onCollide(boundary.name, () => {
            player.isInDialogue = true;
            displayDIalogue(dialogueData[boundary.name], () => {
              player.isInDialogue = false;
              if (boundary.name == "records") player.play("idle-down");
              audio.pause();
            });
            if (boundary.name == "records") {
              dancing = true;
              audio.play();
              player.play("dancing-down");
            }
          });
        }
      }
      continue;
    }

    if (layer.name === "spawnpoints") {
      for (const entity of layer.objects) {
        if (entity.name === "player") {
          player.pos = k.vec2(
            (map.pos.x + entity.x) * scaleFactor,
            (map.pos.y + entity.y) * scaleFactor
          );
          k.add(player);

          continue;
        }
        if (entity.name === "player2") {
          player2.pos = k.vec2(entity.x * scaleFactor, entity.y * scaleFactor);
          k.add(player2);
        }
      }
    }

    player.onCollide("player2", () => {
      player.isInDialogue = true;
      displayDIalogue(
        "Here's my boy, Henoc. He's 15 months old but he's so clever! I'm trying to teach him some javascript but he's not interested by the moment 😝",
        () => {
          player.isInDialogue = false;
        }
      );
    });
  }

  setCamScale(k);

  k.onResize(() => {
    setCamScale(k);
  });

  k.onUpdate(() => {
    k.camPos(player.pos.x, player.pos.y + 100);
  });

  k.onMouseDown((mouseBtn) => {
    if (mouseBtn !== "left" || player.isInDialogue) return;

    const worldMousePos = k.toWorld(k.mousePos());
    player.moveTo(worldMousePos, player.speed);

    const mouseAngle = player.pos.angle(worldMousePos);

    const lowerBound = 50;
    const upperBound = 125;

    if (
      mouseAngle > lowerBound &&
      mouseAngle < upperBound &&
      player.curAnim() !== "walk-up"
    ) {
      player.play("walk-up");
      player.direction = "up";
      return;
    }
    if (
      mouseAngle < -lowerBound &&
      mouseAngle > -upperBound &&
      player.curAnim() !== "walk-down"
    ) {
      player.play("walk-down");
      player.direction = "down";
      return;
    }
    if (Math.abs(mouseAngle) > upperBound) {
      player.flipX = false;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "right";
      return;
    }
    if (Math.abs(mouseAngle) < lowerBound) {
      player.flipX = true;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "left";
      return;
    }
  });

  k.onMouseRelease(() => {
    if (dancing) return;
    if (player.direction === "down") {
      player.play("idle-down");
      return;
    }
    if (player.direction === "up") {
      player.play("idle-up");
      return;
    }

    player.play("idle-side");
  });
});

k.go("main");
