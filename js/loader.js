/**
 * loader.js — Payload decompression and global state init.
 *
 * Expects kfs-payload.js to have been loaded first, setting:
 *   window.KFS_PAYLOAD = "<base64-gzipped-json>"
 *
 * After init(), the following globals are available:
 *   window.KFS_TEMPLATE  {string}  Raw HTML template string
 *   window.KFS_JSONS     {object}  Map of language -> copy object
 */

(function (root) {
  'use strict';

  /**
   * Decompress a base64-encoded gzip string and parse it as JSON.
   * Uses the browser's native DecompressionStream (all modern browsers).
   * @param {string} base64Value
   * @returns {Promise<any>}
   */
  async function decompressPayload(base64Value) {
    if (!('DecompressionStream' in root)) {
      throw new Error(
        'Your browser does not support DecompressionStream. ' +
          'Please use a modern browser (Chrome 80+, Firefox 113+, Safari 16.4+).'
      );
    }

    const bytes = Uint8Array.from(atob(base64Value), (c) => c.charCodeAt(0));
    const stream = new Response(bytes).body.pipeThrough(
      new DecompressionStream('gzip')
    );
    const text = await new Response(stream).text();
    return JSON.parse(text);
  }

  /**
   * Load the KFS payload and populate window.KFS_TEMPLATE and window.KFS_JSONS.
   * Safe to call multiple times — skips if already loaded.
   * @returns {Promise<void>}
   */
  async function loadPayload() {
    if (root.KFS_TEMPLATE && root.KFS_JSONS) return; // Already loaded

    const raw = root.KFS_PAYLOAD;
    if (!raw) {
      throw new Error(
        'window.KFS_PAYLOAD is not defined. ' +
          'Make sure kfs-payload.js is loaded before loader.js.'
      );
    }

    const data = await decompressPayload(raw);

    if (!data.template || !data.jsons) {
      throw new Error(
        'Payload structure invalid — expected { template, jsons }. ' +
          'Rebuild kfs-payload.js using scripts/build_payload.py.'
      );
    }

    root.KFS_TEMPLATE = data.template;
    root.KFS_JSONS = data.jsons;
  }

  // Export
  root.Loader = { loadPayload };
})(window);
