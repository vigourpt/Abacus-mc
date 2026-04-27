module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},14747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},85148,(e,t,r)=>{t.exports=e.x("better-sqlite3-90e2652d1716b047",()=>require("better-sqlite3-90e2652d1716b047"))},22734,(e,t,r)=>{t.exports=e.x("fs",()=>require("fs"))},43793,e=>{"use strict";var t=e.i(85148),r=e.i(14747);let a=process.env.DATABASE_PATH||r.default.join(process.cwd(),"data","mission-control.db"),n=null;function s(){if(!n){var s;let o=e.r(22734),i=r.default.dirname(a);o.existsSync(i)||o.mkdirSync(i,{recursive:!0}),(n=new t.default(a)).pragma("journal_mode = WAL"),(s=n).exec(`
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
  `)}return n}function o(e){return s().prepare("SELECT * FROM tasks WHERE id = ?").get(e)}function i(e){return s().prepare("SELECT * FROM conversations WHERE id = ?").get(e)}e.s(["createConversation",0,function(e,t,r){return s().prepare(`
    INSERT INTO conversations (id, agent_slug, title)
    VALUES (?, ?, ?)
  `).run(e,t,r??null),i(e)},"createMessage",0,function(e,t,r,a){var n;return s().prepare(`
    INSERT INTO messages (id, conversation_id, role, content)
    VALUES (?, ?, ?, ?)
  `).run(e,t,r,a),s().prepare('UPDATE conversations SET updated_at = datetime("now") WHERE id = ?').run(t),n=e,s().prepare("SELECT * FROM messages WHERE id = ?").get(n)},"createTask",0,function(e,t,r){return s().prepare(`
    INSERT INTO tasks (id, agent_slug, task, status)
    VALUES (?, ?, ?, 'pending')
  `).run(e,t,r),o(e)},"deleteConversation",0,function(e){let t=s();t.prepare("DELETE FROM messages WHERE conversation_id = ?").run(e),t.prepare("DELETE FROM conversations WHERE id = ?").run(e)},"getAgentBySlug",0,function(e){return s().prepare("SELECT * FROM agent_definitions WHERE slug = ?").get(e)},"getAllAgents",0,function(){return s().prepare("SELECT * FROM agent_definitions ORDER BY name").all()},"getAllConversations",0,function(){return s().prepare("SELECT * FROM conversations ORDER BY updated_at DESC").all()},"getAllTasks",0,function(){return s().prepare("SELECT * FROM tasks ORDER BY created_at DESC").all()},"getConversationById",0,i,"getMessagesByConversation",0,function(e){return s().prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC").all(e)},"getRecentActivity",0,function(e=50){return s().prepare("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?").all(e)},"getTaskById",0,o,"logActivity",0,function(e,t,r,a,n){s().prepare(`
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
    `).run(t,e)}])},66680,(e,t,r)=>{t.exports=e.x("node:crypto",()=>require("node:crypto"))},89960,e=>{"use strict";var t=e.i(66680);let r={randomUUID:t.randomUUID},a=new Uint8Array(256),n=a.length,s=[];for(let e=0;e<256;++e)s.push((e+256).toString(16).slice(1));e.s(["v4",0,function(e,o,i){if(r.randomUUID&&!o&&!e)return r.randomUUID();var l=e,d=i;let u=(l=l||{}).random??l.rng?.()??(n>a.length-16&&((0,t.randomFillSync)(a),n=0),a.slice(n,n+=16));if(u.length<16)throw Error("Random bytes length must be >= 16");if(u[6]=15&u[6]|64,u[8]=63&u[8]|128,o){if((d=d||0)<0||d+16>o.length)throw RangeError(`UUID byte range ${d}:${d+15} is out of buffer bounds`);for(let e=0;e<16;++e)o[d+e]=u[e];return o}return function(e,t=0){return(s[e[t+0]]+s[e[t+1]]+s[e[t+2]]+s[e[t+3]]+"-"+s[e[t+4]]+s[e[t+5]]+"-"+s[e[t+6]]+s[e[t+7]]+"-"+s[e[t+8]]+s[e[t+9]]+"-"+s[e[t+10]]+s[e[t+11]]+s[e[t+12]]+s[e[t+13]]+s[e[t+14]]+s[e[t+15]]).toLowerCase()}(u)}],89960)},25564,e=>{"use strict";var t=e.i(47909),r=e.i(74017),a=e.i(96250),n=e.i(59756),s=e.i(61916),o=e.i(74677),i=e.i(69741),l=e.i(16795),d=e.i(87718),u=e.i(95169),c=e.i(47587),E=e.i(66012),p=e.i(70101),T=e.i(26937),g=e.i(10372),R=e.i(93695);e.i(52474);var v=e.i(220),m=e.i(89171),x=e.i(89960),f=e.i(43793),N=e.i(22838);async function h(e){try{let t,r,{conversationId:a,content:n,role:s="user"}=await e.json();if(!a||!n)return m.NextResponse.json({error:"Missing conversationId or content"},{status:400});let o=(0,f.getConversationById)(a);if(!o)return m.NextResponse.json({error:"Conversation not found"},{status:404});let i=(0,x.v4)();(0,f.createMessage)(i,a,"user",n);let l=(0,f.getAgentBySlug)(o.agent_slug);if(!l)return m.NextResponse.json({error:"Agent not found"},{status:404});let d=(0,f.getMessagesByConversation)(a).filter(e=>"system"!==e.role).map(e=>`${e.role}: ${e.content}`).join("\n"),u=(r=(t=l.content.replace(/^---[\s\S]*?---\n/,"")).match(/^#\s+(?:Role|Persona|Agent)[\s\S]*?$/mi))&&r.index&&r.index>0?t.slice(0,r.index).trim():t.trim();return A(a,l.content,n,d,u).catch(e=>{console.error("Failed to generate response:",e);let t=(0,x.v4)();(0,f.createMessage)(t,a,"assistant",`Error: ${e.message}`)}),m.NextResponse.json({success:!0,messageId:i})}catch(e){return console.error("Failed to create message:",e),m.NextResponse.json({error:"Internal server error"},{status:500})}}async function A(e,t,r,a,n){try{let s=(0,N.getGatewayClient)(),o="";o=n?`## Agent Instructions
${n}

## Conversation History
${a}

## Current Message
user: ${r}

assistant:`:`## Agent Persona
${t}

## Conversation History
${a}

## Current Message
user: ${r}

assistant:`;let i=await s.agentInvoke(r,void 0,o),l=(0,x.v4)();(0,f.createMessage)(l,e,"assistant",`[Task dispatched to gateway — session: ${i.sessionId}, taskId: ${i.taskId}]`)}catch(r){console.error("Assistant response error:",r);let t=(0,x.v4)();(0,f.createMessage)(t,e,"assistant",`Error: ${r instanceof Error?r.message:String(r)}`)}}e.s(["POST",0,h,"dynamic",0,"force-dynamic","runtime",0,"nodejs"],53654);var C=e.i(53654);let S=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/chat/messages/route",pathname:"/api/chat/messages",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/chat/messages/route.ts",nextConfigOutput:"",userland:C}),{workAsyncStorage:_,workUnitAsyncStorage:I,serverHooks:y}=S;async function O(e,t,a){a.requestMeta&&(0,n.setRequestMeta)(e,a.requestMeta),S.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let m="/api/chat/messages/route";m=m.replace(/\/index$/,"")||"/";let x=await S.prepare(e,t,{srcPage:m,multiZoneDraftMode:!1});if(!x)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:f,params:N,nextConfig:h,parsedUrl:A,isDraftMode:C,prerenderManifest:_,routerServerContext:I,isOnDemandRevalidate:y,revalidateOnlyGenerated:O,resolvedPathname:w,clientReferenceManifest:L,serverActionsManifest:U}=x,X=(0,i.normalizeAppPath)(m),D=!!(_.dynamicRoutes[X]||_.routes[w]),F=async()=>((null==I?void 0:I.render404)?await I.render404(e,t,A,!1):t.end("This page could not be found"),null);if(D&&!C){let e=!!_.routes[w],t=_.dynamicRoutes[X];if(t&&!1===t.fallback&&!e){if(h.adapterPath)return await F();throw new R.NoFallbackError}}let k=null;!D||S.isDev||C||(k="/index"===(k=w)?"/":k);let M=!0===S.isDev||!D,b=D&&!M;U&&L&&(0,o.setManifestsSingleton)({page:m,clientReferenceManifest:L,serverActionsManifest:U});let P=e.method||"GET",H=(0,s.getTracer)(),q=H.getActiveScopeSpan(),j=!!(null==I?void 0:I.isWrappedByNextServer),B=!!(0,n.getRequestMeta)(e,"minimalMode"),$=(0,n.getRequestMeta)(e,"incrementalCache")||await S.getIncrementalCache(e,h,_,B);null==$||$.resetRequestCache(),globalThis.__incrementalCache=$;let Y={params:N,previewProps:_.preview,renderOpts:{experimental:{authInterrupts:!!h.experimental.authInterrupts},cacheComponents:!!h.cacheComponents,supportsDynamicResponse:M,incrementalCache:$,cacheLifeProfiles:h.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>S.onRequestError(e,t,a,n,I)},sharedContext:{buildId:f}},K=new l.NodeNextRequest(e),W=new l.NodeNextResponse(t),G=d.NextRequestAdapter.fromNodeNextRequest(K,(0,d.signalFromNodeResponse)(t));try{let n,o=async e=>S.handle(G,Y).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=H.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${P} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t),n&&n!==e&&(n.setAttribute("http.route",a),n.updateName(t))}else e.updateName(`${P} ${m}`)}),i=async n=>{var s,i;let l=async({previousCacheEntry:r})=>{try{if(!B&&y&&O&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await o(n);e.fetchMetrics=Y.renderOpts.fetchMetrics;let i=Y.renderOpts.pendingWaitUntil;i&&a.waitUntil&&(a.waitUntil(i),i=void 0);let l=Y.renderOpts.collectedTags;if(!D)return await (0,E.sendResponse)(K,W,s,Y.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,p.toNodeOutgoingHttpHeaders)(s.headers);l&&(t[g.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==Y.renderOpts.collectedRevalidate&&!(Y.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&Y.renderOpts.collectedRevalidate,a=void 0===Y.renderOpts.collectedExpire||Y.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:Y.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await S.onRequestError(e,t,{routerKind:"App Router",routePath:m,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:b,isOnDemandRevalidate:y})},!1,I),t}},d=await S.handleResponse({req:e,nextConfig:h,cacheKey:k,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:_,isRoutePPREnabled:!1,isOnDemandRevalidate:y,revalidateOnlyGenerated:O,responseGenerator:l,waitUntil:a.waitUntil,isMinimalMode:B});if(!D)return null;if((null==d||null==(s=d.value)?void 0:s.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(i=d.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});B||t.setHeader("x-nextjs-cache",y?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),C&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,p.fromNodeOutgoingHttpHeaders)(d.value.headers);return B&&D||u.delete(g.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,T.getCacheControlHeader)(d.cacheControl)),await (0,E.sendResponse)(K,W,new Response(d.value.body,{headers:u,status:d.value.status||200})),null};j&&q?await i(q):(n=H.getActiveScopeSpan(),await H.withPropagatedContext(e.headers,()=>H.trace(u.BaseServerSpan.handleRequest,{spanName:`${P} ${m}`,kind:s.SpanKind.SERVER,attributes:{"http.method":P,"http.target":e.url}},i),void 0,!j))}catch(t){if(t instanceof R.NoFallbackError||await S.onRequestError(e,t,{routerKind:"App Router",routePath:X,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:b,isOnDemandRevalidate:y})},!1,I),D)throw t;return await (0,E.sendResponse)(K,W,new Response(null,{status:500})),null}}e.s(["handler",0,O,"patchFetch",0,function(){return(0,a.patchFetch)({workAsyncStorage:_,workUnitAsyncStorage:I})},"routeModule",0,S,"serverHooks",0,y,"workAsyncStorage",0,_,"workUnitAsyncStorage",0,I],25564)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0lwuoni._.js.map