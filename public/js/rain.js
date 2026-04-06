// Animated rain canvas — purely decorative background effect
(function () {
  const canvas = document.getElementById("rain-canvas");
  const ctx = canvas.getContext("2d");

  let drops = [];
  const NUM_DROPS = 120;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    initDrops();
  }

  function initDrops() {
    drops = [];
    for (let i = 0; i < NUM_DROPS; i++) {
      drops.push({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        len:   Math.random() * 20 + 8,
        speed: Math.random() * 4 + 2,
        alpha: Math.random() * 0.4 + 0.1,
        width: Math.random() * 0.8 + 0.3,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drops.forEach((d) => {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.len * 0.15, d.y + d.len);
      ctx.strokeStyle = `rgba(79,195,247,${d.alpha})`;
      ctx.lineWidth = d.width;
      ctx.lineCap = "round";
      ctx.stroke();

      d.y += d.speed;
      d.x -= d.speed * 0.15;

      if (d.y > canvas.height + d.len) {
        d.y = -d.len;
        d.x = Math.random() * canvas.width;
      }
      if (d.x < -10) {
        d.x = canvas.width + 10;
      }
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
})();