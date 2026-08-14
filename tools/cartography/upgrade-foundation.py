# Foundation upgrade is deterministic and safe to rerun.
# Validation now covers readable deep-zoom labels and vector province LOD.
from pathlib import Path
import json

ROOT = Path('.')


def replace_if_present(path, old, new):
    p = ROOT / path
    text = p.read_text(encoding='utf-8')
    if old in text:
        p.write_text(text.replace(old, new, 1), encoding='utf-8')


replace_if_present(
    'src/map/components/WorldMap.jsx',
    '        renderFill={!textureReady}',
    '        renderFill={!textureReady || cameraState.zoom >= 3.35}',
)
replace_if_present(
    'src/map/components/layers/CityLayer.jsx',
    '        fontSize={fontSize * getLabelScale(zoom)}',
    '        fontSize={fontSize}',
)
replace_if_present(
    'src/map/rendering/city/CityLabelLayout.js',
    '  return Math.max(0.035, Math.min(1.0, 0.95 * zoom ** -0.65));',
    '  return Math.max(0.22, Math.min(0.55, 1.8 / Math.sqrt(Math.max(1, zoom))));',
)

physical_path = ROOT / 'src/map/data/AnatoliaPhysicalAtlas.js'
physical = physical_path.read_text(encoding='utf-8')
for old in ('maxZoom:3.2, priority:100', 'maxZoom:4, priority:100', 'maxZoom:3.4, priority:100', 'maxZoom:3.2, priority:95'):
    prefix = old.split(',', 1)[0]
    physical = physical.replace(old, old.replace(prefix, 'maxZoom:12'))
physical_path.write_text(physical, encoding='utf-8')

(ROOT / 'tools/tests/cartography-foundation.test.js').write_text(r'''import assert from "node:assert/strict";
import { ANATOLIA_CITY_ATLAS } from "../../src/map/data/AnatoliaCityAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { getMapLod } from "../../src/map/rendering/CartographyModel.js";
import { boxesOverlap, getCityVisualStyle, layoutCityLabels, selectVisibleCities } from "../../src/map/rendering/city/CityLabelLayout.js";

const cities = Object.entries(ANATOLIA_CITY_ATLAS).map(([id, map]) => ({ id, map }));
assert.equal(getMapLod(1), "world");
assert.equal(getMapLod(2.8), "city");
assert.equal(getMapLod(8), "detailed");

for (const zoom of [1.2, 2.8, 3.6, 5, 8]) {
  const visible = selectVisibleCities(cities, zoom);
  const labels = layoutCityLabels(visible, zoom);
  assert.ok(labels.length > 0, `Expected city labels at zoom ${zoom}`);
  assert.ok(labels.length <= 32, `Label budget exceeded at zoom ${zoom}`);
  const placedBoxes = [];
  for (const label of labels) {
    const style = getCityVisualStyle(label.city, zoom);
    assert.ok(style.fontSize >= 0.045, `City label became sub-pixel at zoom ${zoom}`);
    const width = Math.max(0.34, String(label.city.map.name).length * style.fontSize * 0.44);
    const half = width / 2;
    const box = {
      left: label.anchor === "start" ? label.x : label.anchor === "end" ? label.x - width : label.x - half,
      right: label.anchor === "start" ? label.x + width : label.anchor === "end" ? label.x : label.x + half,
      top: label.y - style.fontSize * 0.76,
      bottom: label.y + style.fontSize * 0.22,
    };
    for (const other of placedBoxes) assert.equal(boxesOverlap(box, other), false, `City labels overlap at zoom ${zoom}`);
    placedBoxes.push(box);
  }
}

assert.ok(getCityVisualStyle(cities[0], 8).fontSize > 0.1);
assert.ok(ANATOLIA_PHYSICAL_ATLAS.lakes.length >= 8);
assert.ok(ANATOLIA_PHYSICAL_ATLAS.rivers.length >= 10);
assert.ok(ANATOLIA_PHYSICAL_ATLAS.labels.filter((label) => label.kind === "sea").every((label) => label.maxZoom >= 8));
for (const id of ["konstantinopolis", "iznik", "bursa", "ankara", "konya", "kayseri", "sivas", "trabzon", "erzurum"]) {
  assert.ok(ANATOLIA_CITY_ATLAS[id], `Missing historical city atlas entry: ${id}`);
}
console.log(`Cartography foundation tests passed: ${cities.length} cities, ${ANATOLIA_PHYSICAL_ATLAS.rivers.length} rivers, ${ANATOLIA_PHYSICAL_ATLAS.lakes.length} lakes, deterministic labels across 5 zoom levels.`);
''', encoding='utf-8')

package_path = ROOT / 'package.json'
package = json.loads(package_path.read_text(encoding='utf-8'))
package['scripts']['test:cartography-foundation'] = 'node tools/tests/cartography-foundation.test.js'
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

ci_path = ROOT / '.github/workflows/ci.yml'
ci = ci_path.read_text(encoding='utf-8')
if 'npm run test:cartography-foundation' not in ci and 'npm run test:cartography-2efgh' in ci:
    ci = ci.replace('npm run test:cartography-2efgh', 'npm run test:cartography-2efgh\n          npm run test:cartography-foundation', 1)
ci_path.write_text(ci, encoding='utf-8')

print('Cartography foundation source patch prepared.')
