"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[9050],{7019:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>o,contentTitle:()=>i,default:()=>h,frontMatter:()=>a,metadata:()=>c,toc:()=>l});var s=t(5893),r=t(1151);const a={sidebar_position:1},i="create()",c={id:"api-reference/create",title:"create()",description:"Use create() for draft mutation to get a new state, which also supports currying.",source:"@site/docs/api-reference/create.md",sourceDirName:"api-reference",slug:"/api-reference/create",permalink:"/docs/api-reference/create",draft:!1,unlisted:!1,editUrl:"https://github.com/unadlib/mutative/tree/main/website/docs/api-reference/create.md",tags:[],version:"current",lastUpdatedBy:"unadlib",lastUpdatedAt:1701797985,formattedLastUpdatedAt:"Dec 5, 2023",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"tutorialSidebar",previous:{title:"API Reference",permalink:"/docs/category/api-reference"},next:{title:"apply()",permalink:"/docs/api-reference/apply"}},o={},l=[{value:"Usage",id:"usage",level:2},{value:"Currying",id:"currying",level:2}];function d(e){const n={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,r.a)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.h1,{id:"create",children:"create()"}),"\n",(0,s.jsxs)(n.p,{children:["Use ",(0,s.jsx)(n.code,{children:"create()"})," for draft mutation to get a new state, which also supports currying."]}),"\n",(0,s.jsx)(n.h2,{id:"usage",children:"Usage"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"import { create } from 'mutative';\n\nconst baseState = {\n  foo: 'bar',\n  list: [{ text: 'todo' }],\n};\n\nconst state = create(baseState, (draft) => {\n  draft.foo = 'foobar';\n  draft.list.push({ text: 'learning' });\n});\n"})}),"\n",(0,s.jsxs)(n.p,{children:["In this basic example, the changes to the draft are 'mutative' within the draft callback, and ",(0,s.jsx)(n.code,{children:"create()"})," is finally executed with a new immutable state."]}),"\n",(0,s.jsx)(n.p,{children:"Then options is optional."}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsxs)(n.p,{children:["strict - ",(0,s.jsx)(n.code,{children:"boolean"}),", the default is false."]}),"\n",(0,s.jsxs)(n.blockquote,{children:["\n",(0,s.jsxs)(n.p,{children:["Forbid accessing non-draftable values in strict mode(unless using ",(0,s.jsx)(n.a,{href:"#unsafe",children:"unsafe()"}),")."]}),"\n"]}),"\n",(0,s.jsxs)(n.blockquote,{children:["\n",(0,s.jsxs)(n.p,{children:["When strict mode is enabled, mutable data can only be accessed using ",(0,s.jsx)(n.a,{href:"#unsafe",children:(0,s.jsx)(n.code,{children:"unsafe()"})}),"."]}),"\n"]}),"\n",(0,s.jsxs)(n.blockquote,{children:["\n",(0,s.jsxs)(n.p,{children:[(0,s.jsxs)(n.strong,{children:["It is recommended to enable ",(0,s.jsx)(n.code,{children:"strict"})," in development mode and disable ",(0,s.jsx)(n.code,{children:"strict"})," in production mode."]})," This will ensure safe explicit returns and also keep good performance in the production build. If the value that does not mix any current draft or is ",(0,s.jsx)(n.code,{children:"undefined"})," is returned, then use ",(0,s.jsx)(n.a,{href:"#rawreturn",children:"rawReturn()"}),"."]}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsxs)(n.p,{children:["enablePatches - ",(0,s.jsx)(n.code,{children:"boolean | { pathAsArray?: boolean; arrayLengthAssignment?: boolean; }"}),", the default is false."]}),"\n",(0,s.jsxs)(n.blockquote,{children:["\n",(0,s.jsx)(n.p,{children:"Enable patch, and return the patches/inversePatches."}),"\n"]}),"\n",(0,s.jsxs)(n.blockquote,{children:["\n",(0,s.jsxs)(n.p,{children:["If you need to set the shape of the generated patch in more detail, then you can set ",(0,s.jsx)(n.code,{children:"pathAsArray"})," and ",(0,s.jsx)(n.code,{children:"arrayLengthAssignment"}),"\u3002",(0,s.jsx)(n.code,{children:"pathAsArray"})," default value is ",(0,s.jsx)(n.code,{children:"true"}),", if it's ",(0,s.jsx)(n.code,{children:"true"}),", the path will be an array, otherwise it is a string; ",(0,s.jsx)(n.code,{children:"arrayLengthAssignment"})," default value is ",(0,s.jsx)(n.code,{children:"true"}),", if it's ",(0,s.jsx)(n.code,{children:"true"}),", the array length will be included in the patches, otherwise no include array length(",(0,s.jsx)(n.strong,{children:"NOTE"}),": If ",(0,s.jsx)(n.code,{children:"arrayLengthAssignment"})," is ",(0,s.jsx)(n.code,{children:"false"}),", it is fully compatible with JSON Patch spec, but it may have additional performance loss), ",(0,s.jsx)(n.a,{href:"https://github.com/unadlib/mutative/issues/6",children:"view related discussions"}),"."]}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsxs)(n.p,{children:["enableAutoFreeze - ",(0,s.jsx)(n.code,{children:"boolean"}),", the default is false."]}),"\n",(0,s.jsxs)(n.blockquote,{children:["\n",(0,s.jsxs)(n.p,{children:["Enable autoFreeze, and return frozen state, and enable circular reference checking only in ",(0,s.jsx)(n.code,{children:"development"})," mode."]}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:["\n",(0,s.jsxs)(n.p,{children:["mark - ",(0,s.jsx)(n.code,{children:"(target) => ('mutable'|'immutable'|function) | (target) => ('mutable'|'immutable'|function)[]"})]}),"\n",(0,s.jsxs)(n.blockquote,{children:["\n",(0,s.jsxs)(n.p,{children:["Set a mark to determine if the value is mutable or if an instance is an immutable, and it can also return a shallow copy function(",(0,s.jsx)(n.code,{children:"AutoFreeze"})," and ",(0,s.jsx)(n.code,{children:"Patches"})," should both be disabled, Some patches operation might not be equivalent).\nWhen the mark function is (target) => 'immutable', it means all the objects in the state structure are immutable. In this specific case, you can totally turn on ",(0,s.jsx)(n.code,{children:"AutoFreeze"})," and ",(0,s.jsx)(n.code,{children:"Patches"}),".\n",(0,s.jsx)(n.code,{children:"mark"})," supports multiple marks, and the marks are executed in order, and the first mark that returns a value will be used."]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,s.jsx)(n.h2,{id:"currying",children:"Currying"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"const [draft, finalize] = create(baseState);\ndraft.foobar.bar = 'baz';\nconst state = finalize();\n"})}),"\n",(0,s.jsxs)(n.blockquote,{children:["\n",(0,s.jsxs)(n.p,{children:["Support set options such as ",(0,s.jsx)(n.code,{children:"const [draft, finalize] = create(baseState, { enableAutoFreeze: true });"})]}),"\n"]})]})}function h(e={}){const{wrapper:n}={...(0,r.a)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(d,{...e})}):d(e)}},1151:(e,n,t)=>{t.d(n,{Z:()=>c,a:()=>i});var s=t(7294);const r={},a=s.createContext(r);function i(e){const n=s.useContext(a);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:i(e.components),s.createElement(a.Provider,{value:n},e.children)}}}]);