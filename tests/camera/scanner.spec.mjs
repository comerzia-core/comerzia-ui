import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const streams = [];
    const scenario = new URLSearchParams(location.search).get("scenario");
    let permissionGranted = false;
    window.cameraTest = { streams, requests: [], opticalConstraints: [], events: [], torchStates: [], nativeReads: 0, hideRear: false, pending: 0 };
    const devices = () => scenario === "primary-correction" ? [
      { deviceId: "front-camera", kind: "videoinput", label: "Front camera", groupId: "cameras" },
      { deviceId: "ultra-camera", kind: "videoinput", label: "Back ultra wide camera", groupId: "cameras" },
      { deviceId: "main-camera", kind: "videoinput", label: "Back main wide camera", groupId: "cameras" },
    ] : [
      { deviceId: "front-camera", kind: "videoinput", label: permissionGranted ? "Front camera" : "", groupId: "cameras" },
      { deviceId: window.cameraTest.hideRear ? "rear-replacement" : "rear-camera", kind: "videoinput", label: permissionGranted ? "Rear camera" : "", groupId: "cameras" },
    ];
    Object.defineProperty(navigator.mediaDevices, "enumerateDevices", { value: async () => {
      window.cameraTest.events.push("enumerate");
      if (scenario === "slow-enumeration") await new Promise(resolve => setTimeout(resolve, 1800));
      return devices();
    } });
    if (scenario === "both-readers") window.BarcodeDetector = class {
      async detect() { window.cameraTest.nativeReads++; return []; }
    };
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", { value: async constraints => {
      window.cameraTest.events.push("camera");
      window.cameraTest.requests.push(constraints);
      if (window.cameraTest.hideRear && constraints.video.deviceId?.exact === "rear-camera") throw new DOMException("Old camera unavailable", "NotFoundError");
      if (scenario === "relaxed-resolution" && constraints.video.width.min) {
        throw Object.assign(new DOMException("Resolution unavailable", "OverconstrainedError"), { constraint: "width" });
      }
      if (scenario === "denied") throw new DOMException("No permission", "NotAllowedError");
      window.cameraTest.pending++;
      if (scenario === "late-stream") await new Promise(resolve => setTimeout(resolve, 400));
      const deviceId = constraints.video?.deviceId?.exact || (scenario === "primary-correction" ? "ultra-camera" : window.cameraTest.hideRear ? "rear-replacement" : "rear-camera");
      permissionGranted = true;
      const canvas = document.createElement("canvas");
      canvas.width = 640; canvas.height = 480;
      const context = canvas.getContext("2d");
      let frame = 0;
      const stream = canvas.captureStream(30);
      const track = stream.getVideoTracks()[0];
      const supportsTorch = deviceId !== "front-camera" && deviceId !== "ultra-camera" && scenario !== "unsupported-torch";
      let opticalState = { torch: false, focusMode: "single-shot", zoom: 1 };
      let currentConstraints = constraints.video;
      track.getSettings = () => {
        const settings = { deviceId, facingMode: deviceId === "front-camera" ? "user" : "environment", width: 640, height: 480, frameRate: 30, ...opticalState };
        if (scenario === "unknown-torch" || !supportsTorch) delete settings.torch;
        return settings;
      };
      track.getCapabilities = () => ({ torch: supportsTorch, focusMode: ["continuous"], zoom: { min: 1, max: 4 } });
      track.getConstraints = () => structuredClone(currentConstraints);
      track.applyConstraints = async constraints => {
        if (track.readyState === "ended") throw new DOMException("The camera track has stopped.","AbortError");
        window.cameraTest.opticalConstraints.push(constraints);
        currentConstraints = structuredClone(constraints);
        opticalState = { torch: false, focusMode: "single-shot", zoom: 1 };
        for (const group of constraints.advanced || []) {
          if (scenario === "ignored-zoom" && "zoom" in group) continue;
          if ((scenario === "ignored-torch" || !supportsTorch) && "torch" in group) continue;
          Object.assign(opticalState, group);
        }
        window.cameraTest.torchStates.push(opticalState.torch);
      };
      streams.push(stream);
      window.cameraTest.pending--;
      function draw() {
        if (track.readyState === "ended") return;
        context.fillStyle = window.cameraTest.labelCanvas ? "white"
          : deviceId === "front-camera" ? "#d47725" : "#278bd4";
        context.fillRect(0,0,640,480);
        context.fillStyle = "white";
        context.fillRect((frame++ * 3) % 580,180,60,60);
        if (window.cameraTest.labelCanvas) {
          const label = window.cameraTest.labelCanvas;
          // Alinear las barras con la mira central; el precio está en la mitad superior de la etiqueta.
          context.drawImage(label,(640-label.width)/2,(480-label.height)/2-48);
        }
        requestAnimationFrame(draw);
      }
      draw();
      return stream;
    } });
  });
});

