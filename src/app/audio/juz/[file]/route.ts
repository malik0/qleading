import { getCloudflareContext } from "@opennextjs/cloudflare";

interface R2ObjectBody {
  body: ReadableStream;
  httpEtag: string;
  size: number;
  range?: { offset: number; length: number };
  writeHttpMetadata(headers: Headers): void;
}

interface R2Bucket {
  get(key: string, options?: { range?: Headers }): Promise<R2ObjectBody | null>;
}

const AUDIO_FILE = /^juz_(?:0[1-9]|[12]\d|30)\.(?:webm|mp3)$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;

  if (!AUDIO_FILE.test(file)) {
    return new Response("Not found", { status: 404 });
  }

  const context = await getCloudflareContext({ async: true });
  const bucket = (context.env as { AUDIO?: R2Bucket }).AUDIO;
  if (!bucket) {
    return new Response("Audio storage is unavailable", { status: 503 });
  }

  const hasRange = Boolean(request.headers.get("range"));
  const object = await bucket.get(
    `juz/${file}`,
    hasRange ? { range: request.headers } : undefined,
  );
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers({
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": file.endsWith(".webm") ? "audio/webm" : "audio/mpeg",
    ETag: object.httpEtag,
  });
  object.writeHttpMetadata(headers);
  headers.set("Accept-Ranges", "bytes");

  if (hasRange && object.range) {
    const end = object.range.offset + object.range.length - 1;
    headers.set("Content-Length", String(object.range.length));
    headers.set("Content-Range", `bytes ${object.range.offset}-${end}/${object.size}`);
    return new Response(object.body, { status: 206, headers });
  }

  headers.set("Content-Length", String(object.size));
  return new Response(object.body, { status: 200, headers });
}
