// 1) Define your version somewhere near the top:
let version = "v1.6.0-extended-stages-spoiled-pizza";

let goldenPizzas = [];
let pizzaFeverActive = false;
let pizzaFeverTimer = 0;
const pizzaFeverDuration = 600; // ~10 seconds if your game loop is ~60 FPS

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartButton");

canvas.width = 800;
canvas.height = 600;

/* Letterbox resizing */
function resizeCanvas() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const targetAspect = 800 / 600; // 4:3
  const windowAspect = windowWidth / windowHeight;

  let finalWidth, finalHeight;
  if (windowAspect < targetAspect) {
    finalWidth = windowWidth;
    finalHeight = windowWidth / targetAspect;
  } else {
    finalHeight = windowHeight;
    finalWidth = windowHeight * targetAspect;
  }

  canvas.style.width = finalWidth + "px";
  canvas.style.height = finalHeight + "px";
  canvas.style.left = (windowWidth - finalWidth) / 2 + "px";
  canvas.style.top = (windowHeight - finalHeight) / 2 + "px";
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
resizeCanvas();

// BACKGROUND MUSIC
const backgroundMusic = new Audio(
  "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bit%20Quest.mp3"
);
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

// YUMMY SOUND (pizza)
const yummySound = new Audio("./yummy.mp3");
yummySound.volume = 1.0;

// WEIGHT SOUND
const weightSound = new Audio("./weightlifting.mp3");
weightSound.volume = 0.8;

// GAME OVER SOUND
const gameOverSound = new Audio("./game_over.mp3");
gameOverSound.volume = 1.0;

// NED SOUND
const nedSound = new Audio("./ned.mp3");
nedSound.volume = 1.0;

// SPOILED PIZZA SOUND
const spoiledSound = new Audio("./spoiled.mp3"); // Assume a sound file for spoiled pizza
spoiledSound.volume = 0.8;

// Load background image
const backgroundImage = new Image();
backgroundImage.src = "./fong_bong_pizza_man.webp";
backgroundImage.onload = () => {
  console.log("Background image loaded successfully.");
};
backgroundImage.onerror = () => {
  console.error("Failed to load the background image.");
};

// Off-screen canvas for transparency
const tempCanvas = document.createElement("canvas");
const tempCtx = tempCanvas.getContext("2d");
tempCanvas.width = canvas.width;
tempCanvas.height = canvas.height;

// Load images
const playerImage = new Image();
playerImage.src = "./player.png";

const pizzaImage = new Image();
pizzaImage.src =
  "https://134984376.cdn6.editmysite.com/uploads/1/3/4/9/134984376/s935319452332453897_p106_i1_w1080.png";

const weightImage = new Image();
weightImage.src = "./weightlifting.png";

const nedImage = new Image();
nedImage.src = "./evil_ned.webp";

const goldenPizzaImage = new Image();
goldenPizzaImage.src = "./golden_pizza.webp";

const spoiledPizzaImage = new Image();
spoiledPizzaImage.src = "./spoiled_pizza.webp"; // Assume an image for spoiled pizza

// Player object
let player = {
  x: canvas.width / 2 - 50,
  y: canvas.height - 150,
  width: 100,
  height: 150,
  speed: 30,
};

// Health logic
let health = 3;
const maxHealth = 3;

// Arrays and scoring
let pizzas = [];
let weights = [];
let neds = [];
let spoiledPizzas = []; // New array for spoiled pizzas
let score = 0;
let gameOver = false;

// Stage system
let currentStage = 1;
const stageThresholds = [50, 150, 300, 500, 750, 1000, 1500]; // Stages up to 7: 1->2 at 50, 2->3 at 150, 3->4 at 300, 4->5 at 500, 5->6 at 750, 6->7 at 1000, 7->8 at 1500
let stageTransitionTimer = 0;
const stageTransitionDuration = 120;

// Ned laser effect
let nedLasers = [];
const nedLaserDuration = 60;

