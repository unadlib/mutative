"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[6157],{9187:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>c,contentTitle:()=>a,default:()=>m,frontMatter:()=>i,metadata:()=>l,toc:()=>d});var s=r(5893),n=r(1151);const i={sidebar_position:1},a="Comparison with Immer",l={id:"extra-topics/comparison-with-immer",title:"Comparison with Immer",description:"Mutative is a high-performance immutable update library, and Immer is a popular immutable update library. This page compares the differences between Mutative and Immer.",source:"@site/docs/extra-topics/comparison-with-immer.md",sourceDirName:"extra-topics",slug:"/extra-topics/comparison-with-immer",permalink:"/docs/extra-topics/comparison-with-immer",draft:!1,unlisted:!1,editUrl:"https://github.com/unadlib/mutative/tree/main/website/docs/extra-topics/comparison-with-immer.md",tags:[],version:"current",lastUpdatedBy:"unadlib",lastUpdatedAt:1727021689e3,sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"tutorialSidebar",previous:{title:"Extra Topics",permalink:"/docs/category/extra-topics"},next:{title:"FAQ",permalink:"/docs/extra-topics/faq"}},c={},d=[{value:"Difference between Mutative and Immer",id:"difference-between-mutative-and-immer",level:2},{value:"Mutative vs Immer Performance",id:"mutative-vs-immer-performance",level:2}];function o(e){const t={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",img:"img",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,n.a)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(t.h1,{id:"comparison-with-immer",children:"Comparison with Immer"}),"\n",(0,s.jsx)(t.p,{children:"Mutative is a high-performance immutable update library, and Immer is a popular immutable update library. This page compares the differences between Mutative and Immer."}),"\n",(0,s.jsx)(t.h2,{id:"difference-between-mutative-and-immer",children:"Difference between Mutative and Immer"}),"\n",(0,s.jsxs)(t.table,{children:[(0,s.jsx)(t.thead,{children:(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.th,{style:{textAlign:"left"}}),(0,s.jsx)(t.th,{style:{textAlign:"right"},children:"Mutative"}),(0,s.jsx)(t.th,{style:{textAlign:"center"},children:"Immer"})]})}),(0,s.jsxs)(t.tbody,{children:[(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{style:{textAlign:"left"},children:"Custom shallow copy"}),(0,s.jsx)(t.td,{style:{textAlign:"right"},children:"\u2705"}),(0,s.jsx)(t.td,{style:{textAlign:"center"},children:"\u274c"})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{style:{textAlign:"left"},children:"Strict mode"}),(0,s.jsx)(t.td,{style:{textAlign:"right"},children:"\u2705"}),(0,s.jsx)(t.td,{style:{textAlign:"center"},children:"\u274c"})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{style:{textAlign:"left"},children:"No data freeze by default"}),(0,s.jsx)(t.td,{style:{textAlign:"right"},children:"\u2705"}),(0,s.jsx)(t.td,{style:{textAlign:"center"},children:"\u274c"})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{style:{textAlign:"left"},children:"Non-invasive marking"}),(0,s.jsx)(t.td,{style:{textAlign:"right"},children:"\u2705"}),(0,s.jsx)(t.td,{style:{textAlign:"center"},children:"\u274c"})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{style:{textAlign:"left"},children:"Complete freeze data"}),(0,s.jsx)(t.td,{style:{textAlign:"right"},children:"\u2705"}),(0,s.jsx)(t.td,{style:{textAlign:"center"},children:"\u274c"})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{style:{textAlign:"left"},children:"Non-global config"}),(0,s.jsx)(t.td,{style:{textAlign:"right"},children:"\u2705"}),(0,s.jsx)(t.td,{style:{textAlign:"center"},children:"\u274c"})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{style:{textAlign:"left"},children:"async draft function"}),(0,s.jsx)(t.td,{style:{textAlign:"right"},children:"\u2705"}),(0,s.jsx)(t.td,{style:{textAlign:"center"},children:"\u274c"})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{style:{textAlign:"left"},children:"Fully compatible with JSON Patch spec"}),(0,s.jsx)(t.td,{style:{textAlign:"right"},children:"\u2705"}),(0,s.jsx)(t.td,{style:{textAlign:"center"},children:"\u274c"})]})]})]}),"\n",(0,s.jsxs)(t.p,{children:["Mutative has fewer bugs such as accidental draft escapes than Immer, ",(0,s.jsx)(t.a,{href:"https://github.com/unadlib/mutative/blob/main/test/immer-non-support.test.ts",children:"view details"}),"."]}),"\n",(0,s.jsx)(t.h2,{id:"mutative-vs-immer-performance",children:"Mutative vs Immer Performance"}),"\n",(0,s.jsxs)(t.blockquote,{children:["\n",(0,s.jsx)(t.p,{children:"Mutative passed all of Immer's test cases."}),"\n"]}),"\n",(0,s.jsxs)(t.p,{children:["Measure(ops/sec) to update 50K arrays and 1K objects, bigger is better(",(0,s.jsx)(t.a,{href:"https://github.com/unadlib/mutative/blob/main/test/performance/benchmark.ts",children:"view source"}),"). [Mutative v1.0.10 vs Immer v10.1.1]"]}),"\n",(0,s.jsx)(t.p,{children:(0,s.jsx)(t.img,{alt:"Benchmark",src:r(9109).Z+"",width:"1000",height:"600"})}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{children:"Naive handcrafted reducer - No Freeze x 4,486 ops/sec \xb10.85% (98 runs sampled)\nMutative - No Freeze x 6,338 ops/sec \xb11.14% (93 runs sampled)\nImmer - No Freeze x 5.32 ops/sec \xb10.43% (18 runs sampled)\n\nMutative - Freeze x 969 ops/sec \xb11.02% (98 runs sampled)\nImmer - Freeze x 383 ops/sec \xb10.44% (94 runs sampled)\n\nMutative - Patches and No Freeze x 978 ops/sec \xb10.22% (97 runs sampled)\nImmer - Patches and No Freeze x 5.32 ops/sec \xb10.54% (18 runs sampled)\n\nMutative - Patches and Freeze x 507 ops/sec \xb10.28% (97 runs sampled)\nImmer - Patches and Freeze x 279 ops/sec \xb10.76% (91 runs sampled)\n\nThe fastest method is Mutative - No Freeze\n"})}),"\n",(0,s.jsxs)(t.p,{children:["Run ",(0,s.jsx)(t.code,{children:"yarn benchmark"})," to measure performance."]}),"\n",(0,s.jsxs)(t.blockquote,{children:["\n",(0,s.jsx)(t.p,{children:"OS: macOS 14.6.1, CPU: Apple M1 Max, Node.js: v20.11.0"}),"\n"]}),"\n",(0,s.jsx)(t.p,{children:"Immer relies on auto-freeze to be enabled, if auto-freeze is disabled, Immer will have a huge performance drop and Mutative will have a huge performance lead, especially with large data structures it will have a performance lead of more than 50x."}),"\n",(0,s.jsxs)(t.p,{children:["So if you are using Immer, you will have to enable auto-freeze for performance. Mutative is disabled auto-freeze by default. With the default configuration of both, we can see the 16x performance gap between Mutative (",(0,s.jsx)(t.code,{children:"6,338 ops/sec"}),") and Immer (",(0,s.jsx)(t.code,{children:"383 ops/sec"}),")."]}),"\n",(0,s.jsxs)(t.p,{children:["Overall, Mutative has a huge performance lead over Immer in ",(0,s.jsx)(t.a,{href:"https://github.com/unadlib/mutative/tree/main/test/performance",children:"more performance testing scenarios"}),". Run ",(0,s.jsx)(t.code,{children:"yarn performance"})," to get all the performance results locally."]})]})}function m(e={}){const{wrapper:t}={...(0,n.a)(),...e.components};return t?(0,s.jsx)(t,{...e,children:(0,s.jsx)(o,{...e})}):o(e)}},9109:(e,t,r)=>{r.d(t,{Z:()=>s});const s=r.p+"assets/images/benchmark-387378cfb2fb4125c0c64312e2044e44.jpg"},1151:(e,t,r)=>{r.d(t,{Z:()=>l,a:()=>a});var s=r(7294);const n={},i=s.createContext(n);function a(e){const t=s.useContext(i);return s.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:a(e.components),s.createElement(i.Provider,{value:t},e.children)}}}]);