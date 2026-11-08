import test from 'node:test';
import assert from 'node:assert/strict';
import { palette, xdsThemes, cssVariables } from '../dist/palette.js';
import { readFileSync } from 'node:fs';
const luminance = hex => { const rgb=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722; };
const contrast = (a,b) => {const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
test('approved palette remains exact',()=>assert.deepEqual(palette,{"obsidian": "#17191D", "vermilion": "#FF563B", "paper": "#F3F1EA", "powderBlue": "#97B8C3", "stone": "#D5D0C3", "gunmetal": "#41454A", "salmon": "#FF9A83", "blueHaze": "#D6E7EC", "pewter": "#A7A297", "offWhite": "#FFFCF6"}));
for(const [name,{colors:c}] of Object.entries(xdsThemes)){
 test(`${name}: readable text, actions and semantic states`,()=>{
 const pairs=[['onPrimary','primary'],['onPrimary','primaryHover'],['onPrimaryContainer','primaryContainer'],['onSecondaryContainer','secondaryContainer'],['onErrorContainer','errorContainer']];
 for(const bg of ['background','surfacePanel','surfaceRaised','surfaceHigh','surfaceElevated'])for(const fg of ['textPrimary','textSecondary','primary','success','warning','danger'])pairs.push([fg,bg]);
 for(const [fg,bg] of pairs)assert.ok(contrast(c[fg],c[bg])>=4.5,`${name} ${fg}/${bg}: ${contrast(c[fg],c[bg]).toFixed(2)}`);
 });
 test(`${name}: CSS contract includes all semantic tokens`,()=>{const vars=cssVariables(xdsThemes[name]);for(const [k,v] of Object.entries(c)){if(k==='navItemBackground')continue;const key='--xds-'+k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());assert.equal(vars[key],v);assert.ok(readFileSync(new URL('../dist/colors.css',import.meta.url),'utf8').includes(`${key}: ${v};`));}});
}
