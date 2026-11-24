import React, { useEffect, useMemo, useState } from "react";
import { Check, Code2, Copy, Download, Image as ImageIcon, Link2, Share2 } from "lucide-react";
import InfoModal from "./InfoModal.jsx";
import { renderPassportShareCard } from "../utils/shareCardCanvas";

export default function SharePassportModal({
  open,
  onClose,
  runnerName,
  seasonFilter,
  passport,
  regionStats,
  trophyStats
}) {
  const [mode, setMode] = useState("image"); // "image" | "embed"
  const [format, setFormat] = useState("story"); // "story" | "square"
  const [previewUrl, setPreviewUrl] = useState("");
  const [blob, setBlob] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [ogSynced, setOgSynced] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");

  const seasonLabel = seasonFilter === "all" ? "All-Time" : `${seasonFilter} Season`;

  const shareOrigin = useMemo(() => {
    if (typeof window === "undefined") return "https://ns-running-results.opensrc.mx";
    const origin = window.location.origin;
    return origin.includes("localhost") || origin.includes("127.0.0.1")
      ? "https://ns-running-results.opensrc.mx"
      : origin;
  }, []);

  // /share?name=... serves per-runner dynamic og:image & og:title for Facebook/WhatsApp/X,
  // then immediately redirects humans into /?name=...&tab=passport
  const passportUrl = useMemo(() => {
    const params = new URLSearchParams({ name: runnerName });
    return `${shareOrigin}/share?${params.toString()}`;
  }, [shareOrigin, runnerName]);

  const embedUrl = useMemo(() => {
    const params = new URLSearchParams({ name: runnerName, tab: "passport", embed: "1" });
    return `${shareOrigin}/?${params.toString()}`;
  }, [shareOrigin, runnerName]);

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
        const summary = `${passport.caughtCount}/${passport.totalCount} NS Race Medals (${passport.percent}%) • ${regionStats.unlockedCount}/7 Regions • ${trophyStats.unlockedCount}/${trophyStats.totalCount} Trophies • ${passport.rank.current.title}`;
        return fetch("/api/ns-share-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: runnerName,
            summary,
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

  const iframeSnippet = `<iframe src="${embedUrl}" width="100%" height="780" style="border:0;border-radius:16px;overflow:hidden;" loading="lazy" title="${runnerName} — Nova Scotia Race Passport"></iframe>`;

  const markdownSnippet = `[![${runnerName} NS Race Passport](https://img.shields.io/badge/NS_Race_Passport-${passport.caughtCount}%2F${passport.totalCount}_Medals_(${passport.percent}%25)-0370b9?style=for-the-badge)](${passportUrl})`;

  useEffect(() => {
    if (!open || mode !== "image") return;
    let cancelled = false;
    setRendering(true);
    renderPassportShareCard({
      runnerName,
      seasonLabel,
      passport,
      regionStats,
      trophyStats,
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
  }, [open, mode, format, runnerName, seasonLabel, passport, regionStats, trophyStats]);

  function handleDownload() {
    if (!previewUrl) return;
    const slug = runnerName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `ns-race-passport-${slug || "runner"}-${format}.png`;
    a.click();
  }

  async function handleNativeShare() {
    if (!blob || !navigator.share) return;
    try {
      const slug = runnerName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const file = new File([blob], `ns-race-passport-${slug || "runner"}-${format}.png`, {
        type: "image/png"
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${runnerName}'s Nova Scotia Race Passport`,
          text: `${passport.caughtCount}/${passport.totalCount} NS Race Medals (${passport.percent}%) • ${regionStats.unlockedCount}/7 Regions • ${trophyStats.unlockedCount}/${trophyStats.totalCount} Trophies`,
          files: [file]
        });
      } else {
        await navigator.share({
          title: `${runnerName}'s Nova Scotia Race Passport`,
          text: `${passport.caughtCount}/${passport.totalCount} NS Race Medals (${passport.percent}%)`,
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
      title="Share Your NS Race Passport"
      icon={<Share2 size={18} />}
      onClose={onClose}
    >
      {/* Mode Switcher: Image Card vs Web Embed & Link */}
      <div className="share-mode-tabs">
        <button
          type="button"
          className={`share-mode-tab ${mode === "image" ? "active" : ""}`}
          onClick={() => setMode("image")}
        >
          <ImageIcon size={15} />
          <span>Share Image (IG / Strava / FB)</span>
        </button>
        <button
          type="button"
          className={`share-mode-tab ${mode === "embed" ? "active" : ""}`}
          onClick={() => setMode("embed")}
        >
          <Code2 size={15} />
          <span>Link &amp; Web Embed</span>
        </button>
      </div>

      {mode === "image" ? (
        <div className="share-image-panel">
          <div className="share-format-row">
            <button
              type="button"
              className={`share-fmt-btn ${format === "story" ? "active" : ""}`}
              onClick={() => setFormat("story")}
            >
              📱 Story (9:16 — IG / FB)
            </button>
            <button
              type="button"
              className={`share-fmt-btn ${format === "square" ? "active" : ""}`}
              onClick={() => setFormat("square")}
            >
              🟦 Square (1:1 — Strava / Feed)
            </button>
          </div>

          <div className={`share-preview-frame ${format}`}>
            {rendering || !previewUrl ? (
              <div className="share-preview-loading">Generating your medal card...</div>
            ) : (
              <img src={previewUrl} alt={`${runnerName} Race Passport share card`} />
            )}
          </div>

          <div className="share-actions-row">
            <button
              type="button"
              className="share-primary-btn"
              onClick={handleDownload}
              disabled={!previewUrl || rendering}
            >
              <Download size={16} />
              <span>Download PNG</span>
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

            <a
              className="share-secondary-btn"
              href={fbShareUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Facebook</span>
            </a>
          </div>
          <p className="im-footnote">
            Download the PNG to post straight to your <strong>Instagram Story</strong>, upload as a{" "}
            <strong>Strava activity photo</strong>, or share on <strong>Facebook</strong>.
          </p>
        </div>
      ) : (
        <div className="share-embed-panel">
          <h4 className="im-subhead" style={{ marginTop: 4 }}>
            Direct Passport Link
          </h4>
          <div className="share-code-box">
            <code>{passportUrl}</code>
            <button
              type="button"
              className="share-copy-btn"
              onClick={() => handleCopy("url", passportUrl)}
            >
              {copiedKey === "url" ? <Check size={14} /> : <Link2 size={14} />}
              <span>{copiedKey === "url" ? "Copied!" : "Copy"}</span>
            </button>
          </div>

          <h4 className="im-subhead">Web Embed (HTML iframe)</h4>
          <p className="im-lead" style={{ marginBottom: 8 }}>
            Paste this into any website, running club page, or blog to embed your live Nova Scotia
            Race Passport:
          </p>
          <div className="share-code-box multiline">
            <code>{iframeSnippet}</code>
            <button
              type="button"
              className="share-copy-btn"
              onClick={() => handleCopy("iframe", iframeSnippet)}
            >
              {copiedKey === "iframe" ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedKey === "iframe" ? "Copied!" : "Copy"}</span>
            </button>
          </div>

          <h4 className="im-subhead">Markdown Badge</h4>
          <div className="share-code-box multiline">
            <code>{markdownSnippet}</code>
            <button
              type="button"
              className="share-copy-btn"
              onClick={() => handleCopy("md", markdownSnippet)}
            >
              {copiedKey === "md" ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedKey === "md" ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </div>
      )}
    </InfoModal>
  );
}
