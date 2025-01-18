// game.js

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

// 1) CREATE BACKGROUND MUSIC AUDIO OBJECT
const backgroundMusic = new Audio("https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bit%20Quest.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

// 2) CREATE “YUMMY” SOUND EFFECT
// Use your own link or local file here
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
pizzaImage.src =
    "https://134984376.cdn6.editmysite.com/uploads/1/3/4/9/134984376/s935319452332453897_p106_i1_w1080.png";

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
        tempCtx.globalAlpha = 1; // reset alpha on temp context

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

            // // 3) PLAY THE "YUMMY" SOUND WHEN PIZZA IS EATEN
            // yummySound.play().catch(err => {
            //     console.warn("Yummy sound was prevented:", err);
            // });

            const newSound = yummySound.cloneNode(true);

            // Copy settings if needed
            newSound.volume = yummySound.volume;

            // Play the cloned sound
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
    // Always clear the main canvas each frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground(); // Draw your partially transparent background first

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
        
        // Optional: Stop music on game over
        // backgroundMusic.pause();
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

// 4) START BACKGROUND MUSIC ON FIRST KEY PRESS
document.addEventListener("keydown", (e) => {
    // If music is paused, try playing it. This ensures user interaction to bypass autoplay restrictions.
    if (backgroundMusic.paused) {
        backgroundMusic.play().catch(err => {
            console.warn("Audio play was prevented by the browser:", err);
        });
    }

    if (e.key === "ArrowLeft") {
        movePlayer("left");
    } else if (e.key === "ArrowRight") {
        movePlayer("right");
    }
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

// Start the game (rendering + logic). Music will wait for first key press to play.
gameLoop();
