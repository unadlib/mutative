"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[5502],{9390:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>o,default:()=>d,frontMatter:()=>s,metadata:()=>p,toc:()=>i});var a=n(5893),r=n(1151);const s={sidebar_position:2},o="apply()",p={id:"api-reference/apply",title:"apply()",description:"Use apply() for applying patches to get the new state.",source:"@site/docs/api-reference/apply.md",sourceDirName:"api-reference",slug:"/api-reference/apply",permalink:"/docs/api-reference/apply",draft:!1,unlisted:!1,editUrl:"https://github.com/unadlib/mutative/tree/main/website/docs/api-reference/apply.md",tags:[],version:"current",lastUpdatedBy:"unadlib",lastUpdatedAt:1701797985,formattedLastUpdatedAt:"Dec 5, 2023",sidebarPosition:2,frontMatter:{sidebar_position:2},sidebar:"tutorialSidebar",previous:{title:"create()",permalink:"/docs/api-reference/create"},next:{title:"makeCreator()",permalink:"/docs/api-reference/makecreator"}},c={},i=[{value:"Usage",id:"usage",level:2}];function l(e){const t={code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",...(0,r.a)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(t.h1,{id:"apply",children:"apply()"}),"\n",(0,a.jsxs)(t.p,{children:["Use ",(0,a.jsx)(t.code,{children:"apply()"})," for applying patches to get the new state."]}),"\n",(0,a.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-ts",children:"import { create, apply } from 'mutative';\n\nconst baseState = {\n  foo: 'bar',\n  list: [{ text: 'todo' }],\n};\n\nconst [state, patches, inversePatches] = create(\n  baseState,\n  (draft) => {\n    draft.foo = 'foobar';\n    draft.list.push({ text: 'learning' });\n  },\n  {\n    enablePatches: true,\n  }\n);\n\nconst nextState = apply(baseState, patches);\nexpect(nextState).toEqual(state);\nconst prevState = apply(state, inversePatches);\nexpect(prevState).toEqual(baseState);\n"})})]})}function d(e={}){const{wrapper:t}={...(0,r.a)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(l,{...e})}):l(e)}},1151:(e,t,n)=>{n.d(t,{Z:()=>p,a:()=>o});var a=n(7294);const r={},s=a.createContext(r);function o(e){const t=a.useContext(s);return a.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function p(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:o(e.components),a.createElement(s.Provider,{value:t},e.children)}}}]);