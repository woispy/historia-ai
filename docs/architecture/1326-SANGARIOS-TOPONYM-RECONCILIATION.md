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


## 2026-10-09 third-pass: Malagina, Metabole, Akhisar and Mekece

### New evidence inspected

1. **Foss (1990), “Byzantine Malagina and the Lower Sangarius.”** The Cambridge Core abstract says field investigation allowed Foss to locate Malagina more precisely and identify its fortress. The full article remains behind access restrictions in the current pass, so this abstract alone does not provide coordinates or the detailed site argument. Bibliographic record: https://www.cambridge.org/core/journals/anatolian-studies/article/abs/byzantine-malagina-and-the-lower-sangarius/C764A7C79EB54493BA6061F3402DEF3C
2. **Sakarya Metropolitan Municipality, *Sakarya Kaleleri*, section 2.2.1 (Mekece Kalesi), printed p. 43 and nearby discussion.** It says Mekece Castle has often been considered as a possible Malagina Castle, but describes the modern research as inconclusive; it reports that Şahin discussed Mekece in his Malagina/Melagina study and that Foss repeated earlier information without visiting Mekece itself. It separately discusses the Paşalar Castle identification. https://sakarya.bel.tr/uploads/files/sakaryakaleleri.pdf
3. **Sakarya University thesis, historical road networks in northwestern Anatolia, PDF p. 30 (search-indexed text).** It distinguishes the broad Malagina region from its fortress and argues that Paşalar Castle is the more suitable identification for Malagina/Metabole Castle, based on topography and route relationships; it also acknowledges that both Paşalar and Mekece have been proposed. https://acikerisim.sakarya.edu.tr/bitstream/handle/20.500.12619/101577/T10915.pdf?sequence=1
4. **Foss (2022), *The Beginnings of the Ottoman Empire*, chapter “The Homeland of the Ottomans,” pp. 65–68 (accessible indexed extract).** The account distinguishes the Mekece fort from the broader Malagina plain, describes the plain as extending roughly between Mekece and Lefke, and identifies the strategically placed fortress of Metabole with the Akhisar of the Ottoman campaign narrative. It also treats the Sangarios route as held by Orhan by 1324. Accessible excerpt: https://www.scribd.com/document/595994910/The-Beginnings-of-the-Ottoman-Empire-Clive-Foss-2022. Because this is an indexed/hosted excerpt rather than the publisher's full text, the bibliographic book should be checked before any exact quotation or coordinate use.

### Reconciliation ruling

- **Malagina (region)** is not interchangeable with **Metabole (fortress)**. The broad regional name refers to the Sangarios plain/corridor; the fortress is a specific site.
- **Mekece Kalesi** is a separate physical fort near Mekece. It has appeared in earlier proposals for Metabole, but the consulted secondary discussion favours Paşalar as the more suitable fortress identification while preserving the debate.
- **Akhisar** in the 1304/05 Ottoman narrative must not be matched to any modern town simply by name. Foss's 2022 account associates the campaign's Akhisar with the Malagina/Metabole fortress context; this is a historical-site hypothesis, not a 1326 province boundary.
- **Mekece/Makaǧā** as a toponym in TIB's chronicle summary remains a separate question from the location of Mekece Castle and from the broader Malagina region.
- The statement that the Sangarios route was held by Orhan by 1324 is a dated regional-control claim in Foss (2022), useful for historical chronology but not a coordinate-level frontier or proof that every adjacent locality had the same status on 1326-04-07.

**Disposition:** the best-supported working distinction is *Malagina plain/region ≠ Metabole fortress ≠ Mekece Castle*. Paşalar is a stronger candidate for the fortress identification in the consulted secondary literature, but it is not yet promoted to the anchor registry. No coordinate, geometry, evidence-matrix item, or review binding was added. The exact political frontier remains **INSUFFICIENT_EVIDENCE / REVIEW_REQUIRED**.


## 2026-10-09 fourth pass — official Paşalar Castle records

Two official Turkish records were checked against the scholarly Malagina/Metabole identification:

- **Sakarya Governorship, “Paşalar Kalesi”** states that Paşalar Castle (also called Karaceyş Castle) is Byzantine and was conquered in 1314 during Osman Gazi's period; it describes the castle as overlooking the Pamukova and Geyve plains from Geyve to Mekece. https://www.sakarya.gov.tr/pasalar-kalesi
- **Ministry of Culture and Tourism, Culture Inventory, “Paşalar Kalesi”** places the remains at Kale Tepe, north of Paşalar village, Pamukova/Sakarya and gives a broad 5th–6th century construction date. It describes surviving fortification remains and reused late Roman funerary stelae, but the page provides no coordinates in its location section. https://www.kulturportali.gov.tr/turkiye/sakarya/kulturenvanteri/pasalar-kalesi

