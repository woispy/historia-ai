const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));

const CharacterEngine = {
  createCharacter(description) {
    const text = description.toLowerCase();

    const stats = {
      leadership: 50,
      diplomacy: 50,
      warfare: 50,
      economy: 50,
      intelligence: 50,
      intrigue: 50,
      charisma: 50,
    };

    const personality = [];

    const addTrait = (trait) => {
      if (!personality.includes(trait)) {
        personality.push(trait);
      }
    };

    if (text.includes("adalet")) {
      stats.leadership += 10;
      addTrait("Adaletli");
    }

    if (text.includes("hırsl")) {
      stats.charisma += 8;
      addTrait("Hırslı");
    }

    if (text.includes("sabır")) {
      stats.diplomacy += 5;
      addTrait("Sabırlı");
    }

    if (text.includes("ticaret")) {
      stats.economy += 15;
      addTrait("Ticaret Odaklı");
    }

    if (text.includes("medrese")) {
      stats.intelligence += 12;
      addTrait("Bilge");
    }

    if (text.includes("zek")) {
      stats.intelligence += 15;
      addTrait("Zeki");
    }

    if (text.includes("savaş")) {
      stats.warfare += 15;
      addTrait("Savaşçı");
    }

    if (text.includes("komutan")) {
      stats.warfare += 10;
      addTrait("Lider");
    }

    if (text.includes("diplomasi")) {
      stats.diplomacy += 15;
      addTrait("Diplomatik");
    }

    Object.keys(stats).forEach((key) => {
      stats[key] = clamp(stats[key]);
    });

    return {
  profile: {
    name: "Henüz Belirlenmedi",

    age: 18,

    country: "Osmanlı Beyliği",

    culture: "Türkmen",

    religion: "Sünni İslam",

    dynasty: "Kayı",

    title: "Bey",

    description,
  },

  stats,

  personality,

  analysis: {
    summary:
      "Bu karakter eğitimli ve diplomasiye yatkın bir hükümdar profili sergiliyor.",

    strengths: [
      "Diplomasi",
      "Eğitim"
    ],

    weaknesses: [
      "Askerî tecrübe"
    ],

    recommendations: [
      "Güçlü bir komutan görevlendirin.",
      "İlk yıllarda diplomasiye öncelik verin."
    ]
  },

  memories: [],

  reputation: {},

  temporaryEffects: [],
    };
  },
};

export default CharacterEngine;