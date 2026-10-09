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
| Lefke / Leukai | Modern Osmaneli, Bilecik | Öztürk's full 2021 *LIBRI* article is now accessible: https://www.libridergi.org/wp-content/uploads/2021/03/lbr.202101.pdf. Its abstract and printed pp. 2–3 explicitly identify Leukai/Lefke with modern Osmaneli and describe the Roman/Hajj-road route, local milestones, bridges and settlement evidence. The Bilecik Provincial Directorate of Culture and Tourism independently lists Leukai (Lefke) at Osmaneli: https://bilecik.ktb.gov.tr/tr-69066/tarihce.html. | **PLACE MATCH: WELL-SUPPORTED FOR PLACE IDENTITY.** This does not supply a vetted project coordinate or establish 1326 political control. Coordinate provenance must still be recorded separately before adding an anchor. |
| Geyve / Kabeia-Kabia-Kabaia | Modern Geyve, Sakarya | Sencer Şahin's published survey “1983 Yılında Bithynia ve Lycia-Pamphylia'da Yapılan Epigrafi ve Tarihi Coğrafya Araştırmaları” reports that he identified ancient Kabaia at the location of modern Geyve and relates the name to an inscription; searchable excerpt: https://ukaas.ktb.gov.tr/Eklenti/130204%2C02arastirmapdf.pdf?0=. The Geyve Municipality history page gives a secondary summary of the Rufinus inscription: https://geyve.bel.tr/geyve-tarihi. | **PLACE MATCH: SCHOLARLY-SUPPORTED, SPELLING VARIANTS RETAINED.** TIB's Kabeia and the epigraphic forms Kabia/Kabaia should be recorded as variants, not silently normalized. This identifies a place, not 1326 control or a frontier. |
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
3. Find an independent historical gazetteer entry for Mekece/Makaǧā; if none is found, keep it unresolved. The 2021 Leukai article discusses the ancient road passing approximately along today's İznik–Mekece route, but that is route context, not proof that Mekece equals TIB's Makaǧā.
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


## 2026-10-09 second-pass verification addendum

### Leukai/Lefke

The full text of Öztürk (2021) was retrieved and inspected. Printed pp. 2–3 explicitly identify Leukai/Lefke with modern Osmaneli and cite TIB 13's Leukai entry (s.v. Leukai (2), p. 177). The paper also discusses the Lefke Gate, Roman/Hajj-road routes, milestones, bridges and settlements. This upgrades the *place-name identity* assessment to **WELL-SUPPORTED**. Its route discussion is ancient/medieval historical geography, not a 1326 ownership statement or political boundary. No anchor was added because the project still needs a separately sourced coordinate and an explicit research-only role.

### Geyve/Kabia

A Ministry-hosted PDF of Sencer Şahin's 1983 epigraphic/historical-geography survey was located. The indexed text says Şahin identified ancient Kabaia at the location of modern Geyve and connects the name to a funerary inscription: https://ukaas.ktb.gov.tr/Eklenti/130204%2C02arastirmapdf.pdf?0=. This is a stronger scholarly lead than the municipality's summary. Preserve forms **Kabeia / Kabia / Kabaia** as source-specific variants until TIB's exact spelling and the underlying publication are compared. The PDF endpoint could not be opened for a complete line-by-line extraction in this pass, so this is recorded as a supported lead rather than a full primary-source transcription.

### Malagina and Mekece

Sakarya Metropolitan Municipality's historical-castles PDF summarizes Foss's identification of the Malagina fortress with Paşalar Kalesi and notes that Mekece Kalesi had been an earlier proposal: https://sakarya.bel.tr/uploads/files/sakaryakaleleri.pdf. This is useful because it exposes a real historical identification conflict: do not collapse Mekece and Malagina into one place or assume the names are interchangeable. Foss's full 1990 article remains the scholarly authority to inspect before coordinate/anchor acceptance. The TIB campaign narrative's Mekece/Makaǧā remains unresolved as an independent place match.

**Net result:** place-identity evidence improved for Leukai/Lefke and Geyve/Kabia, while Malagina/Mekece is now explicitly treated as a potentially conflicting identification problem. No anchor registry entry, candidate polygon, or review binding was created. The exact 1326 frontier remains **INSUFFICIENT_EVIDENCE / REVIEW_REQUIRED**.


## 2026-10-09 source-critical spelling and site distinction

The accessible Cambridge Core record for Clive Foss's 1990 article confirms that the paper argues Malagina's site can be located more precisely through fieldwork, but the freely visible extract does not expose the full topographical argument. Its footnotes cite Sencer Şahin's work on Malagina/Melagina and Pachymeres for **Kabaia**; the article also explicitly warns that another proposed identification of **Hisn al-Ghabra with Geyve** is appealing but uncertain because the name's actual form cannot be determined. These are different historical name problems and must not be merged into one equivalence.

- Foss article record and visible extract: https://www.cambridge.org/core/journals/anatolian-studies/article/abs/byzantine-malagina-and-the-lower-sangarius/C764A7C79EB54493BA6061F3402DEF3C
- Foss's note references Kabaia to Pachymeres, *ed. Bekker* I.419; that confirms a historical source trail for the form but is not by itself a coordinate-level identification of the Ottoman-chronicle form TIB spells Kabeia.
- The TIB 1304/05 narrative's **Geyve/Kabeia** should therefore remain a provisional cross-period toponym reconciliation, distinct from the better-supported modern Geyve ↔ ancient Kabaia epigraphic identification.
- Foss's site argument and the Sakarya Metropolitan Municipality summary make **Malagina ↔ Paşalar Kalesi** a promising research lead; Mekece Kalesi is recorded as an earlier competing proposal. Do not use generic “Akhisar” name matching to resolve this conflict.

**Adjudication unchanged:** no anchor or review binding added. This pass clarifies the identity graph and unresolved aliases; it does not create a 1326 political boundary.
