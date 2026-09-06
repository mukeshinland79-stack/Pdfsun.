/**
 * Just-In-Time (JIT) On-Demand Microphone Permission & Stream Manager
 * 
 * Guarantees:
 * 1. Zero automatic permission prompts or checks on page load / route navigation / pricing section.
 * 2. Microphone requests are strictly bound to explicit user click interactions.
 * 3. Uses Permissions API (navigator.permissions.query) to detect permission state:
 *    - 'granted': quiet, instant stream acquisition with zero latency.
 *    - 'prompt': on-demand browser prompt initiated strictly from user click.
 *    - 'denied': notifies user to adjust browser settings without triggering redundant prompts.
 * 4. Immediate resource release: track.stop() stops the recording indicator and releases hardware resources.
 */

export type MicPermissionStatus = "granted" | "prompt" | "denied" | "unsupported";

export interface MicRequestResult {
  success: boolean;
  stream: MediaStream | null;
  status: MicPermissionStatus;
  errorMessage?: string;
}

/**
 * Checks the current microphone permission state without triggering a prompt.
 * Safe fallback if browser does not support Permissions API or 'microphone' query.
 */
export async function getMicrophonePermissionState(): Promise<MicPermissionStatus> {
  if (typeof window === "undefined" || !navigator?.permissions?.query) {
    return "prompt"; // Default to standard prompt flow
  }

  try {
    // Note: Standard name is 'microphone'
    const permissionStatus = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return permissionStatus.state as MicPermissionStatus;
  } catch {
    // Some browsers (e.g. certain Safari/Firefox versions) do not support 'microphone' in Permissions API
    return "prompt";
  }
}

/**
 * Requests microphone stream strictly on explicit user action (e.g. click event).
 * Fast, lightweight, zero-latency execution.
 */
export async function requestMicrophoneStreamOnDemand(): Promise<MicRequestResult> {
  if (
    typeof window === "undefined" ||
    !navigator?.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    return {
      success: false,
      stream: null,
      status: "unsupported",
      errorMessage: "Microphone access is not supported in this browser or device.",
    };
  }

  // 1. Check existing permission status using Permissions API
  const currentState = await getMicrophonePermissionState();

  if (currentState === "denied") {
    return {
      success: false,
      stream: null,
      status: "denied",
      errorMessage:
        "Microphone access is blocked in your browser. Please allow microphone permissions in your site settings to continue.",
    };
  }

  // 2. Request stream ONLY within user-initiated click execution
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    return {
      success: true,
      stream,
      status: "granted",
    };
  } catch (err: any) {
    const errorName = err?.name || "";
    if (
      errorName === "NotAllowedError" ||
      errorName === "PermissionDeniedError" ||
      err?.message?.includes("denied")
    ) {
      return {
        success: false,
        stream: null,
        status: "denied",
        errorMessage:
          "Microphone permission was denied. Please allow microphone access in your browser settings.",
      };
    }

    if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
      return {
        success: false,
        stream: null,
        status: "unsupported",
        errorMessage: "No microphone hardware found on your device.",
      };
    }

    return {
      success: false,
      stream: null,
      status: "prompt",
      errorMessage: err?.message || "Failed to initialize microphone audio stream.",
    };
  }
}

/**
 * Cleanly releases all MediaStream audio tracks and frees system resources.
 */
export function releaseMicrophoneStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  try {
    const tracks = stream.getTracks();
    tracks.forEach((track) => {
      try {
        track.stop();
        track.enabled = false;
      } catch (trackErr) {
        console.warn("Could not stop audio track cleanly:", trackErr);
      }
    });
  } catch (err) {
    console.warn("Could not release microphone stream tracks:", err);
  }
}
