"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[1139],{9820:(e,t,i)=>{i.r(t),i.d(t,{assets:()=>c,contentTitle:()=>r,default:()=>d,frontMatter:()=>s,metadata:()=>a,toc:()=>u});var n=i(5893),o=i(1151);const s={sidebar_position:2},r="FAQ",a={id:"extra-topics/faq",title:"FAQ",description:"If you have any questions about mutative, you can feedback on GitHub Discussions.",source:"@site/docs/extra-topics/faq.md",sourceDirName:"extra-topics",slug:"/extra-topics/faq",permalink:"/docs/extra-topics/faq",draft:!1,unlisted:!1,editUrl:"https://github.com/unadlib/mutative/tree/main/website/docs/extra-topics/faq.md",tags:[],version:"current",lastUpdatedBy:"unadlib",lastUpdatedAt:1701597396e3,sidebarPosition:2,frontMatter:{sidebar_position:2},sidebar:"tutorialSidebar",previous:{title:"Comparison with Immer",permalink:"/docs/extra-topics/comparison-with-immer"},next:{title:"Contributing",permalink:"/docs/extra-topics/contributing"}},c={},u=[{value:"Q&amp;A",id:"qa",level:2}];function l(e){const t={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",ul:"ul",...(0,o.a)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.h1,{id:"faq",children:"FAQ"}),"\n",(0,n.jsxs)(t.p,{children:["If you have any questions about mutative, you can feedback on ",(0,n.jsx)(t.a,{href:"https://github.com/unadlib/mutative/issues",children:"GitHub Discussions"}),"."]}),"\n",(0,n.jsx)(t.h2,{id:"qa",children:"Q&A"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:"Why does Mutative have such good performance?"}),"\n"]}),"\n",(0,n.jsx)(t.p,{children:"Mutative optimization focus on shallow copy optimization, more complete lazy drafts, finalization process optimization, and more."}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:"I'm already using Immer, can I migrate smoothly to Mutative?"}),"\n"]}),"\n",(0,n.jsx)(t.p,{children:"Yes. Unless you have to be compatible with Internet Explorer, Mutative supports almost all of Immer features, and you can easily migrate from Immer to Mutative."}),"\n",(0,n.jsxs)(t.blockquote,{children:["\n",(0,n.jsxs)(t.p,{children:["Migration is also not possible for React Native that does not support Proxy. React Native uses a new JS engine during refactoring - Hermes, and it (if < v0.59 or when using the Hermes engine on React Native < v0.64) does ",(0,n.jsx)(t.a,{href:"https://github.com/facebook/hermes/issues/33",children:"not support Proxy on Android"}),", but ",(0,n.jsx)(t.a,{href:"https://reactnative.dev/blog/2021/03/12/version-0.64#hermes-with-proxy-support",children:"React Native v0.64 with the Hermes engine support Proxy"}),"."]}),"\n"]}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:"Can Mutative be integrated with Redux?"}),"\n"]}),"\n",(0,n.jsxs)(t.p,{children:["Yes. Mutative supports return values for reducer, and ",(0,n.jsx)(t.code,{children:"redux-toolkit"})," is considering support for ",(0,n.jsxs)(t.a,{href:"https://github.com/reduxjs/redux-toolkit/pull/3074",children:["configurable ",(0,n.jsx)(t.code,{children:"produce()"})]}),"."]})]})}function d(e={}){const{wrapper:t}={...(0,o.a)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(l,{...e})}):l(e)}},1151:(e,t,i)=>{i.d(t,{Z:()=>a,a:()=>r});var n=i(7294);const o={},s=n.createContext(o);function r(e){const t=n.useContext(s);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:r(e.components),n.createElement(s.Provider,{value:t},e.children)}}}]);