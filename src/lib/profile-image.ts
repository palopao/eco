const IMAGE_PREFIX = "data:image/webp+gzip;base64,";
const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const MAX_STORED_CHARS = 450_000;
const MAX_DIMENSION = 512;
const MAX_PIXELS = 40_000_000;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

export async function encodeProfileImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("The original image must be smaller than 10 MB.");
  }

  const image = await createImageBitmap(file);
  try {
    if (image.width * image.height > MAX_PIXELS) {
      throw new Error("This image is too large to process. Choose a smaller image.");
    }

    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable in this browser.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const webp = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Could not convert this image to WebP.")),
        "image/webp",
        0.78,
      );
    });
    if (webp.type !== "image/webp") {
      throw new Error("This browser does not support WebP image conversion.");
    }

    const compressed = await new Response(
      webp.stream().pipeThrough(new CompressionStream("gzip")),
    ).arrayBuffer();
    const encoded = `${IMAGE_PREFIX}${toBase64(new Uint8Array(compressed))}`;
    if (encoded.length > MAX_STORED_CHARS) {
      throw new Error("The processed image is too large for a Firestore profile. Choose a smaller image.");
    }
    return encoded;
  } finally {
    image.close();
  }
}

export async function decodeProfileImage(source: string): Promise<string> {
  if (!source.startsWith(IMAGE_PREFIX)) return source;
  const bytes = Uint8Array.from(atob(source.slice(IMAGE_PREFIX.length)), (character) => character.charCodeAt(0));
  const webp = await new Response(
    new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
  ).blob();
  return URL.createObjectURL(new Blob([webp], { type: "image/webp" }));
}
