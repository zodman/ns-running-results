import React, { useEffect, useMemo, useState } from "react";
import { Award, Check, Download, Facebook, Link2, Share2 } from "lucide-react";
import InfoModal from "./InfoModal.jsx";
import { renderPassportShareCard } from "../utils/shareCardCanvas";

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
  const [selectedMedalId, setSelectedMedalId] = useState(initialMedal?.id || "all");
  const [previewUrl, setPreviewUrl] = useState("");
  const [blob, setBlob] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [ogSynced, setOgSynced] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");

  const seasonLabel = seasonFilter === "all" ? "All-Time" : `${seasonFilter} Season`;

  const caughtMedals = useMemo(
    () => (passport?.entries ? passport.entries.filter((e) => e.caught) : []),
    [passport?.entries]
  );

  useEffect(() => {
    if (open) {
      setSelectedMedalId(initialMedal?.id || "all");
    }
  }, [open, initialMedal]);

  const activeMedal = useMemo(() => {
    if (selectedMedalId === "all") return null;
    return caughtMedals.find((m) => m.id === selectedMedalId) || null;
  }, [selectedMedalId, caughtMedals]);

  const shareOrigin = useMemo(() => {
    if (typeof window === "undefined") return "https://ns-running-results.opensrc.mx";
    const origin = window.location.origin;
    return origin.includes("localhost") || origin.includes("127.0.0.1")
      ? "https://ns-running-results.opensrc.mx"
      : origin;
  }, []);

  const passportUrl = useMemo(() => {
    const params = new URLSearchParams({ name: runnerName, tab: "passport" });
    if (activeMedal) {
      params.set("medal", activeMedal.id);
    }
    return `${shareOrigin}/?${params.toString()}`;
  }, [shareOrigin, runnerName, activeMedal]);

  const shareSummary = useMemo(() => {
    if (activeMedal) {
      const tierName =
        activeMedal.tier === "gold"
          ? "Gold Loyalist (3+ finishes)"
          : activeMedal.tier === "silver"
            ? "Silver Loyalist (2 finishes)"
            : "Finisher";
      return `${runnerName} earned the ${activeMedal.name} Finisher Medal (${activeMedal.bestTime}) • ${tierName} on Nova Scotia Race Passport!`;
    }
    return `${passport.caughtCount}/${passport.totalCount} NS Race Medals (${passport.percent}%) • ${regionStats.unlockedCount}/7 Regions • ${trophyStats.unlockedCount}/${trophyStats.totalCount} Trophies • ${passport.rank.current.title}`;
  }, [activeMedal, runnerName, passport, regionStats, trophyStats]);

  // Silently generate & upload this runner's 1200x630 personalized OG preview card when modal opens
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
      format: "og"
    })
      .then((res) => {
        if (cancelled || !res?.jpegBase64) return;
        return fetch("/api/ns-share-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: runnerName,
            summary: `${passport.caughtCount}/${passport.totalCount} NS Race Medals (${passport.percent}%) • ${regionStats.unlockedCount}/7 Regions • ${trophyStats.unlockedCount}/${trophyStats.totalCount} Trophies • ${passport.rank.current.title}`,
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
  }, [open, runnerName, seasonLabel, passport, regionStats, trophyStats]);

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
  }, [open, format, activeMedal, runnerName, seasonLabel, passport, regionStats, trophyStats]);

  function handleDownload() {
    if (!previewUrl) return;
    const slug = runnerName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const medalSlug = activeMedal ? activeMedal.id : "passport-wall";
    const ext = format === "fb" ? "jpg" : "png";
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `ns-race-${medalSlug}-${slug || "runner"}-${format}.${ext}`;
    a.click();
  }

  async function handleNativeShare() {
    if (!blob || !navigator.share) return;
    try {
      const slug = runnerName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const medalSlug = activeMedal ? activeMedal.id : "passport-wall";
      const ext = format === "fb" ? "jpg" : "png";
      const file = new File([blob], `ns-race-${medalSlug}-${slug || "runner"}-${format}.${ext}`, {
        type: format === "fb" ? "image/jpeg" : "image/png"
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: activeMedal
            ? `${runnerName}'s ${activeMedal.name} Medal`
            : `${runnerName}'s Nova Scotia Race Passport`,
          text: shareSummary,
          files: [file]
        });
      } else {
        await navigator.share({
          title: activeMedal
            ? `${runnerName}'s ${activeMedal.name} Medal`
            : `${runnerName}'s Nova Scotia Race Passport`,
          text: shareSummary,
          url: passportUrl
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

  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(passportUrl)}`;
  const canNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  return (
    <InfoModal
      open={open}
      title="Share Your NS Race Passport & Medals"
      icon={<Share2 size={18} />}
      onClose={onClose}
    >
      <div className="share-image-panel">
        {/* Medal Selection Filter: Share All Medals or Single Caught Medal */}
        {caughtMedals.length > 0 && (
          <div className="share-target-bar">
            <span className="share-target-label">
              <Award size={14} />
              <span>What would you like to share?</span>
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
              <optgroup label="Individual Caught Medals">
                {caughtMedals.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.tier === "gold" ? "🥇" : m.tier === "silver" ? "🥈" : "🥉"} {m.name} ({m.bestTime})
                  </option>
                ))}
              </optgroup>
            </select>
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
            <div className="share-preview-loading">
              Generating your {format === "fb" ? "Facebook share card" : "medal card"}...
            </div>
          ) : (
            <img
              src={previewUrl}
              alt={`${runnerName} ${activeMedal ? activeMedal.name : "Race Passport"} share card`}
            />
          )}
        </div>

        {/* Realistic Facebook Post / Link Preview Metadata Mockup */}
        {format === "fb" && (
          <div className="share-fb-card-meta">
            <div className="fb-meta-domain">NS-RUNNING-RESULTS.OPENSRC.MX</div>
            <div className="fb-meta-title">
              {activeMedal
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
            title="Share directly to Facebook"
          >
            <Facebook size={16} />
            <span>Share on Facebook</span>
          </a>

          <button
            type="button"
            className="share-primary-btn"
            onClick={handleDownload}
            disabled={!previewUrl || rendering}
          >
            <Download size={16} />
            <span>Download {format === "fb" ? "JPG" : "PNG"}</span>
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
              {activeMedal ? `Direct Link to ${activeMedal.name} Medal` : "Direct Passport Link"}
            </span>
            {ogSynced && (
              <span className="share-sync-badge">
                <Check size={12} /> FB Preview Synced
              </span>
            )}
          </div>
          <div className="share-code-box">
            <code>{passportUrl}</code>
            <button
              type="button"
              className="share-copy-btn"
              onClick={() => handleCopy("url", passportUrl)}
              aria-label="Copy direct passport link"
            >
              {copiedKey === "url" ? <Check size={14} /> : <Link2 size={14} />}
              <span>{copiedKey === "url" ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </div>

        <p className="im-footnote">
          Share directly to <strong>Facebook</strong>, download for your <strong>Instagram Story</strong>, or upload as a{" "}
          <strong>Strava activity photo</strong>.
        </p>
      </div>
    </InfoModal>
  );
}
