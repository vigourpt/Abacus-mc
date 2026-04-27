module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},14747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},85148,(e,t,r)=>{t.exports=e.x("better-sqlite3-90e2652d1716b047",()=>require("better-sqlite3-90e2652d1716b047"))},22734,(e,t,r)=>{t.exports=e.x("fs",()=>require("fs"))},43793,e=>{"use strict";var t=e.i(85148),r=e.i(14747);let a=process.env.DATABASE_PATH||r.default.join(process.cwd(),"data","mission-control.db"),n=null;function s(){if(!n){var s;let i=e.r(22734),o=r.default.dirname(a);i.existsSync(o)||i.mkdirSync(o,{recursive:!0}),(n=new t.default(a)).pragma("journal_mode = WAL"),(s=n).exec(`
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
  `)}return n}function i(e){return s().prepare("SELECT * FROM tasks WHERE id = ?").get(e)}function o(e){return s().prepare("SELECT * FROM conversations WHERE id = ?").get(e)}e.s(["createConversation",0,function(e,t,r){return s().prepare(`
    INSERT INTO conversations (id, agent_slug, title)
    VALUES (?, ?, ?)
  `).run(e,t,r??null),o(e)},"createMessage",0,function(e,t,r,a){var n;return s().prepare(`
    INSERT INTO messages (id, conversation_id, role, content)
    VALUES (?, ?, ?, ?)
  `).run(e,t,r,a),s().prepare('UPDATE conversations SET updated_at = datetime("now") WHERE id = ?').run(t),n=e,s().prepare("SELECT * FROM messages WHERE id = ?").get(n)},"createTask",0,function(e,t,r){return s().prepare(`
    INSERT INTO tasks (id, agent_slug, task, status)
    VALUES (?, ?, ?, 'pending')
  `).run(e,t,r),i(e)},"deleteConversation",0,function(e){let t=s();t.prepare("DELETE FROM messages WHERE conversation_id = ?").run(e),t.prepare("DELETE FROM conversations WHERE id = ?").run(e)},"getAgentBySlug",0,function(e){return s().prepare("SELECT * FROM agent_definitions WHERE slug = ?").get(e)},"getAllAgents",0,function(){return s().prepare("SELECT * FROM agent_definitions ORDER BY name").all()},"getAllConversations",0,function(){return s().prepare("SELECT * FROM conversations ORDER BY updated_at DESC").all()},"getAllTasks",0,function(){return s().prepare("SELECT * FROM tasks ORDER BY created_at DESC").all()},"getConversationById",0,o,"getMessagesByConversation",0,function(e){return s().prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC").all(e)},"getRecentActivity",0,function(e=50){return s().prepare("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?").all(e)},"getTaskById",0,i,"logActivity",0,function(e,t,r,a,n){s().prepare(`
    INSERT INTO activity_log (event_type, agent_slug, task_id, message, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).run(e,r??null,a??null,t,n?JSON.stringify(n):null)},"updateTaskStatus",0,function(e,t,r,a){let n=s();"completed"===t||"failed"===t?n.prepare(`
      UPDATE tasks 
      SET status = ?, result = ?, error = ?, updated_at = datetime('now'), completed_at = datetime('now')
      WHERE id = ?
    `).run(t,r??null,a??null,e):n.prepare(`
      UPDATE tasks 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(t,e)}])},19091,e=>{"use strict";var t=e.i(47909),r=e.i(74017),a=e.i(96250),n=e.i(59756),s=e.i(61916),i=e.i(74677),o=e.i(69741),l=e.i(16795),d=e.i(87718),u=e.i(95169),E=e.i(47587),c=e.i(66012),p=e.i(70101),T=e.i(26937),R=e.i(10372),g=e.i(93695);e.i(52474);var v=e.i(220),N=e.i(89171),x=e.i(43793);async function A(e,{params:t}){try{let{id:e}=await t,r=(0,x.getConversationById)(e);if(!r)return N.NextResponse.json({error:"Conversation not found"},{status:404});let a=(0,x.getMessagesByConversation)(e);return N.NextResponse.json({...r,messages:a})}catch(e){return console.error("Failed to fetch conversation:",e),N.NextResponse.json({error:"Internal server error"},{status:500})}}async function f(e,{params:t}){try{let{id:e}=await t;if(!(0,x.getConversationById)(e))return N.NextResponse.json({error:"Conversation not found"},{status:404});return(0,x.deleteConversation)(e),N.NextResponse.json({success:!0})}catch(e){return console.error("Failed to delete conversation:",e),N.NextResponse.json({error:"Internal server error"},{status:500})}}e.s(["DELETE",0,f,"GET",0,A,"dynamic",0,"force-dynamic","runtime",0,"nodejs"],90667);var m=e.i(90667);let _=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/chat/conversations/[id]/route",pathname:"/api/chat/conversations/[id]",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/chat/conversations/[id]/route.ts",nextConfigOutput:"",userland:m}),{workAsyncStorage:h,workUnitAsyncStorage:C,serverHooks:S}=_;async function O(e,t,a){a.requestMeta&&(0,n.setRequestMeta)(e,a.requestMeta),_.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let N="/api/chat/conversations/[id]/route";N=N.replace(/\/index$/,"")||"/";let x=await _.prepare(e,t,{srcPage:N,multiZoneDraftMode:!1});if(!x)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:A,params:f,nextConfig:m,parsedUrl:h,isDraftMode:C,prerenderManifest:S,routerServerContext:O,isOnDemandRevalidate:I,revalidateOnlyGenerated:y,resolvedPathname:w,clientReferenceManifest:L,serverActionsManifest:U}=x,X=(0,o.normalizeAppPath)(N),F=!!(S.dynamicRoutes[X]||S.routes[w]),D=async()=>((null==O?void 0:O.render404)?await O.render404(e,t,h,!1):t.end("This page could not be found"),null);if(F&&!C){let e=!!S.routes[w],t=S.dynamicRoutes[X];if(t&&!1===t.fallback&&!e){if(m.adapterPath)return await D();throw new g.NoFallbackError}}let k=null;!F||_.isDev||C||(k="/index"===(k=w)?"/":k);let M=!0===_.isDev||!F,b=F&&!M;U&&L&&(0,i.setManifestsSingleton)({page:N,clientReferenceManifest:L,serverActionsManifest:U});let P=e.method||"GET",q=(0,s.getTracer)(),H=q.getActiveScopeSpan(),j=!!(null==O?void 0:O.isWrappedByNextServer),B=!!(0,n.getRequestMeta)(e,"minimalMode"),Y=(0,n.getRequestMeta)(e,"incrementalCache")||await _.getIncrementalCache(e,m,S,B);null==Y||Y.resetRequestCache(),globalThis.__incrementalCache=Y;let K={params:f,previewProps:S.preview,renderOpts:{experimental:{authInterrupts:!!m.experimental.authInterrupts},cacheComponents:!!m.cacheComponents,supportsDynamicResponse:M,incrementalCache:Y,cacheLifeProfiles:m.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>_.onRequestError(e,t,a,n,O)},sharedContext:{buildId:A}},W=new l.NodeNextRequest(e),G=new l.NodeNextResponse(t),$=d.NextRequestAdapter.fromNodeNextRequest(W,(0,d.signalFromNodeResponse)(t));try{let n,i=async e=>_.handle($,K).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=q.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${P} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t),n&&n!==e&&(n.setAttribute("http.route",a),n.updateName(t))}else e.updateName(`${P} ${N}`)}),o=async n=>{var s,o;let l=async({previousCacheEntry:r})=>{try{if(!B&&I&&y&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await i(n);e.fetchMetrics=K.renderOpts.fetchMetrics;let o=K.renderOpts.pendingWaitUntil;o&&a.waitUntil&&(a.waitUntil(o),o=void 0);let l=K.renderOpts.collectedTags;if(!F)return await (0,c.sendResponse)(W,G,s,K.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,p.toNodeOutgoingHttpHeaders)(s.headers);l&&(t[R.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==K.renderOpts.collectedRevalidate&&!(K.renderOpts.collectedRevalidate>=R.INFINITE_CACHE)&&K.renderOpts.collectedRevalidate,a=void 0===K.renderOpts.collectedExpire||K.renderOpts.collectedExpire>=R.INFINITE_CACHE?void 0:K.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await _.onRequestError(e,t,{routerKind:"App Router",routePath:N,routeType:"route",revalidateReason:(0,E.getRevalidateReason)({isStaticGeneration:b,isOnDemandRevalidate:I})},!1,O),t}},d=await _.handleResponse({req:e,nextConfig:m,cacheKey:k,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:S,isRoutePPREnabled:!1,isOnDemandRevalidate:I,revalidateOnlyGenerated:y,responseGenerator:l,waitUntil:a.waitUntil,isMinimalMode:B});if(!F)return null;if((null==d||null==(s=d.value)?void 0:s.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(o=d.value)?void 0:o.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});B||t.setHeader("x-nextjs-cache",I?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),C&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,p.fromNodeOutgoingHttpHeaders)(d.value.headers);return B&&F||u.delete(R.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,T.getCacheControlHeader)(d.cacheControl)),await (0,c.sendResponse)(W,G,new Response(d.value.body,{headers:u,status:d.value.status||200})),null};j&&H?await o(H):(n=q.getActiveScopeSpan(),await q.withPropagatedContext(e.headers,()=>q.trace(u.BaseServerSpan.handleRequest,{spanName:`${P} ${N}`,kind:s.SpanKind.SERVER,attributes:{"http.method":P,"http.target":e.url}},o),void 0,!j))}catch(t){if(t instanceof g.NoFallbackError||await _.onRequestError(e,t,{routerKind:"App Router",routePath:X,routeType:"route",revalidateReason:(0,E.getRevalidateReason)({isStaticGeneration:b,isOnDemandRevalidate:I})},!1,O),F)throw t;return await (0,c.sendResponse)(W,G,new Response(null,{status:500})),null}}e.s(["handler",0,O,"patchFetch",0,function(){return(0,a.patchFetch)({workAsyncStorage:h,workUnitAsyncStorage:C})},"routeModule",0,_,"serverHooks",0,S,"workAsyncStorage",0,h,"workUnitAsyncStorage",0,C],19091)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0w~eifa._.js.map