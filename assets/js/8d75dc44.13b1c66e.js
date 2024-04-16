"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[1009],{2991:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>o,default:()=>p,frontMatter:()=>u,metadata:()=>c,toc:()=>d});var a=n(5893),r=n(1151),s=n(4866),i=n(5162);const u={sidebar_position:4},o="Using Mutative with React",c={id:"getting-started/mutative-with-react",title:"Using Mutative with React",description:"You can use Mutative with React by using the useMutative() hook.",source:"@site/docs/getting-started/mutative-with-react.md",sourceDirName:"getting-started",slug:"/getting-started/mutative-with-react",permalink:"/docs/getting-started/mutative-with-react",draft:!1,unlisted:!1,editUrl:"https://github.com/unadlib/mutative/tree/main/website/docs/getting-started/mutative-with-react.md",tags:[],version:"current",lastUpdatedBy:"unadlib",lastUpdatedAt:170222723e4,sidebarPosition:4,frontMatter:{sidebar_position:4},sidebar:"tutorialSidebar",previous:{title:"Concepts",permalink:"/docs/getting-started/concepts"},next:{title:"Performance",permalink:"/docs/getting-started/performance"}},l={},d=[{value:"use-mutative Hook",id:"use-mutative-hook",level:2},{value:"Installation",id:"installation",level:2},{value:"API",id:"api",level:2},{value:"useMutative",id:"usemutative",level:3},{value:"useMutativeReducer",id:"usemutativereducer",level:3},{value:"Patches",id:"patches",level:3}];function h(e){const t={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",p:"p",pre:"pre",...(0,r.a)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(t.h1,{id:"using-mutative-with-react",children:"Using Mutative with React"}),"\n",(0,a.jsxs)(t.p,{children:["You can use Mutative with React by using the ",(0,a.jsx)(t.code,{children:"useMutative()"})," hook."]}),"\n",(0,a.jsx)(t.h2,{id:"use-mutative-hook",children:"use-mutative Hook"}),"\n",(0,a.jsxs)(t.p,{children:["A hook to use ",(0,a.jsx)(t.a,{href:"https://github.com/unadlib/mutative",children:"mutative"})," as a React hook to efficient update react state immutable with mutable way."]}),"\n",(0,a.jsx)(t.h2,{id:"installation",children:"Installation"}),"\n",(0,a.jsxs)(s.Z,{groupId:"npm2yarn",children:[(0,a.jsx)(i.Z,{value:"npm",children:(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-bash",children:"npm install mutative use-mutative\n"})})}),(0,a.jsx)(i.Z,{value:"yarn",label:"Yarn",children:(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-bash",children:"yarn add mutative use-mutative\n"})})}),(0,a.jsx)(i.Z,{value:"pnpm",label:"pnpm",children:(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-bash",children:"pnpm add mutative use-mutative\n"})})})]}),"\n",(0,a.jsx)(t.h2,{id:"api",children:"API"}),"\n",(0,a.jsx)(t.h3,{id:"usemutative",children:"useMutative"}),"\n",(0,a.jsx)(t.p,{children:"Provide you can create immutable state easily with mutable way."}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-tsx",children:"export function App() {\n  const [state, setState] = useMutative(\n    {\n      foo: 'bar',\n      list: [\n        { text: 'todo' },\n      ],\n    },\n  );\n  <button\n    onClick={() => {\n      // set value with draft mutable\n      setState((draft) => {\n        draft.foo = `${draft.foo} 2`;\n        draft.list.push({ text: 'todo 2' });\n      });\n    }}\n  >\n    click\n  </button>\n  <button\n    onClick={() => {\n      // also can override value directly\n      setState({\n        foo: 'bar 2',\n        list: [{ text: 'todo 2' }],\n      });\n    }}\n  >\n    click\n  </button>\n}\n"})}),"\n",(0,a.jsx)(t.h3,{id:"usemutativereducer",children:"useMutativeReducer"}),"\n",(0,a.jsx)(t.p,{children:"Provide you can create immutable state easily with mutable way in reducer way."}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-tsx",children:"function reducer(\n  draft: State,\n  action: { type: 'reset' | 'increment' | 'decrement' }\n) {\n  switch (action.type) {\n    case 'reset':\n      return initialState;\n    case 'increment':\n      return void draft.count++;\n    case 'decrement':\n      return void draft.count--;\n  }\n}\n\nexport function App() {\n  const [state, dispatch] = useMutativeReducer(reducer, initialState);\n\n  return (\n    <div>\n      Count: {state.count}\n      <br />\n      <button onClick={() => dispatch({ type: 'increment' })}>Increment</button>\n      <button onClick={() => dispatch({ type: 'decrement' })}>Decrement</button>\n      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>\n    </div>\n  );\n}\n"})}),"\n",(0,a.jsx)(t.h3,{id:"patches",children:"Patches"}),"\n",(0,a.jsxs)(t.p,{children:["In some cases, you may want to get that patches from your update, we can pass ",(0,a.jsx)(t.code,{children:"{ enablePatches: true }"})," options in ",(0,a.jsx)(t.code,{children:"useMutative"})," or ",(0,a.jsx)(t.code,{children:"useMutativeReducer"}),", that can provide you the ability to get that patches from pervious action."]}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-tsx",children:"const [state, setState, patches, inversePatches] = useMutative(initState, {\n  enablePatches: true,\n});\n\nconst [state, dispatch, patchState] = useMutativeReducer(\n  reducer,\n  initState,\n  initializer,\n  { enablePatches: true }\n);\n\n// actions be that actions that are applied in previous state.\nconst [actions, patchGroup] = patchState;\n\nconst [patches, inversePatches] = patches;\n"})}),"\n",(0,a.jsxs)(t.p,{children:["patches format will follow ",(0,a.jsx)(t.a,{href:"https://jsonpatch.com/",children:"https://jsonpatch.com/"}),", but the ",(0,a.jsx)(t.code,{children:'"path"'})," field be array structure."]})]})}function p(e={}){const{wrapper:t}={...(0,r.a)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(h,{...e})}):h(e)}},5162:(e,t,n)=>{n.d(t,{Z:()=>i});n(7294);var a=n(6905);const r={tabItem:"tabItem_Ymn6"};var s=n(5893);function i(e){let{children:t,hidden:n,className:i}=e;return(0,s.jsx)("div",{role:"tabpanel",className:(0,a.Z)(r.tabItem,i),hidden:n,children:t})}},4866:(e,t,n)=>{n.d(t,{Z:()=>w});var a=n(7294),r=n(6905),s=n(2466),i=n(6550),u=n(469),o=n(1980),c=n(7392),l=n(12);function d(e){return a.Children.toArray(e).filter((e=>"\n"!==e)).map((e=>{if(!e||(0,a.isValidElement)(e)&&function(e){const{props:t}=e;return!!t&&"object"==typeof t&&"value"in t}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}function h(e){const{values:t,children:n}=e;return(0,a.useMemo)((()=>{const e=t??function(e){return d(e).map((e=>{let{props:{value:t,label:n,attributes:a,default:r}}=e;return{value:t,label:n,attributes:a,default:r}}))}(n);return function(e){const t=(0,c.l)(e,((e,t)=>e.value===t.value));if(t.length>0)throw new Error(`Docusaurus error: Duplicate values "${t.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[t,n])}function p(e){let{value:t,tabValues:n}=e;return n.some((e=>e.value===t))}function m(e){let{queryString:t=!1,groupId:n}=e;const r=(0,i.k6)(),s=function(e){let{queryString:t=!1,groupId:n}=e;if("string"==typeof t)return t;if(!1===t)return null;if(!0===t&&!n)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return n??null}({queryString:t,groupId:n});return[(0,o._X)(s),(0,a.useCallback)((e=>{if(!s)return;const t=new URLSearchParams(r.location.search);t.set(s,e),r.replace({...r.location,search:t.toString()})}),[s,r])]}function v(e){const{defaultValue:t,queryString:n=!1,groupId:r}=e,s=h(e),[i,o]=(0,a.useState)((()=>function(e){let{defaultValue:t,tabValues:n}=e;if(0===n.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(t){if(!p({value:t,tabValues:n}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${t}" but none of its children has the corresponding value. Available values are: ${n.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return t}const a=n.find((e=>e.default))??n[0];if(!a)throw new Error("Unexpected error: 0 tabValues");return a.value}({defaultValue:t,tabValues:s}))),[c,d]=m({queryString:n,groupId:r}),[v,b]=function(e){let{groupId:t}=e;const n=function(e){return e?`docusaurus.tab.${e}`:null}(t),[r,s]=(0,l.Nk)(n);return[r,(0,a.useCallback)((e=>{n&&s.set(e)}),[n,s])]}({groupId:r}),f=(()=>{const e=c??v;return p({value:e,tabValues:s})?e:null})();(0,u.Z)((()=>{f&&o(f)}),[f]);return{selectedValue:i,selectValue:(0,a.useCallback)((e=>{if(!p({value:e,tabValues:s}))throw new Error(`Can't select invalid tab value=${e}`);o(e),d(e),b(e)}),[d,b,s]),tabValues:s}}var b=n(2389);const f={tabList:"tabList__CuJ",tabItem:"tabItem_LNqP"};var g=n(5893);function x(e){let{className:t,block:n,selectedValue:a,selectValue:i,tabValues:u}=e;const o=[],{blockElementScrollPositionUntilNextRender:c}=(0,s.o5)(),l=e=>{const t=e.currentTarget,n=o.indexOf(t),r=u[n].value;r!==a&&(c(t),i(r))},d=e=>{let t=null;switch(e.key){case"Enter":l(e);break;case"ArrowRight":{const n=o.indexOf(e.currentTarget)+1;t=o[n]??o[0];break}case"ArrowLeft":{const n=o.indexOf(e.currentTarget)-1;t=o[n]??o[o.length-1];break}}t?.focus()};return(0,g.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,r.Z)("tabs",{"tabs--block":n},t),children:u.map((e=>{let{value:t,label:n,attributes:s}=e;return(0,g.jsx)("li",{role:"tab",tabIndex:a===t?0:-1,"aria-selected":a===t,ref:e=>o.push(e),onKeyDown:d,onClick:l,...s,className:(0,r.Z)("tabs__item",f.tabItem,s?.className,{"tabs__item--active":a===t}),children:n??t},t)}))})}function j(e){let{lazy:t,children:n,selectedValue:r}=e;const s=(Array.isArray(n)?n:[n]).filter(Boolean);if(t){const e=s.find((e=>e.props.value===r));return e?(0,a.cloneElement)(e,{className:"margin-top--md"}):null}return(0,g.jsx)("div",{className:"margin-top--md",children:s.map(((e,t)=>(0,a.cloneElement)(e,{key:t,hidden:e.props.value!==r})))})}function y(e){const t=v(e);return(0,g.jsxs)("div",{className:(0,r.Z)("tabs-container",f.tabList),children:[(0,g.jsx)(x,{...e,...t}),(0,g.jsx)(j,{...e,...t})]})}function w(e){const t=(0,b.Z)();return(0,g.jsx)(y,{...e,children:d(e.children)},String(t))}},1151:(e,t,n)=>{n.d(t,{Z:()=>u,a:()=>i});var a=n(7294);const r={},s=a.createContext(r);function i(e){const t=a.useContext(s);return a.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function u(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:i(e.components),a.createElement(s.Provider,{value:t},e.children)}}}]);