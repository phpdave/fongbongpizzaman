// 1) Define your version somewhere near the top:
let version = "v1.0.1";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartButton");

// Keep internal resolution 800x600
canvas.width = 800;
canvas.height = 600;

/* Letterbox resizing: keep 4:3 aspect ratio so no sides get cut off. */
function resizeCanvas() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const targetAspect = 800 / 600; // 4:3
  const windowAspect = windowWidth / windowHeight;

  let finalWidth, finalHeight;
  if (windowAspect < targetAspect) {
    // Window is relatively tall/narrow -> match full width, reduce height
    finalWidth = windowWidth;
    finalHeight = windowWidth / targetAspect;
  } else {
    // Window is relatively wide -> match full height, reduce width
    finalHeight = windowHeight;
    finalWidth = windowHeight * targetAspect;
  }

  // Center the canvas in the window
  canvas.style.width = finalWidth + "px";
  canvas.style.height = finalHeight + "px";
  canvas.style.left = (windowWidth - finalWidth) / 2 + "px";
  canvas.style.top = (windowHeight - finalHeight) / 2 + "px";
}

// Listen to resizing
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
resizeCanvas();

// BACKGROUND MUSIC
const backgroundMusic = new Audio(
  "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bit%20Quest.mp3"
);
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

// YUMMY SOUND
const yummySound = new Audio("./yummy.mp3");
yummySound.volume = 1.0;

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

// Load the player image
const playerImage = new Image();
playerImage.src = "./player.png";

// Player object
let player = {
  x: canvas.width / 2 - 50,
  y: canvas.height - 150,
  width: 100,
  height: 150,
  speed: 30,
};

// Health logic
let health = 5;      // Start with 5 HP
const maxHealth = 10;

// Pizzas array
let pizzas = [];
let score = 0;
let gameOver = false;

// Load pizza image
const pizzaImage = new Image();
pizzaImage.src = "https://134984376.cdn6.editmysite.com/uploads/1/3/4/9/134984376/s935319452332453897_p106_i1_w1080.png";

// Create a new pizza
function createPizza() {
  const size = 40;
  pizzas.push({
    x: Math.random() * (canvas.width - size),
    y: 0,
    width: size,
    height: size,
    speed: 1.5 + Math.random(),
  });
}

// Draw the background with transparency
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

// Update game state
function update() {
  if (gameOver) return;

  pizzas.forEach((pizza, index) => {
    pizza.y += pizza.speed;

    // Check if pizza is caught
    const caught =
      pizza.y + pizza.height >= player.y &&
      pizza.x + pizza.width >= player.x &&
      pizza.x <= player.x + player.width;

    if (caught) {
      score++;
      pizzas.splice(index, 1);

      // Make the player 5 pixels wider
      player.width += 5;
      if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
      }

      // Increase health by 1 (up to max)
      if (health < maxHealth) {
        health++;
      }

      // "Yummy!" sound
      const newSound = yummySound.cloneNode(true);
      newSound.volume = yummySound.volume;
      newSound.play().catch((err) => {
        console.warn("Could not play yummy sound:", err);
      });
    }
    // If pizza goes off the screen, we lose health
    else if (pizza.y > canvas.height) {
      pizzas.splice(index, 1);
      health--;
      // If health hits 0, gameOver
      if (health <= 0) {
        gameOver = true;
      }
    }
  });
}

// Draw game elements
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();

  // Title
  ctx.fillStyle = "#fff";
  ctx.font = "30px Arial";
  ctx.fillText("Fong Bong Pizza Man", canvas.width / 2 - 150, 40);

  // Score
  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);

  // Draw player & pizzas
  drawPlayer();
  drawPizzas();

  // Draw health orb in bottom-left corner
  drawHealthOrb();

  // If game over, show message + restart
  if (gameOver) {
    ctx.fillStyle = "#fff";
    ctx.font = "40px Arial";
    ctx.fillText("Game Over!", canvas.width / 2 - 100, canvas.height / 2);

    // Show restart button
    restartBtn.style.display = "block";
  }

  // Version number in bottom-left (below the orb)
  ctx.fillStyle = "#fff";
  ctx.font = "14px Arial";
  ctx.fillText(`Version: ${version}`, 10, canvas.height - 10);
}

/**
 * Draws a red circular “orb” that’s filled to reflect the current health %.
 * Example: If health=5 and maxHealth=10 => orb is half filled.
 */
function drawHealthOrb() {
  // orb center near bottom-left, radius 40, for instance
  const orbX = 70;
  const orbY = canvas.height - 70;
  const radius = 40;

  // Outer circle (gray background or black behind the fill)
  ctx.beginPath();
  ctx.arc(orbX, orbY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "#333"; // background color of orb
  ctx.fill();

  // Now fill a portion in red, from 0 (top) downward
  // Approach: we can use a “clip” or draw an arc fraction.
  // Let’s do a circle sector from the top around to some fraction:
  const fillPercent = health / maxHealth; // 0..1

  // We'll do a “pie slice” from -90 degrees to some fraction
  const startAngle = -Math.PI / 2; // top
  const endAngle = startAngle + fillPercent * 2 * Math.PI;

  ctx.beginPath();
  ctx.moveTo(orbX, orbY);
  ctx.arc(orbX, orbY, radius, startAngle, endAngle, false);
  ctx.closePath();
  ctx.fillStyle = "red";
  ctx.fill();

  // Optionally, you can add a border/stroke
  ctx.beginPath();
  ctx.arc(orbX, orbY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Move player
function movePlayer(direction) {
  if (!gameOver) {
    if (direction === "left" && player.x > 0) {
      player.x -= player.speed;
    } else if (direction === "right" && player.x + player.width < canvas.width) {
      player.x += player.speed;
    }
  }
}

// START BACKGROUND MUSIC ON FIRST KEY PRESS
document.addEventListener("keydown", (e) => {
  if (backgroundMusic.paused) {
    backgroundMusic.play().catch((err) => {
      console.warn("Audio play was prevented:", err);
    });
  }

  if (e.key === "ArrowLeft") {
    movePlayer("left");
  } else if (e.key === "ArrowRight") {
    movePlayer("right");
  }
});

// MOBILE TOUCH INPUT
canvas.addEventListener(
  "touchstart",
  function (e) {
    if (backgroundMusic.paused) {
      backgroundMusic.play().catch((err) => {
        console.warn("Audio play was prevented:", err);
      });
    }

    e.preventDefault();

    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];

    // Convert to internal coords
    const scaleX = canvas.width / rect.width;
    const touchX = (touch.clientX - rect.left) * scaleX;

    // left half => move left, right half => move right
    if (touchX < canvas.width / 2) {
      movePlayer("left");
    } else {
      movePlayer("right");
    }
  },
  { passive: false }
);

// RESTART BUTTON
restartBtn.addEventListener("click", () => {
  location.reload();
});

// Main game loop
function gameLoop() {
  update();
  draw();
  if (!gameOver) {
    requestAnimationFrame(gameLoop);
  }
}

// Spawn pizzas at intervals
setInterval(createPizza, 1000);

// Start the game loop
gameLoop();
