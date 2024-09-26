"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[7182],{8978:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>d,contentTitle:()=>i,default:()=>u,frontMatter:()=>s,metadata:()=>c,toc:()=>o});var r=a(5893),n=a(1151);const s={sidebar_position:5},i="Performance",c={id:"getting-started/performance",title:"Performance",description:"Mutative is a high-performance immutable data structure library, it is up to 2x-6x faster than naive handcrafted reducer and up to 16x faster than Immer.",source:"@site/docs/getting-started/performance.md",sourceDirName:"getting-started",slug:"/getting-started/performance",permalink:"/docs/getting-started/performance",draft:!1,unlisted:!1,editUrl:"https://github.com/unadlib/mutative/tree/main/website/docs/getting-started/performance.md",tags:[],version:"current",lastUpdatedBy:"unadlib",lastUpdatedAt:1727373776e3,sidebarPosition:5,frontMatter:{sidebar_position:5},sidebar:"tutorialSidebar",previous:{title:"Using Mutative with React",permalink:"/docs/getting-started/mutative-with-react"},next:{title:"Advanced Guides",permalink:"/docs/category/advanced-guides"}},d={},o=[{value:"Mutative vs Reducer Performance",id:"mutative-vs-reducer-performance",level:2},{value:"Reducer by object",id:"reducer-by-object",level:3},{value:"Reducer by array",id:"reducer-by-array",level:3},{value:"Mutative vs Immer Performance",id:"mutative-vs-immer-performance",level:2},{value:"More Performance Testing Scenarios",id:"more-performance-testing-scenarios",level:2}];function l(e){const t={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",img:"img",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,n.a)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.h1,{id:"performance",children:"Performance"}),"\n",(0,r.jsxs)(t.p,{children:["Mutative is a high-performance immutable data structure library, it is up to ",(0,r.jsx)(t.code,{children:"2x-6x"})," faster than naive handcrafted reducer and up to ",(0,r.jsx)(t.code,{children:"16x"})," faster than Immer."]}),"\n",(0,r.jsx)(t.h2,{id:"mutative-vs-reducer-performance",children:"Mutative vs Reducer Performance"}),"\n",(0,r.jsx)(t.h3,{id:"reducer-by-object",children:"Reducer by object"}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsx)(t.li,{children:"Naive handcrafted reducer"}),"\n"]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-ts",children:"// baseState type: Record<string, { value: number }>\nconst state = {\n  ...baseState,\n  key0: {\n    ...baseState.key0,\n    value: i,\n  },\n};\n"})}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsx)(t.li,{children:"Mutative"}),"\n"]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-ts",children:"const state = create(baseState, (draft) => {\n  draft.key0.value = i;\n});\n"})}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.img,{alt:"Mutative vs Reducer benchmark by object",src:a(8855).Z+"",width:"1000",height:"600"})}),"\n",(0,r.jsxs)(t.blockquote,{children:["\n",(0,r.jsxs)(t.p,{children:["Measure(seconds) to update the 1K-100K items object, lower is better(",(0,r.jsx)(t.a,{href:"https://github.com/unadlib/mutative/blob/main/test/performance/benchmark-object.ts",children:"view source"}),")."]}),"\n"]}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsxs)(t.strong,{children:["Mutative is up to ",(0,r.jsx)(t.code,{children:"2x"})," faster than naive handcrafted reducer for updating immutable objects."]})}),"\n",(0,r.jsx)(t.h3,{id:"reducer-by-array",children:"Reducer by array"}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsx)(t.li,{children:"Naive handcrafted reducer"}),"\n"]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-ts",children:"// baseState type: { value: number }[]\n\n// slower 6x than Mutative\nconst state = [\n  { ...baseState[0], value: i },\n  ...baseState.slice(1, baseState.length),\n];\n\n// slower 2.5x than Mutative\n// const state = baseState.map((item, index) =>\n//   index === 0 ? { ...item, value: i } : item\n// );\n\n// same performance as Mutative\n// const state = [...baseState];\n// state[0] = { ...baseState[0], value: i };\n"})}),"\n",(0,r.jsxs)(t.blockquote,{children:["\n",(0,r.jsx)(t.p,{children:"The actual difference depends on which spread operation syntax you use."}),"\n"]}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsx)(t.li,{children:"Mutative"}),"\n"]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-ts",children:"const state = create(baseState, (draft) => {\n  draft[0].value = i;\n});\n"})}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.img,{alt:"Mutative vs Reducer benchmark by array",src:a(4119).Z+"",width:"1000",height:"600"})}),"\n",(0,r.jsxs)(t.blockquote,{children:["\n",(0,r.jsxs)(t.p,{children:["Measure(seconds) to update the 1K-100K items array, lower is better(",(0,r.jsx)(t.a,{href:"https://github.com/unadlib/mutative/blob/main/test/performance/benchmark-array.ts",children:"view source"}),")."]}),"\n"]}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsxs)(t.strong,{children:["Mutative is up to ",(0,r.jsx)(t.code,{children:"6x"})," faster than naive handcrafted reducer for updating immutable arrays."]})}),"\n",(0,r.jsx)(t.h2,{id:"mutative-vs-immer-performance",children:"Mutative vs Immer Performance"}),"\n",(0,r.jsxs)(t.blockquote,{children:["\n",(0,r.jsx)(t.p,{children:"Mutative passed all of Immer's test cases."}),"\n"]}),"\n",(0,r.jsxs)(t.p,{children:["Measure(ops/sec) to update 50K arrays and 1K objects, bigger is better(",(0,r.jsx)(t.a,{href:"https://github.com/unadlib/mutative/blob/main/test/performance/benchmark.ts",children:"view source"}),"). [Mutative v1.0.11 vs Immer v10.1.1]"]}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.img,{alt:"Benchmark",src:a(3578).Z+"",width:"1000",height:"600"})}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{children:"Naive handcrafted reducer - No Freeze x 4,469 ops/sec \xb10.82% (99 runs sampled)\nMutative - No Freeze x 6,015 ops/sec \xb11.17% (94 runs sampled)\nImmer - No Freeze x 5.36 ops/sec \xb10.28% (18 runs sampled)\n\nMutative - Freeze x 959 ops/sec \xb10.90% (99 runs sampled)\nImmer - Freeze x 382 ops/sec \xb10.53% (94 runs sampled)\n\nMutative - Patches and No Freeze x 970 ops/sec \xb10.99% (96 runs sampled)\nImmer - Patches and No Freeze x 5.22 ops/sec \xb10.80% (18 runs sampled)\n\nMutative - Patches and Freeze x 505 ops/sec \xb10.85% (93 runs sampled)\nImmer - Patches and Freeze x 275 ops/sec \xb10.49% (89 runs sampled)\n\nThe fastest method is Mutative - No Freeze\n"})}),"\n",(0,r.jsxs)(t.p,{children:["Run ",(0,r.jsx)(t.code,{children:"yarn benchmark"})," to measure performance."]}),"\n",(0,r.jsxs)(t.blockquote,{children:["\n",(0,r.jsx)(t.p,{children:"OS: macOS 14.6.1, CPU: Apple M1 Max, Node.js: v20.11.0"}),"\n"]}),"\n",(0,r.jsx)(t.p,{children:"Immer relies on auto-freeze to be enabled, if auto-freeze is disabled, Immer will have a huge performance drop and Mutative will have a huge performance lead, especially with large data structures it will have a performance lead of more than 50x."}),"\n",(0,r.jsxs)(t.p,{children:["So if you are using Immer, you will have to enable auto-freeze for performance. Mutative is disabled auto-freeze by default. With the default configuration of both, we can see the 16x performance gap between Mutative (",(0,r.jsx)(t.code,{children:"6,015 ops/sec"}),") and Immer (",(0,r.jsx)(t.code,{children:"382 ops/sec"}),")."]}),"\n",(0,r.jsxs)(t.p,{children:["Overall, Mutative has a huge performance lead over Immer in ",(0,r.jsx)(t.a,{href:"https://github.com/unadlib/mutative/tree/main/test/performance",children:"more performance testing scenarios"}),". Run ",(0,r.jsx)(t.code,{children:"yarn performance"})," to get all the performance results locally."]}),"\n",(0,r.jsx)(t.h2,{id:"more-performance-testing-scenarios",children:"More Performance Testing Scenarios"}),"\n",(0,r.jsxs)(t.p,{children:["Mutative is up to ",(0,r.jsx)(t.code,{children:"2.5X-73.8X"})," faster than Immer:"]}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.img,{alt:"Mutative vs Immer - All benchmark results by average multiplier",src:a(6068).Z+"",width:"1000",height:"600"})}),"\n",(0,r.jsxs)(t.blockquote,{children:["\n",(0,r.jsxs)(t.p,{children:[(0,r.jsx)(t.a,{href:"https://github.com/unadlib/mutative/blob/main/test/benchmark",children:"view source"}),"."]}),"\n"]})]})}function u(e={}){const{wrapper:t}={...(0,n.a)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(l,{...e})}):l(e)}},6068:(e,t,a)=>{a.d(t,{Z:()=>r});const r=a.p+"assets/images/all-eef2d2150e5896cae1b043432a88ae34.jpg"},4119:(e,t,a)=>{a.d(t,{Z:()=>r});const r=a.p+"assets/images/benchmark-array-53267be71341564a59ab3e798f0da594.jpg"},8855:(e,t,a)=>{a.d(t,{Z:()=>r});const r=a.p+"assets/images/benchmark-object-d20dc0c6f7df5ee5641847a9a8b8a3ea.jpg"},3578:(e,t,a)=>{a.d(t,{Z:()=>r});const r=a.p+"assets/images/benchmark-d864b3daaa1fa3b3e5a1d341f6d06452.jpg"},1151:(e,t,a)=>{a.d(t,{Z:()=>c,a:()=>i});var r=a(7294);const n={},s=r.createContext(n);function i(e){const t=r.useContext(s);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function c(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:i(e.components),r.createElement(s.Provider,{value:t},e.children)}}}]);