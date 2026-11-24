import React, { useEffect, useMemo, useState } from "react";
import { Award, Check, Download, ExternalLink, Facebook, Globe, Instagram, Link2, Loader2, Share2, Trophy } from "lucide-react";
import InfoModal from "./InfoModal.jsx";
import { renderPassportShareCard } from "../utils/shareCardCanvas";

function StravaIcon({ size = 14, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.925 15.632h4.172z" />
    </svg>
  );
}

function resolveInitialId(item) {
  if (!item) return "all";
  if (item.towns && item.id) return `region:${item.id}`;
  if (item.id === "regions:all") return "regions:all";
  if (item.title && item.id && item.id !== "shelf") return `trophy:${item.id}`;
  if (item.id === "shelf") return "all";
  return item.id || "all";
}

export default function SharePassportModal({
  open,
  onClose,
  runnerName,
  seasonFilter,
  passport,
  regionStats,
  trophyStats,
  initialMedal = null
}) {
  const [format, setFormat] = useState("fb"); // "fb" | "story" | "square"

  const caughtMedals = useMemo(
    () => (passport?.entries ? passport.entries.filter((e) => e.caught) : []),
    [passport?.entries]
  );

  const unlockedTrophies = useMemo(
    () => (trophyStats?.trophies ? trophyStats.trophies.filter((t) => t.unlocked) : []),
    [trophyStats?.trophies]
  );

  const [selectedMedalId, setSelectedMedalId] = useState(() => resolveInitialId(initialMedal));

  const [previewUrl, setPreviewUrl] = useState("");
  const [blob, setBlob] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [ogSynced, setOgSynced] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");

  const seasonLabel = seasonFilter === "all" ? "All-Time" : `${seasonFilter} Season`;

  useEffect(() => {
    if (open) {
      setSelectedMedalId(resolveInitialId(initialMedal));
    }
  }, [open, initialMedal]);

  const isRegion = selectedMedalId.startsWith("region:") || selectedMedalId === "regions:all";
  const isTrophy = selectedMedalId.startsWith("trophy:");

  const activeRegion = useMemo(() => {
    if (!isRegion) return null;
    if (selectedMedalId === "regions:all") {
      return { id: "all", title: "All 7 Nova Scotia Regions", icon: "🗺️", towns: "Across Nova Scotia" };
    }
    const rId = selectedMedalId.replace(/^region:/, "");
    return regionStats?.regions?.find((r) => r.id === rId) || null;
  }, [isRegion, selectedMedalId, regionStats?.regions]);

  const activeTrophy = useMemo(() => {
    if (!isTrophy) return null;
    const tId = selectedMedalId.replace(/^trophy:/, "");
    return unlockedTrophies.find((t) => t.id === tId) || null;
  }, [isTrophy, selectedMedalId, unlockedTrophies]);

  const activeMedal = useMemo(() => {
    if (selectedMedalId === "all" || isTrophy || isRegion) return null;
    return caughtMedals.find((m) => m.id === selectedMedalId) || null;
  }, [selectedMedalId, isTrophy, isRegion, caughtMedals]);

  const shareOrigin = useMemo(() => {
    if (typeof window === "undefined") return "https://ns-running-results.opensrc.mx";
    const origin = window.location.origin;
    return origin.includes("localhost") || origin.includes("127.0.0.1")
      ? "https://ns-running-results.opensrc.mx"
      : origin;
  }, []);

  const passportUrl = useMemo(() => {
    const params = new URLSearchParams({ name: runnerName, tab: "passport" });
    if (activeRegion) {
      params.set("region", activeRegion.id);
    } else if (activeTrophy) {
      params.set("trophy", activeTrophy.id);
    } else if (activeMedal) {
      params.set("medal", activeMedal.id);
    }
    return `${shareOrigin}/?${params.toString()}`;
  }, [shareOrigin, runnerName, activeRegion, activeTrophy, activeMedal]);

  const fbPassportUrl = useMemo(() => {
    const url = new URL(passportUrl);
    url.searchParams.set("utm_source", "facebook");
    url.searchParams.set("utm_medium", "social");
    url.searchParams.set("utm_campaign", "passport_share");
    if (activeRegion) {
      url.searchParams.set("utm_content", `region_${activeRegion.id.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`);
    } else if (activeTrophy) {
      url.searchParams.set("utm_content", `trophy_${activeTrophy.id}`);
    } else if (activeMedal) {
      url.searchParams.set("utm_content", `medal_${activeMedal.id}`);
    } else {
      url.searchParams.set("utm_content", "medal_wall");
    }
    return url.toString();
  }, [passportUrl, activeRegion, activeTrophy, activeMedal]);

  const opensrcPromoUrl = "https://app.opensrc.mx/?utm_source=facebook&utm_medium=social&utm_campaign=passport_share";

  const shareSummary = useMemo(() => {
    if (activeRegion) {
      if (activeRegion.id === "all") {
        return `${runnerName} has captured ${regionStats.unlockedCount} of 7 Nova Scotia Running Regions (${regionStats.percent}%) on Nova Scotia Race Passport! Explore at app.opensrc.mx`;
      }
      const mastery = activeRegion.mastered ? "★ Mastered" : "Captured";
      return `${runnerName} captured the ${activeRegion.id} Region (${mastery} • ${activeRegion.raceCount} ${activeRegion.raceCount === 1 ? "finish" : "finishes"} • ${activeRegion.caughtMedals}/${activeRegion.totalMedals} Medals) on Nova Scotia Race Passport! Explore at app.opensrc.mx`;
    }
    if (activeTrophy) {
      return `${runnerName} unlocked the "${activeTrophy.title}" Achievement Trophy! 🏆 Achievement: ${activeTrophy.desc} • Milestone: ${activeTrophy.progress} • Nova Scotia Race Passport — app.opensrc.mx`;
    }
    if (activeMedal) {
      const tierName =
        activeMedal.tier === "gold"
          ? "Gold Loyalist (3+ finishes)"
          : activeMedal.tier === "silver"
            ? "Silver Loyalist (2 finishes)"
            : "Official Finisher";
      return `${runnerName} earned the ${activeMedal.name} Finisher Medal (${activeMedal.bestTime}) • ${tierName} on Nova Scotia Race Passport! View results at app.opensrc.mx`;
    }
    return `${passport.caughtCount}/${passport.totalCount} NS Race Medals (${passport.percent}%) • ${regionStats.unlockedCount}/7 Regions • ${trophyStats.unlockedCount}/${trophyStats.totalCount} Trophies • ${passport.rank.current.title} — app.opensrc.mx`;
  }, [activeRegion, activeTrophy, activeMedal, runnerName, passport, regionStats, trophyStats]);

  // Silently generate & upload this runner's 1200x630 personalized OG preview card (medal, trophy, or passport)
  useEffect(() => {
    if (!open || !runnerName) return;
    let cancelled = false;
    setOgSynced(false);
    renderPassportShareCard({
      runnerName,
      seasonLabel,
      passport,
      regionStats,
      trophyStats,
      selectedMedal: activeMedal,
      selectedTrophy: activeTrophy,
      selectedRegion: activeRegion,
      format: "og"
    })
      .then((res) => {
        if (cancelled || !res?.jpegBase64) return;
        return fetch("/api/ns-share-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: runnerName,
            summary: shareSummary,
            imageBase64: res.jpegBase64
          })
        });
      })
      .then((r) => {
        if (!cancelled && r && r.ok) setOgSynced(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, runnerName, seasonLabel, passport, regionStats, trophyStats, activeMedal, activeTrophy, activeRegion, shareSummary]);

  // Render selected card format (fb landscape 1200x630, 9:16 story, or 1:1 square)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setRendering(true);
    renderPassportShareCard({
      runnerName,
      seasonLabel,
      passport,
      regionStats,
      trophyStats,
      selectedMedal: activeMedal,
      selectedTrophy: activeTrophy,
      selectedRegion: activeRegion,
      format
    })
      .then((res) => {
        if (cancelled) return;
        setPreviewUrl(res.dataUrl);
        setBlob(res.blob);
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, format, activeMedal, activeTrophy, activeRegion, runnerName, seasonLabel, passport, regionStats, trophyStats]);

  function handleDownload() {
    if (!previewUrl) return;
    const slug = runnerName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const itemSlug = activeRegion
      ? `region-${activeRegion.id}`
      : activeTrophy
        ? `trophy-${activeTrophy.id}`
        : activeMedal
          ? `medal-${activeMedal.id}`
          : "full-passport";
    const ext = format === "fb" ? "jpg" : "png";
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `ns-race-${itemSlug}-${slug || "runner"}-${format}.${ext}`;
    a.click();
  }

  async function handleNativeShare() {
    if (!blob || !navigator.share) return;
    try {
      const slug = runnerName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const itemSlug = activeRegion
        ? `region-${activeRegion.id}`
        : activeTrophy
          ? `trophy-${activeTrophy.id}`
          : activeMedal
            ? activeMedal.id
            : "passport-wall";
      const ext = format === "fb" ? "jpg" : "png";
      const file = new File([blob], `ns-race-${itemSlug}-${slug || "runner"}-${format}.${ext}`, {
        type: format === "fb" ? "image/jpeg" : "image/png"
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: activeRegion
            ? `${runnerName}'s ${activeRegion.id === "all" ? "Nova Scotia 7 Regions" : `${activeRegion.id} Region`} Capture`
            : activeTrophy
              ? `${runnerName}'s ${activeTrophy.title} Trophy`
              : activeMedal
                ? `${runnerName}'s ${activeMedal.name} Medal`
                : `${runnerName}'s Nova Scotia Race Passport`,
          text: shareSummary,
          files: [file]
        });
      } else {
        await navigator.share({
          title: activeRegion
            ? `${runnerName}'s ${activeRegion.id === "all" ? "Nova Scotia 7 Regions" : `${activeRegion.id} Region`} Capture`
            : activeTrophy
              ? `${runnerName}'s ${activeTrophy.title} Trophy`
              : activeMedal
                ? `${runnerName}'s ${activeMedal.name} Medal`
                : `${runnerName}'s Nova Scotia Race Passport`,
          text: shareSummary,
          url: fbPassportUrl
        });
      }
    } catch (_) {
      // User dismissed share sheet
    }
  }

  function handleCopy(key, text) {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  }

  const fbShareQuote = `${shareSummary} • Explore Nova Scotia Race Passport at https://app.opensrc.mx/`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fbPassportUrl)}&quote=${encodeURIComponent(fbShareQuote)}`;
  const canNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  return (
    <InfoModal
      open={open}
      title={
        activeRegion
          ? `Share ${activeRegion.id === "all" ? "Nova Scotia 7 Regions" : `${activeRegion.id} Region`}`
          : activeTrophy
            ? `Share ${activeTrophy.title} Trophy`
            : activeMedal
              ? `Share ${activeMedal.name} Finisher Medal`
              : "Share Your NS Race Passport"
      }
      icon={activeTrophy ? <Trophy size={18} /> : <Share2 size={18} />}
      onClose={onClose}
    >
      <div className="share-image-panel">
        {/* Item Selection Filter: Medal Wall, Finisher Medals, Regions, or Achievement Trophies */}
        {(caughtMedals.length > 0 || unlockedTrophies.length > 0 || regionStats?.unlockedCount > 0) && (
          <div className="share-target-bar">
            <span className="share-target-label">
              <Award size={14} />
              <span>Target to Share:</span>
            </span>
            <select
              className="share-target-select"
              value={selectedMedalId}
              onChange={(e) => setSelectedMedalId(e.target.value)}
              aria-label="Select medal or wall to share"
            >
              <option value="all">
                🏆 Full Medal Wall ({passport.caughtCount} of {passport.totalCount} Caught)
              </option>

              {caughtMedals.length > 0 && (
                <optgroup label="Your Finisher Medals">
                  {caughtMedals.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.tier === "gold" ? "🥇" : m.tier === "silver" ? "🥈" : "🥉"} {m.name} ({m.bestTime})
                    </option>
                  ))}
                </optgroup>
              )}

              {regionStats?.regions && regionStats.regions.some((r) => r.unlocked) && (
                <optgroup label="📍 Captured Nova Scotia Regions">
                  <option value="regions:all">
                    🗺️ All 7 NS Regions ({regionStats.unlockedCount}/7 Captured)
                  </option>
                  {regionStats.regions
                    .filter((r) => r.unlocked)
                    .map((r) => (
                      <option key={`region:${r.id}`} value={`region:${r.id}`}>
                        {r.icon} {r.id} ({r.mastered ? "★ Mastered" : "Captured"} • {r.raceCount} {r.raceCount === 1 ? "finish" : "finishes"})
                      </option>
                    ))}
                </optgroup>
              )}

              {unlockedTrophies.length > 0 && (
                <optgroup label="🏆 Your Achievement Trophies">
                  {unlockedTrophies.map((t) => (
                    <option key={`trophy:${t.id}`} value={`trophy:${t.id}`}>
                      {t.icon} {t.title}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        )}

        {/* Dedicated Regional Highlight Box */}
        {activeRegion && (
          <div className="share-trophy-highlight-box" role="region" aria-label="Region capture details">
            <div className="share-trophy-highlight-head">
              <span className="share-trophy-highlight-icon" aria-hidden="true">{activeRegion.icon || "📍"}</span>
              <div className="share-trophy-highlight-meta">
                <span className="share-trophy-highlight-badge">
                  {activeRegion.id === "all" ? "Nova Scotia Province" : activeRegion.mastered ? "★ Mastered Region" : "Captured Region"}
                </span>
                <h4 className="share-trophy-highlight-title">
                  {activeRegion.id === "all" ? "Capture Nova Scotia — 7 Regions" : `${activeRegion.id} Region`}
                </h4>
              </div>
            </div>
            <p className="share-trophy-highlight-desc">
              <strong>Towns:</strong> {activeRegion.towns || "Across Nova Scotia"}
            </p>
            <div className="share-trophy-highlight-milestone">
              <Check size={13} />
              <span>
                {activeRegion.id === "all"
                  ? `${regionStats.unlockedCount} of 7 regions captured (${regionStats.percent}% of Nova Scotia)`
                  : `${activeRegion.raceCount} ${activeRegion.raceCount === 1 ? "finish" : "finishes"} • ${activeRegion.caughtMedals}/${activeRegion.totalMedals} medals caught`}
              </span>
            </div>
          </div>
        )}

        {/* Dedicated Achievement Trophy Description Box */}
        {activeTrophy && (
          <div className="share-trophy-highlight-box" role="region" aria-label="Trophy achievement details">
            <div className="share-trophy-highlight-head">
              <span className="share-trophy-highlight-icon" aria-hidden="true">{activeTrophy.icon}</span>
              <div className="share-trophy-highlight-meta">
                <span className="share-trophy-highlight-badge">Official Achievement</span>
                <h4 className="share-trophy-highlight-title">{activeTrophy.title}</h4>
              </div>
            </div>
            <p className="share-trophy-highlight-desc">
              <strong>Requirement:</strong> {activeTrophy.desc}
            </p>
            <div className="share-trophy-highlight-milestone">
              <Check size={13} />
              <span>{activeTrophy.progress}</span>
            </div>
          </div>
        )}

        {/* Format Selector: Facebook Preview, Story, Square */}
        <div className="share-format-row">
          <button
            type="button"
            className={`share-fmt-btn ${format === "fb" ? "active" : ""}`}
            onClick={() => setFormat("fb")}
          >
            📘 Facebook (1.91:1 Post Preview)
          </button>
          <button
            type="button"
            className={`share-fmt-btn ${format === "story" ? "active" : ""}`}
            onClick={() => setFormat("story")}
          >
            📱 Story (9:16 IG / Stories)
          </button>
          <button
            type="button"
            className={`share-fmt-btn ${format === "square" ? "active" : ""}`}
            onClick={() => setFormat("square")}
          >
            🟦 Square (1:1 Strava / Feed)
          </button>
        </div>

        {/* Live Preview Frame */}
        <div className={`share-preview-frame ${format}`}>
          {rendering || !previewUrl ? (
            <div className="share-preview-loading" role="status" aria-live="polite">
              <Loader2 size={32} className="share-spin" />
              <span>
                {selectedMedalId === "all"
                  ? `Generating Full Medal Wall ${format === "fb" ? "post card" : format === "story" ? "story" : "square"}...`
                  : activeTrophy
                    ? `Generating ${activeTrophy.title} trophy card...`
                    : `Generating ${activeMedal ? activeMedal.name : "finisher"} medal card...`}
              </span>
            </div>
          ) : (
            <img
              src={previewUrl}
              alt={`${runnerName} ${activeTrophy ? activeTrophy.title : activeMedal ? activeMedal.name : "Race Passport"} share card`}
            />
          )}
        </div>

        {/* Realistic Facebook Post / Link Preview Metadata Mockup */}
        {format === "fb" && (
          <div className="share-fb-card-meta">
            <div className="fb-meta-domain">NS-RUNNING-RESULTS.OPENSRC.MX</div>
            <div className="fb-meta-title">
              {activeTrophy
                ? `${runnerName}'s ${activeTrophy.title} Trophy — Nova Scotia Race Passport`
                : activeMedal
                  ? `${runnerName}'s ${activeMedal.name} Medal — Nova Scotia Race Passport`
                  : `${runnerName}'s Nova Scotia Race Passport`}
            </div>
            <div className="fb-meta-desc">{shareSummary}</div>
          </div>
        )}

        {/* Action Buttons: Share to Facebook, Download, Native Share */}
        <div className="share-actions-row">
          <a
            className="share-fb-btn"
            href={fbShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on Facebook"
          >
            <Facebook size={16} />
            <span>Share on Facebook</span>
          </a>

          <button
            type="button"
            className="share-primary-btn"
            onClick={handleDownload}
            disabled={!previewUrl || rendering}
            title="Download for Strava or Instagram"
            aria-label="Download for Strava / Instagram"
          >
            {rendering ? (
              <>
                <Loader2 size={16} className="share-spin" />
                <span>Generating Card...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span className="share-btn-inline-icons" aria-hidden="true">
                  <StravaIcon size={14} />
                  <Instagram size={14} />
                </span>
                <span>Download for Strava / Instagram</span>
              </>
            )}
          </button>

          {canNativeShare && (
            <button
              type="button"
              className="share-secondary-btn"
              onClick={handleNativeShare}
              disabled={!blob || rendering}
            >
              <Share2 size={15} />
              <span>Share</span>
            </button>
          )}
        </div>

        {/* Direct Link Section */}
        <div className="share-link-section">
          <div className="share-link-header">
            <span className="share-link-label">
              {activeRegion
                ? `Direct Link to ${activeRegion.id === "all" ? "7 Regions" : `${activeRegion.id} Region`}`
                : activeTrophy
                  ? `Direct Link to ${activeTrophy.title} Trophy`
                  : activeMedal
                    ? `Direct Link to ${activeMedal.name} Medal`
                    : "Direct Passport Link"}
            </span>
            {ogSynced && (
              <span className="share-sync-badge">
                <Check size={12} /> FB Preview Synced
              </span>
            )}
          </div>
          <div className="share-code-box">
            <code>{fbPassportUrl}</code>
            <button
              type="button"
              className="share-copy-btn"
              onClick={() => handleCopy("url", fbPassportUrl)}
              aria-label="Copy direct passport link"
            >
              {copiedKey === "url" ? <Check size={14} /> : <Link2 size={14} />}
              <span>{copiedKey === "url" ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>
        </div>

        {/* OpenSrc Ecosystem Banner */}
        <div className="share-opensrc-banner-row">
          <span className="share-opensrc-tagline">
            Powered by <strong>app.opensrc.mx</strong> • Open-Source Nova Scotia Running Ecosystem
          </span>
          <a
            href="https://app.opensrc.mx/?utm_source=facebook&utm_medium=social&utm_campaign=passport_share"
            target="_blank"
            rel="noopener noreferrer"
            className="share-opensrc-pill-link"
            title="Visit app.opensrc.mx"
          >
            <Globe size={13} className="share-opensrc-icon" />
            <span>app.opensrc.mx</span>
            <ExternalLink size={12} />
          </a>
        </div>

        <p className="im-footnote">
          Share directly to <strong>Facebook</strong>, download for your <strong>Instagram Story</strong>, or upload as a{" "}
          <strong>Strava activity photo</strong>. Powered by{" "}
          <a href="https://app.opensrc.mx/" target="_blank" rel="noopener noreferrer">
            app.opensrc.mx
          </a>.
        </p>
      </div>
    </InfoModal>
  );
}
