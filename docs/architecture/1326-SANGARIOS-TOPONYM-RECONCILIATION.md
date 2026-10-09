# Historia AI — 1326 Sangarios Toponym Reconciliation

## Status

- Scenario date: `1326-04-07`
- Workstream: PR #109 / `work/phase-a-1326-t3b-candidate-surface`
- Review type: historical place-name reconciliation
- Authority: research candidate only
- Anchor registry mutation: **NONE**
- Review bindings created: **0**
- Political boundary inference: **PROHIBITED**
- Reviewed: 2026-10-09

## Question

TIB 13, printed pp. 215–216, summarizes an Ottoman-chronicle account of a 1304/05 Sangarios-valley campaign and names Lefke/Leukai, Mekece/Makaǧā, Akhisar/Malagina and Geyve/Kabeia. The same passage warns that the Ottoman narrative is legend-enriched, differs from Byzantine accounts, and contains uncertain identifications. This note tests whether the named places can be reconciled independently enough to add *research anchors*. It does not test or establish a 1326 political frontier.

Primary TIB chapter: https://austriaca.at/0xc1aa5576%200x003b6739.pdf  
TIB 13 official overview: https://www.oeaw.ac.at/en/imafo/research/byzantine-research/communities-and-landscapes/historical-geography/tib-13

## Findings

| TIB form / tradition | Candidate modern association | Independent evidence found | Disposition |
|---|---|---|---|
| Lefke / Leukai | Modern Osmaneli, Bilecik | Türkiye Ministry of Culture and Tourism, Bilecik provincial history explicitly locates Leukai (Lefke) at modern Osmaneli: https://bilecik.ktb.gov.tr/tr-69066/tarihce.html. A separate epigraphic study is catalogued as Hüseyin Sami Öztürk, “Nikaia’dan Yeni Yazıtlar XIV – Nikaia’dan Leukai’a/Lefke’ye Yerleşimler, Miltaşları, Roma Yolu ve Mauricius Köprüsü,” *LIBRI* VII (2021), DOI https://doi.org/10.5281/zenodo.4475599. | **PLACE MATCH: PROVISIONAL / STRONGER THAN OTHER LEADS.** The modern association is supported, but the full article's evidence and exact coordinate-level site extent have not been independently extracted in this pass. Do not add coordinates from the historical name alone. |
| Geyve / Kabeia (TIB spelling) | Modern Geyve, Sakarya | Geyve Municipality's local-history page reports the Kabia name and a 470 CE Rufinus inscription, and discusses Byzantine-era Kabia: https://geyve.bel.tr/geyve-tarihi. This is a useful lead, but the page is not itself the inscription's critical edition. | **PLACE MATCH: PROVISIONAL.** Preserve the spelling distinction (Kabia vs. Kabeia) and seek the underlying epigraphic publication / critical edition before treating the identity as independently established. Do not treat this as evidence of political control in 1326. |
| Akhisar / Malagina | A site in the lower Sangarios region; modern identification requires careful site-level handling | Clive Foss, “Byzantine Malagina and the Lower Sangarius,” *Anatolian Studies* 40 (1990), pp. 161–183, DOI https://doi.org/10.2307/3642800, describes Malagina's strategic role and says field investigations enabled a more precise site identification. Cambridge Core record: https://www.cambridge.org/core/journals/anatolian-studies/article/abs/byzantine-malagina-and-the-lower-sangarius/C764A7C79EB54493BA6061F3402DEF3C. Clive Foss's *The Beginnings of the Ottoman Empire* (2022), chapter “Reconciling the Accounts,” also discusses identifying Byzantine Malagina with APZ's Akhisar: https://academic.oup.com/book/38839/chapter-abstract/337747727. | **HISTORICAL IDENTIFICATION LEAD: PROMISING, NOT YET REGISTRY-READY.** Exact site coordinates and the specific equivalence used by TIB must be checked against the full scholarly argument. The modern place-name “Akhisar” is not sufficient by itself. |
| Mekece / Makaǧā | Modern Mekece is a candidate association, not confirmed here | TIB 13's source-critical narrative is the direct lead. Search results from Foss's 2022 chapter mention a tekfur of Mekece in the campaign narrative, but the accessible abstract does not independently settle the medieval-to-modern place identity. | **UNRESOLVED.** No anchor or coordinate should be added until an independent gazetteer or scholarly place identification is verified. |
| Sangarios | Sakarya River | Official Turkish cultural-heritage material identifies Sangarios as the historical name of the Sakarya: https://www.kulturportali.gov.tr/turkiye/bilecik. TIB 13 also treats the river as regional geography. | **PHYSICAL FEATURE ONLY.** Eligible as a physical/corridor constraint after source/geometry provenance is recorded; never infer that the river is the political border. |

## Evidence-role rules

1. The 1304/05 account is a retrospective conquest narrative. It is not direct proof of continuous possession on 1326-04-07.
2. A verified modern place-name match may support a point anchor's *identity*; it does not support an adjacent political polygon or its ownership.
3. A historical river corridor, road, fortress, or settlement is not a boundary unless a dated source explicitly supports that boundary claim.
4. The Ottoman and Byzantine traditions must remain distinct evidence records. Do not merge them into a single certainty claim.
5. No coordinate is to be generated from a name, approximate region, map screenshot, or a guessed modern town centre. Coordinate provenance must be explicit and independently checkable.
6. Keep immutable Cliopatria candidate geometry unchanged. Any later anchor record remains research-only and must include source identity, temporal scope, coordinate provenance, confidence, and a clear non-boundary role.

## Result

This pass improves the toponym-reconciliation queue but **does not meet the bar to add any new anchor**. Lefke/Leukai → Osmaneli is the best-supported candidate association in the current evidence; Geyve/Kabia needs the underlying epigraphic publication checked; Malagina/Akhisar needs exact site equivalence and coordinates reconciled; Mekece/Makaǧā remains unresolved. No registry entries, candidate polygons, or review bindings were changed.

The exact 1326-04-07 Ottoman–Byzantine frontier remains **INSUFFICIENT_EVIDENCE / REVIEW_REQUIRED**.

## Next operation

1. Extract and evaluate the full 2021 Leukai/Lefke epigraphic paper and the primary epigraphic reference cited by Geyve Municipality.
2. Verify the Malagina site identification against Foss's full paper and TIB's relevant gazetteer entry.
3. Find an independent historical gazetteer entry for Mekece/Makaǧā; if none is found, keep it unresolved.
4. Only then consider research-only point anchors with coordinate provenance; keep boundary bindings blocked unless boundary-specific evidence exists.
5. Re-run the pilot review-binding admissibility checklist; do not create bindings merely to clear the gate.

## Source links

- TIB 13, section C.IV, printed pp. 215–216: https://austriaca.at/0xc1aa5576%200x003b6739.pdf
- Bilecik Provincial Directorate of Culture and Tourism, history: https://bilecik.ktb.gov.tr/tr-69066/tarihce.html
- Geyve Municipality, local history: https://geyve.bel.tr/geyve-tarihi
- Öztürk (2021), LIBRI VII: https://doi.org/10.5281/zenodo.4475599
- Foss (1990), Cambridge Core: https://www.cambridge.org/core/journals/anatolian-studies/article/abs/byzantine-malagina-and-the-lower-sangarius/C764A7C79EB54493BA6061F3402DEF3C
- Foss (2022), Oxford Academic chapter abstract: https://academic.oup.com/book/38839/chapter-abstract/337747727
- Türkiye Kültür Portalı, Bilecik: https://www.kulturportali.gov.tr/turkiye/bilecik
