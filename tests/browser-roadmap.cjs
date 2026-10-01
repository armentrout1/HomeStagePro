const { chromium } = require('playwright');
const { createServer } = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const repo = path.resolve(__dirname, '..');
const output = process.env.BROWSER_TEST_OUTPUT || path.join(repo, 'temp', 'browser-tests');
fs.mkdirSync(output, {recursive:true});
let posts = 0, jobId = null, polls = 0;
let savedReads = 0;
const exchangedTokens = [];
let inactivePack = false;
const trashed=new Set(),purged=new Set(); let permanentDeletes=0;
const savedJobs = Array.from({length:31}, (_, i) => ({id:`00000000-0000-4000-8000-${String(i).padStart(12,'0')}`,state:'completed',room_type:'Living Room',mode:'furnish',thumbnailUrl:'/staging-examples/living-1-after.webp',created_at:new Date(Date.UTC(2026,8,30,12,0,i)).toISOString()}));
const submittedIds = new Set();
const send = (res, data, status = 200) => { res.writeHead(status, {'Content-Type':'application/json'}); res.end(JSON.stringify(data)); };
const server = createServer(async (req,res) => {
  const url = new URL(req.url,'http://localhost');
  if(url.pathname==='/api/access/exchange') {
    let body=''; for await(const chunk of req) body+=chunk;
    const token=JSON.parse(body).token;
    if(token==='fixture-inactive') {inactivePack=true;return send(res,{error:'This pack has expired or is no longer active. Request your current access links below.'},401);}
    exchangedTokens.push(token); return send(res,{success:true});
  }
  if(url.pathname==='/api/usage-status') return send(res,{status:'premium',paidRemaining:5,totalRemaining:5,paidGranted:5,paidUsed:0});
  if(url.pathname==='/api/create-checkout-session') return send(res,{url:'/thank-you?session_id=cs_browser_fixture'});
  if(url.pathname==='/api/checkout-status') return send(res,{status:'complete',planName:'Quick Pack',usageAllowed:5,orderId:'order_fixture',livePayment:false,price:9,emailDeliveryConfigured:true});
  if(url.pathname==='/api/generate-staged-room') {
    posts++; let body=''; for await(const chunk of req) body+=chunk;
    jobId=JSON.parse(body).requestId;
    submittedIds.add(jobId);
    req.socket.destroy(); return;
  }
  if(url.pathname===`/api/staging-jobs/${jobId}`) {
    polls++; return send(res,{state:'completed',data:{requestId:jobId,promptHash:'fixture',stagedSignedUrl:'/staging-examples/living-1-after.webp'}});
  }
  const mutation=url.pathname.match(/^\/api\/staging-jobs\/(00000000-[a-f0-9-]+)(?:\/(trash|restore))?$/);
  if(mutation&&req.method!=='GET'){
    const [,id,action]=mutation;
    if(action==='trash')trashed.add(id);else if(action==='restore')trashed.delete(id);else if(req.method==='DELETE'){purged.add(id);permanentDeletes++;}
    return send(res,{success:true});
  }
  if(url.pathname==='/api/staging-jobs') {
    if(inactivePack)return send(res,{error:'Access required'},402);
    const rows=savedJobs.filter(j=>!purged.has(j.id)&&trashed.has(j.id)===(url.searchParams.get('view')==='trash'));
    const start=url.searchParams.has('before')?rows.findIndex(j=>j.id===url.searchParams.get('before'))+1:0;
    return send(res,rows.slice(start,start+30));
  }
  if(url.pathname.startsWith('/api/staging-jobs/00000000-')) { savedReads++; return send(res,{state:'completed',data:{stagedSignedUrl:'/staging-examples/living-1-after.webp'}}); }
  if(url.pathname.startsWith('/api/')) return send(res,{error:'Fixture does not implement this endpoint'},404);
  const publicRoot=path.join(repo,'dist/public');
  let file=path.resolve(publicRoot,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(publicRoot+path.sep) && file!==publicRoot) {res.writeHead(404);return res.end();}
  if(!fs.existsSync(file)||fs.statSync(file).isDirectory()) {
    const prebuilt=path.join(repo,'dist/prerender',encodeURIComponent(url.pathname)+'.html');
    file=fs.existsSync(prebuilt)?prebuilt:path.join(publicRoot,'index.html');
  }
  const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}); fs.createReadStream(file).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(5181,'127.0.0.1',resolve));
  let browser;
  const results=[];
  try {
    browser=await chromium.launch({headless:true, ...(process.env.BROWSER_CHANNEL ? {channel:process.env.BROWSER_CHANNEL} : {})});
    const context=await browser.newContext({viewport:{width:1280,height:900}});
    const page=await context.newPage();
    const errors=[]; page.on('pageerror', e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:5181/',{waitUntil:'networkidle'});
    await page.locator('input[type=file]').setInputFiles(path.join(repo,'client/public/staging-examples/living-1-before.webp'));
    await page.getByRole('heading',{name:'Choose where furniture can change'}).waitFor();
    await page.getByRole('combobox').filter({has:page.locator('option[value=replace]')}).selectOption('replace');
    await page.getByRole('button',{name:'Protect everything',exact:true}).click();
    await page.getByRole('button',{name:'Undo selection'}).click();
    await page.getByRole('combobox',{name:'Photo zoom'}).selectOption('150');
    await page.getByRole('combobox',{name:'Photo zoom'}).selectOption('100');
    await page.waitForTimeout(250);
    const before = await page.locator('canvas').evaluate(c=>c.toDataURL());
    await page.getByRole('navigation').getByRole('link',{name:'Pricing',exact:true}).click();
    await page.getByRole('button',{name:/Quick Pack, \$9/}).click();
    await page.getByRole('heading',{name:'Thank You For Your Purchase!'}).waitFor();
    await page.getByRole('button',{name:'Start Staging',exact:true}).click();
    await page.getByText('Your photo and edit selection were restored on this device.').waitFor();
    await page.getByRole('heading',{name:'Choose where furniture can change'}).waitFor();
    await page.waitForTimeout(250);
    assert.equal(await page.locator('canvas').evaluate(c=>c.toDataURL()),before);
    assert.equal(await page.locator('select').filter({has:page.locator('option[value=replace]')}).inputValue(),'replace');
    results.push({test:'checkout restores photo, exact selection and mode',result:'pass'});
    await page.getByRole('button',{name:'Stage Room',exact:true}).click();
    await page.getByRole('img',{name:'Staged room',exact:true}).last().waitFor();
    assert.equal(submittedIds.size,1); assert.ok(polls>=1);
    results.push({test:'lost POST response automatically reconnects with one generation ID',result:'pass',httpAttempts:posts,uniqueGenerationIds:submittedIds.size});
    await page.screenshot({path:path.join(output,'roadmap-desktop-check.png'),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('button',{name:'Toggle mobile menu'}).click();
    const dialog=page.getByRole('dialog',{name:'RoomStagerPro menu'}); await dialog.waitFor();
    for(let i=0;i<12;i++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(()=>Boolean(document.activeElement.closest('[role=dialog]'))),true); }
    await page.keyboard.press('Escape');
    await dialog.waitFor({state:'hidden'});
    // Radix restores focus after unmount; wait for that lifecycle on slower CI runners.
    await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Toggle mobile menu');
    assert.equal(await page.getByRole('button',{name:'Toggle mobile menu'}).evaluate(e=>e===document.activeElement),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
    results.push({test:'mobile dialog focus trap, Escape and no horizontal overflow',result:'pass'});
    await page.screenshot({path:path.join(output,'roadmap-mobile-check.png'),fullPage:true});
    await page.goto('http://127.0.0.1:5181/access',{waitUntil:'networkidle'});
    assert.equal(await page.getByRole('button',{name:/Ready · open image/}).count(),30);
    await page.getByRole('button',{name:'Load older images'}).click();
    await page.getByRole('button',{name:/Ready · open image/}).nth(30).waitFor();
    await page.getByRole('button',{name:/Ready · open image/}).last().click();
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button',{name:'Download image',exact:true}).click();
    assert.equal((await downloadEvent).suggestedFilename(),'virtually-staged-room.png');
    assert.equal(savedReads,2);
    results.push({test:'older saved images load and download refreshes the private URL',result:'pass'});
    await page.getByRole('button',{name:'Move to Trash',exact:true}).first().click();
    await page.getByText('Moved to Trash. You can restore it there.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Trash',exact:true}).click();
    await page.getByRole('button',{name:'Restore image',exact:true}).click();
    await page.getByText('Trash is empty.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Saved images',exact:true}).click();
    await page.getByRole('button',{name:'Move to Trash',exact:true}).first().click();
    await page.getByText('Moved to Trash. You can restore it there.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Trash',exact:true}).click();
    await page.getByRole('button',{name:'Delete permanently',exact:true}).click();
    const deleteDialog=page.getByRole('alertdialog');await deleteDialog.waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
    await page.getByRole('button',{name:'Keep in Trash',exact:true}).click();
    assert.equal(permanentDeletes,0);
    await page.getByRole('button',{name:'Delete permanently',exact:true}).click();
    await page.getByRole('button',{name:'Delete these files permanently',exact:true}).click();
    await page.getByText('Trash is empty.',{exact:true}).waitFor();assert.equal(permanentDeletes,1);
    await page.getByRole('button',{name:'Saved images',exact:true}).click();
    await page.getByRole('button',{name:/Ready · open image/}).nth(29).waitFor();
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:path.join(output,'saved-images-mobile.png'),fullPage:false});
    await page.setViewportSize({width:1280,height:900});
    await page.screenshot({path:path.join(output,'saved-images-desktop.png'),fullPage:false});
    results.push({test:'saved-image cards, Trash, restore, and cancel/confirm permanent deletion on mobile',result:'pass'});
    // Emulate opening an emailed link while /access is already mounted.
    for(const token of ['fixture-pack-one','fixture-pack-two']) {
      await page.goto('http://127.0.0.1:5181/access#token='+token);
      await page.waitForFunction(()=>window.location.hash==='');
      await page.getByRole('status').getByText('Your pack is open on this device.',{exact:false}).waitFor();
      await page.getByRole('button',{name:/Ready · open image/}).nth(29).waitFor();
    }
    assert.deepEqual(exchangedTokens,['fixture-pack-one','fixture-pack-two']);
    assert.equal(await page.getByRole('button',{name:'Download image',exact:true}).count(),0);
    await page.goto('http://127.0.0.1:5181/access#token=fixture-inactive');
    await page.waitForLoadState('networkidle');
    await page.getByRole('status').getByText('This pack has expired or is no longer active.',{exact:false}).waitFor();
    results.push({test:'emailed links activate an open access page, clear old previews and explain inactive packs',result:'pass'});
    assert.deepEqual(errors,[]);
    results.push({test:'production hydration and browser JavaScript errors',result:'pass'});
    fs.writeFileSync(path.join(output,'roadmap-browser-check.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify(results));
  } finally { await browser?.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(e=>{console.error(e);process.exitCode=1;});
