import { NextResponse } from 'next/server';
import { getProperties } from '@/lib/db';
import { stats } from '@/lib/data';
export async function POST(req:Request){
 const rows=await getProperties(); const s=stats(rows);
 const body=await req.json().catch(()=>({}));
 const prompt=body.prompt||'Analyze this real-estate dataset and give actionable insights.';
 const key=process.env.DASHSCOPE_API_KEY;
 if(!key)return NextResponse.json({ok:true,source:'local',insights:[`Dataset contains ${s.count} properties with an average price of EGP ${Math.round(s.avgPrice).toLocaleString()}.`,`Average asking price per square meter is EGP ${Math.round(s.avgPpm).toLocaleString()}.`,`The strongest concentration is in ${s.cities.join(', ')}; compare districts before pricing new listings.`]});
 try{
  const response=await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model:process.env.QWEN_MODEL||'qwen-plus',temperature:.2,messages:[{role:'system',content:'You are an autonomous real-estate intelligence analyst. Return concise, evidence-based insights, anomalies, opportunities and recommended actions. Never invent facts.'},{role:'user',content:`${prompt}\nDataset summary: ${JSON.stringify(s)}\nRows: ${JSON.stringify(rows)}`} ]})});
  if(!response.ok)throw new Error(`Qwen request failed: ${response.status}`);
  const json=await response.json();return NextResponse.json({ok:true,source:'qwen',answer:json.choices?.[0]?.message?.content||'No insight returned.'});
 }catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'AI request failed'},{status:502});}
}
