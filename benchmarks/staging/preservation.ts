import sharp from "sharp";
import { z } from "zod";

export const regionSchema = z.object({
  id:z.string().regex(/^[a-z0-9-]+$/), label:z.string(),
  x:z.number().min(0).max(1), y:z.number().min(0).max(1),
  width:z.number().positive().max(1), height:z.number().positive().max(1),
}).refine(r=>r.x+r.width<=1.000001&&r.y+r.height<=1.000001,"Region must fit inside the source");
export type PreservationRegion = z.infer<typeof regionSchema>;

// Diagnostics only: furniture/shadows can legitimately change pixels. Never use
// whole-image similarity to accept staging, or restore a rectangle over furniture.
export async function comparePreservation(original:Buffer,candidate:Buffer,regions:PreservationRegion[]) {
  const parsed=z.array(regionSchema).parse(regions);
  if(new Set(parsed.map(r=>r.id)).size!==parsed.length)throw new Error("Duplicate region ID");
  const a=await sharp(original).rotate().removeAlpha().toColourspace("srgb").raw().toBuffer({resolveWithObject:true});
  const candidateMeta=await sharp(candidate).rotate().metadata();
  const aw=a.info.width,ah=a.info.height;
  // Permit ordinary output-resolution rounding, never hide a changed framing by cropping.
  const bw=candidateMeta.autoOrient.width,bh=candidateMeta.autoOrient.height;
  if(Math.abs(aw/ah-bw/bh)/(aw/ah)>.005)throw new Error("Candidate aspect ratio changed; inspect framing before pixel comparison");
  const b=await sharp(candidate).rotate().resize(aw,ah,{fit:"fill"}).removeAlpha().toColourspace("srgb").raw().toBuffer();
  const comparisons=[];
  for(const region of parsed){
    const left=Math.floor(region.x*aw),top=Math.floor(region.y*ah);
    const width=Math.min(aw-left,Math.max(1,Math.round(region.width*aw))),height=Math.min(ah-top,Math.max(1,Math.round(region.height*ah)));
    const before=Buffer.alloc(width*height*3),after=Buffer.alloc(before.length),difference=Buffer.alloc(before.length);
    let absoluteError=0,changedPixels=0;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const src=((top+y)*aw+left+x)*3,dst=(y*width+x)*3;let max=0;
      for(let c=0;c<3;c++){const d=Math.abs(a.data[src+c]-b[src+c]);absoluteError+=d;max=Math.max(max,d);before[dst+c]=a.data[src+c];after[dst+c]=b[src+c];difference[dst+c]=Math.min(255,d*4);}
      if(max>16)changedPixels++;
    }
    const encode=(buffer:Buffer)=>sharp(buffer,{raw:{width,height,channels:3}}).png().toBuffer();
    comparisons.push({region,meanAbsoluteError:absoluteError/before.length,fractionPixelsOver16:changedPixels/(width*height),
      before:await encode(before),after:await encode(after),difference:await encode(difference)});
  }
  return { normalizedTo:{width:aw,height:ah}, candidateWasResized:aw!==bw||ah!==bh, comparisons };
}
