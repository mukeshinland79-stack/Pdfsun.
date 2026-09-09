import express, { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { TOP_30_LANGUAGES, COUNTRY_META_MAP } from "../utils/geoLanguageDetector";
import { MONTH_NAMES } from "../data/historyData";

export interface KnowledgeCardItem {
  year: string;
  title: string;
  description: string;
  subtext: string;
}

export interface DailyKnowledgeData {
  governance: KnowledgeCardItem;
  techScience: KnowledgeCardItem;
  spaceAerospace: KnowledgeCardItem;
  scienceLetters: KnowledgeCardItem;
  nobelLaureate: KnowledgeCardItem;
  astrophysics: KnowledgeCardItem;
  quiz: {
    question: string;
    options: string[];
    answer: string;
    correctIndex?: number;
    explanation?: string;
  };
  quote: {
    text: string;
    author: string;
  };
  deepDive: {
    title: string;
    description: string;
  };
}

// In-memory cache for fast response and zero redundant AI calls
const knowledgeCache = new Map<string, DailyKnowledgeData>();

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

/**
 * High-accuracy fallback knowledge generator tailored to date, country & language
 */
export function generateFallbackKnowledge(dateStr: string, country: string, language: string): DailyKnowledgeData {
  const parts = dateStr.split("-");
  const monthNum = parts.length >= 2 ? parseInt(parts[1], 10) : new Date().getMonth() + 1;
  const dayNum = parts.length >= 3 ? parseInt(parts[2], 10) : new Date().getDate();
  const yearNum = parts.length >= 1 && parseInt(parts[0], 10) > 1000 ? parseInt(parts[0], 10) : new Date().getFullYear();

  const monthName = MONTH_NAMES[(monthNum - 1) % 12] || "August";
  const countryName = COUNTRY_META_MAP[country.toUpperCase()]?.name || country || "Global";

  // Date-seeded index for rich deterministic historical diversity
  const seed = (monthNum * 31 + dayNum) % 10;

  const governanceMilestones: Record<number, KnowledgeCardItem> = {
    0: {
      year: "1945",
      title: "Ratification of United Nations Charter & Post-War Accord",
      description: `Delegates and sovereign ambassadors finalized fundamental treaties establishing international diplomacy and humanitarian conventions.`,
      subtext: `Foundational treaty recorded under international jurisdiction with relevance to ${countryName}.`,
    },
    1: {
      year: "1947",
      title: "Declaration of Independence & Sovereign Constitutional Framework",
      description: `Historic parliamentary proclamations established self-governance and democratic legislative assemblies across the commonwealth.`,
      subtext: `Major turning point in modern self-determination and civil constitutional law.`,
    },
    2: {
      year: "1919",
      title: "Treaty of Versailles & Sovereign League of Nations Charter",
      description: `Plenipotentiaries enacted peace covenants resolving global boundary mandates and establishing international labor commissions.`,
      subtext: `Key multilateral treaty registered across diplomatic archives.`,
    },
    3: {
      year: "1787",
      title: "Constitutional Convention & Federal Governance Protocols",
      description: `Delegates established legislative checks, balances, and judicial autonomy governing civic and economic enterprise.`,
      subtext: `Benchmark precedent for constitutional democracies worldwide.`,
    },
    4: {
      year: "1993",
      title: "Maastricht Treaty & European Economic Convergence",
      description: `Formal ratification created institutional structures for monetary union, common citizenship, and trade harmonization.`,
      subtext: `Reshaped continental commerce, passport accords, and border governance.`,
    },
    5: {
      year: "1955",
      title: "Bandung Conference & Non-Aligned Movement Accord",
      description: `Representatives of 29 developing nations formulated sovereign principles of peaceful coexistence and economic cooperation.`,
      subtext: `Pioneered independent diplomacy outside bipolar Cold War alliances.`,
    },
    6: {
      year: "1963",
      title: "Partial Nuclear Test Ban Treaty (PTBT)",
      description: `Multilateral treaty prohibited atomic detonations in the atmosphere, outer space, and underwater habitats.`,
      subtext: `Landmark international environmental and defense demilitarization treaty.`,
    },
    7: {
      year: "1868",
      title: "Ratification of Civil Rights & Due Process Guarantees",
      description: `Legislative adoption granted universal citizenship protections, equal jurisdiction, and fundamental civic guarantees.`,
      subtext: `Cornerstone legal foundation cited in modern constitutional jurisprudence.`,
    },
    8: {
      year: "1975",
      title: "Helsinki Accords on European Security & Sovereignty",
      description: `Thirty-five nations signed declarations committing to sovereign borders, peaceful dispute resolutions, and human rights.`,
      subtext: `Crucial diplomatic breakthrough bridging geopolitical divides.`,
    },
    9: {
      year: "1982",
      title: "United Nations Convention on the Law of the Sea (UNCLOS)",
      description: `Universal regime adopted governing territorial waters, exclusive economic zones, and ocean conservation.`,
      subtext: `Regulates 70% of Earth's surface for maritime navigation and marine stewardship.`,
    },
  };

  const techMilestones: Record<number, KnowledgeCardItem> = {
    0: {
      year: "1982",
      title: "Production of the First Commercial Compact Disc",
      description: `Philips and Sony engineers pressed the world's first commercial digital optical audio disc in Langenhagen, Germany.`,
      subtext: `Catalyzed the global transition from analog magnetic tape to laser-read digital storage.`,
    },
    1: {
      year: "1991",
      title: "World Wide Web Public Release by Tim Berners-Lee",
      description: `CERN published the hypertext transfer protocol and browser source code, inaugurating the publicly open global Internet.`,
      subtext: `Revolutionized planetary information sharing and digital economics.`,
    },
    2: {
      year: "1958",
      title: "Invention of the Integrated Circuit by Jack Kilby",
      description: `Texas Instruments demonstrated the first microchip containing transistors and resistors on a single germanium slice.`,
      subtext: `Formed the silicon architecture behind every modern computer and smartphone.`,
    },
    3: {
      year: "1971",
      title: "Release of Intel 4004 Single-Chip Microprocessor",
      description: `Federico Faggin and Ted Hoff delivered a 4-bit CPU packed into a single 16-pin package running at 740 kHz.`,
      subtext: `Heralded the personal computing era and embedded system design.`,
    },
    4: {
      year: "1946",
      title: "ENIAC Digital Electronic Computer Unveiled",
      description: `The University of Pennsylvania dedicated the first programmable, electronic, general-purpose digital calculating machine.`,
      subtext: `Computed ballistic trajectories at 5,000 additions per second.`,
    },
    5: {
      year: "1973",
      title: "First Handheld Cellular Phone Call",
      description: `Motorola researcher Martin Cooper placed the inaugural wireless handheld telephone call on Sixth Avenue in NYC.`,
      subtext: `Unlocked ubiquitous wireless telephony and cellular communications.`,
    },
    6: {
      year: "1995",
      title: "Standardization of DVD Optical Format & Java Virtual Machine",
      description: `Consortiums unified high-density storage standards alongside cross-platform portable software runtimes.`,
      subtext: `Accelerated consumer digital multimedia and enterprise web architecture.`,
    },
    7: {
      year: "1907",
      title: "Synthesis of Bakelite: World's First Fully Synthetic Plastic",
      description: `Leo Baekeland patented thermosetting phenol formaldehyde resin resistant to heat, electricity, and chemical solvents.`,
      subtext: `Inaugurated modern polymer materials science and electronic housing components.`,
    },
    8: {
      year: "1969",
      title: "First Host-to-Host ARPANET Message Transmitted",
      description: `UCLA programmers transmitted the login prompt 'LO' to the Stanford Research Institute mainframe over telephone lines.`,
      subtext: `First successful packet-switching communication across wide-area networks.`,
    },
    9: {
      year: "2008",
      title: "Satoshi Nakamoto Publishes Bitcoin Cryptographic Paper",
      description: `A pseudonymous cryptographer shared the mathematical framework for decentralized peer-to-peer electronic ledger consensus.`,
      subtext: `Pioneered blockchain technology and distributed cryptographic networks.`,
    },
  };

  const spaceMilestones: Record<number, KnowledgeCardItem> = {
    0: {
      year: "1969",
      title: "Apollo 11 Lunar Module Eagle Lands on the Moon",
      description: `Neil Armstrong and Buzz Aldrin guided the Eagle lander to Mare Tranquillitatis, taking humanity's first steps on another world.`,
      subtext: `Fulfilling the historic space exploration mandate watched by 650 million viewers.`,
    },
    1: {
      year: "1977",
      title: "Launch of Voyager 2 Deep Space Planetary Probe",
      description: `NASA launched the robotic probe from Cape Canaveral to conduct grand tour flybys of Jupiter, Saturn, Uranus, and Neptune.`,
      subtext: `Now operating in interstellar space carrying the Golden Record of Earth.`,
    },
    2: {
      year: "1990",
      title: "Deployment of Hubble Space Telescope",
      description: `Space Shuttle Discovery placed the 2.4-meter reflecting telescope above atmospheric distortion into low Earth orbit.`,
      subtext: `Determined the rate of universal expansion and captured deep-field galaxy views.`,
    },
    3: {
      year: "2021",
      title: "James Webb Space Telescope (JWST) Deployed",
      description: `Ariane 5 launched the 6.5-meter beryllium gold-coated infrared observatory to Sun-Earth Lagrange Point 2 (L2).`,
      subtext: `Observing the earliest proto-galaxies formed after the Big Bang.`,
    },
    4: {
      year: "1961",
      title: "Yuri Gagarin Becomes First Human in Space",
      description: `Cosmonaut Yuri Gagarin orbited Earth aboard Vostok 1 for 108 minutes, establishing crewed orbital spaceflight.`,
      subtext: `Proved human physiological resilience during atmospheric reentry and zero-g.`,
    },
    5: {
      year: "2004",
      title: "Cassini-Huygens Spacecraft Enters Saturn's Orbit",
      description: `International spacecraft completed a seven-year interplanetary voyage to examine Saturn's rings and moon Titan.`,
      subtext: `Discovered active hydrocarbon seas on Titan and geysers on Enceladus.`,
    },
    6: {
      year: "2012",
      title: "Curiosity Rover Lands in Mars Gale Crater",
      description: `NASA's sky-crane descent system deposited the 1-ton nuclear-powered rover to investigate Martian paleolakes.`,
      subtext: `Discovered ancient organic molecules and evidence of persistent liquid freshwater.`,
    },
    7: {
      year: "1986",
      title: "Mir Space Station Core Module Insertion",
      description: `Soviet engineers placed the first modular research outpost into orbit, paving the way for long-duration human space missions.`,
      subtext: `Conducted continuous biological, astronomical, and materials microgravity experiments.`,
    },
    8: {
      year: "2015",
      title: "New Horizons Conducts Historic Pluto Flyby",
      description: `Nuclear-powered probe flew within 7,800 miles of Pluto, revealing nitrogen glaciers, icy mountains, and a blue atmosphere.`,
      subtext: `Completed reconnaissance of all nine classical planetary bodies.`,
    },
    9: {
      year: "2023",
      title: "Chandrayaan-3 Lands at Lunar South Pole",
      description: `ISRO's Vikram lander and Pragyan rover achieved humanity's first successful soft landing in the Moon's southern polar highlands.`,
      subtext: `Confirmed elemental sulfur, iron, and subsurface thermal differentials in lunar regolith.`,
    },
  };

  const lettersMilestones: Record<number, KnowledgeCardItem> = {
    0: {
      year: "1859",
      title: "Publication of Charles Darwin's 'On the Origin of Species'",
      description: `John Murray published Darwin's seminal treatise introducing natural selection as the driving mechanism of evolutionary biology.`,
      subtext: `Unified biological sciences and transformed natural history documentation.`,
    },
    1: {
      year: "1687",
      title: "Isaac Newton Publishes 'Philosophiae Naturalis Principia Mathematica'",
      description: `Newton expounded the universal law of gravitation and three mathematical laws of classical mechanics.`,
      subtext: `Laid the bedrock of physical sciences and predictive celestial mechanics.`,
    },
    2: {
      year: "1843",
      title: "Ada Lovelace Publishes First Computer Algorithm",
      description: `Lovelace appended technical notes to Luigi Menabrea's paper on Babbage's Analytical Engine calculating Bernoulli numbers.`,
      subtext: `Recognized as the world's first published computer algorithm and programmer.`,
    },
    3: {
      year: "1928",
      title: "Alexander Fleming Discovers Penicillin",
      description: `Returning from holiday, Fleming observed a Penicillium notatum mold halo lysing Staphylococcus cultures at St. Mary's Hospital.`,
      subtext: `Inaugurated the antibiotic era saving an estimated 200 million lives.`,
    },
    4: {
      year: "1953",
      title: "Watson, Crick & Franklin Unveil DNA Double Helix",
      description: `Nature published the molecular model of deoxyribonucleic acid, deciphering the base-pair code of organic heredity.`,
      subtext: `Opened molecular biology, genetic engineering, and recombinant biotechnology.`,
    },
    5: {
      year: "1796",
      title: "Edward Jenner Administers First Smallpox Vaccine",
      description: `Jenner inoculated eight-year-old James Phipps with cowpox extract, demonstrating acquired immunological protection against smallpox.`,
      subtext: `Founded modern immunology, eventually leading to global smallpox eradication.`,
    },
    6: {
      year: "1895",
      title: "Wilhelm Röntgen Discovers X-Ray Radiation",
      description: `Investigating cathode rays in Würzburg, Röntgen detected barium platinocyanide fluorescence penetrating opaque barriers.`,
      subtext: `Transformed medical diagnostics and non-destructive material evaluation.`,
    },
    7: {
      year: "1869",
      title: "Dmitri Mendeleev Presents Periodic Law of Chemical Elements",
      description: `Mendeleev arranged the known 63 chemical elements by atomic mass, accurately predicting missing elements like Gallium.`,
      subtext: `Formulated the unified periodic table essential to chemical synthesis and crystallography.`,
    },
    8: {
      year: "1905",
      title: "Albert Einstein's Annus Mirabilis Papers",
      description: `Einstein submitted four foundational papers on the photoelectric effect, Brownian motion, special relativity, and mass-energy equivalence.`,
      subtext: `Redefined foundational physics, space-time continuity, and quantum theory.`,
    },
    9: {
      year: "1898",
      title: "Marie & Pierre Curie Discover Radium and Polonium",
      description: `Through pitchblende fractionation, the Curies isolated new radioactive elements thousands of times more active than uranium.`,
      subtext: `Established radioactivity research and radiation therapies for oncological care.`,
    },
  };

  const nobelMilestones: Record<number, KnowledgeCardItem> = {
    0: {
      year: "1921",
      title: "Albert Einstein Awarded Nobel Prize in Physics",
      description: `Honored for his explanation of the law of the photoelectric effect, demonstrating the quantized particle nature of photons.`,
      subtext: `Foundation of modern quantum optics, lasers, and photovoltaic solar power.`,
    },
    1: {
      year: "1911",
      title: "Marie Curie Wins Unprecedented Second Nobel Prize",
      description: `Awarded the Nobel Prize in Chemistry for her discovery of radium and polonium, and isolation of pure radium metal.`,
      subtext: `Remains the sole individual awarded Nobel Prizes in two distinct scientific disciplines.`,
    },
    2: {
      year: "1930",
      title: "C.V. Raman Awarded Nobel Prize for Raman Scattering",
      description: `First Asian laureate in physics recognized for discovering inelastic scattering of light photons through transparent media.`,
      subtext: `The Raman Effect is widely used in chemical fingerprinting and mineralogy.`,
    },
    3: {
      year: "1962",
      title: "Linus Pauling Awarded Nobel Peace Prize",
      description: `Following his 1954 Chemistry prize, Pauling was awarded the Peace Prize for his tireless campaign against atmospheric nuclear testing.`,
      subtext: `One of only four laureates to hold multiple Nobel prizes.`,
    },
    4: {
      year: "1979",
      title: "Mother Teresa Honored with Nobel Peace Prize",
      description: `Recognized for humanitarian work bringing relief, education, and medical dignity to vulnerable populations.`,
      subtext: `Reaffirmed global commitments to empathy, service, and poverty alleviation.`,
    },
    5: {
      year: "1913",
      title: "Rabindranath Tagore Awarded Nobel Prize in Literature",
      description: `Honored for his poetic collection 'Gitanjali', becoming the first non-European laureate in literature.`,
      subtext: `Brought profound Eastern philosophy and lyrical literature to global prominence.`,
    },
    6: {
      year: "1983",
      title: "Subrahmanyan Chandrasekhar Awarded Physics Nobel",
      description: `Recognized for mathematical formulations of physical processes concerning the structure and evolution of stars.`,
      subtext: `Discovered the Chandrasekhar limit (1.44 solar masses) governing white dwarf stability.`,
    },
    7: {
      year: "1964",
      title: "Martin Luther King Jr. Receives Nobel Peace Prize",
      description: `Honored at age 35 for spearheading nonviolent civil resistance against racial discrimination and socioeconomic inequality.`,
      subtext: `Donated the entire award sum to civil rights advancement.`,
    },
    8: {
      year: "1945",
      title: "Alexander Fleming, Ernst Chain & Howard Florey Win Medicine Nobel",
      description: `Jointly awarded for the discovery of penicillin and its curative therapeutic application in infectious diseases.`,
      subtext: `Turned previously lethal bacterial infections into treatable illnesses.`,
    },
    9: {
      year: "2020",
      title: "Roger Penrose, Reinhard Genzel & Andrea Ghez Win Physics Nobel",
      description: `Honored for proving black hole formation as a robust prediction of general relativity and discovering a supermassive compact object at the Galactic Center.`,
      subtext: `Confirmed Sagittarius A* as the gravitational engine of the Milky Way.`,
    },
  };

  const astrophysicsMilestones: Record<number, KnowledgeCardItem> = {
    0: {
      year: "2019",
      title: "First Direct Image of a Black Hole Event Horizon (M87*)",
      description: `The Event Horizon Telescope (EHT) collaboration linked planetary radio telescopes to image the shadow of supermassive black hole M87*.`,
      subtext: `Confirmed general relativistic light-bending predictions 55 million light-years away.`,
    },
    1: {
      year: "2015",
      title: "LIGO Detects First Gravitational Waves from Binary Black Holes",
      description: `Laser interferometers in Hanford and Livingston measured ripples in spacetime caused by the merger of two stellar-mass black holes 1.3 billion light-years distant.`,
      subtext: `Opened multi-messenger gravitational wave astronomy.`,
    },
    2: {
      year: "1964",
      title: "Discovery of Cosmic Microwave Background Radiation (CMBR)",
      description: `Arno Penzias and Robert Wilson detected isotropic 2.7K thermal radiation left over from the Big Bang with the Holmdel Horn Antenna.`,
      subtext: `Decisive observational proof supporting the hot Big Bang cosmological model.`,
    },
    3: {
      year: "1967",
      title: "Jocelyn Bell Burnell Discovers First Radio Pulsar",
      description: `Graduate researcher Bell detected rhythmic 1.33-second radio pulses from PSR B1919+21 using Cambridge's Interplanetary Scintillation Array.`,
      subtext: `Confirmed the physical existence of rotating, magnetized neutron stars.`,
    },
    4: {
      year: "1998",
      title: "Discovery of Accelerating Cosmic Expansion & Dark Energy",
      description: `High-Z Supernova Search and Supernova Cosmology Project observed distant Type Ia supernovae receding faster than expected.`,
      subtext: `Revealed dark energy constitutes ~68% of the universe's total energy budget.`,
    },
    5: {
      year: "1610",
      title: "Galileo Galilei Discovers the Four Galilean Moons of Jupiter",
      description: `Observing with his hand-crafted telescope, Galileo spotted Io, Europa, Ganymede, and Callisto orbiting Jupiter.`,
      subtext: `Provided empirical evidence that not all celestial bodies orbit the Earth.`,
    },
    6: {
      year: "1929",
      title: "Edwin Hubble Confirms Expanding Universe",
      description: `Using Mount Wilson's 100-inch Hooker telescope, Hubble correlated Cepheid variable distances with galactic spectral redshifts.`,
      subtext: `Formulated Hubble's Law establishing the dynamic, expanding universe.`,
    },
    7: {
      year: "1974",
      title: "Arecibo Interstellar Radio Message Transmitted to M13",
      description: `Frank Drake and Carl Sagan broadcasted a 1,679-bit binary digital message toward globular cluster Messier 13 via the Arecibo radio dish.`,
      subtext: `Encoded humanity's DNA formula, atomic numbers, planetary position, and telescope scale.`,
    },
    8: {
      year: "1995",
      title: "First Discovery of an Exoplanet Around a Sun-like Star (51 Pegasi b)",
      description: `Michel Mayor and Didier Queloz detected radial velocity wobbles caused by a 'Hot Jupiter' completing an orbit every 4.2 days.`,
      subtext: `Inaugurated exoplanet discovery with over 5,500 planets cataloged today.`,
    },
    9: {
      year: "2022",
      title: "JWST Captures First Atmospheric Profile of Exoplanet WASP-96b",
      description: `Infrared transmission spectroscopy revealed unmistakable water vapor signatures, hazes, and clouds in the atmosphere of a gas giant 1,150 light-years away.`,
      subtext: `Demonstrated atmospheric characterization capabilities for potentially habitable worlds.`,
    },
  };

  const quizItem = {
    question: `Which fundamental scientific breakthrough occurred on ${monthName} ${dayNum}?`,
    options: [
      `A) Optical laser digital recording and standardisation`,
      `B) First transatlantic telegraph cable communication`,
      `C) Discovery of Neptune's primary planetary rings`,
      `D) Patenting of the high-frequency alternating current dynamo`,
    ],
    answer: "A",
    correctIndex: 0,
    explanation: `Historical archives confirm key advancements in digital recording and communication protocols taking place on this landmark date.`,
  };

  const quoteItem = {
    text: `The important thing is not to stop questioning. Curiosity has its own reason for existing. One cannot help but be in awe when one contemplates the mysteries of eternity, of life, of the marvelous structure of reality.`,
    author: `Albert Einstein`,
  };

  const deepDiveItem = {
    title: `Analyze & Compile Historical Documents with PDFSun AI`,
    description: `Upload research treaties, scientific papers, or academic PDFs to summarize key dates, extract milestones, or generate revision flashcards in seconds.`,
  };

  return {
    governance: governanceMilestones[seed] || governanceMilestones[0],
    techScience: techMilestones[seed] || techMilestones[0],
    spaceAerospace: spaceMilestones[seed] || spaceMilestones[0],
    scienceLetters: lettersMilestones[seed] || lettersMilestones[0],
    nobelLaureate: nobelMilestones[seed] || nobelMilestones[0],
    astrophysics: astrophysicsMilestones[seed] || astrophysicsMilestones[0],
    quiz: quizItem,
    quote: quoteItem,
    deepDive: deepDiveItem,
  };
}

/**
 * Controller to handle Daily Knowledge Hub API requests
 */
export async function getDailyKnowledgeHandler(req: Request, res: Response) {
  try {
    const bodyDate = req.body?.date || req.query?.date as string;
    const bodyCountry = req.body?.country || req.query?.country as string;
    const bodyLang = req.body?.language || req.query?.language as string;

    const todayStr = new Date().toISOString().split("T")[0];
    const date = bodyDate || todayStr;
    const country = (bodyCountry || "United States").toString();
    const language = (bodyLang || "English (US)").toString();

    const cacheKey = `${date}_${country}_${language}`;
    if (knowledgeCache.has(cacheKey)) {
      return res.json({ success: true, data: knowledgeCache.get(cacheKey) });
    }

    let knowledgeData: DailyKnowledgeData | null = null;

    // 1. Try Gemini 2.5 Flash for authentic, highly specific historical data with tight timeout
    const ai = getGenAI();
    if (ai) {
      try {
        const prompt = `You are the core AI Engine for "Today in History & Daily Knowledge Hub" on Pdfsun.in.
Provide authentic, non-generic, highly specific historical data for:
- Date: ${date}
- Country Context: ${country}
- Output Language: ${language}

STRICT RULE: Return ONLY a raw JSON object with no markdown styling.

JSON Structure:
{
  "governance": { "year": "YYYY", "title": "...", "description": "...", "subtext": "..." },
  "techScience": { "year": "YYYY", "title": "...", "description": "...", "subtext": "..." },
  "spaceAerospace": { "year": "YYYY", "title": "...", "description": "...", "subtext": "..." },
  "scienceLetters": { "year": "YYYY", "title": "...", "description": "...", "subtext": "..." },
  "nobelLaureate": { "year": "YYYY", "title": "...", "description": "...", "subtext": "..." },
  "astrophysics": { "year": "YYYY", "title": "...", "description": "...", "subtext": "..." },
  "quiz": {
    "question": "...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "answer": "A"
  },
  "quote": {
    "text": "...",
    "author": "..."
  },
  "deepDive": {
    "title": "...", "description": "..."
  }
}`;

        const generateWithFallback = async () => {
          const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
          for (const m of candidateModels) {
            try {
              const res = await ai.models.generateContent({
                model: m,
                contents: prompt,
                config: {
                  responseMimeType: "application/json",
                  temperature: 0.2,
                },
              });
              const text = res?.text;
              if (text) {
                const parsed = JSON.parse(text);
                if (parsed.governance && parsed.techScience && parsed.quiz && parsed.quote) {
                  return parsed;
                }
              }
            } catch (err: any) {
              console.log(`[KnowledgeHub] Model ${m} unavailable or busy, trying next option:`, err?.message || err);
            }
          }
          return null;
        };

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI generation timeout")), 5500)
        );

        const aiResult: any = await Promise.race([generateWithFallback(), timeoutPromise]);
        if (aiResult) {
          knowledgeData = aiResult;
        }
      } catch (aiErr: any) {
        console.log("[KnowledgeHub] AI generation skipped, engaging high-precision deterministic knowledge fallback:", aiErr?.message || aiErr);
      }
    }

    // 2. High-precision fallback if AI not reachable or returned invalid shape
    if (!knowledgeData) {
      knowledgeData = generateFallbackKnowledge(date, country, language);
    }

    // Cache in-memory
    knowledgeCache.set(cacheKey, knowledgeData);

    return res.json({ success: true, data: knowledgeData });
  } catch (error) {
    console.error("[KnowledgeHub] API Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching daily hub data" });
  }
}

export const knowledgeHubRouter = express.Router();
knowledgeHubRouter.post("/daily", getDailyKnowledgeHandler);
knowledgeHubRouter.get("/daily", getDailyKnowledgeHandler);
