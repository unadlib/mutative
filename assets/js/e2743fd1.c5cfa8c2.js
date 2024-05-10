"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[6982],{4245:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>r,default:()=>u,frontMatter:()=>i,metadata:()=>o,toc:()=>d});var a=n(5893),s=n(1151);const i={sidebar_position:7},r="unsafe()",o={id:"api-reference/unsafe",title:"unsafe()",description:"When strict mode is enabled, mutable data can only be accessed using unsafe().",source:"@site/docs/api-reference/unsafe.md",sourceDirName:"api-reference",slug:"/api-reference/unsafe",permalink:"/docs/api-reference/unsafe",draft:!1,unlisted:!1,editUrl:"https://github.com/unadlib/mutative/tree/main/website/docs/api-reference/unsafe.md",tags:[],version:"current",lastUpdatedBy:"unadlib",lastUpdatedAt:1702222992e3,sidebarPosition:7,frontMatter:{sidebar_position:7},sidebar:"tutorialSidebar",previous:{title:"rawReturn()",permalink:"/docs/api-reference/rawreturn"},next:{title:"isDraftable()",permalink:"/docs/api-reference/isdraftable"}},c={},d=[{value:"Usage",id:"usage",level:2}];function l(e){const t={a:"a",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...(0,s.a)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(t.h1,{id:"unsafe",children:"unsafe()"}),"\n",(0,a.jsxs)(t.p,{children:["When ",(0,a.jsx)(t.a,{href:"/docs/advanced-guides/strict-mode",children:"strict mode"})," is enabled, mutable data can only be accessed using ",(0,a.jsx)(t.code,{children:"unsafe()"}),"."]}),"\n",(0,a.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,a.jsxs)(t.p,{children:["The ",(0,a.jsx)(t.code,{children:"unsafe()"})," provides a means to perform non-standard state mutations which are not typically allowed within the Mutative strict immutability constraints. This API enables direct mutations on draft states or original objects, allowing developers to bypass the protective layers that prevent accidental state mutations."]}),"\n",(0,a.jsxs)(t.p,{children:["When used, ",(0,a.jsx)(t.code,{children:"unsafe()"})," allows for direct assignment and manipulation of properties within a draft state, which can be necessary for certain operations that require a level of flexibility beyond the standard immutable update patterns. For example, it can be used when interacting with complex objects or when integrating with third-party libraries that may not adhere to immutable update patterns."]}),"\n",(0,a.jsxs)(t.p,{children:["Key features of the ",(0,a.jsx)(t.code,{children:"unsafe()"})," API include:"]}),"\n",(0,a.jsxs)(t.ul,{children:["\n",(0,a.jsx)(t.li,{children:"Allowing mutations that would be restricted under the library\u2019s strict mode."}),"\n",(0,a.jsx)(t.li,{children:"Providing the ability to directly manipulate draft state properties."}),"\n",(0,a.jsx)(t.li,{children:"Enabling integration with objects or libraries that require direct state mutation."}),"\n",(0,a.jsx)(t.li,{children:"Assisting in scenarios where controlled mutations are necessary and do not undermine the overall integrity of the state management process."}),"\n"]}),"\n",(0,a.jsxs)(t.p,{children:["It's important to note that while ",(0,a.jsx)(t.code,{children:"unsafe()"})," can be a powerful tool, it should be used with caution. Since it allows operations that circumvent the core immutability principles of Mutative, it should only be used when such operations are absolutely necessary and when the developer is aware of the potential risks involved. The ",(0,a.jsx)(t.code,{children:"unsafe()"})," API underscores Mutative's commitment to offering robust and flexible state management tools while also catering to advanced use cases where exceptions to the immutability rules are required."]}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-ts",children:"const baseState = {\n  list: [],\n  date: new Date(),\n};\n\nconst state = create(\n  baseState,\n  (draft) => {\n    unsafe(() => {\n      draft.date.setFullYear(2000);\n    });\n    // or return the mutable data:\n    // const date = unsafe(() => draft.date);\n  },\n  {\n    strict: true,\n  }\n);\n"})})]})}function u(e={}){const{wrapper:t}={...(0,s.a)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(l,{...e})}):l(e)}},1151:(e,t,n)=>{n.d(t,{Z:()=>o,a:()=>r});var a=n(7294);const s={},i=a.createContext(s);function r(e){const t=a.useContext(i);return a.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function o(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:r(e.components),a.createElement(i.Provider,{value:t},e.children)}}}]);