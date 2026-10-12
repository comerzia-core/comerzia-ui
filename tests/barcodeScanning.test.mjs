import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { BarcodeFormat, BinaryBitmap, HybridBinarizer, RGBLuminanceSource } from "@zxing/library";
import { createBarcodeReader } from "../src/utils/barcodeScanning.ts";

// El fixture se genera mediante gradlew test --tests '*LabelRendererTest', sin red ni impresora.
const fixtureUrl = new URL("../../comerzia/build/label-validation/barcode7003000100006.json", import.meta.url);
const fixture = JSON.parse(readFileSync(fixtureUrl, "utf8"));
const packed = Buffer.from(fixture.bitmapBase64, "base64");
const width = fixture.heightDots;
const height = fixture.widthDots;
const pixels = new Uint8ClampedArray(width * height);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const px = fixture.widthDots - 1 - y;
  pixels[y * width + x] = packed[x * fixture.widthBytes + (px >> 3)] & (0x80 >> (px % 8)) ? 255 : 0;
}

function bitmap(data, w, h) {
  return new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(data, w, h)));
}

function resample(scale, blur = false) {
  const w = Math.round(width * scale), h = Math.round(height * scale);
  const data = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = Math.min(width - 1, Math.floor(x / scale));
    const sy = Math.min(height - 1, Math.floor(y / scale));
    let total = 0, count = 0;
    const radius = blur ? 1 : 0;
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      const nx = Math.min(width-1, Math.max(0, sx+dx));
      const ny = Math.min(height-1, Math.max(0, sy+dy));
      total += pixels[ny * width + nx]; count++;
    }
    data[y * w + x] = total / count;
  }
  return bitmap(data, w, h);
}

test("The frontend reader recovers the exact barcode from the agent raster", () => {
  const result = createBarcodeReader().decodeWithState(bitmap(pixels, width, height));
  assert.equal(result.getText(), "7003000100006");
  assert.equal(result.getBarcodeFormat(), BarcodeFormat.CODE_128);
  assert.equal(fixture.moduleDots, 3);
});

for (const [scale, blur] of [[0.75,false], [0.5,false], [1,true], [0.75,true]]) {
  test("The barcode survives image scale " + scale + " and blur " + blur, () => {
    assert.equal(createBarcodeReader().decodeWithState(resample(scale, blur)).getText(), "7003000100006");
  });
}

test("Valid supplier EAN13 remains supported", () => {
  const supplier = JSON.parse(readFileSync(new URL("../../comerzia/build/label-validation/supplier-ean13.json",import.meta.url),"utf8"));
  const packed = Buffer.from(supplier.bitmapBase64,"base64");
  const data = new Uint8ClampedArray(supplier.widthDots * supplier.heightDots);
  for (let y=0;y<supplier.heightDots;y++) for (let x=0;x<supplier.widthDots;x++)
    data[y*supplier.widthDots+x] = packed[y*supplier.widthBytes+(x>>3)] & (0x80>>(x%8)) ? 255 : 0;
  const result = createBarcodeReader().decodeWithState(bitmap(data,supplier.widthDots,supplier.heightDots));
  assert.equal(result.getText(),"5901234123457");
  assert.equal(result.getBarcodeFormat(),BarcodeFormat.EAN_13);
});

for (const scale of [1, 0.75, 0.5]) {
  test("Small-label QR keeps the product code at camera scale " + scale, () => {
    const qr = JSON.parse(readFileSync(new URL("../../comerzia/build/label-validation/label30x20-qr.json", import.meta.url), "utf8"));
    const packed = Buffer.from(qr.bitmapBase64, "base64");
    const w = Math.round(qr.widthDots * scale), h = Math.round(qr.heightDots * scale);
    const data = new Uint8ClampedArray(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const px = Math.min(qr.widthDots - 1, Math.floor(x / scale)), py = Math.min(qr.heightDots - 1, Math.floor(y / scale));
      data[y * w + x] = packed[py * qr.widthBytes + (px >> 3)] & (0x80 >> (px % 8)) ? 255 : 0;
    }
    const result = createBarcodeReader().decodeWithState(bitmap(data, w, h));
    assert.equal(result.getText(), "7003000100006");
    assert.equal(result.getBarcodeFormat(), BarcodeFormat.QR_CODE);
  });
}

