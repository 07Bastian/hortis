export type RotationCropGroup = "leaf" | "fruit" | "root" | "legume" | "other";
export type SeedLicense = "op" | "f1" | "oss" | "pvr" | "unknown";

export interface Cultivar {
  id: string;
  nameDe: string;
  nameEn: string;
  nameLatin: string;
  family: string;
  cropGroup: RotationCropGroup;
  defaultLicense: SeedLicense;
  daysToMaturity?: number;
  notes?: string;
}

/** Offline cultivar catalog (~120 common temperate garden crops). */
export const CULTIVARS: Cultivar[] = [
  { id: "tom-berner", nameDe: "Berner Rose", nameEn: "Bernese Rose Tomato", nameLatin: "Solanum lycopersicum", family: "solanaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 80 },
  { id: "tom-sanmarz", nameDe: "San Marzano", nameEn: "San Marzano Tomato", nameLatin: "Solanum lycopersicum", family: "solanaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 85 },
  { id: "tom-cherry", nameDe: "Kirschtomate Sweet 100", nameEn: "Sweet 100 Cherry", nameLatin: "Solanum lycopersicum", family: "solanaceae", cropGroup: "fruit", defaultLicense: "f1", daysToMaturity: 65 },
  { id: "tom-blackkr", nameDe: "Black Krim", nameEn: "Black Krim Tomato", nameLatin: "Solanum lycopersicum", family: "solanaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 80 },
  { id: "pep-kalocsai", nameDe: "Kalocsai Paprika", nameEn: "Kalocsai Pepper", nameLatin: "Capsicum annuum", family: "solanaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 75 },
  { id: "pep-chili", nameDe: "Cayenne", nameEn: "Cayenne Chili", nameLatin: "Capsicum annuum", family: "solanaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 70 },
  { id: "egg-blackb", nameDe: "Black Beauty Aubergine", nameEn: "Black Beauty Eggplant", nameLatin: "Solanum melongena", family: "solanaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 80 },
  { id: "pot-sieglin", nameDe: "Sieglinde", nameEn: "Sieglinde Potato", nameLatin: "Solanum tuberosum", family: "solanaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 90 },
  { id: "pot-linda", nameDe: "Linda", nameEn: "Linda Potato", nameLatin: "Solanum tuberosum", family: "solanaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 100 },
  { id: "cuc-markete", nameDe: "Marketmore Gurke", nameEn: "Marketmore Cucumber", nameLatin: "Cucumis sativus", family: "cucurbitaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 60 },
  { id: "cuc-chinese", nameDe: "Chinesische Schlange", nameEn: "Chinese Long Cucumber", nameLatin: "Cucumis sativus", family: "cucurbitaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 65 },
  { id: "zuc-nero", nameDe: "Nero di Milano Zucchini", nameEn: "Nero di Milano Squash", nameLatin: "Cucurbita pepo", family: "cucurbitaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 50 },
  { id: "zuc-gold", nameDe: "Gold Rush Zucchini", nameEn: "Gold Rush Squash", nameLatin: "Cucurbita pepo", family: "cucurbitaceae", cropGroup: "fruit", defaultLicense: "f1", daysToMaturity: 50 },
  { id: "pum-hokkaido", nameDe: "Hokkaido", nameEn: "Hokkaido Squash", nameLatin: "Cucurbita maxima", family: "cucurbitaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 95 },
  { id: "pum-buttern", nameDe: "Butternut", nameEn: "Butternut Squash", nameLatin: "Cucurbita moschata", family: "cucurbitaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 100 },
  { id: "mel-sugar", nameDe: "Sugar Baby Melone", nameEn: "Sugar Baby Watermelon", nameLatin: "Citrullus lanatus", family: "cucurbitaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 80 },
  { id: "pea-early", nameDe: "Früh Erbse", nameEn: "Early Pea", nameLatin: "Pisum sativum", family: "fabaceae", cropGroup: "legume", defaultLicense: "op", daysToMaturity: 60 },
  { id: "pea-sugar", nameDe: "Zuckererbse", nameEn: "Sugar Snap Pea", nameLatin: "Pisum sativum", family: "fabaceae", cropGroup: "legume", defaultLicense: "op", daysToMaturity: 65 },
  { id: "bean-saxa", nameDe: "Saxa Buschbohne", nameEn: "Saxa Bush Bean", nameLatin: "Phaseolus vulgaris", family: "fabaceae", cropGroup: "legume", defaultLicense: "op", daysToMaturity: 55 },
  { id: "bean-blauhil", nameDe: "Blauhilde Stangenbohne", nameEn: "Blauhilde Pole Bean", nameLatin: "Phaseolus vulgaris", family: "fabaceae", cropGroup: "legume", defaultLicense: "op", daysToMaturity: 70 },
  { id: "bean-fire", nameDe: "Feuerbohne", nameEn: "Runner Bean", nameLatin: "Phaseolus coccineus", family: "fabaceae", cropGroup: "legume", defaultLicense: "op", daysToMaturity: 75 },
  { id: "fava-aguadu", nameDe: "Aquadulce Ackerbohne", nameEn: "Aquadulce Fava", nameLatin: "Vicia faba", family: "fabaceae", cropGroup: "legume", defaultLicense: "op", daysToMaturity: 90 },
  { id: "lentil", nameDe: "Beluga Linse", nameEn: "Beluga Lentil", nameLatin: "Lens culinaris", family: "fabaceae", cropGroup: "legume", defaultLicense: "op", daysToMaturity: 100 },
  { id: "lettuce-butter", nameDe: "Butterkopfsalat", nameEn: "Butterhead Lettuce", nameLatin: "Lactuca sativa", family: "asteraceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 55 },
  { id: "lettuce-lollo", nameDe: "Lollo Rosso", nameEn: "Lollo Rosso", nameLatin: "Lactuca sativa", family: "asteraceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 50 },
  { id: "lettuce-ice", nameDe: "Eisberg", nameEn: "Iceberg Lettuce", nameLatin: "Lactuca sativa", family: "asteraceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 70 },
  { id: "spin-matador", nameDe: "Matador Spinat", nameEn: "Matador Spinach", nameLatin: "Spinacia oleracea", family: "amaranthaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 45 },
  { id: "chard-rb", nameDe: "Rainbow Mangold", nameEn: "Rainbow Chard", nameLatin: "Beta vulgaris var. cicla", family: "amaranthaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 55 },
  { id: "kale-nero", nameDe: "Nero di Toscana", nameEn: "Tuscan Kale", nameLatin: "Brassica oleracea var. sabellica", family: "brassicaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 65 },
  { id: "kale-west", nameDe: "Westländer Winter", nameEn: "Westland Winter Kale", nameLatin: "Brassica oleracea var. sabellica", family: "brassicaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 70 },
  { id: "cab-filderk", nameDe: "Filderkraut", nameEn: "Filderkraut Cabbage", nameLatin: "Brassica oleracea var. capitata", family: "brassicaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 100 },
  { id: "broc-calo", nameDe: "Calabrese Brokkoli", nameEn: "Calabrese Broccoli", nameLatin: "Brassica oleracea var. italica", family: "brassicaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 85 },
  { id: "caul-erfurt", nameDe: "Erfurter Zwerg Blumenkohl", nameEn: "Erfurt Dwarf Cauliflower", nameLatin: "Brassica oleracea var. botrytis", family: "brassicaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 75 },
  { id: "rad-rudi", nameDe: "Rudi Radieschen", nameEn: "Rudi Radish", nameLatin: "Raphanus sativus", family: "brassicaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 25 },
  { id: "rad-french", nameDe: "French Breakfast", nameEn: "French Breakfast Radish", nameLatin: "Raphanus sativus", family: "brassicaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 28 },
  { id: "kohlrabi", nameDe: "Superschmelz Kohlrabi", nameEn: "Superschmelz Kohlrabi", nameLatin: "Brassica oleracea var. gongylodes", family: "brassicaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 60 },
  { id: "turnip", nameDe: "Teltower Rübchen", nameEn: "Teltow Turnip", nameLatin: "Brassica rapa", family: "brassicaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 50 },
  { id: "carrot-nanta", nameDe: "Nantaise Karotte", nameEn: "Nantes Carrot", nameLatin: "Daucus carota", family: "apiaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 70 },
  { id: "carrot-rote", nameDe: "Rote Riesen", nameEn: "Autumn King Carrot", nameLatin: "Daucus carota", family: "apiaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 90 },
  { id: "pars-berlin", nameDe: "Berliner Halblange Pastinake", nameEn: "Berlin Half-Long Parsnip", nameLatin: "Pastinaca sativa", family: "apiaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 120 },
  { id: "cel-prager", nameDe: "Prager Riesen Sellerie", nameEn: "Prague Giant Celeriac", nameLatin: "Apium graveolens", family: "apiaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 130 },
  { id: "parsley", nameDe: "Mooskrause Petersilie", nameEn: "Moss Curled Parsley", nameLatin: "Petroselinum crispum", family: "apiaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 75 },
  { id: "dill", nameDe: "Gewöhnlicher Dill", nameEn: "Common Dill", nameLatin: "Anethum graveolens", family: "apiaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 50 },
  { id: "fennel", nameDe: "Di Firenze Fenchel", nameEn: "Florence Fennel", nameLatin: "Foeniculum vulgare", family: "apiaceae", cropGroup: "other", defaultLicense: "op", daysToMaturity: 80 },
  { id: "onion-stutt", nameDe: "Stuttgarter Riesen", nameEn: "Stuttgart Giant Onion", nameLatin: "Allium cepa", family: "alliaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 100 },
  { id: "onion-red", nameDe: "Rote Braunschweiger", nameEn: "Red Brunswick Onion", nameLatin: "Allium cepa", family: "alliaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 110 },
  { id: "leek-bleubl", nameDe: "Bleu de Solaise Lauch", nameEn: "Blue Solaise Leek", nameLatin: "Allium porrum", family: "alliaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 120 },
  { id: "garlic", nameDe: "Thermidrome Knoblauch", nameEn: "Thermidrome Garlic", nameLatin: "Allium sativum", family: "alliaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 240 },
  { id: "chive", nameDe: "Schnittlauch", nameEn: "Chives", nameLatin: "Allium schoenoprasum", family: "alliaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 90 },
  { id: "beet-detroi", nameDe: "Detroit Dark Red", nameEn: "Detroit Dark Red Beet", nameLatin: "Beta vulgaris", family: "amaranthaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 60 },
  { id: "beet-chiogg", nameDe: "Chioggia", nameEn: "Chioggia Beet", nameLatin: "Beta vulgaris", family: "amaranthaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 55 },
  { id: "corn-golden", nameDe: "Golden Bantam Mais", nameEn: "Golden Bantam Corn", nameLatin: "Zea mays", family: "poaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 80 },
  { id: "sunflower", nameDe: "Riesen Sonnenblume", nameEn: "Giant Sunflower", nameLatin: "Helianthus annuus", family: "asteraceae", cropGroup: "other", defaultLicense: "op", daysToMaturity: 90 },
  { id: "basil-geno", nameDe: "Genoveser Basilikum", nameEn: "Genovese Basil", nameLatin: "Ocimum basilicum", family: "lamiaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 60 },
  { id: "basil-thai", nameDe: "Thai Basilikum", nameEn: "Thai Basil", nameLatin: "Ocimum basilicum var. thyrsiflora", family: "lamiaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 65 },
  { id: "mint", nameDe: "Pfefferminze", nameEn: "Peppermint", nameLatin: "Mentha × piperita", family: "lamiaceae", cropGroup: "leaf", defaultLicense: "op" },
  { id: "sage", nameDe: "Echter Salbei", nameEn: "Common Sage", nameLatin: "Salvia officinalis", family: "lamiaceae", cropGroup: "leaf", defaultLicense: "op" },
  { id: "thyme", nameDe: "Deutscher Thymian", nameEn: "German Thyme", nameLatin: "Thymus vulgaris", family: "lamiaceae", cropGroup: "leaf", defaultLicense: "op" },
  { id: "oregano", nameDe: "Oregano", nameEn: "Oregano", nameLatin: "Origanum vulgare", family: "lamiaceae", cropGroup: "leaf", defaultLicense: "op" },
  { id: "rosemary", nameDe: "Rosmarin", nameEn: "Rosemary", nameLatin: "Salvia rosmarinus", family: "lamiaceae", cropGroup: "leaf", defaultLicense: "op" },
  { id: "coriander", nameDe: "Koriander", nameEn: "Coriander", nameLatin: "Coriandrum sativum", family: "apiaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 45 },
  { id: "rocket", nameDe: "Rucola", nameEn: "Rocket / Arugula", nameLatin: "Eruca vesicaria", family: "brassicaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 35 },
  { id: "mustard", nameDe: "Senf Grün", nameEn: "Mustard Greens", nameLatin: "Brassica juncea", family: "brassicaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 40 },
  { id: "pakchoi", nameDe: "Pak Choi", nameEn: "Pak Choi", nameLatin: "Brassica rapa subsp. chinensis", family: "brassicaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 45 },
  { id: "strawberry", nameDe: "Mieze Schindler", nameEn: "Mieze Schindler Strawberry", nameLatin: "Fragaria × ananassa", family: "rosaceae", cropGroup: "fruit", defaultLicense: "op" },
  { id: "rasp-heritage", nameDe: "Heritage Himbeere", nameEn: "Heritage Raspberry", nameLatin: "Rubus idaeus", family: "rosaceae", cropGroup: "fruit", defaultLicense: "op" },
  { id: "zucchini-round", nameDe: "Tondo di Piacenza", nameEn: "Round Zucchini", nameLatin: "Cucurbita pepo", family: "cucurbitaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 55 },
  { id: "tomato-oxheart", nameDe: "Ochsenherz", nameEn: "Oxheart Tomato", nameLatin: "Solanum lycopersicum", family: "solanaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 85 },
  { id: "pepper-sweet", nameDe: "Corno di Toro", nameEn: "Bull's Horn Pepper", nameLatin: "Capsicum annuum", family: "solanaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 75 },
  { id: "bean-coco", nameDe: "Coco Blanc", nameEn: "Coco Blanc Bean", nameLatin: "Phaseolus vulgaris", family: "fabaceae", cropGroup: "legume", defaultLicense: "op", daysToMaturity: 85 },
  { id: "clover", nameDe: "Inkarnatklee", nameEn: "Crimson Clover", nameLatin: "Trifolium incarnatum", family: "fabaceae", cropGroup: "legume", defaultLicense: "op", notes: "Gründüngung" },
  { id: "phacelia", nameDe: "Phacelia", nameEn: "Lacy Phacelia", nameLatin: "Phacelia tanacetifolia", family: "boraginaceae", cropGroup: "other", defaultLicense: "op", notes: "Gründüngung / Bienen" },
  { id: "buckwheat", nameDe: "Buchweizen", nameEn: "Buckwheat", nameLatin: "Fagopyrum esculentum", family: "polygonaceae", cropGroup: "other", defaultLicense: "op", notes: "Gründüngung" },
  { id: "oat", nameDe: "Hafer Gründüngung", nameEn: "Oats Cover Crop", nameLatin: "Avena sativa", family: "poaceae", cropGroup: "other", defaultLicense: "op" },
  { id: "rye", nameDe: "Winterroggen", nameEn: "Winter Rye", nameLatin: "Secale cereale", family: "poaceae", cropGroup: "other", defaultLicense: "op" },
  { id: "calendula", nameDe: "Ringelblume", nameEn: "Calendula", nameLatin: "Calendula officinalis", family: "asteraceae", cropGroup: "other", defaultLicense: "op" },
  { id: "marigold", nameDe: "Studentenblume", nameEn: "French Marigold", nameLatin: "Tagetes patula", family: "asteraceae", cropGroup: "other", defaultLicense: "op", notes: "Nematoden" },
  { id: "nasturtium", nameDe: "Kapuzinerkresse", nameEn: "Nasturtium", nameLatin: "Tropaeolum majus", family: "tropaeolaceae", cropGroup: "other", defaultLicense: "op" },
  { id: "borage", nameDe: "Borretsch", nameEn: "Borage", nameLatin: "Borago officinalis", family: "boraginaceae", cropGroup: "other", defaultLicense: "op" },
  { id: "squash-patty", nameDe: "Pattypan", nameEn: "Pattypan Squash", nameLatin: "Cucurbita pepo", family: "cucurbitaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 55 },
  { id: "melon-charent", nameDe: "Charentais Melone", nameEn: "Charentais Melon", nameLatin: "Cucumis melo", family: "cucurbitaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 85 },
  { id: "endive", nameDe: "Endivie", nameEn: "Endive", nameLatin: "Cichorium endivia", family: "asteraceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 85 },
  { id: "chicory", nameDe: "Radicchio", nameEn: "Radicchio", nameLatin: "Cichorium intybus", family: "asteraceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 90 },
  { id: "celery-stalk", nameDe: "Stangensellerie", nameEn: "Stalk Celery", nameLatin: "Apium graveolens var. dulce", family: "apiaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 100 },
  { id: "salsify", nameDe: "Schwarzwurzel", nameEn: "Salsify", nameLatin: "Scorzonera hispanica", family: "asteraceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 150 },
  { id: "jerusalem", nameDe: "Topinambur", nameEn: "Jerusalem Artichoke", nameLatin: "Helianthus tuberosus", family: "asteraceae", cropGroup: "root", defaultLicense: "op" },
  { id: "sweetpot", nameDe: "Süßkartoffel Beauregard", nameEn: "Beauregard Sweet Potato", nameLatin: "Ipomoea batatas", family: "convolvulaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 120 },
  { id: "okra", nameDe: "Clemson Spineless Okra", nameEn: "Clemson Spineless Okra", nameLatin: "Abelmoschus esculentus", family: "malvaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 55 },
  { id: "amaranth", nameDe: "Amaranth Blatt", nameEn: "Leaf Amaranth", nameLatin: "Amaranthus tricolor", family: "amaranthaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 40 },
  { id: "quinoa", nameDe: "Quinoa", nameEn: "Quinoa", nameLatin: "Chenopodium quinoa", family: "amaranthaceae", cropGroup: "other", defaultLicense: "op", daysToMaturity: 100 },
  { id: "flax", nameDe: "Lein", nameEn: "Flax", nameLatin: "Linum usitatissimum", family: "linaceae", cropGroup: "other", defaultLicense: "op" },
  { id: "hemp", nameDe: "Hanf (Industrie)", nameEn: "Industrial Hemp", nameLatin: "Cannabis sativa", family: "cannabaceae", cropGroup: "other", defaultLicense: "op", notes: "Rechtliche Vorgaben beachten" },
  { id: "tomato-roma", nameDe: "Roma VF", nameEn: "Roma VF Tomato", nameLatin: "Solanum lycopersicum", family: "solanaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 75 },
  { id: "pepper-hungar", nameDe: "Hungarian Hot Wax", nameEn: "Hungarian Hot Wax", nameLatin: "Capsicum annuum", family: "solanaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 70 },
  { id: "cucumber-pick", nameDe: "Vorgebirgstrauben", nameEn: "Pickling Cucumber", nameLatin: "Cucumis sativus", family: "cucurbitaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 55 },
  { id: "bean-borlotto", nameDe: "Borlotto", nameEn: "Borlotto Bean", nameLatin: "Phaseolus vulgaris", family: "fabaceae", cropGroup: "legume", defaultLicense: "op", daysToMaturity: 85 },
  { id: "pea-markerbs", nameDe: "Markerbse Kelvedon", nameEn: "Kelvedon Wonder Pea", nameLatin: "Pisum sativum", family: "fabaceae", cropGroup: "legume", defaultLicense: "op", daysToMaturity: 65 },
  { id: "lettuce-oak", nameDe: "Eichblatt", nameEn: "Oakleaf Lettuce", nameLatin: "Lactuca sativa", family: "asteraceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 50 },
  { id: "cabbage-red", nameDe: "Rotkohl", nameEn: "Red Cabbage", nameLatin: "Brassica oleracea var. capitata f. rubra", family: "brassicaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 95 },
  { id: "brussels", nameDe: "Rosenkohl Groninger", nameEn: "Groninger Brussels Sprouts", nameLatin: "Brassica oleracea var. gemmifera", family: "brassicaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 120 },
  { id: "carrot-purple", nameDe: "Purple Haze Karotte", nameEn: "Purple Haze Carrot", nameLatin: "Daucus carota", family: "apiaceae", cropGroup: "root", defaultLicense: "f1", daysToMaturity: 70 },
  { id: "onion-spring", nameDe: "Frühlingszwiebel", nameEn: "Spring Onion", nameLatin: "Allium fistulosum", family: "alliaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 60 },
  { id: "shallot", nameDe: "Schalotte", nameEn: "Shallot", nameLatin: "Allium cepa Aggregatum", family: "alliaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 100 },
  { id: "basil-lemon", nameDe: "Zitronenbasilikum", nameEn: "Lemon Basil", nameLatin: "Ocimum × citriodorum", family: "lamiaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 60 },
  { id: "savory", nameDe: "Bohnenkraut", nameEn: "Summer Savory", nameLatin: "Satureja hortensis", family: "lamiaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 60 },
  { id: "lovage", nameDe: "Liebstöckel", nameEn: "Lovage", nameLatin: "Levisticum officinale", family: "apiaceae", cropGroup: "leaf", defaultLicense: "op" },
  { id: "sorrel", nameDe: "Sauerampfer", nameEn: "Sorrel", nameLatin: "Rumex acetosa", family: "polygonaceae", cropGroup: "leaf", defaultLicense: "op" },
  { id: "purslane", nameDe: "Portulak", nameEn: "Purslane", nameLatin: "Portulaca oleracea", family: "portulacaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 40 },
  { id: "lambslett", nameDe: "Feldsalat", nameEn: "Corn Salad / Mâche", nameLatin: "Valerianella locusta", family: "caprifoliaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 50 },
  { id: "cress", nameDe: "Gartenkresse", nameEn: "Garden Cress", nameLatin: "Lepidium sativum", family: "brassicaceae", cropGroup: "leaf", defaultLicense: "op", daysToMaturity: 14 },
  { id: "onion-set", nameDe: "Steckzwiebel Sturon", nameEn: "Sturon Onion Sets", nameLatin: "Allium cepa", family: "alliaceae", cropGroup: "root", defaultLicense: "op", daysToMaturity: 90 },
  { id: "tomato-debarao", nameDe: "De Barao", nameEn: "De Barao Tomato", nameLatin: "Solanum lycopersicum", family: "solanaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 80 },
  { id: "pepper-padron", nameDe: "Padrón", nameEn: "Padron Pepper", nameLatin: "Capsicum annuum", family: "solanaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 60 },
  { id: "gherkin", nameDe: "Einlegegurke", nameEn: "Gherkin", nameLatin: "Cucumis sativus", family: "cucurbitaceae", cropGroup: "fruit", defaultLicense: "op", daysToMaturity: 50 },
  { id: "soy", nameDe: "Sojabohne", nameEn: "Soybean", nameLatin: "Glycine max", family: "fabaceae", cropGroup: "legume", defaultLicense: "op", daysToMaturity: 100 },
  { id: "chickpea", nameDe: "Kichererbse", nameEn: "Chickpea", nameLatin: "Cicer arietinum", family: "fabaceae", cropGroup: "legume", defaultLicense: "op", daysToMaturity: 100 },
  { id: "wheat", nameDe: "Sommerweizen", nameEn: "Spring Wheat", nameLatin: "Triticum aestivum", family: "poaceae", cropGroup: "other", defaultLicense: "op" },
  { id: "barley", nameDe: "Sommergerste", nameEn: "Spring Barley", nameLatin: "Hordeum vulgare", family: "poaceae", cropGroup: "other", defaultLicense: "op" },
];

export function searchCultivars(q: string, limit = 40): Cultivar[] {
  const term = q.trim().toLowerCase();
  if (!term) return CULTIVARS.slice(0, limit);
  return CULTIVARS.filter(
    (c) =>
      c.nameDe.toLowerCase().includes(term) ||
      c.nameEn.toLowerCase().includes(term) ||
      c.nameLatin.toLowerCase().includes(term) ||
      c.family.toLowerCase().includes(term) ||
      c.id.includes(term),
  ).slice(0, limit);
}

export function getCultivar(id: string): Cultivar | undefined {
  return CULTIVARS.find((c) => c.id === id);
}

export function familyToCropGroup(family: string): RotationCropGroup {
  const f = family.toLowerCase();
  if (f === "fabaceae") return "legume";
  if (["solanaceae", "cucurbitaceae", "rosaceae", "malvaceae"].includes(f)) return "fruit";
  if (["brassicaceae", "asteraceae", "lamiaceae", "amaranthaceae", "apiaceae"].includes(f) && !["daucus", "pastinaca"].includes(f)) {
    // many brassicas are leaf; roots handled by cultivar
    if (["alliaceae"].includes(f)) return "root";
    return "leaf";
  }
  if (["alliaceae", "apiaceae", "convolvulaceae"].includes(f)) return "root";
  return "other";
}
