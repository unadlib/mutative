"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[3418],{4015:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>c,contentTitle:()=>r,default:()=>h,frontMatter:()=>s,metadata:()=>l,toc:()=>o});var n=a(5893),i=a(1151);const s={title:"Announcing Mutative 1.0 - A New Era in Efficient Immutable Updates",authors:"unadlib",tags:["release"],image:"./img/social-card.jpg",date:new Date("2023-12-16T00:00:00.000Z")},r=void 0,l={permalink:"/blog/releases/1.0",editUrl:"https://github.com/unadlib/mutative/tree/main/website/blog/releases/1.0/index.md",source:"@site/blog/releases/1.0/index.md",title:"Announcing Mutative 1.0 - A New Era in Efficient Immutable Updates",description:"In the world of JavaScript development, managing immutable state efficiently is a cornerstone for high-performance applications. Today, we are excited to introduce Mutative 1.0, a JavaScript library that redefines the way we handle immutable updates. With performance that is 2-6x faster than naive handcrafted reducers and over 10x faster than Immer, Mutative 1.0 is set to transform our approach to immutable state management and make it more efficient.",date:"2023-12-16T00:00:00.000Z",tags:[{label:"release",permalink:"/blog/tags/release"}],readingTime:5.555,hasTruncateMarker:!1,authors:[{name:"Michael Lin",title:"Author of Mutative",url:"https://unadlib.github.io",imageURL:"https://github.com/unadlib.png",key:"unadlib"}],frontMatter:{title:"Announcing Mutative 1.0 - A New Era in Efficient Immutable Updates",authors:"unadlib",tags:["release"],image:"./img/social-card.jpg",date:"2023-12-16T00:00:00.000Z"},unlisted:!1},c={image:a(8979).Z,authorsImageUrls:[void 0]},o=[{value:"Key Features and Benefits",id:"key-features-and-benefits",level:2},{value:"Performance",id:"performance",level:2},{value:"Reducer by object",id:"reducer-by-object",level:3},{value:"Reducer by array",id:"reducer-by-array",level:3},{value:"Mutative vs Immer Performance",id:"mutative-vs-immer-performance",level:2},{value:"Comparison with Immer",id:"comparison-with-immer",level:2},{value:"Getting Started",id:"getting-started",level:2},{value:"Conclusion",id:"conclusion",level:2}];function d(e){const t={a:"a",blockquote:"blockquote",code:"code",h2:"h2",h3:"h3",img:"img",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,i.a)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.p,{children:"In the world of JavaScript development, managing immutable state efficiently is a cornerstone for high-performance applications. Today, we are excited to introduce Mutative 1.0, a JavaScript library that redefines the way we handle immutable updates. With performance that is 2-6x faster than naive handcrafted reducers and over 10x faster than Immer, Mutative 1.0 is set to transform our approach to immutable state management and make it more efficient."}),"\n",(0,n.jsxs)(t.p,{children:["Repository: ",(0,n.jsx)(t.a,{href:"https://github.com/unadlib/mutative",children:"https://github.com/unadlib/mutative"})]}),"\n",(0,n.jsx)(t.h2,{id:"key-features-and-benefits",children:"Key Features and Benefits"}),"\n",(0,n.jsx)(t.p,{children:"Mutative brings a suite of features designed to optimize performance and flexibility:"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.strong,{children:"High Performance"}),": At its core, Mutative is engineered for speed. It excels in scenarios involving large data structures, making it an ideal choice for complex applications."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.strong,{children:"Immutable Updates with Ease"}),": Supporting a range of data structures including objects, arrays, Sets, Maps, and more customizable types, Mutative ensures that immutable updates are not just efficient but also straightforward to implement."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.strong,{children:"Flexible Configuration"}),": The library offers optional freezing of immutable data, strict mode and supports the JSON Patch standard, providing developers with the flexibility to tailor it to their specific needs."]}),"\n"]}),"\n",(0,n.jsx)(t.h2,{id:"performance",children:"Performance"}),"\n",(0,n.jsx)(t.h3,{id:"reducer-by-object",children:"Reducer by object"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:"Naive handcrafted reducer"}),"\n"]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-ts",children:"// baseState type: Record<string, { value: number }>\nconst state = {\n  ...baseState,\n  key0: {\n    ...baseState.key0,\n    value: i,\n  },\n};\n"})}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:"Mutative"}),"\n"]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-ts",children:"const state = create(baseState, (draft) => {\n  draft.key0.value = i;\n});\n"})}),"\n",(0,n.jsx)(t.p,{children:(0,n.jsx)(t.img,{alt:"Mutative vs Reducer benchmark by object",src:a(3095).Z+"",width:"1000",height:"600"})}),"\n",(0,n.jsxs)(t.blockquote,{children:["\n",(0,n.jsxs)(t.p,{children:["Measure(seconds) to update the 1K-100K items object, lower is better(",(0,n.jsx)(t.a,{href:"https://github.com/unadlib/mutative/blob/main/test/performance/benchmark-object.ts",children:"view source"}),")."]}),"\n"]}),"\n",(0,n.jsx)(t.p,{children:(0,n.jsxs)(t.strong,{children:["Mutative is up to ",(0,n.jsx)(t.code,{children:"2x"})," faster than naive handcrafted reducer for updating immutable objects."]})}),"\n",(0,n.jsx)(t.h3,{id:"reducer-by-array",children:"Reducer by array"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:"Naive handcrafted reducer"}),"\n"]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-ts",children:"// baseState type: { value: number }[]\nconst state = [\n  { ...baseState[0], value: i },\n  ...baseState.slice(1, baseState.length),\n];\n"})}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:"Mutative"}),"\n"]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-ts",children:"const state = create(baseState, (draft) => {\n  draft[0].value = i;\n});\n"})}),"\n",(0,n.jsx)(t.p,{children:(0,n.jsx)(t.img,{alt:"Mutative vs Reducer benchmark by array",src:a(250).Z+"",width:"1000",height:"600"})}),"\n",(0,n.jsxs)(t.blockquote,{children:["\n",(0,n.jsxs)(t.p,{children:["Measure(seconds) to update the 1K-100K items array, lower is better(",(0,n.jsx)(t.a,{href:"https://github.com/unadlib/mutative/blob/main/test/performance/benchmark-array.ts",children:"view source"}),")."]}),"\n"]}),"\n",(0,n.jsx)(t.p,{children:(0,n.jsxs)(t.strong,{children:["Mutative is up to ",(0,n.jsx)(t.code,{children:"6x"})," faster than naive handcrafted reducer for updating immutable arrays."]})}),"\n",(0,n.jsx)(t.h2,{id:"mutative-vs-immer-performance",children:"Mutative vs Immer Performance"}),"\n",(0,n.jsxs)(t.blockquote,{children:["\n",(0,n.jsx)(t.p,{children:"Mutative passed all of Immer's test cases."}),"\n"]}),"\n",(0,n.jsxs)(t.p,{children:["Measure(ops/sec) to update 50K arrays and 1K objects, bigger is better(",(0,n.jsx)(t.a,{href:"https://github.com/unadlib/mutative/blob/main/test/performance/benchmark.ts",children:"view source"}),"). [Mutative v1.0.10 vs Immer v10.1.1]"]}),"\n",(0,n.jsx)(t.p,{children:(0,n.jsx)(t.img,{alt:"Benchmark",src:a(8899).Z+"",width:"1000",height:"600"})}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{children:"Naive handcrafted reducer - No Freeze x 4,439 ops/sec \xb10.65% (98 runs sampled)\nMutative - No Freeze x 6,300 ops/sec \xb11.19% (94 runs sampled)\nImmer - No Freeze x 5.26 ops/sec \xb10.59% (18 runs sampled)\n\nMutative - Freeze x 937 ops/sec \xb11.25% (95 runs sampled)\nImmer - Freeze x 378 ops/sec \xb10.66% (93 runs sampled)\n\nMutative - Patches and No Freeze x 975 ops/sec \xb10.17% (99 runs sampled)\nImmer - Patches and No Freeze x 5.29 ops/sec \xb10.30% (18 runs sampled)\n\nMutative - Patches and Freeze x 512 ops/sec \xb10.85% (98 runs sampled)\nImmer - Patches and Freeze x 278 ops/sec \xb10.57% (90 runs sampled)\n\nThe fastest method is Mutative - No Freeze\n"})}),"\n",(0,n.jsxs)(t.p,{children:["Run ",(0,n.jsx)(t.code,{children:"yarn benchmark"})," to measure performance."]}),"\n",(0,n.jsxs)(t.blockquote,{children:["\n",(0,n.jsx)(t.p,{children:"OS: macOS 14.2.1, CPU: Apple M1 Max, Node.js: v20.11.0"}),"\n"]}),"\n",(0,n.jsx)(t.p,{children:"Immer relies on auto-freeze to be enabled, if auto-freeze is disabled, Immer will have a huge performance drop and Mutative will have a huge performance lead, especially with large data structures it will have a performance lead of more than 50x."}),"\n",(0,n.jsxs)(t.p,{children:["So if you are using Immer, you will have to enable auto-freeze for performance. Mutative is disabled auto-freeze by default. With the default configuration of both, we can see the 16x performance gap between Mutative (",(0,n.jsx)(t.code,{children:"6,300 ops/sec"}),") and Immer (",(0,n.jsx)(t.code,{children:"378 ops/sec"}),")."]}),"\n",(0,n.jsxs)(t.p,{children:["Overall, Mutative has a huge performance lead over Immer in ",(0,n.jsx)(t.a,{href:"https://github.com/unadlib/mutative/tree/main/test/performance",children:"more performance testing scenarios"}),"."]}),"\n",(0,n.jsx)(t.h2,{id:"comparison-with-immer",children:"Comparison with Immer"}),"\n",(0,n.jsx)(t.p,{children:"While Immer has been a popular choice for handling immutable data, Mutative 1.0 takes it a step further, and Mutative is over 10x faster than Immer. It not only matches all of Immer's test cases but also introduces additional features such as custom shallow copy, strict mode, and a default setting that does not freeze data. These enhancements make Mutative more efficient, especially in handling large-scale applications. Here\u2019s a quick comparison of the two libraries:"}),"\n",(0,n.jsxs)(t.table,{children:[(0,n.jsx)(t.thead,{children:(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.th,{style:{textAlign:"left"}}),(0,n.jsx)(t.th,{style:{textAlign:"right"},children:"Mutative"}),(0,n.jsx)(t.th,{style:{textAlign:"center"},children:"Immer"})]})}),(0,n.jsxs)(t.tbody,{children:[(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{style:{textAlign:"left"},children:"Custom shallow copy"}),(0,n.jsx)(t.td,{style:{textAlign:"right"},children:"\u2705"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u274c"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{style:{textAlign:"left"},children:"Strict mode"}),(0,n.jsx)(t.td,{style:{textAlign:"right"},children:"\u2705"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u274c"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{style:{textAlign:"left"},children:"No data freeze by default"}),(0,n.jsx)(t.td,{style:{textAlign:"right"},children:"\u2705"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u274c"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{style:{textAlign:"left"},children:"Non-invasive marking"}),(0,n.jsx)(t.td,{style:{textAlign:"right"},children:"\u2705"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u274c"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{style:{textAlign:"left"},children:"Complete freeze data"}),(0,n.jsx)(t.td,{style:{textAlign:"right"},children:"\u2705"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u274c"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{style:{textAlign:"left"},children:"Non-global config"}),(0,n.jsx)(t.td,{style:{textAlign:"right"},children:"\u2705"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u274c"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{style:{textAlign:"left"},children:"async draft function"}),(0,n.jsx)(t.td,{style:{textAlign:"right"},children:"\u2705"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u274c"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{style:{textAlign:"left"},children:"Fully compatible with JSON Patch spec"}),(0,n.jsx)(t.td,{style:{textAlign:"right"},children:"\u2705"}),(0,n.jsx)(t.td,{style:{textAlign:"center"},children:"\u274c"})]})]})]}),"\n",(0,n.jsxs)(t.p,{children:["Mutative has fewer bugs such as accidental draft escapes than Immer, ",(0,n.jsx)(t.a,{href:"https://github.com/unadlib/mutative/blob/main/test/immer-non-support.test.ts",children:"view details"}),"."]}),"\n",(0,n.jsx)(t.h2,{id:"getting-started",children:"Getting Started"}),"\n",(0,n.jsx)(t.p,{children:"Integrating Mutative into your JavaScript projects is straightforward. You can install it using Yarn or NPM, and its API is intuitive and easy to grasp. Here\u2019s a quick start example:"}),"\n",(0,n.jsxs)(t.ol,{children:["\n",(0,n.jsx)(t.li,{children:"Install Mutative using Yarn or NPM:"}),"\n"]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-bash",children:"yarn add mutative\n"})}),"\n",(0,n.jsxs)(t.ol,{start:"2",children:["\n",(0,n.jsxs)(t.li,{children:["Import the ",(0,n.jsx)(t.code,{children:"create"})," function from Mutative and use it to create a new immutable state:"]}),"\n"]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-javascript",children:"import { create } from 'mutative';\n\nconst baseState = {\n  foo: 'bar',\n  list: [{ text: 'coding' }],\n};\n\nconst state = create(baseState, (draft) => {\n  draft.list.push({ text: 'learning' });\n});\n\nexpect(state).not.toBe(baseState);\nexpect(state.list).not.toBe(baseState.list);\n"})}),"\n",(0,n.jsx)(t.p,{children:"This simple code snippet demonstrates the ease with which you can manage immutable state using Mutative."}),"\n",(0,n.jsx)(t.h2,{id:"conclusion",children:"Conclusion"}),"\n",(0,n.jsx)(t.p,{children:"As we unveil Mutative 1.0, we're not just releasing a new library; we're inviting JavaScript developers to step into a future where state management is no longer a bottleneck but a catalyst for performance and innovation. Mutative 1.0 stands as a testament to what modern JavaScript can achieve - a blend of speed, efficiency, and ease of use that elevates coding from a task to an art."}),"\n",(0,n.jsx)(t.p,{children:"This library is more than a tool; it's a paradigm shift in how we approach immutable updates. With its unparalleled performance, Mutative 1.0 is poised to redefine best practices in JavaScript development, making cumbersome state management a thing of the past. It's an invitation to developers to push the boundaries of what's possible, to build applications that are not just functional but phenomenally fast and responsive."}),"\n",(0,n.jsx)(t.p,{children:"As the JavaScript landscape continues to evolve, Mutative 1.0 will undoubtedly play a pivotal role in shaping the future of state management. We encourage the community to explore its potential, to integrate it into their projects, and to contribute to its growth. Together, we can drive the evolution of JavaScript development, making our applications not just faster, but smarter, and more intuitive than ever before."}),"\n",(0,n.jsx)(t.p,{children:"Join us in embracing the future with Mutative 1.0 - where efficiency meets innovation, and where every line of code brings us closer to the zenith of JavaScript potential."})]})}function h(e={}){const{wrapper:t}={...(0,i.a)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(d,{...e})}):d(e)}},8979:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/social-card-ed05b8b030d73b8ecb02258d29c6dc5b.jpg"},250:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/benchmark-array-53267be71341564a59ab3e798f0da594.jpg"},3095:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/benchmark-object-d20dc0c6f7df5ee5641847a9a8b8a3ea.jpg"},8899:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/benchmark-ca99c20ac720844b23c75fb367742cc2.jpg"},1151:(e,t,a)=>{a.d(t,{Z:()=>l,a:()=>r});var n=a(7294);const i={},s=n.createContext(i);function r(e){const t=n.useContext(s);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:r(e.components),n.createElement(s.Provider,{value:t},e.children)}}}]);