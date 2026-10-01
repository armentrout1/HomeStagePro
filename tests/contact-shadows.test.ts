import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { addContactShadows } from "../server/utils/contactShadows";
import { compositeFurnitureLayer } from "../server/utils/furnitureLayer";

test("contact shadows keep solid objects intact and never copy scene background texture", async () => {
  const width=200,height=160;
  const original=await sharp({create:{width,height,channels:3,background:{r:200,g:160,b:120}}}).png().toBuffer();
  const raw=Buffer.alloc(width*height*4);
  for(let y=50;y<100;y++)for(let x=50;x<100;x++){const p=(y*width+x)*4;raw[p]=240;raw[p+1]=220;raw[p+2]=210;raw[p+3]=255;}
  const layer=await sharp(raw,{raw:{width,height,channels:4}}).png().toBuffer();
  // A deliberately wrong, dark blue background must contribute only local neutral darkening.
  const scene=await sharp({create:{width,height,channels:3,background:{r:20,g:30,b:100}}}).png().toBuffer();
  const result=await addContactShadows(original,scene,layer);
  assert.ok(result.shadowPixels>0);
  const alpha=await sharp(result.layer).raw().toBuffer();
  for(let p=0;p<width*height;p++)if(raw[p*4+3]===255)assert.deepEqual(alpha.subarray(p*4,p*4+4),raw.subarray(p*4,p*4+4));
  const mask=await sharp({create:{width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).png().toBuffer();
  const composite=await compositeFurnitureLayer(original,result.layer,mask);
  const pixels=await sharp(composite.image).raw().toBuffer();
  assert.deepEqual([...pixels.subarray(0,3)],[200,160,120]);
  const q=(102*width+70)*3;
  assert.ok(pixels[q]<200);
  assert.ok(Math.abs(pixels[q]/200-pixels[q+1]/160)<0.01,"source color and texture are retained");
  assert.equal(alpha[(40*width+70)*4+3],0,"no shadow around the upper silhouette");
  // A shadow crossing customer protection rejects the complete result, not just the shadow pixels.
  const protectedRaw=Buffer.alloc(width*height*4);protectedRaw[(102*width+70)*4+3]=255;
  const protectedMask=await sharp(protectedRaw,{raw:{width,height,channels:4}}).png().toBuffer();
  await assert.rejects(compositeFurnitureLayer(original,result.layer,protectedMask),/protected pixels/);
});

test("a brighter scene cannot brighten or repaint the original background",async()=>{
  const source=await sharp({create:{width:64,height:64,channels:3,background:"#aaa"}}).png().toBuffer();
  const scene=await sharp({create:{width:64,height:64,channels:3,background:"white"}}).png().toBuffer();
  const rgba=Buffer.alloc(64*64*4);for(let y=20;y<50;y++)for(let x=20;x<50;x++){const p=(y*64+x)*4;rgba[p]=100;rgba[p+3]=255;}
  const layer=await sharp(rgba,{raw:{width:64,height:64,channels:4}}).png().toBuffer();
  const result=await addContactShadows(source,scene,layer);
  assert.equal(result.shadowPixels,0);
  assert.deepEqual(await sharp(result.layer).raw().toBuffer(),rgba);
});