// Pizza Fever animation particles
let feverParticles = [];

function createGoldenPizza() {
  const size = 50;
  goldenPizzas.push({
    x: Math.random() * (canvas.width - size),
    y: 0,
    width: size,
    height: size,
    speed: 2 + Math.random() * currentStage,
  });
}

/** 
 * GET EXISTING HIGH SCORE FROM LOCAL STORAGE 
 */
let highScore = parseInt(localStorage.getItem("pizzaGameHighScore")) || 0;
let highScoreInitials =
  localStorage.getItem("pizzaGameHighScoreInitials") || "";

/** Create a new pizza */
function createPizza() {
  const size = 40;
  pizzas.push({
    x: Math.random() * (canvas.width - size),
    y: 0,
    width: size,
    height: size,
    speed: 1.5 + Math.random() + currentStage * 0.5,
  });
}

/** Create a new weight item */
function createWeight() {
  const size = 40;
  weights.push({
    x: Math.random() * (canvas.width - size),
    y: 0,
    width: size,
    height: size,
    speed: 1.5 + Math.random() + currentStage * 0.5,
  });
}

/** Create a new Ned item */
function createNed() {
  const size = 50;
  neds.push({
    x: Math.random() * (canvas.width - size),
    y: 0,
    width: size,
    height: size,
    speed: 1 + Math.random() + currentStage * 0.3,
  });
}

/** Create a new spoiled pizza (Stage 5+) */
function createSpoiledPizza() {
  if (currentStage < 5) return; // Only spawn in Stage 5+
  const size = 40;
  spoiledPizzas.push({
    x: Math.random() * (canvas.width - size),
    y: 0,
    width: size,
    height: size,
    speed: 2 + Math.random() + currentStage * 0.7, // Faster than regular pizzas
  });
}

// ----------------------------------------------------
//   PLAYER LASER LOGIC
// ----------------------------------------------------
let lasers = [];
let laserParticles = [];

function createDoubleLaser() {
  const laserCount = currentStage >= 2 ? Math.min(2 + currentStage - 1, 5) : 2;
  for (let i = 0; i < laserCount; i++) {
    const angleDeg = Math.random() * 140 + 20;
    const angleRad = (angleDeg * Math.PI) / 180;
    const speed = 6 + currentStage * 1.5;

    const realAngle = (90 - angleDeg) * (Math.PI / 180);
    const dx = speed * Math.cos(realAngle);
    const dy = -speed * Math.sin(realAngle);

    lasers.push({
      x: player.x + player.width / 2,
      y: player.y + player.height / 2,
      width: currentStage >= 3 ? 6 : 4,
      length: 30 + currentStage * 10,
      angle: realAngle,
      dx,
      dy,
      age: 0,
      isRed: currentStage >= 3,
    });
  }
}

function createLaserParticles(x, y, color = "lime") {
  for (let i = 0; i < 8; i++) {
    laserParticles.push({
      x: x + Math.random() * 10 - 5,
      y: y + Math.random() * 10 - 5,
      dx: (Math.random() - 0.5) * 5,
      dy: (Math.random() - 0.5) * 5,
      size: 3 + Math.random() * 4,
      life: 25 + Math.random() * 15,
      color: color === "purple" ? "purple" : currentStage >= 3 ? "red" : "lime",
    });
  }
}