### Source reconciliation

These official records independently establish a physical castle at Paşalar and its strategic overlook; they do **not** themselves name it as Malagina or Metabole. The 1314 capture statement is a local-government historical claim and must not be silently merged with the Byzantine fortress chronology or treated as proof of an exact political boundary. The Culture Inventory's broad architectural dating also does not date the castle's control in 1326.

The current evidence supports the following split:

- **Paşalar Castle as a physical site:** established in the official cultural inventory.
- **Paşalar Castle = Foss's Metabole fortress:** strong scholarly hypothesis in the reviewed secondary literature, but not independently established by the official inventory page itself.
- **Paşalar Castle control in 1326:** not independently adjudicated by this pass.
- **Coordinate anchor:** not eligible yet; the official inventory page does not provide a coordinate pair, and no coordinate was copied from a generic map/search result.
- **Political boundary:** not established.

No anchor registry entry, candidate geometry, evidence-matrix record, or review binding was created. Keep the exact 1326 frontier **INSUFFICIENT_EVIDENCE / REVIEW_REQUIRED**.


## 2026-10-09 fifth pass — official TIB register and thesis cross-check

### Official TIB 13 toponym register

The Austrian Academy of Sciences' online TIB 13 register was inspected directly:
https://tib.oeaw.ac.at/tib-register/tib13

Its entries preserve distinct forms and page references:
- **Akhisar (Malagina)** points to printed p. 215 and further gazetteer/map references.
- **Makaǧā** is a separate entry and also points to printed p. 215.
- **Malagina (Gegend und Ort, auch Thema)** explicitly classifies Malagina as a region/place/theme and lists several historical-geography pages.
- **Metabolē** is a separate entry with its own set of gazetteer references, including pp. 748–750.
- **Leukai (2)** has its own entry, including p. 177 and the p. 215 campaign reference.

This register structure reinforces that TIB is tracking related but not automatically identical entities. In particular, the p. 215 juxtaposition of Akhisar (Malagina) and Makaǧā does not itself prove that modern Mekece Castle equals Makaǧā, nor does it convert the corridor into a political boundary. The page references are navigation aids into TIB's full text, not standalone coordinate evidence.

### Sakarya University thesis: explicit competing identifications

The accessible indexed text of the Sakarya University thesis on northwestern Anatolian historical roads (T10915, PDF printed p. 30 and references 39–41) makes the dispute more explicit:
https://acikerisim.sakarya.edu.tr/bitstream/handle/20.500.12619/101577/T10915.pdf?sequence=1

The thesis reports that Şahin argued for identifying the broader Malagina region with Mekece, based on the road from Mekece toward İznik and a nearby small lake. It then says the historical descriptions make **Paşalar Castle the more suitable candidate for Malagina/Metabole Castle**, citing Foss and the castle's position relative to the Sangarios, pasture, and the Nikaia–Dorylaion route. It also states that Foss called Paşalar—not Mekece—the Metabole Castle. The thesis cites Foss, “Byzantine Malagina and the Lower Sangarius,” pp. 163–164 and 171, and Şahin, “Malagina/Melagina am Sangarios,” pp. 153–166.

This is a meaningful scholarly cross-check, but it is still a secondary thesis summarizing prior scholarship; the repository currently redirects direct PDF access through a verification page. The evidence is sufficient to rank **Paşalar as the stronger working fortress-site hypothesis**, while retaining Şahin's Mekece regional-identification argument as a competing hypothesis. It is not sufficient to equate the separate TIB campaign toponym Makaǧā with Mekece Castle.

### Coordinate provenance ruling

A web index and a community-maintained archaeological gazetteer expose coordinates for the Paşalar/Metabole site, but neither was accepted as project-grade coordinate authority in this pass. The official Ministry Culture Inventory entry still does not supply a coordinate pair, and the full Foss (1990) topographical argument was not directly inspected. Accordingly:
- no coordinates were copied into project data;
- no anchor-candidate registry entry was created;
- no geometry, evidence-matrix record, or review binding was changed;
- no 1326 control or political boundary was inferred.

**Current disposition:** identity graph refined; Paşalar is the leading *research hypothesis* for the Metabole fortress, not yet a registry-ready anchor. Keep **Malagina region ≠ Metabole fortress ≠ Mekece Castle ≠ TIB campaign Makaǧā (unresolved)** until the source-level entity chain and coordinate provenance are independently documented.

## Updated next operation

