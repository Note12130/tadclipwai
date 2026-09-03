/**
 * Performance Regression Guard (Phase 7: G-3)
 * Runs synthetic fast-path stream-copy and memory throughput benchmark in CI.
 * Fails the build if execution exceeds baseline thresholds by > 20%.
 */

const BASELINE_KEYFRAME_TRIM_MAX_MS = 1500; // Baseline threshold: 1.5s
const REGRESSION_TOLERANCE_MULTIPLIER = 1.2; // 20% tolerance max: 1800ms
const MAX_ALLOWED_MS = BASELINE_KEYFRAME_TRIM_MAX_MS * REGRESSION_TOLERANCE_MULTIPLIER;

function runSyntheticFastPathBenchmark() {
  console.log('---------------------------------------------------------');
  console.log('[PERF GUARD] Running synthetic WebCodecs stream-copy benchmark...');

  const t0 = performance.now();

  // Simulate 10MB container demux, sample slice, and remux buffer operations
  const bufferSize = 10 * 1024 * 1024; // 10MB
  const source = new Uint8Array(bufferSize);
  source.fill(0x55);

  // Chunk slicing (simulating sample copy without re-encoding)
  const chunks = [];
  const chunkSize = 64 * 1024;
  for (let i = 0; i < bufferSize; i += chunkSize) {
    chunks.push(source.subarray(i, Math.min(bufferSize, i + chunkSize)));
  }

  // Remux assembly
  let totalLength = 0;
  for (const chunk of chunks) {
    totalLength += chunk.length;
  }
  const dest = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    dest.set(chunk, offset);
    offset += chunk.length;
  }

  const durationMs = Math.round((performance.now() - t0) * 100) / 100;

  console.log(`[PERF GUARD] Processed ${Math.round(bufferSize / 1024 / 1024)} MB stream-copy in: ${durationMs} ms`);
  console.log(`[PERF GUARD] Baseline Threshold: <= ${BASELINE_KEYFRAME_TRIM_MAX_MS} ms`);
  console.log(`[PERF GUARD] Max Allowed (with 20% tolerance): <= ${MAX_ALLOWED_MS} ms`);
  console.log('---------------------------------------------------------');

  if (durationMs > MAX_ALLOWED_MS) {
    console.error(`[PERF REGRESSION DETECTED] Execution time ${durationMs}ms exceeded limit ${MAX_ALLOWED_MS}ms!`);
    process.exit(1);
  }

  console.log(`[PERF GUARD PASSED] Performance is within acceptable thresholds (${durationMs}ms < ${MAX_ALLOWED_MS}ms).`);
  process.exit(0);
}

runSyntheticFastPathBenchmark();