function updateLasers() {
  for (let i = 0; i < lasers.length; i++) {
    const laser = lasers[i];
    laser.x += laser.dx;
    laser.y += laser.dy;
    laser.age++;

    if (
      laser.x < -50 ||
      laser.y < -50 ||
      laser.x > canvas.width + 50 ||
      laser.y > canvas.height + 50
    ) {
      lasers.splice(i, 1);
      i--;
      continue;
    }

    const endX = laser.x + Math.cos(laser.angle) * laser.length;
    const endY = laser.y - Math.sin(laser.angle) * laser.length;
    const minBeamX = Math.min(laser.x, endX);
    const maxBeamX = Math.max(laser.x, endX);
    const minBeamY = Math.min(laser.y, endY);
    const maxBeamY = Math.max(laser.y, endY);

    let collisionHappened = false;
    for (let j = 0; j < pizzas.length; j++) {
      const p = pizzas[j];
      if (
        maxBeamX >= p.x &&
        minBeamX <= p.x + p.width &&
        maxBeamY >= p.y &&
        minBeamY <= p.y + p.height
      ) {
        score += currentStage;
        createLaserParticles(p.x + p.width / 2, p.y + p.height / 2, laser.isRed ? "red" : "lime");
        pizzas.splice(j, 1);
        if (laser.isRed && currentStage >= 4) {
          continue;
        }
        lasers.splice(i, 1);
        i--;
        collisionHappened = true;
        break;
      }
    }
    if (collisionHappened) continue;
  }

  for (let i = 0; i < laserParticles.length; i++) {
    const p = laserParticles[i];
    p.x += p.dx;
    p.y += p.dy;
    p.life--;
    p.size *= 0.95;
    if (p.life <= 0) {
      laserParticles.splice(i, 1);
      i--;
    }
  }
}

function drawLasers() {
  ctx.save();

  lasers.forEach((laser) => {
    ctx.save();
    ctx.translate(laser.x, laser.y);
    ctx.rotate(-laser.angle);

    const gradient = ctx.createLinearGradient(0, -laser.width * 2, 0, laser.width * 2);
    if (laser.isRed) {
      gradient.addColorStop(0, "rgba(255, 0, 0, 0)");
      gradient.addColorStop(0.4, "rgba(255, 0, 0, 0.8)");
      gradient.addColorStop(0.6, "rgba(255, 0, 0, 0.8)");
      gradient.addColorStop(1, "rgba(255, 0, 0, 0)");
    } else {
      gradient.addColorStop(0, "rgba(0, 255, 0, 0)");
      gradient.addColorStop(0.4, "rgba(0, 255, 0, 0.8)");
      gradient.addColorStop(0.6, "rgba(0, 255, 0, 0.8)");
      gradient.addColorStop(1, "rgba(0, 255, 0, 0)");
    }

    const pulse = Math.sin(laser.age * 0.2) * 3;
    const beamWidth = laser.width + pulse;

    ctx.fillStyle = gradient;
    ctx.fillRect(0, -beamWidth / 2, laser.length, beamWidth);

    ctx.fillStyle = laser.isRed ? "rgba(255, 0, 0, 0.9)" : "lime";
    if (laser.isRed) {
      ctx.globalAlpha = 0.7 + Math.sin(laser.age * 0.4) * 0.3;
    }
    ctx.fillRect(0, -laser.width / 2, laser.length, laser.width);

    ctx.restore();
  });

  laserParticles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  });

  ctx.globalAlpha = 1.0;
  ctx.restore();
}

// ----------------------------------------------------
//   NED LASER LOGIC
// ----------------------------------------------------
function createNedLaser(x, y) {
  const angleDeg = Math.random() * 90 - 45; // -45° to 45° (up-left to up-right)
  const angleRad = (angleDeg * Math.PI) / 180;
  const speed = 20;

  nedLasers.push({
    x: x,
    y: y,
    width: 12,
    length: 0,
    speed: speed,
    angle: angleRad,
    dx: speed * Math.sin(angleRad),
    dy: -speed * Math.cos(angleRad),
    age: 0,
    maxLength: canvas.height,
    flicker: Math.random() * 0.2,
  });
}

