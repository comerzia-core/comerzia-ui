import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const streams = [];
    window.cameraTest = { streams, requests: [], opticalConstraints: [] };
    Object.defineProperty(navigator.mediaDevices, "enumerateDevices", { value: async () => [
      { deviceId: "rear-camera", kind: "videoinput", label: "Rear camera", groupId: "cameras" },
      { deviceId: "front-camera", kind: "videoinput", label: "Front camera", groupId: "cameras" },
    ] });
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", { value: async constraints => {
      window.cameraTest.requests.push(constraints);
      const deviceId = constraints.video?.deviceId?.exact || "rear-camera";
      const canvas = document.createElement("canvas");
      canvas.width = 640; canvas.height = 480;
      const context = canvas.getContext("2d");
      let frame = 0;
      const stream = canvas.captureStream(30);
      const track = stream.getVideoTracks()[0];
      track.getSettings = () => ({ deviceId, width: 640, height: 480, frameRate: 30 });
      track.getCapabilities = () => ({ torch: true, focusMode: ["continuous"], exposureMode: ["continuous"] });
      track.applyConstraints = async constraints => {
        if (track.readyState === "ended") throw new DOMException("The camera track has stopped.","AbortError");
        window.cameraTest.opticalConstraints.push(constraints);
      };
      streams.push(stream);
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
  await expect(page.getByRole("button", { name: "Apagar luz" })).toHaveAttribute("aria-pressed","true");
});

for (const [filename, expectedCode] of [["barcode7003000100006.json","7003000100006"],["label31x57.json","12345678"]]) {
  test("A live camera frame emits barcode " + expectedCode + " once and releases the camera", async ({ page }) => {
    const fixture = JSON.parse(readFileSync(new URL("../../../comerzia/build/label-validation/" + filename,import.meta.url),"utf8"));
    await page.goto("/tests/camera/index.html");
    await expectLiveVideo(page);
    await page.evaluate(fixture => {
      const packed = Uint8Array.from(atob(fixture.bitmapBase64), char => char.charCodeAt(0));
      const canvas = document.createElement("canvas");
      canvas.width = fixture.heightDots; canvas.height = fixture.widthDots;
      const context = canvas.getContext("2d");
      const image = context.createImageData(canvas.width,canvas.height);
      for (let y=0;y<canvas.height;y++) for (let x=0;x<canvas.width;x++) {
        const physicalX = fixture.widthDots-1-y;
        const value = packed[x*fixture.widthBytes+(physicalX>>3)] & (0x80>>(physicalX%8)) ? 255 : 0;
        const offset=(y*canvas.width+x)*4;
        image.data[offset]=value; image.data[offset+1]=value; image.data[offset+2]=value; image.data[offset+3]=255;
      }
      context.putImageData(image,0,0);
      window.cameraTest.labelCanvas=canvas;
    },fixture);
    await expect.poll(() => page.evaluate(() => document.body.dataset.scanned)).toBe(expectedCode);
    expect(await page.evaluate(() => document.body.dataset.scanCount)).toBe("1");
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
