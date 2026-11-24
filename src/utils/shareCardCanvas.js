/**
 * Generates high-resolution PNG share cards (Instagram/FB Story 1080x1920 or Strava/FB Square 1080x1080)
 * using HTML5 Canvas — zero external dependencies, instant download & native mobile sharing.
 */

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let s = text;
  while (s.length > 3 && ctx.measureText(`${s}…`).width > maxWidth) {
    s = s.slice(0, -1);
  }
  return `${s}…`;
}

export async function renderPassportShareCard({
  runnerName,
  seasonLabel = "All-Time",
  passport,
  regionStats,
  trophyStats,
  format = "story" // "story" (1080x1920) | "square" (1080x1080) | "og" (1200x630)
}) {
  if (format === "og") {
    return renderOgLandscapeCard({
      runnerName,
      seasonLabel,
      passport,
      regionStats,
      trophyStats
    });
  }

  const isStory = format === "story";
  const W = 1080;
  const H = isStory ? 1920 : 1080;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // 1. Run NS Deep Navy -> Blue Gradient Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#040b17");
  bg.addColorStop(0.45, "#071d3d");
  bg.addColorStop(1, "#0370b9");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle decorative glow circles
  const glow1 = ctx.createRadialGradient(W * 0.85, H * 0.14, 10, W * 0.85, H * 0.14, 420);
  glow1.addColorStop(0, "rgba(254, 240, 0, 0.14)");
  glow1.addColorStop(1, "rgba(254, 240, 0, 0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W * 0.12, H * 0.86, 10, W * 0.12, H * 0.86, 460);
  glow2.addColorStop(0, "rgba(56, 189, 248, 0.2)");
  glow2.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // Subtle top accent bar
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, "#38bdf8");
  topBar.addColorStop(0.5, "#fef000");
  topBar.addColorStop(1, "#38bdf8");
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, W, 12);

  const padX = 72;
  let y = isStory ? 96 : 58;

  // 2. Eyebrow Pill
  const eyebrow = `NOVA SCOTIA RACE PASSPORT  •  ${seasonLabel.toUpperCase()}`;
  ctx.font = "700 22px Oswald, Arial, sans-serif";
  const eyeW = ctx.measureText(eyebrow).width + 44;
  drawRoundedRect(ctx, padX, y, eyeW, 44, 22);
  ctx.fillStyle = "rgba(254, 240, 0, 0.14)";
  ctx.fill();
  ctx.strokeStyle = "rgba(254, 240, 0, 0.45)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#fef000";
  ctx.textBaseline = "middle";
  ctx.fillText(eyebrow, padX + 22, y + 23);

  y += isStory ? 74 : 62;

  // 3. Runner Name + Progress Ring Row
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = isStory ? "700 72px Oswald, Arial, sans-serif" : "700 58px Oswald, Arial, sans-serif";
  const maxNameW = W - padX * 2 - 240;
  ctx.fillText(truncateText(ctx, runnerName.toUpperCase(), maxNameW), padX, y + (isStory ? 56 : 44));

  // Rank Badge under runner name
  const rankText = `${passport.rank.current.icon}  ${passport.rank.current.title.toUpperCase()}`;
  ctx.font = "700 26px Oswald, Arial, sans-serif";
  const rankW = ctx.measureText(rankText).width + 44;
  const rankY = y + (isStory ? 84 : 68);
  drawRoundedRect(ctx, padX, rankY, rankW, 50, 25);
  ctx.fillStyle = "rgba(254, 240, 0, 0.18)";
  ctx.fill();
  ctx.strokeStyle = "#fef000";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = "#fef000";
  ctx.textBaseline = "middle";
  ctx.fillText(rankText, padX + 22, rankY + 26);

  // Tier summary under rank
  const tierLine = `🥇 ${passport.tiers.gold} Gold   •   🥈 ${passport.tiers.silver} Silver   •   🥉 ${passport.tiers.bronze} Bronze`;
  ctx.font = "600 24px Jost, Arial, sans-serif";
  ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
  ctx.fillText(tierLine, padX, rankY + 84);

  // Circular Progress Ring on Right
  const ringR = isStory ? 96 : 84;
  const ringCx = W - padX - ringR;
  const ringCy = y + ringR - 6;

  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR + 12, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(4, 11, 23, 0.45)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = 14;
  ctx.stroke();

  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (Math.PI * 2 * Math.max(0, passport.percent)) / 100;
  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR, startAngle, endAngle);
  ctx.strokeStyle = "#fef000";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fef000";
  ctx.font = isStory ? "700 50px Oswald, Arial, sans-serif" : "700 44px Oswald, Arial, sans-serif";
  ctx.fillText(`${passport.caughtCount}/${passport.totalCount}`, ringCx, ringCy - 12);
  ctx.fillStyle = "#93c5fd";
  ctx.font = "700 24px Jost, Arial, sans-serif";
  ctx.fillText(`${passport.percent}%`, ringCx, ringCy + 34);
  ctx.textAlign = "left";

  // 4. Three KPI Cards (Medals, Regions, Trophies)
  y = rankY + (isStory ? 140 : 124);
  const kpiGap = 24;
  const kpiW = (W - padX * 2 - kpiGap * 2) / 3;
  const kpiH = isStory ? 148 : 118;

  const kpis = [
    {
      label: "MEDALS CAUGHT",
      val: `${passport.caughtCount} / ${passport.totalCount}`,
      sub: `${passport.percent}% of NS Passport`
    },
    {
      label: "REGIONS CAPTURED",
      val: `${regionStats.unlockedCount} / ${regionStats.totalRegions}`,
      sub: `${regionStats.percent}% of Nova Scotia`
    },
    {
      label: "TROPHIES EARNED",
      val: `${trophyStats.unlockedCount} / ${trophyStats.totalCount}`,
      sub: "Auto-unlocked"
    }
  ];

  kpis.forEach((k, idx) => {
    const kx = padX + idx * (kpiW + kpiGap);
    drawRoundedRect(ctx, kx, y, kpiW, kpiH, 22);
    ctx.fillStyle = "rgba(4, 11, 23, 0.48)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textBaseline = "top";
    ctx.fillStyle = "#93c5fd";
    ctx.font = "700 18px Oswald, Arial, sans-serif";
    ctx.fillText(k.label, kx + 24, y + (isStory ? 24 : 18));

    ctx.fillStyle = "#fef000";
    ctx.font = isStory ? "700 46px Oswald, Arial, sans-serif" : "700 38px Oswald, Arial, sans-serif";
    ctx.fillText(k.val, kx + 24, y + (isStory ? 52 : 42));

    ctx.fillStyle = "rgba(248, 250, 252, 0.72)";
    ctx.font = "500 18px Jost, Arial, sans-serif";
    ctx.fillText(k.sub, kx + 24, y + (isStory ? 108 : 88));
  });

  y += kpiH + (isStory ? 56 : 36);

  // 5. Earned Finisher Medals Showcase
  const caughtMedals = passport.entries
    .filter((e) => e.caught)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const maxMedals = isStory ? 8 : 4;
  const shownMedals = caughtMedals.slice(0, maxMedals);

  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 28px Oswald, Arial, sans-serif";
  ctx.fillText(
    caughtMedals.length
      ? `COLLECTED MEDALS (${caughtMedals.length})`
      : "START COLLECTING NOVA SCOTIA MEDALS",
    padX,
    y
  );
  y += 46;

  // Preload all shown medal logos in parallel
  const loadedLogos = await Promise.all(shownMedals.map((m) => loadImage(m.logo)));

  const cols = 4;
  const cardGap = 20;
  const cardW = (W - padX * 2 - cardGap * (cols - 1)) / cols;
  const cardH = isStory ? 270 : 238;

  shownMedals.forEach((m, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = padX + col * (cardW + cardGap);
    const cy = y + row * (cardH + cardGap);

    drawRoundedRect(ctx, cx, cy, cardW, cardH, 22);
    ctx.fillStyle = "rgba(4, 11, 23, 0.56)";
    ctx.fill();
    ctx.strokeStyle =
      m.tier === "gold"
        ? "rgba(254, 240, 0, 0.7)"
        : m.tier === "silver"
          ? "rgba(203, 213, 225, 0.65)"
          : "rgba(245, 158, 11, 0.55)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const midX = cx + cardW / 2;
    // Mini lanyard ribbon
    ctx.fillStyle = "#0370b9";
    ctx.beginPath();
    ctx.moveTo(midX - 28, cy + 16);
    ctx.lineTo(midX - 10, cy + 16);
    ctx.lineTo(midX, cy + 48);
    ctx.lineTo(midX - 12, cy + 48);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#02528a";
    ctx.beginPath();
    ctx.moveTo(midX + 28, cy + 16);
    ctx.lineTo(midX + 10, cy + 16);
    ctx.lineTo(midX, cy + 48);
    ctx.lineTo(midX + 12, cy + 48);
    ctx.closePath();
    ctx.fill();

    // Metallic coin rim
    const coinR = isStory ? 54 : 46;
    const coinY = cy + (isStory ? 96 : 86);
    const rimColor =
      m.tier === "gold" ? "#fef000" : m.tier === "silver" ? "#cbd5e1" : "#d97706";
    ctx.beginPath();
    ctx.arc(midX, coinY, coinR, 0, Math.PI * 2);
    ctx.fillStyle = rimColor;
    ctx.fill();

    // Inner white face + clipped logo
    const faceR = coinR - 6;
    ctx.save();
    ctx.beginPath();
    ctx.arc(midX, coinY, faceR, 0, Math.PI * 2);
    ctx.clip();
    const img = loadedLogos[i];
    if (img) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(midX - faceR, coinY - faceR, faceR * 2, faceR * 2);
      const scale = Math.min((faceR * 1.65) / img.width, (faceR * 1.65) / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, midX - dw / 2, coinY - dh / 2, dw, dh);
    } else {
      ctx.fillStyle = m.color || "#0370b9";
      ctx.fillRect(midX - faceR, coinY - faceR, faceR * 2, faceR * 2);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 32px Oswald, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(m.short, midX, coinY);
    }
    ctx.restore();

    // Race name & best time
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 20px Oswald, Arial, sans-serif";
    ctx.fillText(truncateText(ctx, m.name, cardW - 24), midX, coinY + coinR + 14);

    ctx.fillStyle = "#fef000";
    ctx.font = "700 24px Oswald, Arial, sans-serif";
    ctx.fillText(m.bestTime || "Finisher", midX, coinY + coinR + 44);

    ctx.fillStyle = "rgba(248, 250, 252, 0.65)";
    ctx.font = "600 15px Jost, Arial, sans-serif";
    const yearTxt = m.count > 1 ? `×${m.count}  •  ${m.years.join(" • ")}` : m.years.join(" • ");
    ctx.fillText(truncateText(ctx, yearTxt, cardW - 20), midX, coinY + coinR + 76);
    ctx.textAlign = "left";
  });

  if (isStory) {
    const medalRows = Math.max(1, Math.ceil(shownMedals.length / cols));
    y += medalRows * (cardH + cardGap) + 32;

    // 6. Story-only: Unlocked Regions & Trophies Highlights
    const unlockedRegions = regionStats.regions.filter((r) => r.unlocked);
    const unlockedTrophies = trophyStats.trophies.filter((t) => t.unlocked).slice(0, 6);

    if (unlockedRegions.length > 0) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 26px Oswald, Arial, sans-serif";
      ctx.fillText(`NOVA SCOTIA REGIONS CAPTURED (${unlockedRegions.length}/7)`, padX, y);
      y += 42;

      let px = padX;
      ctx.font = "600 22px Jost, Arial, sans-serif";
      for (const reg of unlockedRegions) {
        const label = `${reg.icon} ${reg.id}${reg.mastered ? " ★" : ""}`;
        const pw = ctx.measureText(label).width + 36;
        if (px + pw > W - padX) {
          px = padX;
          y += 58;
        }
        drawRoundedRect(ctx, px, y, pw, 46, 23);
        ctx.fillStyle = reg.mastered ? "rgba(254, 240, 0, 0.16)" : "rgba(3, 112, 185, 0.35)";
        ctx.fill();
        ctx.strokeStyle = reg.mastered ? "rgba(254, 240, 0, 0.55)" : "rgba(56, 189, 248, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = reg.mastered ? "#fef000" : "#f8fafc";
        ctx.textBaseline = "middle";
        ctx.fillText(label, px + 18, y + 24);
        px += pw + 14;
      }
      y += 82;
    }

    if (unlockedTrophies.length > 0) {
      ctx.textBaseline = "top";
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 26px Oswald, Arial, sans-serif";
      ctx.fillText(`UNLOCKED TROPHIES (${trophyStats.unlockedCount}/${trophyStats.totalCount})`, padX, y);
      y += 42;

      let px = padX;
      ctx.font = "600 21px Jost, Arial, sans-serif";
      for (const tr of unlockedTrophies) {
        const label = `${tr.icon} ${tr.title}`;
        const pw = ctx.measureText(label).width + 34;
        if (px + pw > W - padX) {
          px = padX;
          y += 56;
        }
        if (y > H - 180) break;
        drawRoundedRect(ctx, px, y, pw, 44, 22);
        ctx.fillStyle = "rgba(4, 11, 23, 0.55)";
        ctx.fill();
        ctx.strokeStyle = "rgba(254, 240, 0, 0.45)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#f8fafc";
        ctx.textBaseline = "middle";
        ctx.fillText(label, px + 17, y + 23);
        px += pw + 14;
      }
    }
  }

  // 7. Footer Watermark Bar
  const footY = H - (isStory ? 116 : 86);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padX, footY);
  ctx.lineTo(W - padX, footY);
  ctx.stroke();

  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fef000";
  ctx.font = "700 26px Oswald, Arial, sans-serif";
  ctx.fillText("NS-RUNNING-RESULTS.OPENSRC.MX", padX, footY + (isStory ? 54 : 42));

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(248, 250, 252, 0.72)";
  ctx.font = "600 20px Jost, Arial, sans-serif";
  ctx.fillText("Atlantic Chip • Route541", W - padX, footY + (isStory ? 54 : 42));
  ctx.textAlign = "left";

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
  return { dataUrl, blob };
}

