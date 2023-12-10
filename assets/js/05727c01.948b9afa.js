"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[1742],{4836:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>r,default:()=>u,frontMatter:()=>o,metadata:()=>d,toc:()=>c});var i=n(5893),a=n(1151);const o={sidebar_position:3},r="Auto Freeze",d={id:"advanced-guides/auto-freeze",title:"Auto Freeze",description:"Enable autoFreeze, and return frozen state, and enable circular reference checking only in development mode.",source:"@site/docs/advanced-guides/auto-freeze.md",sourceDirName:"advanced-guides",slug:"/advanced-guides/auto-freeze",permalink:"/docs/advanced-guides/auto-freeze",draft:!1,unlisted:!1,editUrl:"https://github.com/unadlib/mutative/tree/main/website/docs/advanced-guides/auto-freeze.md",tags:[],version:"current",lastUpdatedBy:"unadlib",lastUpdatedAt:1702227230,formattedLastUpdatedAt:"Dec 10, 2023",sidebarPosition:3,frontMatter:{sidebar_position:3},sidebar:"tutorialSidebar",previous:{title:"Marking data structure",permalink:"/docs/advanced-guides/mark"},next:{title:"Strict Mode",permalink:"/docs/advanced-guides/strict-mode"}},s={},c=[{value:"Enable Auto Freeze",id:"enable-auto-freeze",level:2}];function l(e){const t={admonition:"admonition",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",strong:"strong",ul:"ul",...(0,a.a)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(t.h1,{id:"auto-freeze",children:"Auto Freeze"}),"\n",(0,i.jsx)(t.p,{children:"Enable autoFreeze, and return frozen state, and enable circular reference checking only in development mode."}),"\n",(0,i.jsx)(t.h2,{id:"enable-auto-freeze",children:"Enable Auto Freeze"}),"\n",(0,i.jsxs)(t.p,{children:["The ",(0,i.jsx)(t.code,{children:"enableAutoFreeze"})," option is likely a feature that controls the immutability of objects in the state. When enabled, this option would automatically freeze state objects to prevent them from being modified. This is a common practice in immutable state management, ensuring that state objects are not changed inadvertently, which can lead to unpredictable behaviors in applications."]}),"\n",(0,i.jsxs)(t.p,{children:["Key aspects of the ",(0,i.jsx)(t.code,{children:"enableAutoFreeze"})," option include:"]}),"\n",(0,i.jsxs)(t.ul,{children:["\n",(0,i.jsxs)(t.li,{children:["\n",(0,i.jsxs)(t.p,{children:[(0,i.jsx)(t.strong,{children:"Immutability Enforcement"}),": The primary purpose of ",(0,i.jsx)(t.code,{children:"enableAutoFreeze"})," is to enforce immutability in the state objects. By freezing the objects, it ensures that they cannot be modified once they are created or updated."]}),"\n"]}),"\n",(0,i.jsxs)(t.li,{children:["\n",(0,i.jsxs)(t.p,{children:[(0,i.jsx)(t.strong,{children:"Debugging Aid"}),": This option can be particularly helpful in a development environment where detecting unintended mutations can be crucial. By freezing state objects, any attempts to modify them would result in an error, helping developers identify and fix bugs related to state mutations."]}),"\n"]}),"\n",(0,i.jsxs)(t.li,{children:["\n",(0,i.jsxs)(t.p,{children:[(0,i.jsx)(t.strong,{children:"Optional Use"}),": As an option, ",(0,i.jsx)(t.code,{children:"enableAutoFreeze"})," provides flexibility. Developers can choose to enable it in development environments for added safety and disable it in production for improved performance, depending on their requirements."]}),"\n"]}),"\n",(0,i.jsxs)(t.li,{children:["\n",(0,i.jsxs)(t.p,{children:[(0,i.jsx)(t.strong,{children:"Compatibility with State Management Practices"}),": This feature aligns with the principles of immutable state management, a practice widely adopted in modern application development for its benefits in predictability, simplicity, and ease of debugging."]}),"\n"]}),"\n"]}),"\n",(0,i.jsxs)(t.p,{children:["In summary, the ",(0,i.jsx)(t.code,{children:"enableAutoFreeze"})," option is a useful feature for developers who want to enforce immutability in their application's state. It provides both a safeguard against unintended mutations and a tool for maintaining clean and predictable state management."]}),"\n",(0,i.jsx)(t.admonition,{type:"tip",children:(0,i.jsxs)(t.p,{children:["In order to the security and protection of the updated data in development mode, and the performance in production mode, we recommend that you ",(0,i.jsx)(t.code,{children:"enable"})," auto freeze in development and ",(0,i.jsx)(t.code,{children:"disable"})," it in production."]})})]})}function u(e={}){const{wrapper:t}={...(0,a.a)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(l,{...e})}):l(e)}},1151:(e,t,n)=>{n.d(t,{Z:()=>d,a:()=>r});var i=n(7294);const a={},o=i.createContext(a);function r(e){const t=i.useContext(o);return i.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function d(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:r(e.components),i.createElement(o.Provider,{value:t},e.children)}}}]);