1. Obtain a directly inspectable copy of Foss (1990), especially pp. 163–164 and 170–171, and compare its site argument with the thesis's cited passages.
2. Use TIB's linked full-text page references for printed pp. 215, 748–750, and the separate Makaǧā/Leukai entries; record exact statements and their evidence roles.
3. Seek a coordinate-bearing archaeological/institutional source for the Paşalar fortress and record datum/precision/source identity before any research-only anchor is considered.
4. Keep Makaǧā unresolved unless a source explicitly reconciles that campaign toponym with modern Mekece independently of the castle debate.
5. Do not create review bindings to satisfy the gate. The 1326-04-07 frontier remains **INSUFFICIENT_EVIDENCE / REVIEW_REQUIRED**.


## 2026-10-09 sixth pass — Foss article metadata and TIB register cross-reference

### What the accessible Foss (1990) record actually establishes

Cambridge Core exposes the article's abstract, bibliographic metadata and references, but not the complete site argument. The abstract says the general Malagina location on the Sangarios was known while the exact site had not been convincingly identified; Foss reports that his field investigations enabled a precise location and identification of the fortress. The reference list states that Foss's conclusions differ from S. Şahin's 1986 “Malagina/Melagina am Sangarios” study, while acknowledging Şahin's careful work. Foss also records discovering the fort in 1982 and refers to a prior brief description in *Byzantine Fortifications* (1986), pp. 140, 147–148.

Sources:
- Cambridge Core article record and extract: https://www.cambridge.org/core/journals/anatolian-studies/article/abs/byzantine-malagina-and-the-lower-sangarius/C764A7C79EB54493BA6061F3402DEF3C
- Open bibliographic record: https://openbibart.fr/vibad/index.php?action=getRecordDetail&idt=oba_0065074

This strengthens the methodological point that the site identification rests on fieldwork and a scholarly argument that explicitly differs from an earlier identification—not merely on a modern place-name match. However, because the article body and its topographical description remain unavailable in the directly inspected Cambridge record, this pass cannot independently verify the exact site coordinates or reproduce the argument from pp. 163–164 and 170–171.

### TIB register cross-check: Mekece is present, but equivalence is not encoded

The official TIB 13 register lists all of the following as distinct entries:
- **Akhisar (Malagina)** — includes printed p. 215.
- **Makaǧā** — includes printed p. 215 and pp. 748–750 among its references.
- **Mekece** — includes printed p. 215 and pp. 747–750 among its references.
- **Malagina (Gegend und Ort, auch Thema)** — explicitly spans region/place/theme uses.
- **Metabolē** — a separate entry with its own page references.
- **Leukai (2)** — a separate entry including printed pp. 177–178 and 215.

Register: https://tib.oeaw.ac.at/tib-register/tib13

The co-occurrence of Mekece and Makaǧā in the register's page references is a useful source-navigation clue, but the register is an index, not a claim of identity. The distinct entries do not establish that the campaign form Makaǧā equals modern Mekece, nor that Mekece Castle equals the Metabole fortress. The page references at 747–750 should be read in the full TIB text before they can be used as evidence of any specific identity relation.

### Coordinate and promotion ruling

- Paşalar remains the leading research hypothesis for the specific Metabole fortress in the secondary literature inspected, but the decisive Foss topographical argument is not directly available in this pass.
- The official Ministry Culture Inventory record identifies the physical Paşalar Castle site but gives no coordinate pair.
- No coordinate was copied from a web map, community gazetteer or search result.
- No anchor candidate, evidence-matrix record, candidate geometry or review binding was created.
- No political control or boundary was inferred from a castle location, route corridor, or regional conquest narrative.

**Disposition:** retain the distinctions **Malagina region / place**, **Metabole fortress**, **Mekece Castle / modern Mekece**, and **Makaǧā in the campaign tradition**. The relationship between the last two remains unresolved. Exact frontier on 1326-04-07 remains **INSUFFICIENT_EVIDENCE / REVIEW_REQUIRED**.

## Next operation

1. Obtain a directly inspectable full copy of Foss (1990), or a legitimate institutional/library copy, and verify the site argument against the cited pp. 163–164 and 170–171.
2. Open TIB 13 printed pp. 215 and 747–750 from the linked reader and record the exact wording for Akhisar (Malagina), Makaǧā, Mekece and Metabolē as separate claims.
3. Find an official coordinate-bearing archaeological record for Paşalar Castle; record the source, coordinate reference system, precision and access date before considering a research-only point anchor.
4. Keep the campaign toponym Makaǧā unresolved unless an explicit independent source closes that entity match.
5. Leave geometry, bindings and canonical promotion unchanged until the evidence contract is satisfied.
