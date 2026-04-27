module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},14747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},85148,(e,t,r)=>{t.exports=e.x("better-sqlite3-90e2652d1716b047",()=>require("better-sqlite3-90e2652d1716b047"))},22734,(e,t,r)=>{t.exports=e.x("fs",()=>require("fs"))},43793,e=>{"use strict";var t=e.i(85148),r=e.i(14747);let n=process.env.DATABASE_PATH||r.default.join(process.cwd(),"data","mission-control.db"),a=null;function s(){if(!a){var s;let o=e.r(22734),i=r.default.dirname(n);o.existsSync(i)||o.mkdirSync(i,{recursive:!0}),(a=new t.default(n)).pragma("journal_mode = WAL"),(s=a).exec(`
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
  `)}return a}function o(e){return s().prepare("SELECT * FROM tasks WHERE id = ?").get(e)}function i(e){return s().prepare("SELECT * FROM conversations WHERE id = ?").get(e)}e.s(["createConversation",0,function(e,t,r){return s().prepare(`
    INSERT INTO conversations (id, agent_slug, title)
    VALUES (?, ?, ?)
  `).run(e,t,r??null),i(e)},"createMessage",0,function(e,t,r,n){var a;return s().prepare(`
    INSERT INTO messages (id, conversation_id, role, content)
    VALUES (?, ?, ?, ?)
  `).run(e,t,r,n),s().prepare('UPDATE conversations SET updated_at = datetime("now") WHERE id = ?').run(t),a=e,s().prepare("SELECT * FROM messages WHERE id = ?").get(a)},"createTask",0,function(e,t,r){return s().prepare(`
    INSERT INTO tasks (id, agent_slug, task, status)
    VALUES (?, ?, ?, 'pending')
  `).run(e,t,r),o(e)},"deleteConversation",0,function(e){let t=s();t.prepare("DELETE FROM messages WHERE conversation_id = ?").run(e),t.prepare("DELETE FROM conversations WHERE id = ?").run(e)},"getAgentBySlug",0,function(e){return s().prepare("SELECT * FROM agent_definitions WHERE slug = ?").get(e)},"getAllAgents",0,function(){return s().prepare("SELECT * FROM agent_definitions ORDER BY name").all()},"getAllConversations",0,function(){return s().prepare("SELECT * FROM conversations ORDER BY updated_at DESC").all()},"getAllTasks",0,function(){return s().prepare("SELECT * FROM tasks ORDER BY created_at DESC").all()},"getConversationById",0,i,"getMessagesByConversation",0,function(e){return s().prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC").all(e)},"getRecentActivity",0,function(e=50){return s().prepare("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?").all(e)},"getTaskById",0,o,"logActivity",0,function(e,t,r,n,a){s().prepare(`
    INSERT INTO activity_log (event_type, agent_slug, task_id, message, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).run(e,r??null,n??null,t,a?JSON.stringify(a):null)},"updateTaskStatus",0,function(e,t,r,n){let a=s();"completed"===t||"failed"===t?a.prepare(`
      UPDATE tasks 
      SET status = ?, result = ?, error = ?, updated_at = datetime('now'), completed_at = datetime('now')
      WHERE id = ?
    `).run(t,r??null,n??null,e):a.prepare(`
      UPDATE tasks 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(t,e)}])},66680,(e,t,r)=>{t.exports=e.x("node:crypto",()=>require("node:crypto"))},89960,e=>{"use strict";var t=e.i(66680);let r={randomUUID:t.randomUUID},n=new Uint8Array(256),a=n.length,s=[];for(let e=0;e<256;++e)s.push((e+256).toString(16).slice(1));e.s(["v4",0,function(e,o,i){if(r.randomUUID&&!o&&!e)return r.randomUUID();var l=e,d=i;let u=(l=l||{}).random??l.rng?.()??(a>n.length-16&&((0,t.randomFillSync)(n),a=0),n.slice(a,a+=16));if(u.length<16)throw Error("Random bytes length must be >= 16");if(u[6]=15&u[6]|64,u[8]=63&u[8]|128,o){if((d=d||0)<0||d+16>o.length)throw RangeError(`UUID byte range ${d}:${d+15} is out of buffer bounds`);for(let e=0;e<16;++e)o[d+e]=u[e];return o}return function(e,t=0){return(s[e[t+0]]+s[e[t+1]]+s[e[t+2]]+s[e[t+3]]+"-"+s[e[t+4]]+s[e[t+5]]+"-"+s[e[t+6]]+s[e[t+7]]+"-"+s[e[t+8]]+s[e[t+9]]+"-"+s[e[t+10]]+s[e[t+11]]+s[e[t+12]]+s[e[t+13]]+s[e[t+14]]+s[e[t+15]]).toLowerCase()}(u)}],89960)},58819,e=>{"use strict";var t=e.i(47909),r=e.i(74017),n=e.i(96250),a=e.i(59756),s=e.i(61916),o=e.i(74677),i=e.i(69741),l=e.i(16795),d=e.i(87718),u=e.i(95169),c=e.i(47587),E=e.i(66012),p=e.i(70101),T=e.i(26937),R=e.i(10372),g=e.i(93695);e.i(52474);var v=e.i(220),x=e.i(89171),N=e.i(89960),f=e.i(43793);async function m(){try{let e=(0,f.getAllConversations)();return x.NextResponse.json(e)}catch(e){return console.error("Failed to fetch conversations:",e),x.NextResponse.json({error:"Internal server error"},{status:500})}}async function h(e){try{let{agentSlug:t,title:r}=await e.json();if(!t)return x.NextResponse.json({error:"Missing agentSlug"},{status:400});let n=(0,f.getAgentBySlug)(t);if(!n)return x.NextResponse.json({error:`Agent '${t}' not found`},{status:404});let a=(0,N.v4)(),s=r||`Chat with ${n.name}`,o=(0,f.createConversation)(a,t,s);return x.NextResponse.json(o)}catch(e){return console.error("Failed to create conversation:",e),x.NextResponse.json({error:"Internal server error"},{status:500})}}e.s(["GET",0,m,"POST",0,h,"dynamic",0,"force-dynamic","runtime",0,"nodejs"],77856);var A=e.i(77856);let S=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/chat/conversations/route",pathname:"/api/chat/conversations",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/chat/conversations/route.ts",nextConfigOutput:"",userland:A}),{workAsyncStorage:_,workUnitAsyncStorage:C,serverHooks:O}=S;async function I(e,t,n){n.requestMeta&&(0,a.setRequestMeta)(e,n.requestMeta),S.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let x="/api/chat/conversations/route";x=x.replace(/\/index$/,"")||"/";let N=await S.prepare(e,t,{srcPage:x,multiZoneDraftMode:!1});if(!N)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:f,params:m,nextConfig:h,parsedUrl:A,isDraftMode:_,prerenderManifest:C,routerServerContext:O,isOnDemandRevalidate:I,revalidateOnlyGenerated:y,resolvedPathname:w,clientReferenceManifest:L,serverActionsManifest:U}=N,X=(0,i.normalizeAppPath)(x),D=!!(C.dynamicRoutes[X]||C.routes[w]),F=async()=>((null==O?void 0:O.render404)?await O.render404(e,t,A,!1):t.end("This page could not be found"),null);if(D&&!_){let e=!!C.routes[w],t=C.dynamicRoutes[X];if(t&&!1===t.fallback&&!e){if(h.adapterPath)return await F();throw new g.NoFallbackError}}let k=null;!D||S.isDev||_||(k="/index"===(k=w)?"/":k);let b=!0===S.isDev||!D,M=D&&!b;U&&L&&(0,o.setManifestsSingleton)({page:x,clientReferenceManifest:L,serverActionsManifest:U});let P=e.method||"GET",q=(0,s.getTracer)(),H=q.getActiveScopeSpan(),j=!!(null==O?void 0:O.isWrappedByNextServer),B=!!(0,a.getRequestMeta)(e,"minimalMode"),Y=(0,a.getRequestMeta)(e,"incrementalCache")||await S.getIncrementalCache(e,h,C,B);null==Y||Y.resetRequestCache(),globalThis.__incrementalCache=Y;let K={params:m,previewProps:C.preview,renderOpts:{experimental:{authInterrupts:!!h.experimental.authInterrupts},cacheComponents:!!h.cacheComponents,supportsDynamicResponse:b,incrementalCache:Y,cacheLifeProfiles:h.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,n,a)=>S.onRequestError(e,t,n,a,O)},sharedContext:{buildId:f}},W=new l.NodeNextRequest(e),$=new l.NodeNextResponse(t),G=d.NextRequestAdapter.fromNodeNextRequest(W,(0,d.signalFromNodeResponse)(t));try{let a,o=async e=>S.handle(G,K).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=q.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=r.get("next.route");if(n){let t=`${P} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t),a&&a!==e&&(a.setAttribute("http.route",n),a.updateName(t))}else e.updateName(`${P} ${x}`)}),i=async a=>{var s,i;let l=async({previousCacheEntry:r})=>{try{if(!B&&I&&y&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await o(a);e.fetchMetrics=K.renderOpts.fetchMetrics;let i=K.renderOpts.pendingWaitUntil;i&&n.waitUntil&&(n.waitUntil(i),i=void 0);let l=K.renderOpts.collectedTags;if(!D)return await (0,E.sendResponse)(W,$,s,K.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,p.toNodeOutgoingHttpHeaders)(s.headers);l&&(t[R.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==K.renderOpts.collectedRevalidate&&!(K.renderOpts.collectedRevalidate>=R.INFINITE_CACHE)&&K.renderOpts.collectedRevalidate,n=void 0===K.renderOpts.collectedExpire||K.renderOpts.collectedExpire>=R.INFINITE_CACHE?void 0:K.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:n}}}}catch(t){throw(null==r?void 0:r.isStale)&&await S.onRequestError(e,t,{routerKind:"App Router",routePath:x,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:M,isOnDemandRevalidate:I})},!1,O),t}},d=await S.handleResponse({req:e,nextConfig:h,cacheKey:k,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:I,revalidateOnlyGenerated:y,responseGenerator:l,waitUntil:n.waitUntil,isMinimalMode:B});if(!D)return null;if((null==d||null==(s=d.value)?void 0:s.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(i=d.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});B||t.setHeader("x-nextjs-cache",I?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),_&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,p.fromNodeOutgoingHttpHeaders)(d.value.headers);return B&&D||u.delete(R.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,T.getCacheControlHeader)(d.cacheControl)),await (0,E.sendResponse)(W,$,new Response(d.value.body,{headers:u,status:d.value.status||200})),null};j&&H?await i(H):(a=q.getActiveScopeSpan(),await q.withPropagatedContext(e.headers,()=>q.trace(u.BaseServerSpan.handleRequest,{spanName:`${P} ${x}`,kind:s.SpanKind.SERVER,attributes:{"http.method":P,"http.target":e.url}},i),void 0,!j))}catch(t){if(t instanceof g.NoFallbackError||await S.onRequestError(e,t,{routerKind:"App Router",routePath:X,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:M,isOnDemandRevalidate:I})},!1,O),D)throw t;return await (0,E.sendResponse)(W,$,new Response(null,{status:500})),null}}e.s(["handler",0,I,"patchFetch",0,function(){return(0,n.patchFetch)({workAsyncStorage:_,workUnitAsyncStorage:C})},"routeModule",0,S,"serverHooks",0,O,"workAsyncStorage",0,_,"workUnitAsyncStorage",0,C],58819)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__00319ob._.js.map