async function expectLiveVideo(page) {
  const video = page.locator("video");
  await expect.poll(() => video.evaluate(video => ({
    state: video.readyState,
    width: video.videoWidth,
    live: video.srcObject?.getVideoTracks()[0]?.readyState,
  }))).toEqual({ state: 4, width: 640, live: "live" });
  const start = await video.evaluate(video => video.currentTime);
  await expect.poll(() => video.evaluate(video => video.currentTime)).toBeGreaterThan(start + 0.25);
  expect(await video.evaluate(video => {
    const canvas = document.createElement("canvas");
    canvas.width = 1; canvas.height = 1;
    const context = canvas.getContext("2d");
    context.drawImage(video,0,0,1,1);
    const color = context.getImageData(0,0,1,1).data;
    return color[0]+color[1]+color[2];
  })).toBeGreaterThan(120);
}

test("Camera preview stays live without a barcode and after changing to selfie", async ({ page }) => {
  const failures = [];
  page.on("pageerror", error => failures.push(error.message));
  await page.goto("/tests/camera/index.html");
  await expectLiveVideo(page);
  await page.getByRole("button", { name: "Cambiar cámara" }).click();
  await expectLiveVideo(page);
  expect(await page.evaluate(() => window.cameraTest.requests.at(-1).video.deviceId.exact)).toBe("front-camera");
  await page.getByRole("button", { name: "Cambiar cámara" }).click();
  await expectLiveVideo(page);
  expect(await page.evaluate(() => window.cameraTest.requests.at(-1).video.deviceId.exact)).toBe("rear-camera");
  expect(await page.evaluate(() => window.cameraTest.streams.slice(0,-1).every(stream =>
    stream.getTracks().every(track => track.readyState === "ended")))).toBe(true);
  expect(failures).toEqual([]);
});

test("Camera and flashlight controls sit inside the image and toggle illumination", async ({ page }) => {
  await page.goto("/tests/camera/index.html");
  await expectLiveVideo(page);
  const image = await page.locator("video").boundingBox();
  for (const name of ["Cambiar cámara","Apagar luz"]) {
    const button = await page.getByRole("button", { name }).boundingBox();
    expect(button.x).toBeGreaterThanOrEqual(image.x);
    expect(button.y).toBeGreaterThanOrEqual(image.y);
    expect(button.x+button.width).toBeLessThanOrEqual(image.x+image.width);
    expect(button.y+button.height).toBeLessThanOrEqual(image.y+image.height);
  }
  await expect(page.getByRole("button", { name: "Apagar luz" })).toHaveAttribute("aria-pressed","true");
  expect(await page.locator("video").evaluate(video => getComputedStyle(video).objectFit)).toBe("cover");
  expect(await page.evaluate(() => window.cameraTest.opticalConstraints.some(value => value.advanced[0].torch === true))).toBe(true);
  await page.getByRole("button", { name: "Apagar luz" }).click();
  await expect(page.getByRole("button", { name: "Encender luz" })).toHaveAttribute("aria-pressed","false");
  expect(await page.evaluate(() => window.cameraTest.opticalConstraints.at(-1).advanced[0].torch)).toBe(false);
  await page.getByRole("button", { name: "Cambiar cámara" }).click();
  await expectLiveVideo(page);
  await expect(page.getByRole("button", { name: "Apagar luz" })).toHaveCount(0);
  await page.getByRole("button", { name: "Cambiar cámara" }).click();
  await expectLiveVideo(page);
  await expect(page.getByRole("button", { name: "Apagar luz" })).toHaveAttribute("aria-pressed","true");
});

