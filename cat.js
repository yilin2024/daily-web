"use strict";

(() => {
  // Each 138 × 129 tile is a complete drawing. Every action starts and ends
  // on the same seated pose, so queued actions can join at a planted paw.
  const tile = {width:138, height:129, columns:16};
  const fps = 24;
  const clips = [
    {name:"catch", first:4, count:87, still:31, label:"扑蝴蝶 · Catch a butterfly", message:"猫咪盯住蝴蝶，伸爪扑了两下。"},
    {name:"groom", first:91, count:99, still:29, label:"舔爪洗脸 · Groom a paw", message:"猫咪抬起前爪，舔舔爪尖，再用爪子洗脸。"},
    {name:"sleep", first:190, count:165, still:70, label:"趴下睡觉 · Take a nap", message:"猫咪向前伸展，收起腿，把下巴搁在爪上睡着了。"}
  ];
  const scenes = [...document.querySelectorAll(".cat-hit")].map(button => {
    const canvas = document.createElement("canvas");
    canvas.className = "cat-scene";
    canvas.width = tile.width;
    canvas.height = tile.height;
    canvas.hidden = true;
    canvas.setAttribute("aria-hidden", "true");
    button.before(canvas);
    return {button, canvas, desk:button.closest(".pixel-writer"), ctx:canvas.getContext("2d")};
  });
  if (!scenes.length || scenes.some(scene => !scene.ctx)) return;

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const announcement = document.querySelector(".cat-announcement");
  let atlas, loading, current, started, next = 0, pending = 0;
  let frame = 0, timer = 0, lastTile = -1;

  function show(index) {
    if (index === lastTile) return;
    const x = (index % tile.columns) * tile.width;
    const y = Math.floor(index / tile.columns) * tile.height;
    for (const {ctx} of scenes) {
      ctx.clearRect(0, 0, tile.width, tile.height);
      ctx.drawImage(atlas, x, y, tile.width, tile.height, 0, 0, tile.width, tile.height);
    }
    lastTile = index;
  }

  function labelNext() {
    const label = clips[(next + pending) % clips.length].label;
    for (const {button} of scenes) {
      button.title = label;
      button.setAttribute("aria-label", label);
    }
  }

  function clearPlayback() {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
  }

  function idle() {
    if (!atlas) return;
    show(0);
    for (const {desk} of scenes) delete desk.dataset.catPose;
    if (motion.matches || document.hidden) return;
    // Blink occasionally without running an animation loop between blinks.
    const blink = [1, 2, 3, 3, 2, 1, 0];
    function blinkStep(i) {
      show(blink[i]);
      if (i + 1 < blink.length) timer = setTimeout(() => blinkStep(i + 1), 38);
      else idle();
    }
    timer = setTimeout(() => blinkStep(0), 4600);
  }

  function finish() {
    current = null;
    if (pending) begin();
    else idle();
  }

  function advance(now) {
    const index = Math.max(0, Math.floor((now - started) * fps / 1000));
    if (index >= current.count) { finish(); return; }
    show(current.first + index);
    frame = requestAnimationFrame(advance);
  }

  function begin() {
    clearPlayback();
    pending--;
    current = clips[next];
    next = (next + 1) % clips.length;
    announcement.textContent = current.message;
    for (const {desk} of scenes) desk.dataset.catPose = current.name;
    labelNext();
    if (motion.matches) {
      show(current.first + current.still);
      timer = setTimeout(finish, 1450);
    } else {
      started = performance.now();
      advance(started);
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function prepare() {
    if (loading || atlas) return;
    loading = Promise.all([loadImage("./assets/cat-actions.webp"), loadImage("./assets/writing-stage.webp")])
      .then(([poses]) => {
        atlas = poses;
        show(0);
        for (const {desk, canvas} of scenes) {
          desk.dataset.catReady = "";
          canvas.hidden = false;
        }
        if (pending) begin();
        else idle();
      }).catch(() => {
        if (pending) announcement.textContent = "猫咪动画未加载，点一下可重试。";
        pending = 0;
        loading = null;
        labelNext();
      });
  }

  for (const {button} of scenes) button.addEventListener("click", () => {
    pending = Math.min(pending + 1, current ? clips.length - 1 : clips.length);
    labelNext();
    if (!atlas) prepare();
    else if (!current) begin();
  });

  function reset() {
    clearPlayback();
    current = null;
    pending = 0;
    labelNext();
    idle();
  }
  document.addEventListener("visibilitychange", reset);
  motion.addEventListener("change", reset);
  labelNext();
  prepare();
})();
