const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Keep internal (logical) resolution at 800×600 for game logic
canvas.width = 800;
canvas.height = 600;

// Dynamically resize the canvas style to match the browser’s visible area.
// This helps avoid the iPad “cut off bottom” bug when address bars hide/show.
function resizeCanvasToWindow() {
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
}
window.addEventListener("resize", resizeCanvasToWindow);
window.addEventListener("orientationchange", resizeCanvasToWindow);
// Call once on load:
resizeCanvasToWindow();

// 1) CREATE BACKGROUND MUSIC AUDIO OBJECT
const backgroundMusic = new Audio("https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bit%20Quest.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

// 2) CREATE “YUMMY” SOUND EFFECT
const yummySound = new Audio("./yummy.mp3");
yummySound.volume = 1.0; // full volume (adjust as needed)

// Load the background image
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
playerImage.src = "https://banner2.cleanpng.com/20180217/zjw/av14rma49.webp";

// Player object
let player = {
  x: canvas.width / 2 - 50,
  y: canvas.height - 150,
  width: 100,
  height: 150,
  speed: 30,
};

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
    // Clear the temp canvas each frame
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw background image at 60% opacity onto temp canvas
    tempCtx.globalAlpha = 0.6;
    tempCtx.drawImage(backgroundImage, 0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.globalAlpha = 1; // reset alpha

    // Now draw temp canvas onto the main canvas
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
    if (
      pizza.y + pizza.height >= player.y &&
      pizza.x + pizza.width >= player.x &&
      pizza.x <= player.x + player.width
    ) {
      score++;
      pizzas.splice(index, 1);

      // Make the player 5 pixels wider
      player.width += 5;
      // Keep the player within bounds
      if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
      }

      // Play the "Yummy!" sound (overlapping if multiple catches)
      const newSound = yummySound.cloneNode(true);
      newSound.volume = yummySound.volume;
      newSound.play().catch(err => {
        console.warn("Could not play yummy sound:", err);
      });
    }

    // End game if pizza hits the ground
    if (pizza.y > canvas.height) {
      gameOver = true;
    }
  });
}

// Draw game elements
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();

  // Draw game title
  ctx.fillStyle = "#fff";
  ctx.font = "30px Arial";
  ctx.fillText("Fong Bong Pizza Man", canvas.width / 2 - 150, 40);

  // Draw score
  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);

  drawPlayer();
  drawPizzas();

  // Display game over message
  if (gameOver) {
    ctx.fillStyle = "#fff";
    ctx.font = "40px Arial";
    ctx.fillText("Game Over!", canvas.width / 2 - 100, canvas.height / 2);

    // Show a hint to restart
    ctx.font = "20px Arial";
    ctx.fillText("Tap or press R to restart", canvas.width / 2 - 120, canvas.height / 2 + 50);
  }
}

// Move player
function movePlayer(direction) {
  if (direction === "left" && player.x > 0) {
    player.x -= player.speed;
  } else if (direction === "right" && player.x + player.width < canvas.width) {
    player.x += player.speed;
  }
}

// START BACKGROUND MUSIC ON FIRST KEY PRESS
document.addEventListener("keydown", (e) => {
  // If music is paused, try playing it.
  if (backgroundMusic.paused) {
    backgroundMusic.play().catch(err => {
      console.warn("Audio play was prevented:", err);
    });
  }

  if (!gameOver) {
    if (e.key === "ArrowLeft") {
      movePlayer("left");
    } else if (e.key === "ArrowRight") {
      movePlayer("right");
    }
  } else {
    // If it's game over, pressing "R" reloads page
    if (e.key.toLowerCase() === "r") {
      location.reload();
    }
  }
});

// MOBILE TOUCH INPUT
canvas.addEventListener("touchstart", function(e) {
  // If music is paused, try playing it on first touch
  if (backgroundMusic.paused) {
    backgroundMusic.play().catch(err => {
      console.warn("Audio play was prevented:", err);
    });
  }

  // If game over, tapping reloads
  if (gameOver) {
    location.reload();
    return;
  }

  // Prevent default so iOS Safari doesn’t treat it as a scroll
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];

  // Because the canvas is visually scaled to fill the screen,
  // we must convert the touch coordinates to our internal 800×600 space.
  const scaleX = canvas.width / rect.width;   // ratio of internal width to display width
  const scaleY = canvas.height / rect.height; // ratio of internal height to display height

  // Calculate the internal coordinates
  const touchX = (touch.clientX - rect.left) * scaleX;
  // const touchY = (touch.clientY - rect.top) * scaleY; // only if needed

  // Simple logic: left half => "left", right half => "right"
  if (touchX < canvas.width / 2) {
    movePlayer("left");
  } else {
    movePlayer("right");
  }
}, { passive: false });

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

// Start the game loop (renders + logic). Music & movement start on user input.
gameLoop();
