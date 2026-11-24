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
  selectedMedal = null,
  selectedTrophy = null,
  format = "story" // "story" (1080x1920) | "square" (1080x1080) | "fb" / "og" (1200x630)
}) {
  if (selectedTrophy) {
    return renderSingleTrophyCard({
      runnerName,
      seasonLabel,
      trophy: selectedTrophy,
      passport,
      trophyStats,
      format
    });
  }

  if (selectedMedal) {
    return renderSingleMedalCard({
      runnerName,
      seasonLabel,
      medal: selectedMedal,
      passport,
      format
    });
  }

  if (format === "og" || format === "fb" || format === "facebook") {
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
  ctx.font = isStory ? "700 28px Oswald, Arial, sans-serif" : "700 24px Oswald, Arial, sans-serif";
  const eyeW = ctx.measureText(eyebrow).width + (isStory ? 52 : 44);
  drawRoundedRect(ctx, padX, y, eyeW, isStory ? 52 : 44, isStory ? 26 : 22);
  ctx.fillStyle = "rgba(254, 240, 0, 0.14)";
  ctx.fill();
  ctx.strokeStyle = "rgba(254, 240, 0, 0.45)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#fef000";
  ctx.textBaseline = "middle";
  ctx.fillText(eyebrow, padX + (isStory ? 26 : 22), y + (isStory ? 26 : 22));

  y += isStory ? 84 : 64;

  // 3. Runner Name + Progress Ring Row
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = isStory ? "800 86px Oswald, Arial, sans-serif" : "800 68px Oswald, Arial, sans-serif";
  const maxNameW = W - padX * 2 - (isStory ? 270 : 230);
  ctx.fillText(truncateText(ctx, runnerName.toUpperCase(), maxNameW), padX, y + (isStory ? 68 : 50));

  // Rank Badge under runner name
  const rankText = `${passport.rank.current.icon}  ${passport.rank.current.title.toUpperCase()}`;
  ctx.font = isStory ? "700 32px Oswald, Arial, sans-serif" : "700 26px Oswald, Arial, sans-serif";
  const rankW = ctx.measureText(rankText).width + (isStory ? 50 : 44);
  const rankY = y + (isStory ? 104 : 76);
  drawRoundedRect(ctx, padX, rankY, rankW, isStory ? 56 : 48, isStory ? 28 : 24);
  ctx.fillStyle = "rgba(254, 240, 0, 0.18)";
  ctx.fill();
  ctx.strokeStyle = "#fef000";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = "#fef000";
  ctx.textBaseline = "middle";
  ctx.fillText(rankText, padX + (isStory ? 25 : 22), rankY + (isStory ? 28 : 24));

  // Tier summary under rank
  const tierLine = `🥇 ${passport.tiers.gold} Gold   •   🥈 ${passport.tiers.silver} Silver   •   🥉 ${passport.tiers.bronze} Bronze`;
  ctx.font = isStory ? "700 28px Jost, Arial, sans-serif" : "600 24px Jost, Arial, sans-serif";
  ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
  ctx.fillText(tierLine, padX, rankY + (isStory ? 94 : 80));

  // Circular Progress Ring on Right
  const ringR = isStory ? 108 : 88;
  const ringCx = W - padX - ringR;
  const ringCy = y + ringR - (isStory ? 10 : 6);

  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR + 14, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(4, 11, 23, 0.45)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = isStory ? 16 : 14;
  ctx.stroke();

  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (Math.PI * 2 * Math.max(0, passport.percent)) / 100;
  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR, startAngle, endAngle);
  ctx.strokeStyle = "#fef000";
  ctx.lineWidth = isStory ? 16 : 14;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fef000";
  ctx.font = isStory ? "800 60px Oswald, Arial, sans-serif" : "700 48px Oswald, Arial, sans-serif";
  ctx.fillText(`${passport.caughtCount}/${passport.totalCount}`, ringCx, ringCy - (isStory ? 16 : 12));
  ctx.fillStyle = "#93c5fd";
  ctx.font = isStory ? "700 30px Jost, Arial, sans-serif" : "700 24px Jost, Arial, sans-serif";
  ctx.fillText(`${passport.percent}%`, ringCx, ringCy + (isStory ? 38 : 32));
  ctx.textAlign = "left";

  // 4. Three KPI Cards (Medals, Regions, Trophies)
  y = rankY + (isStory ? 154 : 124);
  const kpiGap = 24;
  const kpiW = (W - padX * 2 - kpiGap * 2) / 3;
  const kpiH = isStory ? 160 : 120;

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
    ctx.font = isStory ? "700 22px Oswald, Arial, sans-serif" : "700 18px Oswald, Arial, sans-serif";
    ctx.fillText(k.label, kx + 22, y + (isStory ? 22 : 18));

    ctx.fillStyle = "#fef000";
    ctx.font = isStory ? "800 52px Oswald, Arial, sans-serif" : "700 42px Oswald, Arial, sans-serif";
    ctx.fillText(k.val, kx + 22, y + (isStory ? 52 : 44));

    ctx.fillStyle = "rgba(248, 250, 252, 0.78)";
    ctx.font = isStory ? "600 21px Jost, Arial, sans-serif" : "500 18px Jost, Arial, sans-serif";
    ctx.fillText(k.sub, kx + 22, y + (isStory ? 116 : 90));
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
  ctx.font = isStory ? "800 36px Oswald, Arial, sans-serif" : "700 30px Oswald, Arial, sans-serif";
  ctx.fillText(
    caughtMedals.length
      ? `COLLECTED MEDALS (${caughtMedals.length})`
      : "START COLLECTING NOVA SCOTIA MEDALS",
    padX,
    y
  );
  y += isStory ? 54 : 46;

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
    ctx.font = isStory ? "700 22px Oswald, Arial, sans-serif" : "700 20px Oswald, Arial, sans-serif";
    ctx.fillText(truncateText(ctx, m.name, cardW - 24), midX, coinY + coinR + 14);

    ctx.fillStyle = "#fef000";
    ctx.font = isStory ? "700 28px Oswald, Arial, sans-serif" : "700 24px Oswald, Arial, sans-serif";
    ctx.fillText(m.bestTime || "Finisher", midX, coinY + coinR + (isStory ? 46 : 42));

    ctx.fillStyle = "rgba(248, 250, 252, 0.75)";
    ctx.font = isStory ? "600 17px Jost, Arial, sans-serif" : "600 15px Jost, Arial, sans-serif";
    const yearTxt = m.count > 1 ? `×${m.count}  •  ${m.years.join(" • ")}` : m.years.join(" • ");
    ctx.fillText(truncateText(ctx, yearTxt, cardW - 20), midX, coinY + coinR + (isStory ? 80 : 74));
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
      ctx.font = "800 34px Oswald, Arial, sans-serif";
      ctx.fillText(`NOVA SCOTIA REGIONS CAPTURED (${unlockedRegions.length}/7)`, padX, y);
      y += 48;

      let px = padX;
      ctx.font = "700 24px Jost, Arial, sans-serif";
      for (const reg of unlockedRegions) {
        const label = `${reg.icon} ${reg.id}${reg.mastered ? " ★" : ""}`;
        const pw = ctx.measureText(label).width + 40;
        if (px + pw > W - padX) {
          px = padX;
          y += 62;
        }
        drawRoundedRect(ctx, px, y, pw, 50, 25);
        ctx.fillStyle = reg.mastered ? "rgba(254, 240, 0, 0.16)" : "rgba(3, 112, 185, 0.35)";
        ctx.fill();
        ctx.strokeStyle = reg.mastered ? "rgba(254, 240, 0, 0.55)" : "rgba(56, 189, 248, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = reg.mastered ? "#fef000" : "#f8fafc";
        ctx.textBaseline = "middle";
        ctx.fillText(label, px + 20, y + 26);
        px += pw + 16;
      }
      y += 88;
    }

    if (unlockedTrophies.length > 0) {
      ctx.textBaseline = "top";
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 34px Oswald, Arial, sans-serif";
      ctx.fillText(`UNLOCKED TROPHIES (${trophyStats.unlockedCount}/${trophyStats.totalCount})`, padX, y);
      y += 48;

      let px = padX;
      ctx.font = "700 23px Jost, Arial, sans-serif";
      for (const tr of unlockedTrophies) {
        const label = `${tr.icon} ${tr.title}`;
        const pw = ctx.measureText(label).width + 40;
        if (px + pw > W - padX) {
          px = padX;
          y += 60;
        }
        if (y > H - 180) break;
        drawRoundedRect(ctx, px, y, pw, 48, 24);
        ctx.fillStyle = "rgba(4, 11, 23, 0.55)";
        ctx.fill();
        ctx.strokeStyle = "rgba(254, 240, 0, 0.45)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#f8fafc";
        ctx.textBaseline = "middle";
        ctx.fillText(label, px + 20, y + 25);
        px += pw + 16;
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
  ctx.font = isStory ? "800 32px Oswald, Arial, sans-serif" : "700 26px Oswald, Arial, sans-serif";
  ctx.fillText("NS-RUNNING-RESULTS.OPENSRC.MX", padX, footY + (isStory ? 54 : 42));

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(248, 250, 252, 0.78)";
  ctx.font = isStory ? "600 24px Jost, Arial, sans-serif" : "600 20px Jost, Arial, sans-serif";
  ctx.fillText("Atlantic Chip • Route541", W - padX, footY + (isStory ? 54 : 42));
  ctx.textAlign = "left";

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
  return { dataUrl, blob };
}

/**
 * Renders a 1200x630 broadcast-grade landscape Open Graph card tailored for Facebook / X / WhatsApp link previews.
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

  // 1. Rich Run NS Deep Navy -> Ocean Blue Gradient Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#040b17");
  bg.addColorStop(0.55, "#072047");
  bg.addColorStop(1, "#0370b9");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Atmospheric athletic glows
  const glow1 = ctx.createRadialGradient(W * 0.84, H * 0.28, 10, W * 0.84, H * 0.28, 360);
  glow1.addColorStop(0, "rgba(254, 240, 0, 0.16)");
  glow1.addColorStop(1, "rgba(254, 240, 0, 0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W * 0.18, H * 0.85, 10, W * 0.18, H * 0.85, 420);
  glow2.addColorStop(0, "rgba(56, 189, 248, 0.18)");
  glow2.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // Subtle diagonal athletic speed stripes
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(640 + i * 90, 0);
    ctx.lineTo(685 + i * 90, 0);
    ctx.lineTo(545 + i * 90, H);
    ctx.lineTo(500 + i * 90, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Top kinetic accent bar
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, "#38bdf8");
  topBar.addColorStop(0.5, "#fef000");
  topBar.addColorStop(1, "#38bdf8");
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, W, 8);

  const padX = 52;

  // 2. Top-Left Identity Block
  const eyebrow = `NOVA SCOTIA RACE PASSPORT  •  ${seasonLabel.toUpperCase()}`;
  ctx.font = "700 18px Oswald, Arial, sans-serif";
  const eyeW = ctx.measureText(eyebrow).width + 36;
  drawRoundedRect(ctx, padX, 30, eyeW, 36, 18);
  ctx.fillStyle = "rgba(254, 240, 0, 0.14)";
  ctx.fill();
  ctx.strokeStyle = "rgba(254, 240, 0, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#fef000";
  ctx.textBaseline = "middle";
  ctx.fillText(eyebrow, padX + 18, 48);

  // Runner Name
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 78px Oswald, Arial, sans-serif";
  ctx.fillText(truncateText(ctx, runnerName.toUpperCase(), 760), padX, 72);

  // 3 Balanced KPI Cards spanning full left column (756px total)
  const unlockedRegNames = regionStats.regions
    .filter((r) => r.unlocked)
    .map((r) => r.id)
    .slice(0, 2)
    .join(", ");
  const kpis = [
    {
      label: "MEDALS CAUGHT",
      val: `${passport.caughtCount} / ${passport.totalCount}`,
      sub: `${passport.percent}% of NS Passport`
    },
    {
      label: "REGIONS CAPTURED",
      val: `${regionStats.unlockedCount} / ${regionStats.totalRegions}`,
      sub: unlockedRegNames || "Explore Nova Scotia"
    },
    {
      label: "TROPHIES EARNED",
      val: `${trophyStats.unlockedCount} / ${trophyStats.totalCount}`,
      sub: `${passport.tiers.gold}G • ${passport.tiers.silver}S • ${passport.tiers.bronze}B`
    }
  ];

  const kpiW = 244;
  const kpiGap = 16;
  kpis.forEach((k, i) => {
    const kx = padX + i * (kpiW + kpiGap);
    const ky = 164;
    drawRoundedRect(ctx, kx, ky, kpiW, 118, 16);
    ctx.fillStyle = "rgba(4, 11, 23, 0.56)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textBaseline = "top";
    ctx.fillStyle = "#93c5fd";
    ctx.font = "700 17px Oswald, Arial, sans-serif";
    ctx.fillText(k.label, kx + 18, ky + 14);

    ctx.fillStyle = "#fef000";
    ctx.font = "700 44px Oswald, Arial, sans-serif";
    ctx.fillText(k.val, kx + 18, ky + 36);

    ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
    ctx.font = "600 16px Jost, Arial, sans-serif";
    ctx.fillText(truncateText(ctx, k.sub, kpiW - 32), kx + 18, ky + 88);
  });

  // 3. Top-Right Circular Progress Ring + Rank Title Directly Underneath
  const ringCx = W - 188;
  const ringCy = 138;
  const ringR = 88;

  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR + 14, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(4, 11, 23, 0.48)";
  ctx.fill();
  ctx.strokeStyle = "rgba(254, 240, 0, 0.2)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.lineWidth = 14;
  ctx.stroke();

  const startA = -Math.PI / 2;
  const endA = startA + (Math.PI * 2 * Math.max(0, passport.percent)) / 100;
  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR, startA, endA);
  ctx.strokeStyle = "#fef000";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fef000";
  ctx.font = "700 54px Oswald, Arial, sans-serif";
  ctx.fillText(`${passport.caughtCount}/${passport.totalCount}`, ringCx, ringCy - 12);
  ctx.fillStyle = "#93c5fd";
  ctx.font = "700 26px Jost, Arial, sans-serif";
  ctx.fillText(`${passport.percent}%`, ringCx, ringCy + 32);

  // Rank Badge centered right below the ring
  const rankText = `${passport.rank.current.icon}  ${passport.rank.current.title.toUpperCase()}`;
  ctx.font = "700 22px Oswald, Arial, sans-serif";
  const rankW = Math.min(310, ctx.measureText(rankText).width + 36);
  const rankX = ringCx - rankW / 2;
  const rankY = 246;
  drawRoundedRect(ctx, rankX, rankY, rankW, 42, 21);
  ctx.fillStyle = "rgba(254, 240, 0, 0.18)";
  ctx.fill();
  ctx.strokeStyle = "#fef000";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#fef000";
  ctx.textBaseline = "middle";
  ctx.fillText(truncateText(ctx, rankText, rankW - 20), ringCx, rankY + 22);
  ctx.textAlign = "left";

  // 4. Full-Width Collected Finisher Medals Showcase Panel
  const panelX = padX;
  const panelY = 304;
  const panelW = W - padX * 2;
  const panelH = 250;

  drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 20);
  ctx.fillStyle = "rgba(4, 11, 23, 0.56)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const caught = passport.entries
    .filter((e) => e.caught)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const shown = caught.slice(0, 5);
  const logos = await Promise.all(shown.map((m) => loadImage(m.logo)));

  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 24px Oswald, Arial, sans-serif";
  ctx.fillText(
    caught.length
      ? `COLLECTED FINISHER MEDALS (${caught.length} OF ${passport.totalCount})`
      : "START COLLECTING NOVA SCOTIA MEDALS",
    panelX + 22,
    panelY + 16
  );

  // Right-aligned extra count or tier hint
  ctx.textAlign = "right";
  ctx.fillStyle = "#93c5fd";
  ctx.font = "700 18px Jost, Arial, sans-serif";
  const rightHint =
    caught.length > 5
      ? `+${caught.length - 5} more medals on Passport`
      : `🥇 ${passport.tiers.gold} Gold   🥈 ${passport.tiers.silver} Silver   🥉 ${passport.tiers.bronze} Bronze`;
  ctx.fillText(rightHint, panelX + panelW - 22, panelY + 18);
  ctx.textAlign = "left";

  if (shown.length > 0) {
    const slotW = (panelW - 44) / shown.length;
    shown.forEach((m, i) => {
      const midX = panelX + 22 + slotW * i + slotW / 2;
      const topY = panelY + 50;

      // V-shaped Run NS lanyard ribbon
      ctx.fillStyle = "#0370b9";
      ctx.beginPath();
      ctx.moveTo(midX - 26, topY);
      ctx.lineTo(midX - 10, topY);
      ctx.lineTo(midX, topY + 30);
      ctx.lineTo(midX - 11, topY + 30);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#02528a";
      ctx.beginPath();
      ctx.moveTo(midX + 26, topY);
      ctx.lineTo(midX + 10, topY);
      ctx.lineTo(midX, topY + 30);
      ctx.lineTo(midX + 11, topY + 30);
      ctx.closePath();
      ctx.fill();

      // Kinetic yellow ribbon stripes
      ctx.fillStyle = "#fef000";
      ctx.beginPath();
      ctx.moveTo(midX - 19, topY);
      ctx.lineTo(midX - 16, topY);
      ctx.lineTo(midX - 5, topY + 30);
      ctx.lineTo(midX - 8, topY + 30);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(midX + 19, topY);
      ctx.lineTo(midX + 16, topY);
      ctx.lineTo(midX + 5, topY + 30);
      ctx.lineTo(midX + 8, topY + 30);
      ctx.closePath();
      ctx.fill();

      // Metallic bevelled coin rim
      const coinY = topY + 68;
      const coinR = 44;
      const rimGrad = ctx.createLinearGradient(midX - coinR, coinY - coinR, midX + coinR, coinY + coinR);
      if (m.tier === "gold") {
        rimGrad.addColorStop(0, "#fef9c3");
        rimGrad.addColorStop(0.5, "#fef000");
        rimGrad.addColorStop(1, "#a16207");
      } else if (m.tier === "silver") {
        rimGrad.addColorStop(0, "#ffffff");
        rimGrad.addColorStop(0.5, "#cbd5e1");
        rimGrad.addColorStop(1, "#64748b");
      } else {
        rimGrad.addColorStop(0, "#fde68a");
        rimGrad.addColorStop(0.5, "#d97706");
        rimGrad.addColorStop(1, "#78350f");
      }

      ctx.beginPath();
      ctx.arc(midX, coinY, coinR, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();

      // Inner white medallion face + logo
      const faceR = coinR - 6;
      ctx.save();
      ctx.beginPath();
      ctx.arc(midX, coinY, faceR, 0, Math.PI * 2);
      ctx.clip();
      const img = logos[i];
      if (img) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(midX - faceR, coinY - faceR, faceR * 2, faceR * 2);
        const scale = Math.min((faceR * 1.65) / img.width, (faceR * 1.65) / img.height);
        ctx.drawImage(
          img,
          midX - (img.width * scale) / 2,
          coinY - (img.height * scale) / 2,
          img.width * scale,
          img.height * scale
        );
      } else {
        ctx.fillStyle = m.color || "#0370b9";
        ctx.fillRect(midX - faceR, coinY - faceR, faceR * 2, faceR * 2);
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 26px Oswald, Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(m.short, midX, coinY);
      }
      ctx.restore();

      // Race Name + Best Time underneath
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 20px Oswald, Arial, sans-serif";
      ctx.fillText(truncateText(ctx, m.name, slotW - 14), midX, coinY + coinR + 10);

      ctx.fillStyle = "#fef000";
      ctx.font = "700 24px Oswald, Arial, sans-serif";
      ctx.fillText(m.bestTime || "Finisher", midX, coinY + coinR + 32);
      ctx.textAlign = "left";
    });
  }

  // 5. Crisp Footer Bar
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fef000";
  ctx.font = "700 22px Oswald, Arial, sans-serif";
  ctx.fillText("NS-RUNNING-RESULTS.OPENSRC.MX", padX, H - 34);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(248, 250, 252, 0.78)";
  ctx.font = "600 18px Jost, Arial, sans-serif";
  ctx.fillText("Official Results • Atlantic Chip & Route541", W - padX, H - 34);
  ctx.textAlign = "left";

  const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.92));
  return { dataUrl: jpegDataUrl, blob, jpegBase64: jpegDataUrl };
}

/**
 * Renders an official single finisher medal share card (Facebook 1200x630, Story 1080x1920, or Square 1080x1080)
 */
async function renderSingleMedalCard({
  runnerName,
  seasonLabel,
  medal,
  passport,
  format = "fb"
}) {
  const isFb = format === "fb" || format === "og" || format === "facebook";
  const isStory = format === "story";
  const W = isFb ? 1200 : 1080;
  const H = isFb ? 630 : isStory ? 1920 : 1080;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Run NS Deep Navy -> Ocean Blue gradient background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#040b17");
  bg.addColorStop(0.55, "#072047");
  bg.addColorStop(1, "#0370b9");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Atmospheric athletic glows
  const glow1 = ctx.createRadialGradient(W * 0.8, H * 0.25, 10, W * 0.8, H * 0.25, 360);
  glow1.addColorStop(0, "rgba(254, 240, 0, 0.16)");
  glow1.addColorStop(1, "rgba(254, 240, 0, 0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W * 0.2, H * 0.85, 10, W * 0.2, H * 0.85, 420);
  glow2.addColorStop(0, "rgba(56, 189, 248, 0.2)");
  glow2.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // Top kinetic accent bar
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, "#38bdf8");
  topBar.addColorStop(0.5, "#fef000");
  topBar.addColorStop(1, "#38bdf8");
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, W, isFb ? 8 : 12);

  const padX = isFb ? 52 : 72;

  // Eyebrow
  const eyebrow = `NOVA SCOTIA RACE PASSPORT  •  OFFICIAL FINISHER MEDAL`;
  ctx.font = isFb ? "700 20px Oswald, Arial, sans-serif" : isStory ? "700 28px Oswald, Arial, sans-serif" : "700 24px Oswald, Arial, sans-serif";
  const eyeW = ctx.measureText(eyebrow).width + (isFb ? 36 : 44);
  const eyeY = isFb ? 30 : isStory ? 90 : 56;
  drawRoundedRect(ctx, padX, eyeY, eyeW, isFb ? 36 : 44, isFb ? 18 : 22);
  ctx.fillStyle = "rgba(254, 240, 0, 0.14)";
  ctx.fill();
  ctx.strokeStyle = "rgba(254, 240, 0, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#fef000";
  ctx.textBaseline = "middle";
  ctx.fillText(eyebrow, padX + (isFb ? 18 : 22), eyeY + (isFb ? 18 : 22));

  // Runner Name
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffffff";
  ctx.font = isFb ? "800 74px Oswald, Arial, sans-serif" : isStory ? "800 88px Oswald, Arial, sans-serif" : "800 70px Oswald, Arial, sans-serif";
  ctx.fillText(truncateText(ctx, runnerName.toUpperCase(), W - padX * 2), padX, eyeY + (isFb ? 44 : 56));

  // Medal Coin position & size
  const coinR = isFb ? 148 : isStory ? 240 : 200;
  const coinCx = isFb ? padX + coinR + 10 : W / 2;
  const coinCy = isFb ? 350 : isStory ? 580 : 420;

  // Metallic coin rim colors based on medal tier
  const tier = medal.tier || (medal.count >= 3 ? "gold" : medal.count === 2 ? "silver" : "bronze");
  const rimG = ctx.createLinearGradient(coinCx - coinR, coinCy - coinR, coinCx + coinR, coinCy + coinR);
  if (tier === "gold") {
    rimG.addColorStop(0, "#ffe066");
    rimG.addColorStop(0.5, "#d99b00");
    rimG.addColorStop(1, "#fff2a3");
  } else if (tier === "silver") {
    rimG.addColorStop(0, "#f1f5f9");
    rimG.addColorStop(0.5, "#94a3b8");
    rimG.addColorStop(1, "#e2e8f0");
  } else {
    rimG.addColorStop(0, "#fca5a5");
    rimG.addColorStop(0.5, "#b45309");
    rimG.addColorStop(1, "#d97706");
  }

  // Outer glow around medal coin
  ctx.save();
  ctx.shadowColor = tier === "gold" ? "rgba(254, 240, 0, 0.4)" : "rgba(56, 189, 248, 0.35)";
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(coinCx, coinCy, coinR, 0, Math.PI * 2);
  ctx.fillStyle = rimG;
  ctx.fill();
  ctx.restore();

  // Inner coin face
  const faceR = coinR - (isFb ? 16 : 24);
  ctx.save();
  ctx.beginPath();
  ctx.arc(coinCx, coinCy, faceR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(coinCx - faceR, coinCy - faceR, faceR * 2, faceR * 2);

  const img = await loadImage(medal.logo);
  if (img) {
    const scale = Math.min((faceR * 1.7) / img.width, (faceR * 1.7) / img.height);
    ctx.drawImage(
      img,
      coinCx - (img.width * scale) / 2,
      coinCy - (img.height * scale) / 2,
      img.width * scale,
      img.height * scale
    );
  } else {
    ctx.fillStyle = medal.color || "#0370b9";
    ctx.fillRect(coinCx - faceR, coinCy - faceR, faceR * 2, faceR * 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${isFb ? 48 : 64}px Oswald, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(medal.short || "NS", coinCx, coinCy);
  }
  ctx.restore();

  // Shiny highlight overlay on coin rim
  ctx.beginPath();
  ctx.arc(coinCx, coinCy, coinR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Content positioning
  if (isFb) {
    // Landscape layout: details to the right of the coin
    const rx = coinCx + coinR + 36;
    const rw = W - padX - rx;

    // Medal Name
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 52px Oswald, Arial, sans-serif";
    ctx.fillText(truncateText(ctx, medal.name.toUpperCase(), rw), rx, 156);

    // Tier badge pill
    const tierLabel =
      tier === "gold"
        ? `🥇 GOLD LOYALIST  •  ${medal.count || 3}× FINISHES`
        : tier === "silver"
          ? `🥈 SILVER LOYALIST  •  ${medal.count || 2}× FINISHES`
          : "🥉 OFFICIAL FINISHER MEDAL";
    ctx.font = "700 18px Oswald, Arial, sans-serif";
    const tierPillW = ctx.measureText(tierLabel).width + 34;
    drawRoundedRect(ctx, rx, 220, tierPillW, 36, 18);
    ctx.fillStyle = tier === "gold" ? "rgba(254, 240, 0, 0.18)" : "rgba(255, 255, 255, 0.12)";
    ctx.fill();
    ctx.strokeStyle = tier === "gold" ? "#fef000" : "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = tier === "gold" ? "#fef000" : "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(tierLabel, rx + 17, 238);

    // 2 stat boxes side by side
    const boxW = Math.floor((rw - 16) / 2);
    // Box 1: Best Time
    drawRoundedRect(ctx, rx, 268, boxW, 122, 16);
    ctx.fillStyle = "rgba(4, 11, 23, 0.58)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.stroke();
    ctx.fillStyle = "#93c5fd";
    ctx.font = "700 17px Oswald, Arial, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("OFFICIAL BEST TIME", rx + 18, 284);
    ctx.fillStyle = "#fef000";
    ctx.font = "700 48px Oswald, Arial, sans-serif";
    ctx.fillText(medal.bestTime || "Finisher", rx + 18, 306);
    ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
    ctx.font = "600 16px Jost, Arial, sans-serif";
    const yearsText = medal.years && medal.years.length ? `Years: ${medal.years.join(", ")}` : "Recorded in Results";
    ctx.fillText(truncateText(ctx, yearsText, boxW - 32), rx + 18, 360);

    // Box 2: Location & Region
    const bx2 = rx + boxW + 16;
    drawRoundedRect(ctx, bx2, 268, boxW, 122, 16);
    ctx.fillStyle = "rgba(4, 11, 23, 0.58)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.stroke();
    ctx.fillStyle = "#93c5fd";
    ctx.font = "700 17px Oswald, Arial, sans-serif";
    ctx.fillText("RACE LOCATION & REGION", bx2 + 18, 284);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 30px Oswald, Arial, sans-serif";
    ctx.fillText(truncateText(ctx, medal.location || "Nova Scotia", boxW - 32), bx2 + 18, 310);
    ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
    ctx.font = "600 16px Jost, Arial, sans-serif";
    ctx.fillText(medal.region || "Nova Scotia", bx2 + 18, 360);

    // Overall passport summary strip
    drawRoundedRect(ctx, rx, 404, rw, 58, 14);
    ctx.fillStyle = "rgba(4, 11, 23, 0.52)";
    ctx.fill();
    ctx.strokeStyle = "rgba(254, 240, 0, 0.3)";
    ctx.stroke();
    ctx.fillStyle = "#fef000";
    ctx.font = "700 20px Oswald, Arial, sans-serif";
    ctx.textBaseline = "middle";
    const passSummary = `PASSPORT: ${passport.caughtCount}/${passport.totalCount} MEDALS (${passport.percent}%) • ${passport.rank?.current?.title?.toUpperCase() || "EXPLORER"}`;
    ctx.fillText(passSummary, rx + 18, 433);
  } else {
    // Vertical / Square layout: details below coin
    let dy = coinCy + coinR + 32;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${isStory ? 64 : 44}px Oswald, Arial, sans-serif`;
    ctx.fillText(truncateText(ctx, medal.name.toUpperCase(), W - padX * 2), W / 2, dy);
    dy += isStory ? 70 : 48;

    ctx.fillStyle = "#fef000";
    ctx.font = `800 ${isStory ? 68 : 46}px Oswald, Arial, sans-serif`;
    ctx.fillText(`Best Time: ${medal.bestTime || "Finisher"}`, W / 2, dy);
    dy += isStory ? 74 : 52;

    ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
    ctx.font = `600 ${isStory ? 32 : 22}px Jost, Arial, sans-serif`;
    ctx.fillText(`${medal.location} • ${medal.region}`, W / 2, dy);
    dy += isStory ? 52 : 38;

    const tierStr =
      tier === "gold"
        ? `🥇 Gold Loyalist (${medal.count} finishes)`
        : tier === "silver"
          ? `🥈 Silver Loyalist (${medal.count} finishes)`
          : "🥉 Official Finisher";
    ctx.fillStyle = "#93c5fd";
    ctx.font = `700 ${isStory ? 32 : 24}px Oswald, Arial, sans-serif`;
    ctx.fillText(tierStr, W / 2, dy);

    if (isStory) {
      dy += 68;
      const boxW = W - padX * 2;
      drawRoundedRect(ctx, padX, dy, boxW, 80, 20);
      ctx.fillStyle = "rgba(4, 11, 23, 0.55)";
      ctx.fill();
      ctx.strokeStyle = "rgba(254, 240, 0, 0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#fef000";
      ctx.font = "700 28px Oswald, Arial, sans-serif";
      ctx.textBaseline = "middle";
      const passSummary = `PASSPORT: ${passport.caughtCount}/${passport.totalCount} MEDALS (${passport.percent}%) • ${passport.rank?.current?.title?.toUpperCase() || "RUNNER"}`;
      ctx.fillText(passSummary, W / 2, dy + 40);
    }
    ctx.textAlign = "left";
  }

  // Footer bar
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fef000";
  ctx.font = isFb ? "700 22px Oswald, Arial, sans-serif" : isStory ? "800 30px Oswald, Arial, sans-serif" : "700 26px Oswald, Arial, sans-serif";
  ctx.fillText("NS-RUNNING-RESULTS.OPENSRC.MX", padX, H - 34);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(248, 250, 252, 0.78)";
  ctx.font = isFb ? "600 18px Jost, Arial, sans-serif" : isStory ? "600 22px Jost, Arial, sans-serif" : "600 20px Jost, Arial, sans-serif";
  ctx.fillText("Official Results • Atlantic Chip & Route541", W - padX, H - 34);
  ctx.textAlign = "left";

  const mime = isFb ? "image/jpeg" : "image/png";
  const dataUrl = canvas.toDataURL(mime, 0.92);
  const blob = await new Promise((res) => canvas.toBlob(res, mime, 0.92));
  return { dataUrl, blob, jpegBase64: dataUrl };
}

/**
 * Render single achievement trophy card (1200x630 fb landscape, 9:16 story, or 1:1 square).
 */
async function renderSingleTrophyCard({
  runnerName,
  seasonLabel,
  trophy,
  passport,
  trophyStats,
  format = "fb"
}) {
  const isFb = format === "fb" || format === "og" || format === "facebook";
  const isStory = format === "story";
  const W = isFb ? 1200 : 1080;
  const H = isFb ? 630 : isStory ? 1920 : 1080;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Run NS Deep Navy -> Ocean Blue gradient background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#040b17");
  bg.addColorStop(0.55, "#072047");
  bg.addColorStop(1, "#0370b9");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Atmospheric athletic glows
  const glow1 = ctx.createRadialGradient(W * 0.8, H * 0.25, 10, W * 0.8, H * 0.25, 380);
  glow1.addColorStop(0, "rgba(254, 240, 0, 0.18)");
  glow1.addColorStop(1, "rgba(254, 240, 0, 0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W * 0.2, H * 0.85, 10, W * 0.2, H * 0.85, 420);
  glow2.addColorStop(0, "rgba(56, 189, 248, 0.22)");
  glow2.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // Top kinetic accent bar
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, "#38bdf8");
  topBar.addColorStop(0.5, "#fef000");
  topBar.addColorStop(1, "#38bdf8");
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, W, isFb ? 8 : 12);

  const padX = isFb ? 56 : 72;

  // Eyebrow
  const eyebrow = `NOVA SCOTIA RACE PASSPORT  •  ACHIEVEMENT TROPHY`;
  ctx.font = isFb ? "700 20px Oswald, Arial, sans-serif" : isStory ? "700 28px Oswald, Arial, sans-serif" : "700 24px Oswald, Arial, sans-serif";
  const eyeW = ctx.measureText(eyebrow).width + (isFb ? 36 : 48);
  const eyeY = isFb ? 30 : isStory ? 90 : 56;
  drawRoundedRect(ctx, padX, eyeY, eyeW, isFb ? 36 : 50, isFb ? 18 : 25);
  ctx.fillStyle = "rgba(254, 240, 0, 0.14)";
  ctx.fill();
  ctx.strokeStyle = "rgba(254, 240, 0, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#fef000";
  ctx.textBaseline = "middle";
  ctx.fillText(eyebrow, padX + (isFb ? 18 : 24), eyeY + (isFb ? 18 : 25));

  if (isFb) {
    // Landscape Layout
    // Left side: Large Trophy Disc
    const discX = padX + 160;
    const discY = 320;
    const discR = 125;

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(discX, discY, discR + 14, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(254, 240, 0, 0.16)";
    ctx.fill();

    // Disc background
    ctx.beginPath();
    ctx.arc(discX, discY, discR, 0, Math.PI * 2);
    const discGrad = ctx.createLinearGradient(discX - discR, discY - discR, discX + discR, discY + discR);
    discGrad.addColorStop(0, "#1e293b");
    discGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = discGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(254, 240, 0, 0.75)";
    ctx.lineWidth = 5;
    ctx.stroke();

    // Trophy emoji icon
    ctx.font = "96px Apple Color Emoji, Segoe UI Emoji, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(trophy.icon || "🏆", discX, discY + 4);

    // Pill below disc
    const pillY = discY + discR + 18;
    drawRoundedRect(ctx, discX - 105, pillY, 210, 34, 17);
    ctx.fillStyle = "rgba(56, 189, 248, 0.18)";
    ctx.fill();
    ctx.strokeStyle = "rgba(56, 189, 258, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#38bdf8";
    ctx.font = "700 15px Oswald, Arial, sans-serif";
    ctx.fillText("UNLOCKED TROPHY", discX, pillY + 17);

    // Right Side: Trophy Details
    const rx = discX + discR + 56;
    const rw = W - padX - rx;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Runner Name Callout
    ctx.fillStyle = "#38bdf8";
    ctx.font = "700 24px Oswald, Arial, sans-serif";
    ctx.fillText(`${runnerName.toUpperCase()} EARNED`, rx, 130);

    // Trophy Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 56px Oswald, Arial, sans-serif";
    ctx.fillText(truncateText(ctx, trophy.title.toUpperCase(), rw), rx, 168);

    // Label: ACHIEVEMENT REQUIREMENT
    ctx.fillStyle = "#fef000";
    ctx.font = "700 16px Oswald, Arial, sans-serif";
    ctx.fillText("ACHIEVEMENT REQUIREMENT", rx, 238);

    // Description
    ctx.fillStyle = "rgba(248, 250, 252, 0.95)";
    ctx.font = "500 24px Jost, Arial, sans-serif";
    ctx.fillText(truncateText(ctx, trophy.desc, rw), rx, 268);

    // Progress Box / Milestone
    const boxW = Math.min(rw, 720);
    const boxH = 68;
    drawRoundedRect(ctx, rx, 318, boxW, boxH, 14);
    ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
    ctx.fill();
    ctx.strokeStyle = "rgba(254, 240, 0, 0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "700 21px Oswald, Arial, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(`✓ Milestone: ${trophy.progress}`, rx + 24, 318 + boxH / 2);

    // Runner Summary Banner
    const rankTitle = passport?.rank?.current?.title || "Nova Scotia Runner";
    const medalsCount = passport?.caughtCount ?? 0;
    const trophiesCount = trophyStats?.unlockedCount ?? 1;

    ctx.fillStyle = "rgba(148, 163, 184, 0.95)";
    ctx.font = "600 20px Jost, Arial, sans-serif";
    ctx.fillText(
      `Rank: ${rankTitle}  •  ${medalsCount} NS Medals Caught  •  ${trophiesCount} Trophies Unlocked`,
      rx,
      418
    );
  } else {
    // Portrait (Story) or Square Layout
    let cy = isStory ? 250 : 150;
    const discR = isStory ? 140 : 105;

    // Runner eyebrow
    ctx.textAlign = "center";
    ctx.fillStyle = "#38bdf8";
    ctx.font = `800 ${isStory ? 40 : 28}px Oswald, Arial, sans-serif`;
    ctx.fillText(`${runnerName.toUpperCase()}`, W / 2, cy);
    cy += isStory ? 52 : 36;

    // Disc
    const discCenterY = cy + discR;
    ctx.beginPath();
    ctx.arc(W / 2, discCenterY, discR + 16, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(254, 240, 0, 0.16)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(W / 2, discCenterY, discR, 0, Math.PI * 2);
    const discGrad = ctx.createLinearGradient(W / 2 - discR, discCenterY - discR, W / 2 + discR, discCenterY + discR);
    discGrad.addColorStop(0, "#1e293b");
    discGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = discGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(254, 240, 0, 0.75)";
    ctx.lineWidth = 4.5;
    ctx.stroke();

    // Emoji icon
    ctx.font = `${isStory ? 124 : 92}px Apple Color Emoji, Segoe UI Emoji, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(trophy.icon || "🏆", W / 2, discCenterY + 4);

    cy = discCenterY + discR + (isStory ? 36 : 24);

    // Pill below disc
    const pillW = isStory ? 280 : 220;
    const pillH = isStory ? 46 : 34;
    drawRoundedRect(ctx, W / 2 - pillW / 2, cy, pillW, pillH, pillH / 2);
    ctx.fillStyle = "rgba(56, 189, 248, 0.18)";
    ctx.fill();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#38bdf8";
    ctx.font = `700 ${isStory ? 22 : 16}px Oswald, Arial, sans-serif`;
    ctx.fillText("UNLOCKED TROPHY", W / 2, cy + pillH / 2);

    cy += pillH + (isStory ? 60 : 38);

    // Trophy Title
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${isStory ? 76 : 52}px Oswald, Arial, sans-serif`;
    ctx.fillText(trophy.title.toUpperCase(), W / 2, cy);
    cy += isStory ? 58 : 40;

    // Achievement Label
    ctx.fillStyle = "#fef000";
    ctx.font = `700 ${isStory ? 22 : 16}px Oswald, Arial, sans-serif`;
    ctx.fillText("ACHIEVEMENT REQUIREMENT", W / 2, cy);
    cy += isStory ? 36 : 24;

    // Description
    ctx.fillStyle = "rgba(248, 250, 252, 0.95)";
    ctx.font = `500 ${isStory ? 34 : 24}px Jost, Arial, sans-serif`;
    ctx.fillText(trophy.desc, W / 2, cy);
    cy += isStory ? 72 : 48;

    // Milestone / Progress Box
    const boxW = Math.min(W - 120, 800);
    const boxH = isStory ? 88 : 64;
    drawRoundedRect(ctx, W / 2 - boxW / 2, cy, boxW, boxH, 16);
    ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
    ctx.fill();
    ctx.strokeStyle = "rgba(254, 240, 0, 0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = `700 ${isStory ? 30 : 22}px Oswald, Arial, sans-serif`;
    ctx.fillText(`✓ Milestone: ${trophy.progress}`, W / 2, cy + boxH / 2);
    cy += boxH + (isStory ? 72 : 44);

    // Runner stats card
    const rankTitle = passport?.rank?.current?.title || "Nova Scotia Runner";
    const medalsCount = passport?.caughtCount ?? 0;
    const trophiesCount = trophyStats?.unlockedCount ?? 1;

    ctx.fillStyle = "rgba(148, 163, 184, 0.95)";
    ctx.font = `600 ${isStory ? 28 : 20}px Jost, Arial, sans-serif`;
    ctx.fillText(
      `${rankTitle}  •  ${medalsCount} Medals Caught  •  ${trophiesCount} Trophies`,
      W / 2,
      cy
    );
  }

  // Footer bar
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fef000";
  ctx.font = isFb ? "700 22px Oswald, Arial, sans-serif" : isStory ? "800 30px Oswald, Arial, sans-serif" : "700 26px Oswald, Arial, sans-serif";
  ctx.fillText("NS-RUNNING-RESULTS.OPENSRC.MX", padX, H - 34);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(248, 250, 252, 0.78)";
  ctx.font = isFb ? "600 18px Jost, Arial, sans-serif" : isStory ? "600 22px Jost, Arial, sans-serif" : "600 20px Jost, Arial, sans-serif";
  ctx.fillText("app.opensrc.mx • Open-Source Athletic Ecosystem", W - padX, H - 34);
  ctx.textAlign = "left";
  ctx.textAlign = "left";

  const mime = isFb ? "image/jpeg" : "image/png";
  const dataUrl = canvas.toDataURL(mime, 0.92);
  const blob = await new Promise((res) => canvas.toBlob(res, mime, 0.92));
  return { dataUrl, blob, jpegBase64: dataUrl };
}
