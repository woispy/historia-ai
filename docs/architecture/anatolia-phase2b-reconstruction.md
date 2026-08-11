# Historia AI — Phase 2B Anatolia Reconstruction

## Purpose

Phase 2A established the reusable GIS, topology, camera and visual hierarchy. Phase 2B makes the 1300 Anatolia layer historically cautious enough to become the game's reference map instead of a generic modernized political map.

## Identity model

```text
Province geometry
      │
      ├── stable province id
      ├── region id
      ├── city anchor
      └── historical control context
                    │
                    ↓
             mutable ownership
```

The province id is persistent. Ownership is not.

Historical control is descriptive metadata and should never silently overwrite the runtime ownership model.

## Ten reconstruction regions

The Phase 2B vocabulary uses ten working regions:

- Bithynia
- Sangarios / Ottoman frontier
- Mysia
- Lydia / Ionia
- Caria / Menteşe
- Inner Western Anatolia
- Central Anatolia
- Pontus
- Eastern Anatolia
- Cilicia / Taurus

These names organize the map and data. They are not presented as exact medieval administrative divisions.

## Temporal discipline

The starting date is `1300-01-01`. Later territorial outcomes must not be copied backward.

Important examples:

### Aydin
Aydinid control is not used as the 1300 owner of Ayasuluk or Birgi. The historical profile records the later start date of 1308 and leaves the 1300 controller unresolved.

### Hamid
The Hamidid sphere is treated as an emerging transition around 1300–1301. Dündar Bey's secure documentary activity begins in 1301, so the map does not manufacture a hard 1300 border.

### Sinop
Sinop is mapped to the Pervâneoğulları context for 1300. Candarid control belongs to the subsequent political transition and is not projected backward.

### Germiyan
Kütahya is the high-confidence anchor for Yakub Bey's independent phase around 1300.

### Menteşe
Mylasa and Peçin are the high-confidence southwestern anchors. Tralles is kept more cautious because early western Anatolian control was fluid.

### Byzantine Bithynia
Nicomedia, Nicaea and Prusa form the high-confidence Byzantine urban anchors. The Ottoman frontier is represented separately as a frontier context rather than a modern state boundary.

## Confidence policy

Every province has two related but distinct confidence concepts:

- `borderConfidence`: confidence in the displayed geographic boundary.
- `historicalControl.confidence`: confidence in the stated 1300 political context.

This distinction matters. A city can be a high-confidence historical location while its surrounding 1300 political frontier is low-confidence.

## Visual policy

Phase 2B does not introduce a second map renderer. It feeds the existing EU5-inspired hierarchy:

- physical coastline remains authoritative;
- province geometry remains source-derived and reusable;
- country boundaries remain stronger than province boundaries;
- city hierarchy follows camera zoom;
- political uncertainty stays in metadata rather than being disguised by stronger geometry.

## Phase 2C hand-off

The next map-only phase is geometry refinement. It should reconcile the 237 source-derived runtime features with the Phase 2B vocabulary, then add historically defensible province geometry, passes, river crossings, settlement density and terrain modifiers. That work should happen before simulation systems depend on exact province adjacency for economy or warfare.
