import { useEffect, useState } from "react";
import { decodeProfileImage } from "../lib/profile-image";

export default function ProfileAvatar({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    decodeProfileImage(src)
      .then((url) => {
        if (!active) {
          if (url.startsWith("blob:")) URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url.startsWith("blob:") ? url : "";
        setImageUrl(url);
      })
      .catch((error: unknown) => {
        console.error("Could not decode the profile image.", error);
        if (active) setImageUrl("");
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return imageUrl
    ? <img className={className} src={imageUrl} alt={alt} />
    : <span className={className} role="img" aria-label={alt}>♪</span>;
}
