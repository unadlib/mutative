"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[2657],{1679:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>o,contentTitle:()=>r,default:()=>l,frontMatter:()=>i,metadata:()=>c,toc:()=>d});var n=a(5893),s=a(1151);const i={sidebar_position:3},r="Concepts",c={id:"getting-started/concepts",title:"Concepts",description:"Mutative is based on the Proxy, its core concepts are draft and patch.",source:"@site/docs/getting-started/concepts.md",sourceDirName:"getting-started",slug:"/getting-started/concepts",permalink:"/docs/getting-started/concepts",draft:!1,unlisted:!1,editUrl:"https://github.com/unadlib/mutative/tree/main/website/docs/getting-started/concepts.md",tags:[],version:"current",lastUpdatedBy:"unadlib",lastUpdatedAt:1702227798e3,sidebarPosition:3,frontMatter:{sidebar_position:3},sidebar:"tutorialSidebar",previous:{title:"Usages",permalink:"/docs/getting-started/usages"},next:{title:"Using Mutative with React",permalink:"/docs/getting-started/mutative-with-react"}},o={},d=[{value:"Base Workflow",id:"base-workflow",level:2},{value:"Drafts",id:"drafts",level:2},{value:"Patches",id:"patches",level:2},{value:"Mark",id:"mark",level:2}];function h(e){const t={code:"code",h1:"h1",h2:"h2",img:"img",li:"li",p:"p",pre:"pre",ul:"ul",...(0,s.a)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.h1,{id:"concepts",children:"Concepts"}),"\n",(0,n.jsxs)(t.p,{children:["Mutative is based on the Proxy, its core concepts are ",(0,n.jsx)(t.code,{children:"draft"})," and ",(0,n.jsx)(t.code,{children:"patch"}),"."]}),"\n",(0,n.jsx)(t.h2,{id:"base-workflow",children:"Base Workflow"}),"\n",(0,n.jsx)(t.p,{children:"Mutative Workflow depicted in the image illustrates a three-stage process:"}),"\n",(0,n.jsx)(t.p,{children:(0,n.jsx)(t.img,{alt:"mutative workflow",src:a(8938).Z+"",width:"3100",height:"1404"})}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:'The "Current State" represents the initial, unchanged state.'}),"\n",(0,n.jsx)(t.li,{children:'The "Draft" stage indicates a mutable phase where changes are made to a draft, marked in red, showing where modifications are occurring. The dotted lines suggest that these are accessed and drafts are created.'}),"\n",(0,n.jsx)(t.li,{children:'Finally, the "Next State" is the immutable data after the changes are finalized.'}),"\n"]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-ts",children:"const baseState = {\n  a0: {\n    b0: {},\n  },\n  a1: {\n    b1: {},\n    b2: {\n      c0: 0,\n    },\n  },\n  a2: {},\n}\n\nconst nextState = create(baseState, (draft) => {\n  const { a0 } = draft;\n  // If it is draftable, once it has been accessed, it will generate a corresponding draft.\n  expect(isDraft(a0)).toBeTruthy();\n  // each node is a draft, and the draft is a proxy object\n  draft.a1.b2.c0 = 1;\n});\n\nexpect(nextState).not.toBe(baseState);\nexpect(nextState.a0).toBe(baseState.a0); // generated draft, but not changed\nexpect(nextState.a2).toBe(baseState.a2); // no generated draft, not changed\nexpect(nextState.a1).not.toBe(baseState.a1);\nexpect(nextState.a1.b2).not.toBe(baseState.a1.b2);\nexpect(nextState.a1.b2.c0).toBe(1);\n"})}),"\n",(0,n.jsx)(t.h2,{id:"drafts",children:"Drafts"}),"\n",(0,n.jsx)(t.p,{children:"Using Mutative to produce a new immutable data(next state) from intermediate drafts."}),"\n",(0,n.jsxs)(t.p,{children:["Mutative creates a draft copy based on the current state. The ",(0,n.jsx)(t.code,{children:"draft"})," is a mutable ",(0,n.jsx)(t.code,{children:"Proxy"})," object, which behaves the same as the original object. Those mutations are recorded and used to produce the next state once the draft function is done. Additionally, if the patches is enabled, it will also produce a ",(0,n.jsx)(t.code,{children:"patches"}),"."]}),"\n",(0,n.jsx)(t.h2,{id:"patches",children:"Patches"}),"\n",(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.code,{children:"Patches"})," are operation patches for immutable updates, consisting of an array where each element is a ",(0,n.jsx)(t.code,{children:"Patch"}),". A ",(0,n.jsx)(t.code,{children:"Patch"})," is an object that contains a ",(0,n.jsx)(t.code,{children:"path"}),", a ",(0,n.jsx)(t.code,{children:"value"}),", and an ",(0,n.jsx)(t.code,{children:"op"}),". The ",(0,n.jsx)(t.code,{children:"path"})," is an array representing the path to an object; the ",(0,n.jsx)(t.code,{children:"value"})," is a new value for the object; and ",(0,n.jsx)(t.code,{children:"op"})," is a string representing the type of operation, which can be ",(0,n.jsx)(t.code,{children:"add"}),", ",(0,n.jsx)(t.code,{children:"remove"}),", or ",(0,n.jsx)(t.code,{children:"replace"}),"."]}),"\n",(0,n.jsxs)(t.p,{children:["By applying ",(0,n.jsx)(t.code,{children:"patches"}),", immutable updates can be made to an object based on these patches. These patches enable immutable updates without modifying the original object, acting as instructions for the update process."]}),"\n",(0,n.jsx)(t.h2,{id:"mark",children:"Mark"}),"\n",(0,n.jsx)(t.p,{children:"If a data structure mixes mutable and immutable data, Mutative supports marking both immutable and mutable data. It allows for non-invasive marking of nodes within this data tree, meaning the original object structure does not require an additional marking symbol. Mutative can maintain the original characteristics of the structure tree's nodes. And The option allows you to mark the immutable data with custom shallow copy."}),"\n",(0,n.jsxs)(t.p,{children:["It is used to mark the immutable data that needs to be updated, and the mutable data that needs to be accessed. You pass the ",(0,n.jsx)(t.code,{children:"mark"})," option to ",(0,n.jsx)(t.code,{children:"create()"})," to mark the immutable data."]})]})}function l(e={}){const{wrapper:t}={...(0,s.a)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(h,{...e})}):h(e)}},8938:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/mutative-workflow-268cdcf217b03de568744b531e1c98ef.png"},1151:(e,t,a)=>{a.d(t,{Z:()=>c,a:()=>r});var n=a(7294);const s={},i=n.createContext(s);function r(e){const t=n.useContext(i);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function c(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:r(e.components),n.createElement(i.Provider,{value:t},e.children)}}}]);