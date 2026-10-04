export async function startCamera(video) {
  if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error("Camera API unavailable"), { name: "NotSupportedError" });
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
  });
  video.srcObject = stream;
  await video.play().catch(() => {});
  return () => {
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  };
}

export function cameraErrorMessage(error) {
  if (!window.isSecureContext) return "The camera only works on a secure (https) link.";
  switch (error?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera access is blocked. Allow the camera for this site in the browser settings, then try again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device. Enter the pass ID instead.";
    case "NotReadableError":
      return "Another app is using the camera. Close it and try again.";
    case "NotSupportedError":
      return "This browser can't open the camera. Use Chrome, or enter the pass ID instead.";
    default:
      return "The camera couldn't start. Try again, or enter the pass ID instead.";
  }
}