function updateNedLasers() {
  for (let i = 0; i < nedLasers.length; i++) {
    const laser = nedLasers[i];
    laser.age++;
    if (laser.length < laser.maxLength) {
      laser.length += laser.speed;
    }
    if (laser.age > nedLaserDuration || laser.y - laser.length * Math.cos(laser.angle) < 0) {
      nedLasers.splice(i, 1);
      i--;
      continue;
    }

    const endX = laser.x + Math.sin(laser.angle) * laser.length;
    const endY = laser.y - Math.cos(laser.angle) * laser.length;
    const minX = Math.min(laser.x, endX);
    const maxX = Math.max(laser.x, endX);
    const minY = Math.min(laser.y, endY);
    const maxY = Math.max(laser.y, endY);

    for (let j = pizzas.length - 1; j >= 0; j--) {
      const p = pizzas[j];
      if (
        p.x + p.width > minX - laser.width &&
        p.x < maxX + laser.width &&
        p.y + p.height > minY &&
        p.y < maxY
      ) {
        createLaserParticles(p.x + p.width / 2, p.y + p.height / 2, "purple");
        pizzas.splice(j, 1);
      }
    }
    for (let j = weights.length - 1; j >= 0; j--) {
      const w = weights[j];
      if (
        w.x + w.width > minX - laser.width &&
        w.x < maxX + laser.width &&
        w.y + w.height > minY &&
        w.y < maxY
      ) {
        weights.splice(j, 1);
      }
    }
    for (let j = goldenPizzas.length - 1; j >= 0; j--) {
      const gp = goldenPizzas[j];
      if (
        gp.x + gp.width > minX - laser.width &&
        gp.x < maxX + laser.width &&
        gp.y + gp.height > minY &&
        gp.y < maxY
      ) {
        goldenPizzas.splice(j, 1);
      }
    }
    for (let j = spoiledPizzas.length - 1; j >= 0; j--) {
      const sp = spoiledPizzas[j];
      if (
        sp.x + sp.width > minX - laser.width &&
        sp.x < maxX + laser.width &&
        sp.y + sp.height > minY &&
        sp.y < maxY
      ) {
        createLaserParticles(sp.x + sp.width / 2, sp.y + sp.height / 2, "purple");
        spoiledPizzas.splice(j, 1);
      }
    }
  }
}

function drawNedLasers() {
  ctx.save();

  nedLasers.forEach((laser) => {
    ctx.save();
    ctx.translate(laser.x, laser.y);
    ctx.rotate(-laser.angle);

    const gradient = ctx.createLinearGradient(-laser.width * 2, 0, laser.width * 2, 0);
    gradient.addColorStop(0, "rgba(186, 85, 211, 0)");
    gradient.addColorStop(0.2, "rgba(186, 85, 211, 0.7)");
    gradient.addColorStop(0.5, "rgba(148, 0, 211, 1)");
    gradient.addColorStop(0.8, "rgba(186, 85, 211, 0.7)");
    gradient.addColorStop(1, "rgba(186, 85, 211, 0)");

    const flicker = Math.sin(laser.age * 0.4 + laser.ficker) * 4;
    const beamWidth = laser.width + flicker;

    ctx.fillStyle = gradient;
    ctx.fillRect(-beamWidth / 2, -laser.length, beamWidth, laser.length);

    ctx.fillStyle = "rgba(148, 0, 211, 0.9)";
    ctx.globalAlpha = 0.8 + Math.sin(laser.age * 0.6) * 0.2;
    ctx.fillRect(-laser.width / 2, -laser.length, laser.width, laser.length);

    ctx.restore();
  });

  ctx.globalAlpha = 1.0;
  ctx.restore();
}

// ----------------------------------------------------
//   PIZZA FEVER ANIMATION
// ----------------------------------------------------
function createFeverParticles() {
  for (let i = 0; i < 10; i++) {
    feverParticles.push({
      x: Math.random() * canvas.width,
      y: canvas.height,
      dx: (Math.random() - 0.5) * 2,
      dy: -Math.random() * 4 - 2,
      size: 5 + Math.random() * 5,
      life: 60 + Math.random() * 20,
      color: `hsl(${Math.random() * 60 + 40}, 100%, 70%)`,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.1,
    });
  }
}

