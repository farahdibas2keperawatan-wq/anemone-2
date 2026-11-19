import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
const dir = process.argv[2] ?? ".";
const db = new PGlite();
// Minimal Supabase stand-ins
await db.exec(`
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.sub', true),'')::uuid $$;
create role anon; create role authenticated;
grant usage on schema public to anon, authenticated;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
`);
for (const f of ["migrations/0001_schema.sql","migrations/0002_rls.sql","seed.sql"]) {
  await db.exec(fs.readFileSync(`${dir}/supabase/${f}`, "utf8"));
  console.log("ok", f);
}
const A="11111111-1111-1111-1111-111111111111", B="22222222-2222-2222-2222-222222222222";
await db.exec(`insert into auth.users values ('${A}'),('${B}')`);
const as = async (uid, sql) => {
  await db.exec(`set role authenticated; select set_config('request.jwt.sub','${uid}',false);`);
  try { return (await db.query(sql)).rows; } finally { await db.exec("reset role"); }
};
const kidA = (await as(A, `insert into public.children (nickname, avatar) values ('Kaka','🐙') returning id, parent_id`))[0];
console.log("A created child", kidA.parent_id === A);
await as(A, `insert into public.child_progress (child_id, lesson_id, completion_status, score) values ('${kidA.id}','m1-l1','completed',3)`);
await as(A, `insert into public.rewards (child_id, reward_type, reward_value, amount) values ('${kidA.id}','daily','2026-11-19',1)`);
console.log("A sees own progress:", (await as(A, `select count(*)::int n from public.child_progress`))[0].n);
console.log("B sees A's children:", (await as(B, `select count(*)::int n from public.children`))[0].n);
console.log("B sees A's progress:", (await as(B, `select count(*)::int n from public.child_progress`))[0].n);
try { await as(B, `insert into public.child_progress (child_id, lesson_id) values ('${kidA.id}','m1-l2')`); console.log("FAIL B wrote A's progress"); }
catch (e) { console.log("B write blocked:", e.message.slice(0,60)); }
try { await as(B, `insert into public.children (nickname, parent_id) values ('x','${A}')`); console.log("FAIL B created child for A"); }
catch (e) { console.log("B spoof parent blocked:", e.message.slice(0,60)); }
const upd = await as(B, `update public.children set nickname='hack' where id='${kidA.id}' returning id`);
console.log("B update A child rows:", upd.length);
try { await as(A, `insert into public.lessons (id,module_id,title,instructions,content_type,sequence_order) values ('x','m1','x','x','match',9)`); console.log("FAIL client wrote content"); }
catch (e) { console.log("content write blocked:", e.message.slice(0,50)); }
try { await as(A, `insert into public.rewards (child_id, reward_type, reward_value) values ('${kidA.id}','daily','2026-11-19')`); console.log("FAIL dup daily"); }
catch (e) { console.log("duplicate daily blocked:", e.message.slice(0,50)); }
await db.exec("set role anon");
console.log("anon reads lessons:", (await db.query("select count(*)::int n from public.lessons")).rows[0].n, "children:", (await db.query("select count(*)::int n from public.children").catch(e=>({rows:[{n:'denied'}]}))).rows[0].n);
