import {writeFile} from "node:fs/promises";
import {client} from "../server/db";
import {supabase} from "../server/supabase";
import {jobBucket,storagePrefix} from "../server/jobFiles";

// Read-only by construction: this script has no storage/database mutation path.
const origin=process.env.PUBLIC_APP_URL;
const expected=process.argv.find(x=>x.startsWith("--origin="))?.slice(9);
const output=process.argv.find(x=>x.startsWith("--output="))?.slice(9);
if(!origin||!expected||new URL(origin).origin!==expected||!output)throw Error("Specify the exact configured --origin and a private --output file.");
const prefix=storagePrefix(), cutoff=Date.now()-86400000;
const limit=10000, folderLimit=500;
let folders=0,files=0,complete=true;
const candidates:{path:string;reason:string}[]=[];
try{
 const rows=await client`SELECT id,state,purged_at FROM staging_jobs LIMIT 10001`;
 const known=new Map(rows.map(row=>[row.id,row]));
 if(rows.length>limit)complete=false;
 const walk=async(path:string):Promise<void>=>{
  if(++folders>folderLimit){complete=false;return;}
  for(let offset=0;;offset+=1000){
   const {data,error}=await supabase.storage.from(jobBucket).list(path,{limit:1000,offset,sortBy:{column:"name",order:"asc"}});
   if(error)throw Error("Storage inventory could not be completed");
   for(const item of data||[]){
    if(!item.name||item.name.includes("/")||item.name===".."||item.name==="."){complete=false;continue;}
    const file=path+"/"+item.name;
    if(!item.id){await walk(file);if(folders>folderLimit)return;continue;}
    if(++files>limit){complete=false;return;}
    const relative=file.slice(prefix.length+1).split("/");
    const id=relative[0]==="results"?relative[2]:relative[0]==="inputs"?relative[1]:undefined;
    const row=known.get(id);const updated=Date.parse(item.updated_at||item.created_at||"");
    if(!Number.isFinite(updated)||updated>=cutoff)continue;
    if(!row&&rows.length<=limit)candidates.push({path:file,reason:"No matching job; older than 24 hours. Review before any deletion."});
    else if(row?.purged_at)candidates.push({path:file,reason:"Residual file for an explicitly purged job. Review before any deletion."});
    else if(relative[0]==="inputs"&&row?.state!=="processing")candidates.push({path:file,reason:"Terminal job input remains; verify its worker and cleanup state."});
   }
   if((data?.length||0)<1000)return;
  }
 };
 await walk(prefix+"/results");if(files<=limit&&folders<=folderLimit)await walk(prefix+"/inputs");
 const report={mode:"read-only",origin:expected,prefix,complete,filesInspected:files,foldersInspected:folders,jobsInspected:rows.length,candidates};
 await writeFile(output,JSON.stringify(report,null,2));
 console.log(JSON.stringify({mode:report.mode,complete,filesInspected:files,candidates:candidates.length}));
}finally{await client.end();}
