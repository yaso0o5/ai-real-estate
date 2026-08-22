export type Property={id:string;city:string;district:string;type:string;status:string;price:number;area:number;listedAt:string};
export const demo:Property[]=[
{id:'1',city:'Cairo',district:'New Cairo',type:'Apartment',status:'For Sale',price:5200000,area:145,listedAt:'2026-08-10'},
{id:'2',city:'Cairo',district:'Maadi',type:'Apartment',status:'For Sale',price:3900000,area:120,listedAt:'2026-08-12'},
{id:'3',city:'Giza',district:'6th of October',type:'Villa',status:'For Sale',price:8800000,area:310,listedAt:'2026-08-14'},
{id:'4',city:'Cairo',district:'Zamalek',type:'Apartment',status:'Rented',price:6100000,area:155,listedAt:'2026-08-15'},
{id:'5',city:'Cairo',district:'Mostakbal City',type:'Apartment',status:'For Sale',price:4700000,area:132,listedAt:'2026-08-16'},
{id:'6',city:'Giza',district:'Sheikh Zayed',type:'Villa',status:'For Sale',price:11200000,area:360,listedAt:'2026-08-17'},
{id:'7',city:'Cairo',district:'Nasr City',type:'Apartment',status:'For Sale',price:2750000,area:110,listedAt:'2026-08-18'},
{id:'8',city:'Cairo',district:'Heliopolis',type:'Apartment',status:'Rented',price:3300000,area:125,listedAt:'2026-08-19'}
];
export function stats(rows:Property[]){const avgPrice=rows.length?rows.reduce((s,r)=>s+r.price,0)/rows.length:0;const avgPpm=rows.length?rows.reduce((s,r)=>s+r.price/r.area,0)/rows.length:0;const cities=[...new Set(rows.map(r=>r.city))];const districts=[...new Set(rows.map(r=>r.district))];const types=[...new Set(rows.map(r=>r.type))];return{count:rows.length,avgPrice,avgPpm,cities,districts,types};}
