"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[9124],{8076:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>c,contentTitle:()=>i,default:()=>u,frontMatter:()=>r,metadata:()=>o,toc:()=>d});var n=a(5893),s=a(1151);const r={sidebar_position:8},i="isDraftable()",o={id:"api-reference/isdraftable",title:"isDraftable()",description:"Check if a value is draftable",source:"@site/docs/api-reference/isdraftable.md",sourceDirName:"api-reference",slug:"/api-reference/isdraftable",permalink:"/docs/api-reference/isdraftable",draft:!1,unlisted:!1,editUrl:"https://github.com/unadlib/mutative/tree/main/website/docs/api-reference/isdraftable.md",tags:[],version:"current",lastUpdatedBy:"unadlib",lastUpdatedAt:1701797985,formattedLastUpdatedAt:"Dec 5, 2023",sidebarPosition:8,frontMatter:{sidebar_position:8},sidebar:"tutorialSidebar",previous:{title:"unsafe()",permalink:"/docs/api-reference/unsafe"},next:{title:"isDraft()",permalink:"/docs/api-reference/isdraft"}},c={},d=[{value:"Usage",id:"usage",level:2}];function l(e){const t={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",...(0,s.a)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.h1,{id:"isdraftable",children:"isDraftable()"}),"\n",(0,n.jsx)(t.p,{children:"Check if a value is draftable"}),"\n",(0,n.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-ts",children:"const baseState = {\n  date: new Date(),\n  list: [{ text: 'todo' }],\n};\n\nexpect(isDraftable(baseState.date)).toBeFalsy();\nexpect(isDraftable(baseState.list)).toBeTruthy();\n"})}),"\n",(0,n.jsxs)(t.blockquote,{children:["\n",(0,n.jsxs)(t.p,{children:["You can set a mark to determine if the value is draftable, and the mark function should be the same as passing in ",(0,n.jsx)(t.code,{children:"create()"})," mark option."]}),"\n"]})]})}function u(e={}){const{wrapper:t}={...(0,s.a)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(l,{...e})}):l(e)}},1151:(e,t,a)=>{a.d(t,{Z:()=>o,a:()=>i});var n=a(7294);const s={},r=n.createContext(s);function i(e){const t=n.useContext(r);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function o(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:i(e.components),n.createElement(r.Provider,{value:t},e.children)}}}]);