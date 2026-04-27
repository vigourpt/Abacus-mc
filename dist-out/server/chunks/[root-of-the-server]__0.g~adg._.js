module.exports=[93695,(e,t,a)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},18622,(e,t,a)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,a)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},14747,(e,t,a)=>{t.exports=e.x("path",()=>require("path"))},85148,(e,t,a)=>{t.exports=e.x("better-sqlite3-90e2652d1716b047",()=>require("better-sqlite3-90e2652d1716b047"))},22734,(e,t,a)=>{t.exports=e.x("fs",()=>require("fs"))},43793,e=>{"use strict";var t=e.i(85148),a=e.i(14747);let r=process.env.DATABASE_PATH||a.default.join(process.cwd(),"data","mission-control.db"),n=null;function s(){if(!n){var s;let i=e.r(22734),o=a.default.dirname(r);i.existsSync(o)||i.mkdirSync(o,{recursive:!0}),(n=new t.default(r)).pragma("journal_mode = WAL"),(s=n).exec(`
    CREATE TABLE IF NOT EXISTS agent_definitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `),s.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      agent_slug TEXT NOT NULL,
      task TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      result TEXT,
      error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (agent_slug) REFERENCES agent_definitions(slug)
    )
  `),s.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)
  `),s.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_agent_slug ON tasks(agent_slug)
  `),s.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      agent_slug TEXT,
      task_id TEXT,
      message TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `),s.exec(`
    CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC)
  `),s.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      agent_slug TEXT NOT NULL,
      title TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (agent_slug) REFERENCES agent_definitions(slug)
    )
  `),s.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    )
  `),s.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)
  `)}return n}function i(e){return s().prepare("SELECT * FROM tasks WHERE id = ?").get(e)}function o(e){return s().prepare("SELECT * FROM conversations WHERE id = ?").get(e)}e.s(["createConversation",0,function(e,t,a){return s().prepare(`
    INSERT INTO conversations (id, agent_slug, title)
    VALUES (?, ?, ?)
  `).run(e,t,a??null),o(e)},"createMessage",0,function(e,t,a,r){var n;return s().prepare(`
    INSERT INTO messages (id, conversation_id, role, content)
    VALUES (?, ?, ?, ?)
  `).run(e,t,a,r),s().prepare('UPDATE conversations SET updated_at = datetime("now") WHERE id = ?').run(t),n=e,s().prepare("SELECT * FROM messages WHERE id = ?").get(n)},"createTask",0,function(e,t,a){return s().prepare(`
    INSERT INTO tasks (id, agent_slug, task, status)
    VALUES (?, ?, ?, 'pending')
  `).run(e,t,a),i(e)},"deleteConversation",0,function(e){let t=s();t.prepare("DELETE FROM messages WHERE conversation_id = ?").run(e),t.prepare("DELETE FROM conversations WHERE id = ?").run(e)},"getAgentBySlug",0,function(e){return s().prepare("SELECT * FROM agent_definitions WHERE slug = ?").get(e)},"getAllAgents",0,function(){return s().prepare("SELECT * FROM agent_definitions ORDER BY name").all()},"getAllConversations",0,function(){return s().prepare("SELECT * FROM conversations ORDER BY updated_at DESC").all()},"getAllTasks",0,function(){return s().prepare("SELECT * FROM tasks ORDER BY created_at DESC").all()},"getConversationById",0,o,"getMessagesByConversation",0,function(e){return s().prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC").all(e)},"getRecentActivity",0,function(e=50){return s().prepare("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?").all(e)},"getTaskById",0,i,"logActivity",0,function(e,t,a,r,n){s().prepare(`
    INSERT INTO activity_log (event_type, agent_slug, task_id, message, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).run(e,a??null,r??null,t,n?JSON.stringify(n):null)},"updateTaskStatus",0,function(e,t,a,r){let n=s();"completed"===t||"failed"===t?n.prepare(`
      UPDATE tasks 
      SET status = ?, result = ?, error = ?, updated_at = datetime('now'), completed_at = datetime('now')
      WHERE id = ?
    `).run(t,a??null,r??null,e):n.prepare(`
      UPDATE tasks 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(t,e)}])},66680,(e,t,a)=>{t.exports=e.x("node:crypto",()=>require("node:crypto"))},89960,e=>{"use strict";var t=e.i(66680);let a={randomUUID:t.randomUUID},r=new Uint8Array(256),n=r.length,s=[];for(let e=0;e<256;++e)s.push((e+256).toString(16).slice(1));e.s(["v4",0,function(e,i,o){if(a.randomUUID&&!i&&!e)return a.randomUUID();var d=e,l=o;let u=(d=d||{}).random??d.rng?.()??(n>r.length-16&&((0,t.randomFillSync)(r),n=0),r.slice(n,n+=16));if(u.length<16)throw Error("Random bytes length must be >= 16");if(u[6]=15&u[6]|64,u[8]=63&u[8]|128,i){if((l=l||0)<0||l+16>i.length)throw RangeError(`UUID byte range ${l}:${l+15} is out of buffer bounds`);for(let e=0;e<16;++e)i[l+e]=u[e];return i}return function(e,t=0){return(s[e[t+0]]+s[e[t+1]]+s[e[t+2]]+s[e[t+3]]+"-"+s[e[t+4]]+s[e[t+5]]+"-"+s[e[t+6]]+s[e[t+7]]+"-"+s[e[t+8]]+s[e[t+9]]+"-"+s[e[t+10]]+s[e[t+11]]+s[e[t+12]]+s[e[t+13]]+s[e[t+14]]+s[e[t+15]]).toLowerCase()}(u)}],89960)},7078,e=>{"use strict";var t=e.i(47909),a=e.i(74017),r=e.i(96250),n=e.i(59756),s=e.i(61916),i=e.i(74677),o=e.i(69741),d=e.i(16795),l=e.i(87718),u=e.i(95169),c=e.i(47587),p=e.i(66012),E=e.i(70101),T=e.i(26937),g=e.i(10372),R=e.i(93695);e.i(52474);var v=e.i(220),x=e.i(89171),m=e.i(89960),f=e.i(43793),N=e.i(22838);async function S(e){try{let t=await e.json();if(!t.agentSlug||!t.task)return x.NextResponse.json({error:"Missing agentSlug or task"},{status:400});let a=(0,f.getAgentBySlug)(t.agentSlug);if(!a)return x.NextResponse.json({error:`Agent '${t.agentSlug}' not found`},{status:404});let r=(0,m.v4)();return(0,f.createTask)(r,t.agentSlug,t.task),(0,f.logActivity)("task.created",`Task queued for agent ${t.agentSlug}`,t.agentSlug,r),h(r,a.content,t.task,t.sessionId).catch(e=>{console.error(`Task ${r} failed:`,e),(0,f.updateTaskStatus)(r,"failed",void 0,e.message),(0,f.logActivity)("task.failed",e.message,t.agentSlug,r)}),x.NextResponse.json({taskId:r,status:"pending",message:"Task created and queuing for execution"})}catch(e){return console.error("Execute error:",e),x.NextResponse.json({error:"Internal server error"},{status:500})}}async function A(e){let t=e.nextUrl.searchParams.get("taskId");if(!t)return x.NextResponse.json({error:"Missing taskId"},{status:400});let a=(0,f.getTaskById)(t);return a?x.NextResponse.json({taskId:a.id,status:a.status,result:a.result,error:a.error,createdAt:a.created_at,completedAt:a.completed_at}):x.NextResponse.json({error:"Task not found"},{status:404})}async function h(e,t,a,r){(0,f.updateTaskStatus)(e,"running"),(0,f.logActivity)("task.started","Executing task via OpenClaw gateway",void 0,e);try{let n,s,i=(0,N.getGatewayClient)();i.connected||await i.connect();let o=(s=(n=t.replace(/^---[\s\S]*?---\n/,"")).match(/^#\s+(?:Role|Persona|Agent)[\s\S]*?$/mi))&&s.index&&s.index>0?n.slice(0,s.index).trim():n.trim(),d=r||i.createSession(),l=await i.agentInvoke(a,void 0,o||void 0,d);(0,f.logActivity)("task.dispatched",`Task dispatched to gateway (session: ${l.sessionId}, taskId: ${l.taskId})`,void 0,e),(0,f.updateTaskStatus)(e,"completed",JSON.stringify({sessionId:l.sessionId,taskId:l.taskId,status:l.status,gateway:"managed"})),(0,f.logActivity)("task.completed","Task completed via gateway",void 0,e)}catch(a){console.error(`Task ${e} execution error:`,a);let t=a instanceof Error?a.message:String(a);throw(0,f.updateTaskStatus)(e,"failed",void 0,t),(0,f.logActivity)("task.error",t,void 0,e),a}}e.s(["GET",0,A,"POST",0,S,"dynamic",0,"force-dynamic","runtime",0,"nodejs"],63898);var I=e.i(63898);let _=new t.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/agents/execute/route",pathname:"/api/agents/execute",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/agents/execute/route.ts",nextConfigOutput:"",userland:I}),{workAsyncStorage:y,workUnitAsyncStorage:C,serverHooks:O}=_;async function k(e,t,r){r.requestMeta&&(0,n.setRequestMeta)(e,r.requestMeta),_.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let x="/api/agents/execute/route";x=x.replace(/\/index$/,"")||"/";let m=await _.prepare(e,t,{srcPage:x,multiZoneDraftMode:!1});if(!m)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:f,params:N,nextConfig:S,parsedUrl:A,isDraftMode:h,prerenderManifest:I,routerServerContext:y,isOnDemandRevalidate:C,revalidateOnlyGenerated:O,resolvedPathname:k,clientReferenceManifest:w,serverActionsManifest:L}=m,U=(0,o.normalizeAppPath)(x),X=!!(I.dynamicRoutes[U]||I.routes[k]),D=async()=>((null==y?void 0:y.render404)?await y.render404(e,t,A,!1):t.end("This page could not be found"),null);if(X&&!h){let e=!!I.routes[k],t=I.dynamicRoutes[U];if(t&&!1===t.fallback&&!e){if(S.adapterPath)return await D();throw new R.NoFallbackError}}let F=null;!X||_.isDev||h||(F="/index"===(F=k)?"/":F);let b=!0===_.isDev||!X,M=X&&!b;L&&w&&(0,i.setManifestsSingleton)({page:x,clientReferenceManifest:w,serverActionsManifest:L});let P=e.method||"GET",q=(0,s.getTracer)(),H=q.getActiveScopeSpan(),j=!!(null==y?void 0:y.isWrappedByNextServer),B=!!(0,n.getRequestMeta)(e,"minimalMode"),Y=(0,n.getRequestMeta)(e,"incrementalCache")||await _.getIncrementalCache(e,S,I,B);null==Y||Y.resetRequestCache(),globalThis.__incrementalCache=Y;let $={params:N,previewProps:I.preview,renderOpts:{experimental:{authInterrupts:!!S.experimental.authInterrupts},cacheComponents:!!S.cacheComponents,supportsDynamicResponse:b,incrementalCache:Y,cacheLifeProfiles:S.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,a,r,n)=>_.onRequestError(e,t,r,n,y)},sharedContext:{buildId:f}},K=new d.NodeNextRequest(e),W=new d.NodeNextResponse(t),G=l.NextRequestAdapter.fromNodeNextRequest(K,(0,l.signalFromNodeResponse)(t));try{let n,i=async e=>_.handle(G,$).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let a=q.getRootSpanAttributes();if(!a)return;if(a.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${a.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let r=a.get("next.route");if(r){let t=`${P} ${r}`;e.setAttributes({"next.route":r,"http.route":r,"next.span_name":t}),e.updateName(t),n&&n!==e&&(n.setAttribute("http.route",r),n.updateName(t))}else e.updateName(`${P} ${x}`)}),o=async n=>{var s,o;let d=async({previousCacheEntry:a})=>{try{if(!B&&C&&O&&!a)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await i(n);e.fetchMetrics=$.renderOpts.fetchMetrics;let o=$.renderOpts.pendingWaitUntil;o&&r.waitUntil&&(r.waitUntil(o),o=void 0);let d=$.renderOpts.collectedTags;if(!X)return await (0,p.sendResponse)(K,W,s,$.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,E.toNodeOutgoingHttpHeaders)(s.headers);d&&(t[g.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let a=void 0!==$.renderOpts.collectedRevalidate&&!($.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&$.renderOpts.collectedRevalidate,r=void 0===$.renderOpts.collectedExpire||$.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:$.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:a,expire:r}}}}catch(t){throw(null==a?void 0:a.isStale)&&await _.onRequestError(e,t,{routerKind:"App Router",routePath:x,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:M,isOnDemandRevalidate:C})},!1,y),t}},l=await _.handleResponse({req:e,nextConfig:S,cacheKey:F,routeKind:a.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:I,isRoutePPREnabled:!1,isOnDemandRevalidate:C,revalidateOnlyGenerated:O,responseGenerator:d,waitUntil:r.waitUntil,isMinimalMode:B});if(!X)return null;if((null==l||null==(s=l.value)?void 0:s.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(o=l.value)?void 0:o.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});B||t.setHeader("x-nextjs-cache",C?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),h&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,E.fromNodeOutgoingHttpHeaders)(l.value.headers);return B&&X||u.delete(g.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,T.getCacheControlHeader)(l.cacheControl)),await (0,p.sendResponse)(K,W,new Response(l.value.body,{headers:u,status:l.value.status||200})),null};j&&H?await o(H):(n=q.getActiveScopeSpan(),await q.withPropagatedContext(e.headers,()=>q.trace(u.BaseServerSpan.handleRequest,{spanName:`${P} ${x}`,kind:s.SpanKind.SERVER,attributes:{"http.method":P,"http.target":e.url}},o),void 0,!j))}catch(t){if(t instanceof R.NoFallbackError||await _.onRequestError(e,t,{routerKind:"App Router",routePath:U,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:M,isOnDemandRevalidate:C})},!1,y),X)throw t;return await (0,p.sendResponse)(K,W,new Response(null,{status:500})),null}}e.s(["handler",0,k,"patchFetch",0,function(){return(0,r.patchFetch)({workAsyncStorage:y,workUnitAsyncStorage:C})},"routeModule",0,_,"serverHooks",0,O,"workAsyncStorage",0,y,"workUnitAsyncStorage",0,C],7078)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0.g~adg._.js.map