function updateFeverParticles() {
  for (let i = 0; i < feverParticles.length; i++) {
    const p = feverParticles[i];
    p.x += p.dx;
    p.y += p.dy;
    p.dy += 0.05; // Gravity effect
    p.life--;
    p.rotation += p.spin;
    if (p.life <= 0 || p.y > canvas.height + 20) {
      feverParticles.splice(i, 1);
      i--;
    }
  }
}

function drawFeverParticles() {
  ctx.save();
  feverParticles.forEach((p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 80;
    ctx.beginPath();
    ctx.moveTo(0, -p.size);
    ctx.lineTo(p.size * 0.7, p.size * 0.7);
    ctx.lineTo(-p.size * 0.7, p.size * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  ctx.globalAlpha = 1.0;
  ctx.restore();
}

// Draw background
function drawBackground() {
  if (backgroundImage.complete) {
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.globalAlpha = 0.6;
    tempCtx.drawImage(
      backgroundImage,
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    );
    tempCtx.globalAlpha = 1;
    ctx.drawImage(tempCanvas, 0, 0);
  }
}

// Draw the player
function drawPlayer() {
  ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
}

// Draw pizzas
function drawPizzas() {
  pizzas.forEach((pizza) => {
    ctx.drawImage(pizzaImage, pizza.x, pizza.y, pizza.width, pizza.height);
  });
}

function drawGoldenPizzas() {
  goldenPizzas.forEach((gp) => {
    ctx.drawImage(goldenPizzaImage, gp.x, gp.y, gp.width, gp.height);
  });
}

// Draw weights
function drawWeights() {
  weights.forEach((weight) => {
    ctx.drawImage(weightImage, weight.x, weight.y, weight.width, weight.height);
  });
}

// Draw neds
function drawNeds() {
  neds.forEach((ned) => {
    ctx.drawImage(nedImage, ned.x, ned.y, ned.width, ned.height);

    ctx.fillStyle = "#fff";
    ctx.font = "16px Arial";
    let textWidth = ctx.measureText("Ned").width;
    let textX = ned.x + (ned.width - textWidth) / 2;
    let textY = ned.y - 5;
    ctx.fillText("Ned", textX, textY);
  });
}

// Draw spoiled pizzas
function drawSpoiledPizzas() {
  spoiledPizzas.forEach((sp) => {
    ctx.drawImage(spoiledPizzaImage, sp.x, sp.y, sp.width, sp.height);
  });
}

/** Update game state */
function update() {
  if (gameOver) return;

  // Stage transition logic
  if (stageTransitionTimer > 0) {
    stageTransitionTimer--;
    return;
  }

  if (currentStage === 1 && score >= stageThresholds[0]) {
    currentStage = 2;
    stageTransitionTimer = stageTransitionDuration;
    player.speed += 10;
  } else if (currentStage === 2 && score >= stageThresholds[1]) {
    currentStage = 3;
    stageTransitionTimer = stageTransitionDuration;
    player.speed += 10;
  } else if (currentStage === 3 && score >= stageThresholds[2]) {
    currentStage = 4;
    stageTransitionTimer = stageTransitionDuration;
    player.speed += 10;
  } else if (currentStage === 4 && score >= stageThresholds[3]) {
    currentStage = 5;
    stageTransitionTimer = stageTransitionDuration;
    player.speed += 10;
  } else if (currentStage === 5 && score >= stageThresholds[4]) {
    currentStage = 6;
    stageTransitionTimer = stageTransitionDuration;
    player.speed += 10;
  } else if (currentStage === 6 && score >= stageThresholds[5]) {
    currentStage = 7;
    stageTransitionTimer = stageTransitionDuration;
    player.speed += 10;
  } else if (currentStage === 7 && score >= stageThresholds[6]) {
    currentStage = 8;
    stageTransitionTimer = stageTransitionDuration;
    player.speed += 10;
  }

  // Update pizzas
  pizzas.forEach((pizza, index) => {
    pizza.y += pizza.speed;
    const caught =
      pizza.y + pizza.height >= player.y &&
      pizza.x + pizza.width >= player.x &&
      pizza.x <= player.x + player.width;

    if (caught) {
      const pointsToAdd = pizzaFeverActive ? 5 + currentStage : 1 + currentStage;
      score += pointsToAdd;
      pizzas.splice(index, 1);
      player.width += 5;
      if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
      }
      if (health < maxHealth) health++;

      const newSound = yummySound.cloneNode(true);
      newSound.play().catch(console.warn);
    } else if (pizza.y > canvas.height) {
      pizzas.splice(index, 1);
      health--;
      if (health <= 0 && !gameOver) {
        gameOver = true;
        onGameOver();
      }
    }
  });

  // Update weights
  weights.forEach((weight, wIndex) => {
    weight.y += weight.speed;
    const caughtWeight =
      weight.y + weight.height >= player.y &&
      weight.x + weight.width >= player.x &&
      weight.x <= player.x + player.width;

    if (caughtWeight) {
      weights.splice(wIndex, 1);
      player.width = Math.ceil(player.width * (2 / 3));
      if (player.width < 10) player.width = 10;
      health--;
      if (health <= 0 && !gameOver) {
        gameOver = true;
        onGameOver();
      }
      const newWeightSound = weightSound.cloneNode(true);
      newWeightSound.play().catch(console.warn);
    } else if (weight.y > canvas.height) {
      weights.splice(wIndex, 1);
    }
  });

  // Update neds
  neds.forEach((ned, nIndex) => {
    ned.y += ned.speed;
    const caughtNed =
      ned.y + ned.height >= player.y &&
      ned.x + ned.width >= player.x &&
      ned.x <= player.x + player.width;

    if (caughtNed) {
      score += 10 + currentStage * 5;
      health--;
      createNedLaser(ned.x + ned.width / 2, ned.y + ned.height / 2);
      neds.splice(nIndex, 1);

      const newNedSound = nedSound.cloneNode(true);
      newNedSound.play().catch(console.warn);

      createDoubleLaser();

      if (health <= 0 && !gameOver) {
        gameOver = true;
        onGameOver();
      }
    } else if (ned.y > canvas.height) {
      neds.splice(nIndex, 1);
    }
  });

  // Update spoiled pizzas
  spoiledPizzas.forEach((sp, spIndex) => {
    sp.y += sp.speed;
    const caughtSpoiled =
      sp.y + sp.height >= player.y &&
      sp.x + sp.width >= player.x &&
      sp.x <= player.x + player.width;

    if (caughtSpoiled) {
      score -= 5 + currentStage; // Lose points
      if (score < 0) score = 0; // Prevent negative score
      health -= 2; // Double health damage
      spoiledPizzas.splice(spIndex, 1);
      player.width -= 10; // Shrink player
      if (player.width < 10) player.width = 10;
      if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
      }

      const newSpoiledSound = spoiledSound.cloneNode(true);
      newSpoiledSound.play().catch(console.warn);

      if (health <= 0 && !gameOver) {
        gameOver = true;
        onGameOver();
      }
    } else if (sp.y > canvas.height) {
      spoiledPizzas.splice(spIndex, 1);
    }
  });

  updateLasers();
  updateNedLasers();

  // Update golden pizzas
  goldenPizzas.forEach((gp, index) => {
    gp.y += gp.speed;
    const caughtGolden =
      gp.y + gp.height >= player.y &&
      gp.x + gp.width >= player.x &&
      gp.x <= player.x + player.width;

    if (caughtGolden) {
      score += 5 + currentStage * 5;
      pizzaFeverActive = true;
      pizzaFeverTimer = pizzaFeverDuration;
      goldenPizzas.splice(index, 1);
      const goldenSound = yummySound.cloneNode(true);
      goldenSound.play().catch(console.warn);
    } else if (gp.y > canvas.height) {
      goldenPizzas.splice(index, 1);
    }
  });

  // Handle Pizza Fever
  if (pizzaFeverActive) {
    pizzaFeverTimer--;
    if (pizzaFeverTimer % 10 === 0) createFeverParticles();
    updateFeverParticles();
    if (pizzaFeverTimer <= 0) {
      pizzaFeverActive = false;
      feverParticles = [];
    }
  }
}

/** Called once if gameOver = true */
function onGameOver() {
  playGameOverSound();

  if (score > highScore) {
    let initials = prompt("New High Score! Enter your initials:");
    if (!initials) initials = "???";
    initials = initials.trim().toUpperCase();
    localStorage.setItem("pizzaGameHighScore", score.toString());
    localStorage.setItem("pizzaGameHighScoreInitials", initials);
    highScore = score;
    highScoreInitials = initials;
  }
}

/** Draw everything */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  // UI
  ctx.fillStyle = "#fff";
  ctx.font = "30px Arial";
  ctx.fillText("Fong Bong Pizza Man", canvas.width / 2 - 150, 40);

  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
  ctx.fillText(`Stage: ${currentStage}`, 10, 60);
  const highScoreDisplay = `High Score: ${highScore} (${highScoreInitials})`;
  ctx.fillText(highScoreDisplay, canvas.width - 250, 30);

  // Draw game elements
  drawPlayer();
  drawPizzas();
  drawGoldenPizzas();
  drawWeights();
  drawNeds();
  drawSpoiledPizzas();
  drawLasers();
  drawNedLasers();

  drawHealthOrb();

  // Pizza Fever animation
  if (pizzaFeverActive) {
    const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.3;
    ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFD700";
    ctx.font = "50px Arial";
    const scale = 1 + Math.sin(Date.now() * 0.01) * 0.1;
    ctx.save();
    ctx.translate(canvas.width / 2, 120);
    ctx.scale(scale, scale);
    ctx.fillText("PIZZA FEVER!", -ctx.measureText("PIZZA FEVER!").width / 2, 0);
    ctx.restore();

    drawFeverParticles();
  }

  // Stage transition screen
  if (stageTransitionTimer > 0) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "50px Arial";
    ctx.fillText(`Stage ${currentStage}`, canvas.width / 2 - 100, canvas.height / 2);
  }

  if (gameOver) {
    ctx.fillStyle = "#fff";
    ctx.font = "40px Arial";
    ctx.fillText("Game Over!", canvas.width / 2 - 100, canvas.height / 2);
    restartBtn.style.display = "block";
  }

  // Version
  ctx.font = "14px Arial";
  ctx.fillText(`Version: ${version}`, 10, canvas.height - 10);
}

