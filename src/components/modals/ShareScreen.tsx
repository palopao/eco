import { useState } from "react";
import { AppHeader } from "../../components/ui/AppHeader";
import { Icon } from "../../components/ui/Icon";
import ProfileAvatar from "../../components/ProfileAvatar";
import type { Review, User } from "../../types";
import type { Album } from "../../types";
import { PORTRAIT, ALBUM_PLACEHOLDER } from "../../lib/constants";

export function ShareScreen({
  close,
  album,
  review,
  user,
}: {
  close: () => void;
  album: Album | null;
  review: Review | null;
  user: User | null;
}) {
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const coverUrl = album?.coverUrl ?? ALBUM_PLACEHOLDER;
  const title = album?.title ?? "Your latest listen";
  const artist = album?.artist ?? "Eco";
  const rating = review?.rating ?? album?.averageRating ?? 0;
  const reviewText = review?.textContent ?? review?.content ?? "";

  const createImage = async () => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = coverUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Album artwork could not be loaded."));
    });

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image generation is not supported by this browser.");

    const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
    const imageWidth = image.width * scale;
    const imageHeight = image.height * scale;
    context.drawImage(image, (canvas.width - imageWidth) / 2, (canvas.height - imageHeight) / 2, imageWidth, imageHeight);
    const overlay = context.createLinearGradient(0, 0, 0, canvas.height);
    overlay.addColorStop(0, "#06101dcc");
    overlay.addColorStop(0.4, "#06101d55");
    overlay.addColorStop(1, "#06101df2");
    context.fillStyle = overlay;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const coverSize = 660;
    const coverX = (canvas.width - coverSize) / 2;
    context.shadowColor = "#00000099";
    context.shadowBlur = 45;
    context.drawImage(image, coverX, 410, coverSize, coverSize);
    context.shadowBlur = 0;
    context.fillStyle = "#ffffff";
    context.font = "800 74px Inter, sans-serif";
    context.textAlign = "center";
    context.fillText(title.slice(0, 24), 540, 1210, 900);
    context.font = "600 38px Inter, sans-serif";
    context.fillStyle = "#cbd5e1";
    context.fillText(artist.toUpperCase().slice(0, 36), 540, 1270, 900);
    context.fillStyle = "#00d2ff";
    context.font = "700 42px Inter, sans-serif";
    context.fillText(`${"★".repeat(Math.round(rating))}  ${rating.toFixed(1)} / 5`, 540, 1390, 900);

    if (reviewText) {
      context.fillStyle = "#f1f5f9";
      context.font = "italic 34px Inter, sans-serif";
      const words = reviewText.split(/\s+/);
      let line = "";
      let y = 1500;
      for (const word of words) {
        const nextLine = line ? `${line} ${word}` : word;
        if (context.measureText(nextLine).width > 820) {
          context.fillText(line, 540, y, 820);
          line = word;
          y += 48;
          if (y > 1690) break;
        } else {
          line = nextLine;
        }
      }
      if (line && y <= 1690) context.fillText(line, 540, y, 820);
    }
    context.fillStyle = "#ffffff";
    context.font = "800 44px Inter, sans-serif";
    context.fillText("eco", 540, 1820);
    context.fillStyle = "#00d2ff";
    context.fillText(`@${user?.username ?? "listener"}`, 540, 1870);
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not export the social card.")), "image/png");
    });
  };

  const downloadCard = async () => {
    setWorking(true);
    setError("");
    try {
      const blob = await createImage();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "eco-listen.png";
      link.click();
      URL.revokeObjectURL(url);
    } catch (generationError) {
      console.error("Could not generate the social card.", generationError);
      setError(generationError instanceof Error ? generationError.message : "Could not generate the social card.");
    } finally {
      setWorking(false);
    }
  };

  const shareCard = async () => {
    setWorking(true);
    setError("");
    try {
      const file = new File([await createImage()], "eco-listen.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${title} — Eco`, text: `I rated ${title} ${rating}/5 on Eco.` });
      } else {
        const url = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === "AbortError") return;
      console.error("Could not share the social card.", shareError);
      setError(shareError instanceof Error ? shareError.message : "Could not share the social card.");
    } finally {
      setWorking(false);
    }
  };

  return <div className="modal-backdrop share-backdrop" onMouseDown={close}><section className="share-generator" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
    <AppHeader className="modal-safe-header" onLogo={close} action={<button type="button" className="header-icon-button" onClick={close} aria-label="Close social share card"><Icon name="close" size={19} /></button>} />
    <div className="share-top"><div><span>SOCIAL CARD</span><h2>Share your listen</h2></div></div>
    <div className="story-card">
      <div className="story-bg" style={{ backgroundImage: `url(${coverUrl})` }} />
      <div className="story-brand">ec<span>o</span></div>
      <div className="story-content"><img src={coverUrl} alt={`${title} by ${artist}`} /><div className="story-rating"><span>{"★".repeat(Math.round(rating))}</span><b>{rating.toFixed(1)} / 5.0</b></div><h3>{title}</h3><p className="story-artist">{artist.toUpperCase()}</p>{reviewText && <blockquote>{reviewText}</blockquote>}        <div className="story-user"><ProfileAvatar className="share-avatar" src={user?.photoURL || user?.avatarUrl || PORTRAIT} alt="" /><span><b>@{user?.username ?? "listener"}</b><small>Logged on Eco</small></span></div></div>
    </div>
    {error && <p role="alert" className="error-text">{error}</p>}
    <div className="share-actions"><button className="publish-button" disabled={working} onClick={shareCard}><Icon name="share" size={18} /> Share card</button><button className="square-action" disabled={working} onClick={downloadCard} aria-label="Download image"><Icon name="download" /></button></div>
  </section></div>;
}
