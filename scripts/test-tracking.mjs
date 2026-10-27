import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { webcrypto, createHash } from 'node:crypto';
import { build } from 'esbuild';

const temporary = await mkdtemp(join(tmpdir(), 'booking-tests-'));
const events = [];
globalThis.__trackingEvents = events;
Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
const stored = new Map();
globalThis.window = {};
globalThis.localStorage = { getItem: k => stored.get(k) ?? null, setItem: (k,v) => stored.set(k,v) };
globalThis.sessionStorage = globalThis.localStorage;
let autoCompleteTags = true;
globalThis.__completeTag = event => { if (autoCompleteTags) event.eventCallback?.(); };
const stub = {
  name: 'analytics-capture',
  setup(builder) {
    builder.onResolve({ filter: /(^|\/)posthog$/ }, () => ({ path: 'capture', namespace: 'test' }));
    builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: `
      export function pushDataLayer(event, props) { const e = {event,...props}; globalThis.__trackingEvents.push(e); globalThis.__completeTag(e); }
      export function trackEvent(event, props) { globalThis.__trackingEvents.push({event,...props}); }
      export function identifyUser(email, props) { globalThis.__trackingEvents.push({event:'identify',email,...props}); }
      export function setPersonProperties() {}
      export function trackBookingPageViewed() {}
    `, loader: 'js' }));
  },
};
const componentStubs = {
  name: 'booking-page-browser-stubs',
  setup(builder) {
    builder.onResolve({filter:/^lucide-react$/},()=>({path:'icons',namespace:'component'}));
    builder.onResolve({filter:/^react(\/jsx-runtime)?$/}, args=>({path:args.path,namespace:'component'}));
    builder.onResolve({filter:/\/syncTimezone$/},()=>({path:'timezone',namespace:'component'}));
    builder.onResolve({filter:/\/syncUtm$/},()=>({path:'utm',namespace:'component'}));
    builder.onLoad({filter:/.*/,namespace:'component'},args=>({contents:args.path==='icons' ? `export function CheckCircle(){}export function Sparkles(){}` : args.path==='react' ? `
      export function useRef(){return {current:globalThis.__bookingContainer};}
      export function useEffect(fn){globalThis.__bookingCleanup=fn();}
    `:args.path==='react/jsx-runtime'?`
      export const Fragment='fragment';export function jsx(){return null;}export function jsxs(){return null;}
    `:args.path==='timezone'?`
      export function syncContactTimezone(){}
    `:`
      export function persistUtmsFromUrl(){}
      export function syncContactUtms(email){globalThis.__trackingEvents.push({event:'sync_identity',email});}
    `,loader:'js'}));
  },
};
async function load(name, entry, extraPlugins=[]) {
  const outfile = join(temporary, `${name}.mjs`);
  await build({ entryPoints:[resolve(entry)], outfile, bundle:true, platform:'node', format:'esm', jsx:'automatic', plugins:[stub,...extraPlugins], logLevel:'silent' });
  return import(pathToFileURL(outfile).href);
}
let passed = 0;
async function test(name, run) {
  try { await run(); passed++; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}
const hash = value => createHash('sha256').update(value).digest('hex');
try {
  const b = await load('booking','src/lib/booking.ts');
  await test('hostile lookalike origin rejected', () => assert.equal(b.isAllowedOnceHubOrigin('https://oncehub.com.evil.com'),false));
  await test('real HTTPS OnceHub origin accepted', () => assert.equal(b.isAllowedOnceHubOrigin('https://oncehub.com'),true));
  await test('null iframe source never authenticates a message', () => assert.equal(b.isFromOnceHubIframe({source:null},{querySelector:()=>({contentWindow:null})}),false));
  await test('message must come from embedded window', () => { const frame={};assert.equal(b.isFromOnceHubIframe({source:frame},{querySelector:()=>({contentWindow:frame})}),true); });
  const fixture = { type:'oncehub.booking.scheduled', payload:{ id:'BKNG-TEST', status:'scheduled', booking_calendar:'BKC-TEST', starting_time:'2026-11-01T14:00:00.000Z', attendees:['host@example.com','guest@example.com'], custom_fields:[{name:'name',value:'Guest Person'},{name:'email',value:'guest@example.com'},{name:'Mobile Phone',value:'+1 (202) 555-0123'}] } };
  await test('documented guest fields, not host attendees', () => assert.deepEqual(b.extractAttendee(fixture),{email:'guest@example.com',phone:'+1 (202) 555-0123',firstName:'Guest',lastName:'Person'}));
  await test('explicit guest identity overrides custom fields', () => assert.equal(b.extractAttendee({payload:{...fixture.payload,customer_email:'updated@example.com'}}).email,'updated@example.com'));
  await test('missing guest does not guess from attendees', () => assert.equal(b.extractAttendee({payload:{attendees:fixture.payload.attendees}}).email,''));
  await test('documented scheduled event accepted', () => assert.equal(b.isFreshBookingConfirmed(fixture),true));
  for (const type of ['oncehub.booking.unscheduled','oncehub.booking.rescheduled','oncehub.booking.canceled','oncehub.booking_calendar.loaded','oncehub.booking_calendar.time_slot_selected','random.booking.successful_noise']) {
    await test(`reject ${type}`, () => assert.equal(b.isFreshBookingConfirmed({...fixture,type}),false));
  }
  for (const status of ['canceled','cancelled','rescheduled','failed','pending']) {
    await test(`reject conflicting status ${status}`, () => assert.equal(b.isFreshBookingConfirmed({type:fixture.type,payload:{...fixture.payload,status}}),false));
  }
  await test('reschedule reference excluded', () => assert.equal(b.isFreshBookingConfirmed({type:fixture.type,payload:{...fixture.payload,rescheduled_booking_id:'BKNG-OLD'}}),false));
  await test('wrong calendar excluded', () => assert.equal(b.isBookingForCalendar(fixture,'BKC-OTHER'),false));
  await test('right calendar accepted', () => assert.equal(b.isBookingForCalendar(fixture,'BKC-TEST'),true));
  await test('native booking ID used', async () => assert.equal(await b.extractBookingId(fixture),'BKNG-TEST'));
  const fallbackPayload = {...fixture.payload}; delete fallbackPayload.id;
  const fallback = await b.extractBookingId({payload:fallbackPayload});
  await test('complete fallback opaque and stable', async () => { assert.match(fallback,/^oh-fb-[a-f0-9]{64}$/); assert.equal(await b.extractBookingId({payload:fallbackPayload}),fallback); assert.ok(!fallback.includes('guest')); });
  await test('fallback changes for another calendar', async () => assert.notEqual(await b.extractBookingId({payload:{...fallbackPayload,booking_calendar:'BKC-OTHER'}}),fallback));
  await test('partial identity cannot invent booking ID', async () => assert.equal(await b.extractBookingId({payload:{email:'guest@example.com'}}),''));
  await test('calendar ID is not mistaken for booking ID', async () => assert.equal(await b.extractBookingId({payload:{id:'BKC-TEST'}}),''));
  await test('Gmail periods normalized', () => assert.equal(b.normaliseEmailForHash(' G.Uest@Gmail.com '),'guest@gmail.com'));
  await test('other-domain periods preserved', () => assert.equal(b.normaliseEmailForHash(' G.Uest@Example.com '),'g.uest@example.com'));
  await test('E164 phone normalized', () => assert.equal(b.normalisePhoneForHash('+1 (202) 555-0123'),'+12025550123'));
  await test('national number omitted without guessing country', () => assert.equal(b.normalisePhoneForHash('(202) 555-0123'),''));
  await test('extension number omitted instead of mangled', () => assert.equal(b.normalisePhoneForHash('+1 202 555 0123 ext 45'),''));
  const args={bookingType:'setter',bookingId:'BKNG-RACE',email:'G.Uest@gmail.com',phone:'+1 (202) 555-0123'};
  await test('concurrent callback emits exactly once', async () => {
    events.length=0;
    const results=await Promise.all(Array.from({length:5},()=>b.emitBookedCallConversion(args)));
    assert.equal(results.filter(Boolean).length,1);
    const conversions=events.filter(x=>x.event==='booked_call'); assert.equal(conversions.length,1);
    assert.equal(conversions[0].booking_id,args.bookingId);
    assert.equal(conversions[0].enhanced_conversion_data.sha256_email_address,hash('guest@gmail.com'));
    assert.equal(conversions[0].enhanced_conversion_data.sha256_phone_number,hash('+12025550123'));
    assert.ok(!JSON.stringify(conversions[0]).includes('@'));
  });
  await test('refresh memory reset still deduplicates storage', async () => { b._resetInMemoryFiredForTest(); assert.equal(await b.emitBookedCallConversion(args),false); });
  await test('blocked storage retains in-memory concurrency protection', async () => {
    const previous=globalThis.localStorage;globalThis.localStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
    try { const results=await Promise.all([b.emitBookedCallConversion({...args,bookingId:'BKNG-PRIVATE'}),b.emitBookedCallConversion({...args,bookingId:'BKNG-PRIVATE'})]); assert.equal(results.filter(Boolean).length,1); }
    finally {globalThis.localStorage=previous;}
  });
  await test('missing optional identity still counts native booking', async () => { await b.emitBookedCallConversion({...args,bookingId:'BKNG-NO-IDENTITY',email:'',phone:''}); assert.deepEqual(events.find(x=>x.booking_id==='BKNG-NO-IDENTITY'&&x.event==='booked_call').enhanced_conversion_data,{}); });
  await test('tag completion actually gates emitter resolution', async () => {
    autoCompleteTags=false; let finished=false;
    const result=b.emitBookedCallConversion({...args,bookingId:'BKNG-WAIT'}).then(()=>{finished=true;});
    await new Promise(r=>setTimeout(r,20)); assert.equal(finished,false);
    events.find(x=>x.booking_id==='BKNG-WAIT'&&x.event==='booked_call').eventCallback(); await result; assert.equal(finished,true);autoCompleteTags=true;
  });
  await test('blocked GTM cannot indefinitely hold confirmation', async () => {
    autoCompleteTags=false; const started=Date.now(); await b.emitBookedCallConversion({...args,bookingId:'BKNG-BLOCKED'}); assert.ok(Date.now()-started<2300);autoCompleteTags=true;
  });
  const server=await load('utm-server','netlify/functions/save-contact-utm.ts');
  const originalFetch=globalThis.fetch; const previousToken=process.env.HUBSPOT_TOKEN;process.env.HUBSPOT_TOKEN='test-only';
  let written;
  globalThis.fetch=async (_url,options)=>{written=JSON.parse(options.body).properties;return {ok:true,status:200,text:async()=>''};};
  await test('braid identifiers cannot overwrite GCLID property', async () => {
    const result=await server.handler({httpMethod:'POST',body:JSON.stringify({email:'guest@example.com',utm_source:'google',gbraid:'BRAID',wbraid:'WBRAID'})},{});
    assert.equal(JSON.parse(result.body).ok,true);assert.deepEqual(written,{utm_source:'google'});
  });
  await test('real GCLID is mapped independently of braid IDs', async () => {await server.handler({httpMethod:'POST',body:JSON.stringify({email:'guest@example.com',gclid:'GCLID',gbraid:'BRAID'})},{});assert.equal(written.hs_google_click_id,'GCLID');});
  if(previousToken===undefined)delete process.env.HUBSPOT_TOKEN;else process.env.HUBSPOT_TOKEN=previousToken;
  globalThis.fetch=originalFetch;
  const sync=await load('utm-client','src/lib/syncUtm.ts');
  stored.set('pp_utm_data',JSON.stringify({utm_source:'google',gclid:'TEST'}));
  globalThis.window.location={search:''};globalThis.document={cookie:''};
  let calls=0;
  globalThis.fetch=async()=>{calls++;return {ok:true,status:200,json:async()=>calls===1?{ok:false,reason:'contact_not_found'}:{ok:true,written:{hs_google_click_id:'TEST'}}};};
  const flush=()=>new Promise(r=>setTimeout(r,0));
  await test('failed CRM update stays retryable and is not reported synced',async()=>{
    events.length=0;sync.syncContactUtms('guest@example.com','test');await flush();
    assert.equal(events.some(e=>e.event==='contact_utm_synced'),false);
    sync.syncContactUtms('guest@example.com','test');await flush();
    assert.equal(calls,2);assert.equal(events.filter(e=>e.event==='contact_utm_synced').length,1);
  });
  await test('confirmed CRM update deduplicates later attempts',async()=>{sync.syncContactUtms('guest@example.com','test');await flush();assert.equal(calls,2);});
  globalThis.fetch=originalFetch;
  for (const [component,page,calendar,target] of [
    ['Book','src/pages/Book.tsx','BKC-Q45L7MVX52','/trainingnew/closer'],
    ['BookCall','src/pages/BookCall.tsx','BKC-P9JY2GLKJX','/trainingnew/setter'],
  ]) {
    await test(`${component} authenticates, updates guest identity, redirects and fires once`,async()=>{
      const listeners=new Map(); const source={};const iframe={contentWindow:source,src:`https://oncehub.com/c/${calendar}`};
      globalThis.__bookingContainer={querySelector:()=>iframe};
      globalThis.document={cookie:'',querySelector:()=>({})};
      globalThis.window={location:{search:'?email=old@example.com&firstname=Old&lastname=Identity&phone=2025550999',href:''},addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:()=>{}};
      const module=await load(`page-${component}`,page,[componentStubs]);
      module[component]();events.length=0;
      const message={origin:'https://oncehub.com',source,data:{...fixture,payload:{...fixture.payload,id:`BKNG-${component}`,booking_calendar:calendar}}};
      const handler=listeners.get('message');assert.equal(typeof handler,'function');
      handler({...message,source:{}});await flush();assert.equal(events.some(e=>e.event==='booked_call'),false);
      handler({...message,data:{...message.data,payload:{...message.data.payload,booking_calendar:'BKC-WRONG'}}});await flush();assert.equal(events.some(e=>e.event==='booked_call'),false);
      handler(message);handler(message);await new Promise(r=>setTimeout(r,40));
      assert.equal(events.filter(e=>e.event==='booked_call').length,1);
      assert.equal(events.find(e=>e.event==='sync_identity').email,'guest@example.com');
      assert.equal(JSON.parse(stored.get('pp_booking_data')).email,'guest@example.com');
      assert.equal(JSON.parse(stored.get('pp_booking_data')).lastname,'Person');
      assert.equal(new URL(globalThis.window.location.href,'https://example.com').pathname,target);
      assert.ok(!globalThis.window.location.href.includes('email='));
      assert.ok(!globalThis.window.location.href.includes('phone='));
      globalThis.__bookingCleanup?.();
    });
  }
  console.log(`\n${passed} tracking regression checks passed. No network requests sent.`);
} finally { await rm(temporary,{recursive:true,force:true}); }
