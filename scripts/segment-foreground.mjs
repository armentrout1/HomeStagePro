import { RawImage } from '@huggingface/transformers';
import { loadFurnitureModel } from './furniture-model.mjs';
import sharp from 'sharp';
let text='';
for await(const chunk of process.stdin){text+=chunk;if(text.length>16_000_000)throw Error('Input too large');}
const {image,boxes}=JSON.parse(text);
const {data:rgb,info}=await sharp(Buffer.from(image,'base64'),{limitInputPixels:4_194_304}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
if(!Array.isArray(boxes)||boxes.length<1||boxes.length>6)throw Error('Invalid objects');
const segmenter = await loadFurnitureModel(true);
const alpha=Buffer.alloc(info.width*info.height);
for(const box of boxes){
  if(!Array.isArray(box)||box.length!==4||box.some(v=>!Number.isFinite(v)||v<0||v>1000)||box[2]<=box[0]||box[3]<=box[1])throw Error('Invalid object bounds');
  const left=Math.max(0,Math.floor((box[0]-25)*info.width/1000)),top=Math.max(0,Math.floor((box[1]-25)*info.height/1000));
  const right=Math.min(info.width,Math.ceil((box[2]+25)*info.width/1000)),bottom=Math.min(info.height,Math.ceil((box[3]+25)*info.height/1000));
  const width=right-left,height=bottom-top;
  const crop=await sharp(rgb,{raw:info}).extract({left,top,width,height}).raw().toBuffer();
  const result=await segmenter(new RawImage(new Uint8Array(crop),width,height,3));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const a=result.data[(y*width+x)*4+3];
    // Reject an incomplete detected box. Never hide a cropped edge in the layer.
    if(a>8&&((x===0&&left>0)||(y===0&&top>0)||(x===width-1&&right<info.width)||(y===height-1&&bottom<info.height)))throw Error('Furniture reaches extraction boundary');
    const p=(top+y)*info.width+left+x;alpha[p]=Math.max(alpha[p],a);
  }
}
const rgba=Buffer.alloc(info.width*info.height*4);
for(let p=0;p<alpha.length;p++){for(let c=0;c<3;c++)rgba[p*4+c]=rgb[p*3+c];rgba[p*4+3]=alpha[p];}
const layer=await sharp(rgba,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
process.stdout.write(JSON.stringify({layer:layer.toString('base64')}));
await segmenter.dispose();