function drawHealthOrb() {
  const orbX = 70;
  const orbY = canvas.height - 70;
  const radius = 40;

  ctx.beginPath();
  ctx.arc(orbX, orbY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#333";
  ctx.fill();

  const fillPercent = health / maxHealth;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + fillPercent * 2 * Math.PI;
  ctx.beginPath();
  ctx.moveTo(orbX, orbY);
  ctx.arc(orbX, orbY, radius, startAngle, endAngle, false);
  ctx.closePath();
  ctx.fillStyle = "red";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(orbX, orbY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** Play the game over sound once */
function playGameOverSound() {
  const newGameOverSound = gameOverSound.cloneNode(true);
  newGameOverSound.play().catch((err) => {
    console.warn("Could not play game_over sound:", err);
  });
}

// Keyboard movement (arrows)
document.addEventListener("keydown", (e) => {
  if (backgroundMusic.paused) {
    backgroundMusic.play().catch(console.warn);
  }
  if (e.key === "ArrowLeft") movePlayer("left");
  else if (e.key === "ArrowRight") movePlayer("right");
});

function movePlayer(direction) {
  if (gameOver || stageTransitionTimer > 0) return;
  if (direction === "left" && player.x > 0) {
    player.x -= player.speed;
  } else if (direction === "right" && player.x + player.width < canvas.width) {
    player.x += player.speed;
  }
}

// -------------------------------------------------
// DRAG / TOUCH + MOUSE LOGIC (MOVE & JUMP)
// -------------------------------------------------
let dragStartX = 0;
let dragStartY = 0;
let isDragging = false;
let jumpUsed = false;
let mouseDown = false;

function clampPlayerX() {
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) {
    player.x = canvas.width - player.width;
  }
}

function doJump() {
  if (player.y >= canvas.height - 150) {
    player.y -= 50;
    setTimeout(() => {
      player.y += 50;
    }, 200);
  }
}

canvas.addEventListener(
  "touchstart",
  function (e) {
    if (backgroundMusic.paused) {
      backgroundMusic.play().catch(console.warn);
    }
    e.preventDefault();
    if (gameOver || stageTransitionTimer > 0) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    dragStartX = (touch.clientX - rect.left) * scaleX;
    dragStartY = (touch.clientY - rect.top) * scaleY;
    isDragging = true;
    jumpUsed = false;
  },
  { passive: false }
);

canvas.addEventListener(
  "touchmove",
  function (e) {
    e.preventDefault();
    if (!isDragging || gameOver || stageTransitionTimer > 0) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const currentX = (touch.clientX - rect.left) * scaleX;
    const currentY = (touch.clientY - rect.top) * scaleY;

    const deltaY = dragStartY - currentY;
    if (deltaY > 40 && !jumpUsed) {
      doJump();
      jumpUsed = true;
    } else {
      player.x = currentX - player.width / 2;
      clampPlayerX();
    }
  },
  { passive: false }
);

canvas.addEventListener("touchend", function (e) {
  isDragging = false;
});

canvas.addEventListener("mousedown", function (e) {
  if (backgroundMusic.paused) {
    backgroundMusic.play().catch(console.warn);
  }
  if (gameOver || stageTransitionTimer > 0) return;

  mouseDown = true;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  dragStartX = (e.clientX - rect.left) * scaleX;
  dragStartY = (e.clientY - rect.top) * scaleY;
  isDragging = true;
  jumpUsed = false;
});

canvas.addEventListener("mousemove", function (e) {
  if (!mouseDown || !isDragging || gameOver || stageTransitionTimer > 0) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const currentX = (e.clientX - rect.left) * scaleX;
  const currentY = (e.clientY - rect.top) * scaleY;

  const deltaY = dragStartY - currentY;
  if (deltaY > 40 && !jumpUsed) {
    doJump();
    jumpUsed = true;
  } else {
    player.x = currentX - player.width / 2;
    clampPlayerX();
  }
});

canvas.addEventListener("mouseup", function () {
  mouseDown = false;
  isDragging = false;
});

canvas.addEventListener("mouseleave", function () {
  mouseDown = false;
  isDragging = false;
});

// -------------------------------------------------

// RESTART
restartBtn.addEventListener("click", () => {
  location.reload();
});

// Main loop
function gameLoop() {
  update();
  draw();
  if (!gameOver) {
    requestAnimationFrame(gameLoop);
  }
}

// Spawning intervals (adjusted per stage)
function setSpawnIntervals() {
  clearInterval(pizzaInterval);
  clearInterval(weightInterval);
  clearInterval(nedInterval);
  clearInterval(goldenPizzaInterval);
  clearInterval(spoiledPizzaInterval);

  pizzaInterval = setInterval(createPizza, 1000 / (currentStage * 1.2));
  weightInterval = setInterval(createWeight, 3000 / (currentStage * 0.9));
  nedInterval = setInterval(createNed, 5000 / (currentStage * 0.95));
  goldenPizzaInterval = setInterval(createGoldenPizza, 15000 / (currentStage * 1.1));
  spoiledPizzaInterval = setInterval(createSpoiledPizza, 4000 / (currentStage * 0.8)); // Spoiled pizzas spawn more frequently as stage increases
}

let pizzaInterval, weightInterval, nedInterval, goldenPizzaInterval, spoiledPizzaInterval;
setSpawnIntervals();

// Start
gameLoop();