export type CloudinaryFolder = "products" | "brands" | "banners" | "categories" | "payment";

/** Uploads a single image to Cloudinary using a short-lived signature from /api/cloudinary/sign (admin only). */
export async function uploadImage(file: File, folder: CloudinaryFolder) {
  let signRes: Response;
  try {
    signRes = await fetch("/api/cloudinary/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder }),
    });
  } catch {
    throw new Error("Couldn't reach the server to start the upload. Check your internet connection.");
  }

  const signJson = await signRes.json().catch(() => null);
  if (!signRes.ok || !signJson) throw new Error(signJson?.error || "Could not start the upload.");
  const { timestamp, folder: signedFolder, signature, apiKey, cloudName } = signJson;
  if (!cloudName || !apiKey) throw new Error("Cloudinary isn't configured yet. Add the Cloudinary keys to .env.local and restart the server.");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("folder", signedFolder);
  fd.append("signature", signature);

  let uploadRes: Response;
  try {
    uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
  } catch {
    throw new Error("Couldn't reach Cloudinary. Check your internet connection and the cloud name.");
  }

  const data = await uploadRes.json().catch(() => null);
  if (!uploadRes.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || `Cloudinary rejected the upload (status ${uploadRes.status}). Check your Cloudinary cloud name and API keys.`);
  }
  return { url: data.secure_url as string, publicId: data.public_id as string };
}

/** Uploads a customer's payment screenshot for one specific order (any logged-in user, own order only). */
export async function uploadPaymentProof(file: File, orderId: string) {
  let signRes: Response;
  try {
    signRes = await fetch("/api/cloudinary/sign-payment-proof", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
  } catch {
    throw new Error("Couldn't reach the server to start the upload. Check your internet connection.");
  }

  const signJson = await signRes.json().catch(() => null);
  if (!signRes.ok || !signJson) throw new Error(signJson?.error || "Could not start the upload.");
  const { timestamp, folder, signature, apiKey, cloudName } = signJson;
  if (!cloudName || !apiKey) throw new Error("Cloudinary isn't configured yet.");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("folder", folder);
  fd.append("signature", signature);

  let uploadRes: Response;
  try {
    uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
  } catch {
    throw new Error("Couldn't reach Cloudinary. Check your internet connection.");
  }

  const data = await uploadRes.json().catch(() => null);
  if (!uploadRes.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || `Upload failed (status ${uploadRes.status}).`);
  }
  return { url: data.secure_url as string, publicId: data.public_id as string };
}


/** Uploads a single video (admin only) — same signed params as uploadImage, posted to Cloudinary's video endpoint. */
export async function uploadVideo(file: File, folder: CloudinaryFolder) {
  let signRes: Response;
  try {
    signRes = await fetch("/api/cloudinary/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder }),
    });
  } catch {
    throw new Error("Couldn't reach the server to start the upload. Check your internet connection.");
  }

  const signJson = await signRes.json().catch(() => null);
  if (!signRes.ok || !signJson) throw new Error(signJson?.error || "Could not start the upload.");
  const { timestamp, folder: signedFolder, signature, apiKey, cloudName } = signJson;
  if (!cloudName || !apiKey) throw new Error("Cloudinary isn't configured yet. Add the Cloudinary keys to .env.local and restart the server.");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("folder", signedFolder);
  fd.append("signature", signature);

  let uploadRes: Response;
  try {
    uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, { method: "POST", body: fd });
  } catch {
    throw new Error("Couldn't reach Cloudinary. Check your internet connection.");
  }

  const data = await uploadRes.json().catch(() => null);
  if (!uploadRes.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || `Video upload failed (status ${uploadRes.status}). Large files can take a while — try a shorter clip if this keeps failing.`);
  }
  return { url: data.secure_url as string, publicId: data.public_id as string };
}
