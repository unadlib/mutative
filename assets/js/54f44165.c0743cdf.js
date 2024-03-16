"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[152],{9145:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>u,default:()=>m,frontMatter:()=>l,metadata:()=>o,toc:()=>d});var a=n(5893),r=n(1151),s=n(4866),i=n(5162);const l={sidebar_position:1},u="Installation",o={id:"getting-started/installation",title:"Installation",description:"Mutative is a npm package that can be used in Node.js and browsers, it is also compatible with TypeScript.",source:"@site/docs/getting-started/installation.md",sourceDirName:"getting-started",slug:"/getting-started/installation",permalink:"/docs/getting-started/installation",draft:!1,unlisted:!1,editUrl:"https://github.com/unadlib/mutative/tree/main/website/docs/getting-started/installation.md",tags:[],version:"current",lastUpdatedBy:"unadlib",lastUpdatedAt:1702668879,formattedLastUpdatedAt:"Dec 15, 2023",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"tutorialSidebar",previous:{title:"Getting Started",permalink:"/docs/category/getting-started"},next:{title:"Usages",permalink:"/docs/getting-started/usages"}},c={},d=[{value:"Using Mutative from npm/Yarn/pnpm",id:"using-mutative-from-npmyarnpnpm",level:2},{value:"Using Mutative from CDN",id:"using-mutative-from-cdn",level:2}];function p(e){const t={code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...(0,r.a)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(t.h1,{id:"installation",children:"Installation"}),"\n",(0,a.jsx)(t.p,{children:"Mutative is a npm package that can be used in Node.js and browsers, it is also compatible with TypeScript."}),"\n",(0,a.jsx)(t.h2,{id:"using-mutative-from-npmyarnpnpm",children:"Using Mutative from npm/Yarn/pnpm"}),"\n",(0,a.jsxs)(s.Z,{groupId:"npm2yarn",children:[(0,a.jsx)(i.Z,{value:"npm",children:(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-bash",children:"npm install mutative\n"})})}),(0,a.jsx)(i.Z,{value:"yarn",label:"Yarn",children:(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-bash",children:"yarn add mutative\n"})})}),(0,a.jsx)(i.Z,{value:"pnpm",label:"pnpm",children:(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-bash",children:"pnpm add mutative\n"})})})]}),"\n",(0,a.jsxs)(t.p,{children:["Mutative size is only ",(0,a.jsx)(t.code,{children:"4.12 KB"})," (minified and gzipped), it is very lightweight."]}),"\n",(0,a.jsx)(t.h2,{id:"using-mutative-from-cdn",children:"Using Mutative from CDN"}),"\n",(0,a.jsxs)(t.ul,{children:["\n",(0,a.jsxs)(t.li,{children:["Unpkg: ",(0,a.jsx)(t.code,{children:'<script src="https://unpkg.com/mutative"><\/script>'})]}),"\n",(0,a.jsxs)(t.li,{children:["JSDelivr: ",(0,a.jsx)(t.code,{children:'<script src="https://cdn.jsdelivr.net/npm/mutative"><\/script>'})]}),"\n"]})]})}function m(e={}){const{wrapper:t}={...(0,r.a)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(p,{...e})}):p(e)}},5162:(e,t,n)=>{n.d(t,{Z:()=>i});n(7294);var a=n(6010);const r={tabItem:"tabItem_Ymn6"};var s=n(5893);function i(e){let{children:t,hidden:n,className:i}=e;return(0,s.jsx)("div",{role:"tabpanel",className:(0,a.Z)(r.tabItem,i),hidden:n,children:t})}},4866:(e,t,n)=>{n.d(t,{Z:()=>w});var a=n(7294),r=n(6010),s=n(2466),i=n(6550),l=n(469),u=n(1980),o=n(7392),c=n(12);function d(e){return a.Children.toArray(e).filter((e=>"\n"!==e)).map((e=>{if(!e||(0,a.isValidElement)(e)&&function(e){const{props:t}=e;return!!t&&"object"==typeof t&&"value"in t}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}function p(e){const{values:t,children:n}=e;return(0,a.useMemo)((()=>{const e=t??function(e){return d(e).map((e=>{let{props:{value:t,label:n,attributes:a,default:r}}=e;return{value:t,label:n,attributes:a,default:r}}))}(n);return function(e){const t=(0,o.l)(e,((e,t)=>e.value===t.value));if(t.length>0)throw new Error(`Docusaurus error: Duplicate values "${t.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[t,n])}function m(e){let{value:t,tabValues:n}=e;return n.some((e=>e.value===t))}function h(e){let{queryString:t=!1,groupId:n}=e;const r=(0,i.k6)(),s=function(e){let{queryString:t=!1,groupId:n}=e;if("string"==typeof t)return t;if(!1===t)return null;if(!0===t&&!n)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return n??null}({queryString:t,groupId:n});return[(0,u._X)(s),(0,a.useCallback)((e=>{if(!s)return;const t=new URLSearchParams(r.location.search);t.set(s,e),r.replace({...r.location,search:t.toString()})}),[s,r])]}function b(e){const{defaultValue:t,queryString:n=!1,groupId:r}=e,s=p(e),[i,u]=(0,a.useState)((()=>function(e){let{defaultValue:t,tabValues:n}=e;if(0===n.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(t){if(!m({value:t,tabValues:n}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${t}" but none of its children has the corresponding value. Available values are: ${n.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return t}const a=n.find((e=>e.default))??n[0];if(!a)throw new Error("Unexpected error: 0 tabValues");return a.value}({defaultValue:t,tabValues:s}))),[o,d]=h({queryString:n,groupId:r}),[b,f]=function(e){let{groupId:t}=e;const n=function(e){return e?`docusaurus.tab.${e}`:null}(t),[r,s]=(0,c.Nk)(n);return[r,(0,a.useCallback)((e=>{n&&s.set(e)}),[n,s])]}({groupId:r}),g=(()=>{const e=o??b;return m({value:e,tabValues:s})?e:null})();(0,l.Z)((()=>{g&&u(g)}),[g]);return{selectedValue:i,selectValue:(0,a.useCallback)((e=>{if(!m({value:e,tabValues:s}))throw new Error(`Can't select invalid tab value=${e}`);u(e),d(e),f(e)}),[d,f,s]),tabValues:s}}var f=n(2389);const g={tabList:"tabList__CuJ",tabItem:"tabItem_LNqP"};var v=n(5893);function x(e){let{className:t,block:n,selectedValue:a,selectValue:i,tabValues:l}=e;const u=[],{blockElementScrollPositionUntilNextRender:o}=(0,s.o5)(),c=e=>{const t=e.currentTarget,n=u.indexOf(t),r=l[n].value;r!==a&&(o(t),i(r))},d=e=>{let t=null;switch(e.key){case"Enter":c(e);break;case"ArrowRight":{const n=u.indexOf(e.currentTarget)+1;t=u[n]??u[0];break}case"ArrowLeft":{const n=u.indexOf(e.currentTarget)-1;t=u[n]??u[u.length-1];break}}t?.focus()};return(0,v.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,r.Z)("tabs",{"tabs--block":n},t),children:l.map((e=>{let{value:t,label:n,attributes:s}=e;return(0,v.jsx)("li",{role:"tab",tabIndex:a===t?0:-1,"aria-selected":a===t,ref:e=>u.push(e),onKeyDown:d,onClick:c,...s,className:(0,r.Z)("tabs__item",g.tabItem,s?.className,{"tabs__item--active":a===t}),children:n??t},t)}))})}function j(e){let{lazy:t,children:n,selectedValue:r}=e;const s=(Array.isArray(n)?n:[n]).filter(Boolean);if(t){const e=s.find((e=>e.props.value===r));return e?(0,a.cloneElement)(e,{className:"margin-top--md"}):null}return(0,v.jsx)("div",{className:"margin-top--md",children:s.map(((e,t)=>(0,a.cloneElement)(e,{key:t,hidden:e.props.value!==r})))})}function y(e){const t=b(e);return(0,v.jsxs)("div",{className:(0,r.Z)("tabs-container",g.tabList),children:[(0,v.jsx)(x,{...e,...t}),(0,v.jsx)(j,{...e,...t})]})}function w(e){const t=(0,f.Z)();return(0,v.jsx)(y,{...e,children:d(e.children)},String(t))}},1151:(e,t,n)=>{n.d(t,{Z:()=>l,a:()=>i});var a=n(7294);const r={},s=a.createContext(r);function i(e){const t=a.useContext(s);return a.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:i(e.components),a.createElement(s.Provider,{value:t},e.children)}}}]);