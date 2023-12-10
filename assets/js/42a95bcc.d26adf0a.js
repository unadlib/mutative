"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[6457],{2249:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>i,default:()=>l,frontMatter:()=>s,metadata:()=>o,toc:()=>d});var r=n(5893),a=n(1151);const s={sidebar_position:6},i="rawReturn()",o={id:"api-reference/rawreturn",title:"rawReturn()",description:"For return values that do not contain any drafts, you can use rawReturn() to wrap this return value to improve performance. It ensure that the return value is only returned explicitly.",source:"@site/docs/api-reference/rawreturn.md",sourceDirName:"api-reference",slug:"/api-reference/rawreturn",permalink:"/docs/api-reference/rawreturn",draft:!1,unlisted:!1,editUrl:"https://github.com/unadlib/mutative/tree/main/website/docs/api-reference/rawreturn.md",tags:[],version:"current",lastUpdatedBy:"unadlib",lastUpdatedAt:1702119575,formattedLastUpdatedAt:"Dec 9, 2023",sidebarPosition:6,frontMatter:{sidebar_position:6},sidebar:"tutorialSidebar",previous:{title:"original()",permalink:"/docs/api-reference/original"},next:{title:"unsafe()",permalink:"/docs/api-reference/unsafe"}},c={},d=[{value:"Usage",id:"usage",level:2}];function u(e){const t={a:"a",admonition:"admonition",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...(0,a.a)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.h1,{id:"rawreturn",children:"rawReturn()"}),"\n",(0,r.jsxs)(t.p,{children:["For return values that do not contain any drafts, you can use ",(0,r.jsx)(t.code,{children:"rawReturn()"})," to wrap this return value to improve performance. It ensure that the return value is only returned explicitly."]}),"\n",(0,r.jsx)(t.h2,{id:"usage",children:"Usage"}),"\n",(0,r.jsxs)(t.p,{children:["The ",(0,r.jsx)(t.code,{children:"rawReturn()"})," API offers developers an advanced control mechanism over the return value of state mutation operations. Unlike the standard behavior where the state manipulation function returns the updated draft state, ",(0,r.jsx)(t.code,{children:"rawReturn()"})," allows the return of a raw value directly, bypassing the draft mechanism."]}),"\n",(0,r.jsxs)(t.p,{children:["When you invoke ",(0,r.jsx)(t.code,{children:"rawReturn()"})," within a state manipulation function, you instruct Mutative to use the value you pass to ",(0,r.jsx)(t.code,{children:"rawReturn()"})," as the final result of the current operation. This capability is particularly useful when the desired outcome of an operation is not a new draft state but a specific value that reflects a computed result or a status code."]}),"\n",(0,r.jsxs)(t.p,{children:["Key aspects of the ",(0,r.jsx)(t.code,{children:"rawReturn()"})," API include:"]}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsx)(t.li,{children:"It overrides the default draft return, enabling a direct and explicit return of any value from a state mutation function."}),"\n",(0,r.jsxs)(t.li,{children:["This function can be used to return values such as ",(0,r.jsx)(t.code,{children:"undefined"}),", ",(0,r.jsx)(t.code,{children:"null"}),", or any other primitive or object, offering more flexibility in state management scenarios. ",(0,r.jsx)(t.code,{children:"rawReturn()"})," can not return drafts or contain sub-drafts in draft tree, in strict mode ",(0,r.jsx)(t.code,{children:"rawReturn()"})," will also warn if the return value contains drafts."]}),"\n",(0,r.jsx)(t.li,{children:"It is particularly useful in cases where you want to terminate the draft operation early and return a predetermined value."}),"\n",(0,r.jsx)(t.li,{children:"The API helps maintain clear and explicit control over what is returned from mutation operations, aiding in creating predictable state management flows."}),"\n"]}),"\n",(0,r.jsxs)(t.p,{children:["In essence, ",(0,r.jsx)(t.code,{children:"rawReturn()"})," expands the versatility of state management in Mutative, enabling developers to return immediate values from within draft operations, thereby enhancing the control they have over state transitions and outcomes."]}),"\n",(0,r.jsx)(t.admonition,{type:"tip",children:(0,r.jsxs)(t.p,{children:["If using Redux, you can use ",(0,r.jsx)(t.code,{children:"rawReturn()"})," to return the default state directly."]})}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-ts",children:"const baseState = { id: 'test' };\nconst state = create(baseState as { id: string } | undefined, (draft) => {\n  return rawReturn(undefined);\n});\nexpect(state).toBe(undefined);\n"})}),"\n",(0,r.jsxs)(t.blockquote,{children:["\n",(0,r.jsxs)(t.p,{children:["If the return value mixes drafts, you should not use ",(0,r.jsx)(t.code,{children:"rawReturn()"}),"."]}),"\n"]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-ts",children:"const baseState = { a: 1, b: { c: 1 } };\nconst state = create(baseState, (draft) => {\n  if (draft.b.c === 1) {\n    return {\n      ...draft,\n      a: 2,\n    };\n  }\n});\nexpect(state).toEqual({ a: 2, b: { c: 1 } });\nexpect(isDraft(state.b)).toBeFalsy();\n"})}),"\n",(0,r.jsxs)(t.p,{children:["If you use ",(0,r.jsx)(t.code,{children:"rawReturn()"}),", we recommend that you enable ",(0,r.jsxs)(t.a,{href:"/docs/advanced-guides/strict-mode",children:[(0,r.jsx)(t.code,{children:"strict"})," mode"]})," in development."]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-ts",children:"const baseState = { a: 1, b: { c: 1 } };\nconst state = create(\n  baseState,\n  (draft) => {\n    if (draft.b.c === 1) {\n      // it will warn `The return value contains drafts, please don't use 'rawReturn()' to wrap the return value.` in strict mode.\n      return rawReturn({\n        ...draft,\n        a: 2,\n      });\n    }\n  },\n  {\n    strict: true,\n  }\n);\nexpect(state).toEqual({ a: 2, b: { c: 1 } });\nexpect(isDraft(state.b)).toBeFalsy();\n"})}),"\n",(0,r.jsxs)(t.admonition,{type:"warning",children:[(0,r.jsx)(t.p,{children:"In strict mode, if the return value contains drafts, it will warn:"}),(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{children:"The return value contains drafts, please don't use 'rawReturn()' to wrap the return value\n"})})]})]})}function l(e={}){const{wrapper:t}={...(0,a.a)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(u,{...e})}):u(e)}},1151:(e,t,n)=>{n.d(t,{Z:()=>o,a:()=>i});var r=n(7294);const a={},s=r.createContext(a);function i(e){const t=r.useContext(s);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function o(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:i(e.components),r.createElement(s.Provider,{value:t},e.children)}}}]);