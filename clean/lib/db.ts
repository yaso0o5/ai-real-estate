import { neon } from '@neondatabase/serverless';
import { demo, type Property } from './data';
export async function getProperties():Promise<Property[]>{
  if(!process.env.DATABASE_URL)return demo;
  try{const sql=neon(process.env.DATABASE_URL);const rows=await sql`select id, city, district, type, status, price, area, listed_at as "listedAt" from properties order by listed_at desc limit 500`;return rows as Property[];}catch{return demo;}
}
