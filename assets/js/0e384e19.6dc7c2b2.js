"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[9671],{7876:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>d,contentTitle:()=>s,default:()=>l,frontMatter:()=>r,metadata:()=>o,toc:()=>u});var n=a(5893),i=a(1151);const r={sidebar_position:1},s="Introduction",o={id:"intro",title:"Introduction",description:"Mutative - A JavaScript library for efficient immutable updates, 2-6x faster than naive handcrafted reducer, and more than 10x faster than Immer.",source:"@site/docs/intro.md",sourceDirName:".",slug:"/intro",permalink:"/docs/intro",draft:!1,unlisted:!1,editUrl:"https://github.com/unadlib/mutative/tree/main/website/docs/intro.md",tags:[],version:"current",lastUpdatedBy:"unadlib",lastUpdatedAt:1701961455,formattedLastUpdatedAt:"Dec 7, 2023",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"tutorialSidebar",next:{title:"Getting Started",permalink:"/docs/category/getting-started"}},d={},u=[{value:"What is Mutative?",id:"what-is-mutative",level:2},{value:"Motivation",id:"motivation",level:2},{value:"Features and Benefits",id:"features-and-benefits",level:2}];function c(e){const t={a:"a",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",strong:"strong",ul:"ul",...(0,i.a)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.h1,{id:"introduction",children:"Introduction"}),"\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.strong,{children:"Mutative"})," - A JavaScript library for efficient immutable updates, 2-6x faster than naive handcrafted reducer, and more than 10x faster than Immer."]}),"\n",(0,n.jsx)(t.h2,{id:"what-is-mutative",children:"What is Mutative?"}),"\n",(0,n.jsx)(t.p,{children:"Mutative can help simplify the updating of immutable data structures, such as those used in React and Redux. It allows you to write code in a mutable way for the draft object, and ultimately it produces a new immutable data structure (the next state), avoiding unnecessary accidental mutations or complex deep updates with spread operations."}),"\n",(0,n.jsx)(t.h2,{id:"motivation",children:"Motivation"}),"\n",(0,n.jsxs)(t.p,{children:["Writing immutable updates by hand is usually difficult, prone to errors, and cumbersome. Immer helps us write simpler immutable updates with ",(0,n.jsx)(t.code,{children:"mutative"})," logic."]}),"\n",(0,n.jsx)(t.p,{children:"But its performance issue causes a runtime performance overhead. Immer must have auto-freeze enabled by default(Performance will be worse if auto-freeze is disabled), such immutable state with Immer is not common. In scenarios such as cross-processing, remote data transfer, etc., we have to constantly freeze these immutable data."}),"\n",(0,n.jsxs)(t.p,{children:["There are more parts that could be improved, such as better type inference, non-intrusive markup, support for more types of immutability, Safer immutability, ",(0,n.jsx)(t.a,{href:"https://github.com/unadlib/mutative/blob/main/test/immer-non-support.test.ts",children:"more edge cases"}),", and so on."]}),"\n",(0,n.jsx)(t.p,{children:"This is why Mutative was created."}),"\n",(0,n.jsx)(t.h2,{id:"features-and-benefits",children:"Features and Benefits"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.strong,{children:"Mutation makes immutable updates"})," - Immutable data structures supporting objects, arrays, Sets and Maps."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.strong,{children:"High performance"})," - 10x faster than immer by default, even faster than naive handcrafted reducer."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.strong,{children:"Optional freezing state"})," - No freezing of immutable data by default."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.strong,{children:"Support for JSON Patch"})," - Full compliance with JSON Patch specification."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.strong,{children:"Custom shallow copy"})," - Support for more types of immutable data."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.strong,{children:"Support mark for immutable and mutable data"})," - Allows for non-invasive marking."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.strong,{children:"Safer mutable data access in strict mode"})," - It brings more secure immutable updates."]}),"\n",(0,n.jsxs)(t.li,{children:[(0,n.jsx)(t.strong,{children:"Support for reducer"})," - Support reducer function and any other immutable state library."]}),"\n"]})]})}function l(e={}){const{wrapper:t}={...(0,i.a)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(c,{...e})}):c(e)}},1151:(e,t,a)=>{a.d(t,{Z:()=>o,a:()=>s});var n=a(7294);const i={},r=n.createContext(i);function s(e){const t=n.useContext(r);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function o(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:s(e.components),n.createElement(r.Provider,{value:t},e.children)}}}]);