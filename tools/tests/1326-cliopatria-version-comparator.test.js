import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "historia-cliopatria-compare-"));
const basePath = path.join(root, "v020.geojson");
const headPath = path.join(root, "v021.geojson");
const reportPath = path.join(root, "report.json");

const feature = ({ name, wikidata, fromYear, toYear, geometry, area = 100 }) => ({
  type: "Feature",
  properties: {
    Name: name,
    FromYear: fromYear,
    ToYear: toYear,
    Area: area,
    Type: "POLITY",
    Wikipedia: name,
    Wikidata: wikidata,
    SeshatID: "",
    Components: "",
    MemberOf: ""
  },
  geometry
});

const base = {
  type: "FeatureCollection",
  features: [
    feature({
      name: "Stable State",
      wikidata: "Q1",
      fromYear: 1320,
      toYear: 1330,
      geometry: { type: "Polygon", coordinates: [[[0,0],[1,0],[1,1],[0,0]]] }
    }),
    feature({
      name: "Geometry State",
      wikidata: "Q2",
      fromYear: 1326,
      toYear: 1332,
      geometry: { type: "Polygon", coordinates: [[[2,2],[3,2],[3,3],[2,2]]] }
    }),
    feature({
      name: "Temporal State",
      wikidata: "Q3",
      fromYear: 1320,
      toYear: 1330,
      geometry: { type: "Polygon", coordinates: [[[4,4],[5,4],[5,5],[4,4]]] }
    }),
    feature({
      name: "Removed State",
      wikidata: "Q4",
      fromYear: 1320,
      toYear: 1330,
      geometry: { type: "Polygon", coordinates: [[[6,6],[7,6],[7,7],[6,6]]] }
    }),
    feature({
      name: "Later Correction",
      wikidata: "Q5",
      fromYear: 1400,
      toYear: 1450,
      geometry: { type: "Polygon", coordinates: [[[8,8],[9,8],[9,9],[8,8]]] }
    })
  ]
};

const head = {
  type: "FeatureCollection",
  features: [
    feature({
      name: "Stable State",
      wikidata: "Q1",
      fromYear: 1320,
      toYear: 1330,
      geometry: { type: "Polygon", coordinates: [[[0,0],[1,0],[1,1],[0,0]]] }
    }),
    feature({
      name: "Geometry State",
      wikidata: "Q2",
      fromYear: 1326,
      toYear: 1332,
      geometry: { type: "Polygon", coordinates: [[[2,2],[3.2,2],[3,3],[2,2]]] }
    }),
    feature({
      name: "Temporal State",
      wikidata: "Q3",
      fromYear: 1321,
      toYear: 1330,
      geometry: { type: "Polygon", coordinates: [[[4,4],[5,4],[5,5],[4,4]]] }
    }),
    feature({
      name: "Added State",
      wikidata: "Q6",
      fromYear: 1326,
      toYear: 1332,
      geometry: { type: "Polygon", coordinates: [[[10,10],[11,10],[11,11],[10,10]]] }
    }),
    feature({
      name: "Later Correction",
      wikidata: "Q5",
      fromYear: 1400,
      toYear: 1451,
      geometry: { type: "Polygon", coordinates: [[[8,8],[9,8],[9,9],[8,8]]] }
    })
  ]
};

await fs.writeFile(basePath, JSON.stringify(base));
await fs.writeFile(headPath, JSON.stringify(head));

const result = spawnSync(process.execPath, [
  "tools/historical-gis/cli/compare-1326-cliopatria-versions.js",
  "--base", basePath,
  "--head", headPath,
  "--output", reportPath
], { encoding: "utf8" });

if (result.status !== 0) throw new Error(result.stderr || result.stdout);
const report = JSON.parse(await fs.readFile(reportPath, "utf8"));

const expect = (actual, wanted, label) => {
  if (actual !== wanted) throw new Error(`${label}: expected ${wanted}, got ${actual}`);
};

expect(report.counts.base1326, 4, "base1326");
expect(report.counts.head1326, 4, "head1326");
expect(report.counts.added1326, 1, "added1326");
expect(report.counts.removed1326, 1, "removed1326");
expect(report.counts.temporalChanges1326, 1, "temporalChanges1326");
expect(report.counts.geometryChanges1326, 1, "geometryChanges1326");
expect(report.counts.metadataChanges1326, 0, "metadataChanges1326");
expect(report.counts.non1326TemporalChanges, 1, "non1326TemporalChanges");
if (!report.classification.identityChange) throw new Error("identityChange classification missing.");
if (!report.classification.geometryChange1326) throw new Error("geometryChange1326 classification missing.");
if (!report.classification.temporalChange1326) throw new Error("temporalChange1326 classification missing.");
if (!report.classification.non1326TemporalCorrection) throw new Error("non1326TemporalCorrection classification missing.");

console.log("1326 Cliopatria version comparator: PASS");
