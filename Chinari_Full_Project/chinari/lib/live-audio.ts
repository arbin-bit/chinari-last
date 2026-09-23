export const GEMINI_INPUT_SAMPLE_RATE = 16_000;

export class StreamingPcm16Resampler {
  private pending = new Float32Array(0);
  private position = 0;

  constructor(
    private readonly inputSampleRate: number,
    private readonly outputSampleRate = GEMINI_INPUT_SAMPLE_RATE,
  ) {
    if (inputSampleRate <= 0 || outputSampleRate <= 0) throw new Error("Audio sample rates must be positive.");
  }

  process(chunk: Float32Array) {
    if (!chunk.length) return new Uint8Array(0);
    const input = new Float32Array(this.pending.length + chunk.length);
    input.set(this.pending);
    input.set(chunk, this.pending.length);
    const ratio = this.inputSampleRate / this.outputSampleRate;
    const output: number[] = [];
    while (this.position + 1 < input.length) {
      const lowerIndex = Math.floor(this.position);
      const upperIndex = lowerIndex + 1;
      const fraction = this.position - lowerIndex;
      output.push(input[lowerIndex] + (input[upperIndex] - input[lowerIndex]) * fraction);
      this.position += ratio;
    }
    const consumed = Math.min(Math.floor(this.position), input.length);
    this.pending = input.slice(consumed);
    this.position -= consumed;
    return float32ToPcm16(new Float32Array(output));
  }
}

export function float32ToPcm16(samples: Float32Array) {
  const output = new Uint8Array(samples.length * 2);
  const view = new DataView(output.buffer);
  samples.forEach((sample, index) => {
    const clipped = Math.max(-1, Math.min(1, sample));
    view.setInt16(index * 2, clipped < 0 ? Math.round(clipped * 0x8000) : Math.round(clipped * 0x7fff), true);
  });
  return output;
}

export function pcm16ToFloat32(bytes: Uint8Array) {
  const length = Math.floor(bytes.byteLength / 2);
  const output = new Float32Array(length);
  const view = new DataView(bytes.buffer, bytes.byteOffset, length * 2);
  for (let index = 0; index < length; index += 1) {
    const value = view.getInt16(index * 2, true);
    output[index] = value < 0 ? value / 0x8000 : value / 0x7fff;
  }
  return output;
}

export function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
}

export function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function sampleRateFromMimeType(mimeType: string | undefined, fallback = 24_000) {
  const match = mimeType?.match(/rate=(\d+)/i);
  return match ? Number(match[1]) : fallback;
}

export function mergeTranscript(previous: string, incoming: string) {
  const next = incoming.trim();
  if (!next) return previous;
  if (!previous) return next;
  if (next.startsWith(previous)) return next;
  if (previous.endsWith(next)) return previous;
  const separator = /^[,.;:!?]/.test(next) || previous.endsWith(" ") ? "" : " ";
  return `${previous}${separator}${next}`;
}
