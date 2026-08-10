# Historia AI — Phase 1 Province World Plan

## Goals

1. Treat the generated Natural Earth country geometries as the first global province layer.
2. Give every rendered province a historical country owner and country color.
3. Keep the 1300 scenario data-driven so historical country coverage can grow without changing rendering code.
4. Make the camera feel like a globe map: the full world is the minimum zoom, horizontal movement wraps continuously, and vertical movement remains bounded.
5. Move time controls into the date control and remove simulation summaries from the time-control strip.
6. Keep event/action feedback in the existing Actions/Timeline UI instead of duplicating it beside the clock.

## Historical-map limitation

The current geometry source is Natural Earth `admin-0-countries`, so the Phase 1 map is a historical-political overlay on modern country geometry, not a reconstruction of 1300 administrative borders. The 1300 country dataset therefore maps modern geometry IDs to the historical polity that most closely corresponds to that territory at the scenario start. This is intentionally an intermediate foundation for the later true province-border dataset.

## Camera contract

- Minimum zoom shows the complete world.
- Zooming out never makes the world shrink into a small centered map.
- Horizontal dragging wraps at the antimeridian and repeats the world seamlessly.
- Vertical dragging is clamped to the world bounds.
- Antarctica is rendered from the source geometry but clipped/limited visually by the world viewport rather than allowed to dominate the far-zoom composition.

## Historical coverage

The initial 1300 snapshot includes major polities across Europe, Anatolia, the Middle East, Central Asia, South Asia, East Asia, Africa and Southeast Asia. The dataset is deliberately explicit about approximate/representational ownership where modern Natural Earth geometry cannot express the exact medieval frontier.