/**
 * Renders a 1200x630 landscape Open Graph card tailored for Facebook / X / WhatsApp link previews.
 */
async function renderOgLandscapeCard({
  runnerName,
  seasonLabel,
  passport,
  regionStats,
  trophyStats
}) {
  const W = 1200;
  const H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#040b17");
  bg.addColorStop(0.5, "#071d3d");
  bg.addColorStop(1, "#0370b9");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.85, H * 0.2, 20, W * 0.85, H * 0.2, 420);
  glow.addColorStop(0, "rgba(254, 240, 0, 0.16)");
  glow.addColorStop(1, "rgba(254, 240, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Top accent bar
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, "#38bdf8");
  topBar.addColorStop(0.5, "#fef000");
  topBar.addColorStop(1, "#38bdf8");
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, W, 10);

  const padX = 56;

  // Eyebrow
  const eyebrow = `NOVA SCOTIA RACE PASSPORT  •  ${seasonLabel.toUpperCase()}`;
  ctx.font = "700 18px Oswald, Arial, sans-serif";
  const eyeW = ctx.measureText(eyebrow).width + 36;
  drawRoundedRect(ctx, padX, 42, eyeW, 36, 18);
  ctx.fillStyle = "rgba(254, 240, 0, 0.15)";
  ctx.fill();
  ctx.strokeStyle = "rgba(254, 240, 0, 0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#fef000";
  ctx.textBaseline = "middle";
  ctx.fillText(eyebrow, padX + 18, 61);

  // Runner Name
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 56px Oswald, Arial, sans-serif";
  ctx.fillText(truncateText(ctx, runnerName.toUpperCase(), 660), padX, 94);

  // Rank pill + tier line
  const rankText = `${passport.rank.current.icon}  ${passport.rank.current.title.toUpperCase()}`;
  ctx.font = "700 22px Oswald, Arial, sans-serif";
  const rankW = ctx.measureText(rankText).width + 36;
  drawRoundedRect(ctx, padX, 166, rankW, 42, 21);
  ctx.fillStyle = "rgba(254, 240, 0, 0.18)";
  ctx.fill();
  ctx.strokeStyle = "#fef000";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#fef000";
  ctx.textBaseline = "middle";
  ctx.fillText(rankText, padX + 18, 188);

  // 3 compact KPI pills on left
  const kpis = [
    { label: "MEDALS", val: `${passport.caughtCount}/${passport.totalCount}` },
    { label: "REGIONS", val: `${regionStats.unlockedCount}/${regionStats.totalRegions}` },
    { label: "TROPHIES", val: `${trophyStats.unlockedCount}/${trophyStats.totalCount}` }
  ];
  kpis.forEach((k, i) => {
    const kx = padX + i * 194;
    drawRoundedRect(ctx, kx, 234, 178, 86, 16);
    ctx.fillStyle = "rgba(4, 11, 23, 0.52)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textBaseline = "top";
    ctx.fillStyle = "#93c5fd";
    ctx.font = "700 14px Oswald, Arial, sans-serif";
    ctx.fillText(k.label, kx + 18, 248);
    ctx.fillStyle = "#fef000";
    ctx.font = "700 34px Oswald, Arial, sans-serif";
    ctx.fillText(k.val, kx + 18, 268);
  });

  // Top 5 caught medals row along bottom-left
  const caught = passport.entries
    .filter((e) => e.caught)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 5);
  const logos = await Promise.all(caught.map((m) => loadImage(m.logo)));

  caught.forEach((m, i) => {
    const mx = padX + i * 116 + 44;
    const my = 418;
    const r = 42;
    const rim = m.tier === "gold" ? "#fef000" : m.tier === "silver" ? "#cbd5e1" : "#d97706";
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI * 2);
    ctx.fillStyle = rim;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, r - 5, 0, Math.PI * 2);
    ctx.clip();
    const img = logos[i];
    if (img) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(mx - r, my - r, r * 2, r * 2);
      const scale = Math.min(((r - 5) * 1.65) / img.width, ((r - 5) * 1.65) / img.height);
      ctx.drawImage(img, mx - (img.width * scale) / 2, my - (img.height * scale) / 2, img.width * scale, img.height * scale);
    } else {
      ctx.fillStyle = m.color || "#0370b9";
      ctx.fillRect(mx - r, my - r, r * 2, r * 2);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 26px Oswald, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(m.short, mx, my);
    }
    ctx.restore();

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
    ctx.font = "600 13px Jost, Arial, sans-serif";
    ctx.fillText(truncateText(ctx, m.name, 102), mx, my + r + 8);
    ctx.textAlign = "left";
  });

  // Big Circular Progress Ring on Right
  const ringCx = W - 210;
  const ringCy = 266;
  const ringR = 132;

  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR + 18, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(4, 11, 23, 0.45)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = 18;
  ctx.stroke();

  const startA = -Math.PI / 2;
  const endA = startA + (Math.PI * 2 * Math.max(0, passport.percent)) / 100;
  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR, startA, endA);
  ctx.strokeStyle = "#fef000";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fef000";
  ctx.font = "700 68px Oswald, Arial, sans-serif";
  ctx.fillText(`${passport.caughtCount}/${passport.totalCount}`, ringCx, ringCy - 18);
  ctx.fillStyle = "#93c5fd";
  ctx.font = "700 30px Jost, Arial, sans-serif";
  ctx.fillText(`${passport.percent}% COLLECTED`, ringCx, ringCy + 42);
  ctx.textAlign = "left";

  // Footer
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padX, H - 72);
  ctx.lineTo(W - padX, H - 72);
  ctx.stroke();

  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fef000";
  ctx.font = "700 22px Oswald, Arial, sans-serif";
  ctx.fillText("NS-RUNNING-RESULTS.OPENSRC.MX", padX, H - 36);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(248, 250, 252, 0.72)";
  ctx.font = "600 18px Jost, Arial, sans-serif";
  ctx.fillText("Atlantic Chip • Route541", W - padX, H - 36);
  ctx.textAlign = "left";

  const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.9);
  const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.9));
  return { dataUrl: jpegDataUrl, blob, jpegBase64: jpegDataUrl };
}