for (const [filename, expectedCode] of [["barcode7003000100006.json","7003000100006"],["label31x57.json","12345678"],["label30x20-qr.json","7003000100006"],["label32x12-qr.json","7003000100006"]]) {
  test("A live camera frame from " + filename + " emits " + expectedCode + " once and releases the camera", async ({ page }) => {
    const fixture = JSON.parse(readFileSync(new URL("../../../comerzia/build/label-validation/" + filename,import.meta.url),"utf8"));
    const scenario = filename === "barcode7003000100006.json" ? "both-readers" : filename === "label32x12-qr.json" ? "unsupported-torch" : "";
    await page.goto("/tests/camera/index.html?scenario=" + scenario);
    await expectLiveVideo(page);
    await page.evaluate(fixture => {
      const packed = Uint8Array.from(atob(fixture.bitmapBase64), char => char.charCodeAt(0));
      const canvas = document.createElement("canvas");
      const rotated = fixture.codeFormat !== "QR_CODE";
      canvas.width = rotated ? fixture.heightDots : fixture.widthDots; canvas.height = rotated ? fixture.widthDots : fixture.heightDots;
      const context = canvas.getContext("2d");
      const image = context.createImageData(canvas.width,canvas.height);
      for (let y=0;y<canvas.height;y++) for (let x=0;x<canvas.width;x++) {
        const physicalX = rotated ? fixture.widthDots-1-y : x;
        const physicalY = rotated ? x : y;
        const value = packed[physicalY*fixture.widthBytes+(physicalX>>3)] & (0x80>>(physicalX%8)) ? 255 : 0;
        const offset=(y*canvas.width+x)*4;
        image.data[offset]=value; image.data[offset+1]=value; image.data[offset+2]=value; image.data[offset+3]=255;
      }
      context.putImageData(image,0,0);
      window.cameraTest.labelCanvas=canvas;
    },fixture);
    await expect.poll(() => page.evaluate(() => document.body.dataset.scanned)).toBe(expectedCode);
    expect(await page.evaluate(() => document.body.dataset.scanCount)).toBe("1");
    if (scenario === "both-readers") expect(await page.evaluate(() => window.cameraTest.nativeReads)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.cameraTest.streams.every(stream =>
      stream.getTracks().every(track => track.readyState === "ended")))).toBe(true);
  });
}

test("Closing and reopening stops old streams under StrictMode", async ({ page }) => {
  await page.goto("/tests/camera/index.html");
  await expectLiveVideo(page);
  await page.getByRole("button", { name: "Toggle scanner" }).click();
  await expect.poll(() => page.evaluate(() => window.cameraTest.streams.every(stream =>
    stream.getTracks().every(track => track.readyState === "ended")))).toBe(true);
  await page.getByRole("button", { name: "Toggle scanner" }).click();
  await expectLiveVideo(page);
});

test("The first camera request asks for the rear without enumerating unlabeled cameras first", async ({ page }) => {
  await page.goto("/tests/camera/index.html");
  await expectLiveVideo(page);
  const initial = await page.evaluate(() => ({ request: window.cameraTest.requests[0], event: window.cameraTest.events[0], requests: window.cameraTest.requests.length }));
  expect(initial.event).toBe("camera");
  expect(initial.request.video.facingMode).toEqual({ ideal: "environment" });
  expect(initial.request.video.deviceId).toBeUndefined();
  expect(initial.requests).toBe(1);
});

test("An identified auxiliary lens is corrected once to main wide and manual rotation goes straight to selfie", async ({ page }) => {
  await page.goto("/tests/camera/index.html?scenario=primary-correction");
  await expect.poll(() => page.locator("video").evaluate(video => video.srcObject?.getVideoTracks()[0]?.getSettings().deviceId)).toBe("main-camera");
  await expect(page.getByRole("button", { name: "Apagar luz" })).toBeVisible();
  expect(await page.evaluate(() => window.cameraTest.requests.length)).toBe(2);
  expect(await page.evaluate(() => window.cameraTest.streams[0].getVideoTracks()[0].readyState)).toBe("ended");
  await page.getByRole("button", { name: "Cambiar cámara" }).click();
  await expect.poll(() => page.locator("video").evaluate(video => video.srcObject?.getVideoTracks()[0]?.getSettings().deviceId)).toBe("front-camera");
  await page.getByRole("button", { name: "Cambiar cámara" }).click();
  await expect.poll(() => page.locator("video").evaluate(video => video.srcObject?.getVideoTracks()[0]?.getSettings().deviceId)).toBe("main-camera");
  expect(await page.evaluate(() => window.cameraTest.requests.length)).toBe(4);
});

