const n=()=>typeof window<"u"?"/clca-courier":"",r=t=>{const e=n(),a=t.startsWith("/")?t.slice(1):t;return`${e}/${a}`},s=t=>r(`data/${t}`);export{s as a,r as g};
