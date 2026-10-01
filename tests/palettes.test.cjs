const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const nodes = new Map();
function element() {
    return { value: '', style: {}, textContent: '', innerHTML: '', children: [],
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener() {}, querySelectorAll() { return []; },
        appendChild(child) { this.children.push(child); } };
}
const context = vm.createContext({console, setTimeout, clearTimeout,
    document: { getElementById(id) { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); },
        createElement: element, addEventListener() {} },
    window: { addEventListener() {} }
});
vm.runInContext(fs.readFileSync(path.join(root, 'colors.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), context);
vm.runInContext(`
    const expected = {mard:221, perler:103, artkal:173, artkal_c:172, hama:92};
    for (const [key, count] of Object.entries(expected)) {
        if (PALETTES[key].length !== count) throw Error(key + ' count');
        if (new Set(PALETTES[key].map(c => c.id)).size !== count) throw Error(key + ' duplicates');
        for (const color of PALETTES[key]) {
            if (![color.r,color.g,color.b].every(n => Number.isInteger(n) && n >= 0 && n <= 255)) throw Error(color.id + ' RGB');
            const hex = '#' + [color.r,color.g,color.b].map(n => n.toString(16).padStart(2,'0')).join('').toUpperCase();
            if (hex !== color.hex) throw Error(color.id + ' hex');
            if (color.matchEligible !== false) {
                const match = findClosestColor(color.r,color.g,color.b,PALETTES[key].filter(c => c.matchEligible !== false),'rgb');
                if (match.hex !== color.hex) throw Error(color.id + ' matching');
            }
        }
        state.paintColor = PALETTES.mard[0]; state.copiedColor = state.paintColor;
        state.editHistory = [[{previousColor: state.paintColor}]];
        updateSetting('palette', key);
        if (getActivePalette() !== PALETTES[key]) throw Error(key + ' fallback');
        if (state.paintColor || state.copiedColor || state.editHistory.length) throw Error(key + ' stale edit');
        if (!elements.workshopPalette.innerHTML.includes(PALETTES[key][0].id)) throw Error(key + ' workshop');
    }
    if (PALETTES.artkal_c.some(c => c.id === 'C152')) throw Error('Invalid official C152 included');
    if (PALETTES.artkal.find(c=>c.id==='S13').hex !== '#000000') throw Error('S13');
    if (PALETTES.artkal_c.find(c=>c.id==='C02').hex !== '#000000') throw Error('C02');
    if (!PALETTES.hama.some(c=>c.matchEligible===false)) throw Error('Special material filter');
    updateSetting('palette', 'mard');
    elements.paletteSearchInput.value = 'A01'; renderWorkshopPalette();
    if (!elements.workshopPalette.innerHTML.includes('data-color-id="A1"')) throw Error('Padded MARD search');
    updateSetting('palette', 'missing');
    if (state.settings.palette !== 'mard') throw Error('Invalid brand accepted');
`, context);
assert.equal(nodes.get('paletteSelect').children.length, 5);
console.log('PASS: 5 real palettes, RGB/HEX validity, exact-color matching, brand switching, workshop reset, special materials and MARD search.');