test("A rejected optional zoom does not prevent torch and focus and light toggles retain focus", async ({ page }) => {
  await page.goto("/tests/camera/index.html?scenario=ignored-zoom");
  await expect(page.getByRole("button", { name: "Apagar luz" })).toBeVisible();
  expect(await page.locator("video").evaluate(video => video.srcObject.getVideoTracks()[0].getSettings().focusMode)).toBe("continuous");
  await page.getByRole("button", { name: "Apagar luz" }).click();
  await expect(page.getByRole("button", { name: "Encender luz" })).toHaveAttribute("aria-pressed", "false");
  expect(await page.locator("video").evaluate(video => video.srcObject.getVideoTracks()[0].getSettings().focusMode)).toBe("continuous");
});

test("Ignored torch remains off without probing other cameras", async ({ page }) => {
  await page.goto("/tests/camera/index.html?scenario=ignored-torch");
  await expectLiveVideo(page);
  await expect(page.getByRole("button", { name: "Encender luz" })).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => window.cameraTest.requests.length)).toBe(1);
});

test("Unknown torch feedback stays unknown while manual on and off remain available", async ({ page }) => {
  await page.goto("/tests/camera/index.html?scenario=unknown-torch");
  await expect(page.getByRole("button", { name: "Cambiar luz" })).toHaveAttribute("aria-pressed", "mixed");
  await page.getByRole("button", { name: "Cambiar luz" }).click();
  await expect.poll(() => page.evaluate(() => window.cameraTest.torchStates.at(-1))).toBe(false);
  await page.getByRole("button", { name: "Cambiar luz" }).click();
  await expect.poll(() => page.evaluate(() => window.cameraTest.torchStates.at(-1))).toBe(true);
});

test("A missing torch does not prevent a live preview or reopen a different camera", async ({ page }) => {
  await page.goto("/tests/camera/index.html?scenario=unsupported-torch");
  await expectLiveVideo(page);
  await expect(page.getByRole("button", { name: /luz/ })).toHaveCount(0);
  expect(await page.evaluate(() => window.cameraTest.requests.length)).toBe(1);
});

test("Slow camera enumeration does not block video playback or optical initialization", async ({ page }) => {
  await page.goto("/tests/camera/index.html?scenario=slow-enumeration");
  await expect(page.getByRole("button", { name: "Apagar luz" })).toBeVisible({ timeout: 1500 });
  await expect(page.getByRole("button", { name: "Cambiar cámara" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cambiar cámara" })).toBeVisible();
});

test("A previously confirmed rear ID that disappeared falls back once to the current rear camera", async ({ page }) => {
  await page.goto("/tests/camera/index.html");
  await expectLiveVideo(page);
  await expect(page.getByRole("button", { name: "Cambiar cámara" })).toBeVisible();
  await page.getByRole("button", { name: "Toggle scanner" }).click();
  await page.evaluate(() => { window.cameraTest.hideRear = true; });
  await page.getByRole("button", { name: "Toggle scanner" }).click();
  await expect.poll(() => page.locator("video").evaluate(video => video.srcObject?.getVideoTracks()[0]?.getSettings().deviceId)).toBe("rear-replacement");
  expect(await page.evaluate(() => window.cameraTest.requests.length)).toBe(3);
});

test("Incompatible dimensions recover once without device cycling and permissions are never retried", async ({ page }) => {
  await page.goto("/tests/camera/index.html?scenario=relaxed-resolution");
  await expectLiveVideo(page);
  expect(await page.evaluate(() => window.cameraTest.requests.length)).toBe(2);
  expect(await page.evaluate(() => window.cameraTest.requests[1].video.width.min)).toBeUndefined();
  await page.goto("/tests/camera/index.html?scenario=denied");
  await expect(page.getByText(/Permiso de cámara denegado/)).toBeVisible();
  expect(await page.evaluate(() => window.cameraTest.requests.length)).toBe(1);
});

test("Closing while permission or hardware acquisition is pending releases the late stream", async ({ page }) => {
  await page.goto("/tests/camera/index.html?scenario=late-stream");
  await expect.poll(() => page.evaluate(() => window.cameraTest.pending)).toBe(1);
  await page.getByRole("button", { name: "Toggle scanner" }).click();
  await expect.poll(() => page.evaluate(() => window.cameraTest.pending)).toBe(0);
  expect(await page.evaluate(() => window.cameraTest.streams.every(stream => stream.getTracks().every(track => track.readyState === "ended")))).toBe(true);
});
