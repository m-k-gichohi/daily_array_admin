const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME")!;
const apiKey = Deno.env.get("CLOUDINARY_API_KEY")!;
const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET")!;

async function sha1(message: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(message),
  );

  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function deleteCloudinaryImage(
  publicId: string,
): Promise<boolean> {
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = await sha1(
    `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`,
  );

  const body = new URLSearchParams({
    public_id: publicId,
    api_key: apiKey,
    timestamp: timestamp.toString(),
    signature,
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: "POST",
      body,
    },
  );

  const result = await response.json();

  console.log("Cloudinary delete response:", result);

  return result.result === "ok" || result.result === "not found";
}