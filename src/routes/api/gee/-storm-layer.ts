import { createServerFn } from "@tanstack/react-start";
import { createRequire } from "node:module";
import { env } from "@/lib/env.server";

/**
 * Returns a Sentinel-1 GRD tile URL template from Google Earth Engine.
 *
 * Required env vars:
 *   GEE_SERVICE_ACCOUNT_EMAIL  (or fallback: GEE_SERVICE_ACCOUNT)
 *   GEE_PRIVATE_KEY            — PEM private key, \n escaped as \\n in the env file
 *
 * Optional:
 *   GEE_PROJECT_ID             — Google Cloud project with EE enabled
 *
 * Returns { status: "not_configured" } when credentials are absent, and
 * { status: "not_installed" } when @google/earthengine isn't installed,
 * so the client always gets a clean JSON response instead of a 500.
 */
export const getGeeStormLayer = createServerFn({ method: "GET" }).handler(
  async () => {
    // Accept either naming convention that might be in .env
    const serviceAccount =
      env("GEE_SERVICE_ACCOUNT_EMAIL") ?? env("GEE_SERVICE_ACCOUNT");
    const privateKeyRaw = env("GEE_PRIVATE_KEY");
    const projectId = env("GEE_PROJECT_ID") ?? null;

    if (!serviceAccount || !privateKeyRaw) {
      return {
        status: "not_configured" as const,
        message:
          "Set GEE_SERVICE_ACCOUNT_EMAIL and GEE_PRIVATE_KEY in your environment to enable live GEE layers.",
      };
    }

    // Use createRequire so Vite's SSR analyser never tries to statically resolve
    // @google/earthengine — it only runs at call time on the server.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ee: any;
    try {
      const _require = createRequire(import.meta.url);
      ee = _require("@google/earthengine");
      if (ee?.default) ee = ee.default;
    } catch {
      return {
        status: "not_installed" as const,
        message:
          "Run `npm install @google/earthengine` to enable live GEE tile layers.",
      };
    }

    try {
      // Normalise the private key coming out of .env.
      // Handles the common mistake of pasting the entire service-account JSON
      // as the value of GEE_PRIVATE_KEY instead of just the private_key field.
      let rawKey = privateKeyRaw.trim();

      // If the value looks like a JSON object, extract private_key from it
      if (rawKey.startsWith("{")) {
        try {
          const parsed = JSON.parse(rawKey) as { private_key?: string };
          if (parsed.private_key) rawKey = parsed.private_key;
        } catch {
          // not valid JSON — proceed as-is and let OpenSSL give a clear error
        }
      }

      let privateKey = rawKey
        // unescape literal \n from .env storage
        .replace(/\\n/g, "\n")
        // some copy-paste tools replace newlines with spaces inside the base64 body
        .replace(/(-----BEGIN [^-]+-----)([^-]+)(-----END [^-]+-----)/s, (_, h, body, f) => {
          return h + "\n" + body.replace(/ /g, "\n") + f;
        })
        .trim();

      // Ensure the key ends with a real newline (some PEM parsers require it)
      if (!privateKey.endsWith("\n")) privateKey += "\n";

      // Debug: log the first and last 60 chars so you can verify the PEM header in server logs
      console.log(
        "[GEE] key head:", privateKey.slice(0, 60).replace(/\n/g, "↵"),
        "| key tail:", privateKey.slice(-60).replace(/\n/g, "↵"),
      );

      await new Promise<void>((resolve, reject) =>
        ee.data.authenticateViaPrivateKey(
          { client_email: serviceAccount, private_key: privateKey },
          () =>
            ee.initialize(
              null,
              null,
              () => {
                console.log("[GEE] authenticated and initialized ✅");
                resolve();
              },
              (e: unknown) => reject(new Error(String(e))),
              null,
              projectId,
            ),
          (e: unknown) => reject(new Error(String(e))),
        ),
      );

      // Build a combined backscatter image regardless of polarisation mode.
      // VV scenes (dual-pol IW over land/coast) and HH scenes (single-pol IW
      // over ocean) cannot be mixed directly — rename HH→VV so both collections
      // share the same band name, then merge and take the median.
      // ee.Algorithms.If returns ComputedObject (no .getMap), so we avoid it
      // entirely by merging the two collections before reducing.
      const vvCol = ee
        .ImageCollection("COPERNICUS/S1_GRD")
        .filterDate("2026-01-01", "2026-09-30")
        .filter(ee.Filter.eq("instrumentMode", "IW"))
        .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VV"))
        .select("VV");

      const hhCol = ee
        .ImageCollection("COPERNICUS/S1_GRD")
        .filterDate("2026-01-01", "2026-09-30")
        .filter(ee.Filter.eq("instrumentMode", "IW"))
        .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "HH"))
        // Rename HH → VV so the band name is uniform across the merged collection
        .select(["HH"], ["VV"]);

      // Merge: VV scenes take priority; HH scenes fill in where VV has no data
      const image = vvCol.merge(hhCol).median();

      const mapObj = await new Promise<{ urlFormat: string }>((resolve, reject) =>
        image.getMap(
          { min: -25, max: 0 },
          (obj: { urlFormat: string } | null, err?: string) =>
            err ? reject(new Error(err)) : resolve(obj!),
        ),
      );

      return { status: "ok" as const, urlTile: mapObj.urlFormat };
    } catch (err) {
      console.error("[GEE] layer fetch failed:", err);
      return {
        status: "error" as const,
        message: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
);
