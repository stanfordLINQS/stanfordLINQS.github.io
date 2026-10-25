// News items for news.html and the "Latest News" list on the home page.
//
// To add an item, copy an entry and edit it. Order does not matter; items are
// sorted newest first. Fields:
//   id       short unique slug, used for news.html#id links
//   date     "YYYY-MM-DD", or "YYYY-MM" when only the month is known
//   tag      "Paper", "Award", "Event", or "Press"
//   title    headline (plain text)
//   summary  one to three sentences (may use <em> for journal names)
//   links    optional [{ label, url }]
//   coverage optional [{ label, url }], press stories shown as "In the news"
//   image    optional { src, alt, caption }
window.NEWS = [
  {
    id: "ethan-rosenfeld-mics-award-2026",
    date: "2026-10",
    tag: "Award",
    title: "Ethan Rosenfeld wins the MICS Student Paper Award",
    summary:
      "Ethan Rosenfeld took first place in the Student Paper Award at Mid-Infrared Coherent Sources (MICS), part of the Optica Laser Congress and Exhibition (October 11-15, 2026), for his paper \"Telecom-Pumped Mid-Infrared Frequency Comb Generator on Thin-Film Lithium Niobate\". Congratulations, Ethan!",
  },
  {
    id: "nature-nano-millisecond-phonons",
    date: "2026-10-16",
    tag: "Paper",
    title: "Millisecond phonon lifetimes in piezoelectric nanomechanical resonators",
    summary:
      "Oliver Hitchcock, Matthew Maksymowych and Kaveh Pezeshki made lithium niobate nanomechanical resonators that ring for milliseconds, more than 1000 times longer than earlier devices in the same material, while keeping strong piezoelectric coupling. The losses came from how the devices were made, not from the material: cleaning the released devices first and evaporating the aluminum electrodes through a stencil as the last step keeps resist off the cleaned surfaces. Published in <em>Nature Nanotechnology</em>.",
    links: [
      { label: "Nature Nanotechnology", url: "https://www.nature.com/articles/s41565-026-02289-9" },
      { label: "arXiv", url: "https://arxiv.org/abs/2610.10700" },
    ],
  },
  {
    id: "science-quantum-jumps-of-sound",
    date: "2026-09-17",
    tag: "Paper",
    title: "Quantum jumps of sound",
    summary:
      "Takuma Makihara and Erik Szakiel watched a nanomechanical resonator jump between its one-phonon and zero-phonon states in real time, the first direct observation of quantum jumps in a mechanical resonator. A lithium niobate phononic crystal transfer-printed 75 nm above a superconducting qubit lets the qubit measure the phonon number about 170 times within the resonator's 2.1 ms lifetime. Published in <em>Science</em>.",
    links: [
      { label: "Science", url: "https://doi.org/10.1126/science.aeh7535" },
      { label: "Stanford Report", url: "https://news.stanford.edu/stories/2026/09/first-real-time-quantum-jump-sound" },
      { label: "arXiv", url: "https://arxiv.org/abs/2610.10714" },
    ],
    coverage: [
      { label: "Discover", url: "https://www.discovermagazine.com/scientists-catch-sound-making-a-quantum-jump-with-a-microscopic-tuning-fork-49708" },
      { label: "Phys.org", url: "https://phys.org/news/2026-09-real-quantum.html" },
      { label: "ScienceDaily", url: "https://www.sciencedaily.com/releases/2026/09/260921081054.htm" },
      { label: "The Quantum Insider", url: "https://thequantuminsider.com/2026/09/18/researchers-observe-first-real-time-quantum-jump-in-sound/" },
      { label: "Interesting Engineering", url: "https://interestingengineering.com/science/quantum-jump-in-sound-in-real-time" },
    ],
  },
  {
    id: "nature-photonics-mid-ir-opo",
    date: "2026-08-27",
    tag: "Paper",
    title: "An electrically tuned mid-infrared parametric oscillator on a chip",
    summary:
      "Alex Hwang and Hubert Stokowski built an optical parametric oscillator on thin-film lithium niobate that turns one fixed 1045 nm pump into multi-milliwatt mid-infrared light, tuned by voltage from 2.7 to 3.4 microns (22 THz). Two racetrack resonators of slightly different length form a Vernier filter that replaces the moving parts of a bulk OPO. Published in <em>Nature Photonics</em>.",
    links: [
      { label: "Nature Photonics", url: "https://www.nature.com/articles/s41566-026-01999-9" },
      { label: "arXiv", url: "https://arxiv.org/abs/2604.06673" },
    ],
  },
  {
    id: "qcs-workshop-2026",
    date: "2026-08-21",
    tag: "Event",
    title: "Quantum Computational Sensing Workshop at Stanford",
    summary:
      "We hosted three days on quantum computational sensing under Q-FARM: letting a quantum computer work on a signal while it is still quantum, before readout. Taewon Park, Sam Robison, Erik Szakiel, Yun Zhao and Oliver Hitchcock presented posters from our group. All the talks are online.",
    links: [
      { label: "Workshop page", url: "https://qfarm.stanford.edu/events/conference-workshop/quantum-computational-sensing" },
      { label: "Talks", url: "https://www.youtube.com/@qfarmstanford/videos" },
    ],
  },
  {
    id: "falling-walls-2026",
    date: "2026-08",
    tag: "Award",
    title: "Falling Walls 2026 finalist",
    summary:
      "Amir was named one of ten finalists in Engineering &amp; Technology for the Falling Walls Science Breakthroughs of the Year 2026, for our chip-scale optical amplifier.",
    links: [
      { label: "Falling Walls", url: "https://falling-walls.com/breakthrough/finalists-interviews/amir-safavi-naeini" },
    ],
  },
  {
    id: "nature-physics-dressed-states",
    date: "2026-04-14",
    tag: "Paper",
    title: "Intrinsic phononic dressed states in a nanomechanical system",
    summary:
      "Mert Yuksel (Roukes lab, Caltech) and Matthew Maksymowych saw Jaynes-Cummings ladder physics between a lithium niobate nanomechanical resonator and a two-level-system defect already present in the material, with no superconducting qubit involved. Joint work with Michael Roukes' group at Caltech, with theory support from Mark Dykman (Michigan State). Published in <em>Nature Physics</em>.",
    links: [
      { label: "Nature Physics", url: "https://www.nature.com/articles/s41567-026-03225-3" },
      { label: "arXiv", url: "https://arxiv.org/abs/2502.18587" },
    ],
  },
  {
    id: "pr-applied-frequency-noise",
    date: "2026-02-02",
    tag: "Paper",
    title: "Frequency noise in nanomechanical resonators",
    summary:
      "Two papers in <em>Physical Review Applied</em>. Matthew Maksymowych and Mert Yuksel found that the frequency noise of our phononic crystal resonators grows 100 times when cooling from 1 K to 0.01 K, caused by single two-level-system defects flipping between states. In the companion paper, Oliver Hitchcock showed that nearby mechanical modes see the same defects and fluctuate together.",
    links: [
      { label: "Spectral diffusion", url: "https://doi.org/10.1103/22rx-v855" },
      { label: "Correlated dephasing", url: "https://doi.org/10.1103/gv96-8xp1" },
    ],
  },
  {
    id: "nature-optical-amplifier",
    date: "2026-01-28",
    tag: "Paper",
    title: "Low-power integrated optical amplification through second-harmonic resonance",
    summary:
      "Devin Dean and Taewon Park built a chip-scale optical parametric amplifier with more than 17 dB of gain from under 200 mW of input power, an order of magnitude better than earlier demonstrations. The pump recirculates in a cavity while the signal passes through once, giving 110 nm of bandwidth with near-quantum-limited noise. Published in <em>Nature</em>.",
    links: [
      { label: "Nature", url: "https://www.nature.com/articles/s41586-025-09959-z" },
      { label: "Stanford Report", url: "https://news.stanford.edu/stories/2026/01/energy-efficient-optical-amplifier-biosensing-data-communication" },
      { label: "Press release", url: "https://www.eurekalert.org/news-releases/1114304" },
    ],
  },
  {
    id: "nat-comms-mmwave-transduction",
    date: "2026-01-06",
    tag: "Paper",
    title: "Integrated millimeter-wave cavity electro-optic transduction",
    summary:
      "Kevin Multani and Jason Herrmann built a triply resonant electro-optic transducer at 107 GHz, pairing a superconducting NbTiN millimeter-wave resonator with a thin-film lithium niobate optical racetrack on one chip. Joint work with Emilio Nanni (SLAC). Published in <em>Nature Communications</em>.",
    links: [
      { label: "Nature Communications", url: "https://www.nature.com/articles/s41467-025-67932-w" },
      { label: "arXiv", url: "https://arxiv.org/abs/2504.01920" },
    ],
  },
  {
    id: "science-strontium-titanate",
    date: "2025-10-23",
    tag: "Paper",
    title: "Quantum critical electro-optic and piezo-electric nonlinearities",
    summary:
      "Christopher Anderson and Giovanni Scuri in Jelena Vučković's group found that strontium titanate is a strong electro-optic and piezoelectric material at 5 K, where modulators are usually inefficient. Tuning it toward quantum criticality more than doubles both effects, reaching a Pockels coefficient above 1000 pm/V. A collaboration with the Vučković lab, published in <em>Science</em>.",
    links: [
      { label: "Science", url: "https://doi.org/10.1126/science.adx8657" },
      { label: "Stanford Report", url: "https://news.stanford.edu/stories/2025/10/crystal-strontium-titanate-cryogenic-photonics-quantum-computing" },
      { label: "arXiv", url: "https://arxiv.org/abs/2502.15164" },
    ],
  },
  {
    id: "nat-comms-2d-optomechanical-crystal",
    date: "2025-03-15",
    tag: "Paper",
    title: "High photon-phonon pair generation rate in a two-dimensional optomechanical crystal",
    summary:
      "Felix Mayor built a two-dimensional optomechanical crystal whose 7.4 GHz mechanical mode thermalizes eight times better than in one-dimensional designs. It stays in its ground state below 10 mK while generating photon-phonon pairs at about 147 kHz, a step toward microwave-to-optical transducers. Joint work with Thiago Alegre (UNICAMP). Published in <em>Nature Communications</em>.",
    links: [
      { label: "Nature Communications", url: "https://www.nature.com/articles/s41467-025-57948-7" },
    ],
  },
  {
    id: "pecase-2025",
    date: "2025-01-17",
    tag: "Award",
    title: "Amir Safavi-Naeini awarded PECASE",
    summary:
      "Amir received the Presidential Early Career Award for Scientists and Engineers (PECASE).",
    links: [
      { label: "Q-FARM", url: "https://qfarm.stanford.edu/news/vedika-khemani-amir-safavi-naeini-douglas-stanford-and-mary-wootters-named-2025-pecase" },
    ],
  },
  {
    id: "wombat-2024",
    date: "2024-07-30",
    tag: "Event",
    title: "LINQS at WOMBAT 2024",
    summary:
      "Felix Mayor, Sultan Malik, Samuel Gyger and Andre Primo went to the Workshop on OptoMechanics and Brillouin Scattering (WOMBAT) in Campinas, Brazil. Felix won the best poster award for \"Improving thermalization in piezo-optomechanical microwave-to-optical transducers\", and Sultan gave a talk on optically heralded microwave photon addition.",
    links: [
      { label: "WOMBAT 2024", url: "https://sites.google.com/unicamp.br/wombat2024" },
    ],
  },
  {
    id: "cleo-2023",
    date: "2023-05-15",
    tag: "Event",
    title: "LINQS at CLEO 2023",
    summary:
      "Eight of us presented at CLEO 2023, including Hubert Stokowski and Taewon Park on integrated squeezed light, Felix Mayor on a heralded single microwave photon source, and Luke Qi on a cryogenic visible-to-infrared quantum interface.",
    image: {
      src: "images/news/cleo-2023.jpg",
      alt: "Eight LINQS members standing together in the CLEO 2023 conference hall",
      caption:
        "From left: Alex Hwang, Jason Herrmann, Felix Mayor, Luke Qi, Taewon Park, Hubert Stokowski, Samuel Gyger, Kevin Multani.",
    },
  },
  {
    id: "moore-inventor-fellow-2022",
    date: "2022-10-06",
    tag: "Award",
    title: "Amir Safavi-Naeini named 2022 Moore Inventor Fellow",
    summary:
      "The fellowship supports an effort to invent a device that rapidly and accurately identifies proteins in cells.",
    links: [
      { label: "Stanford H&amp;S", url: "https://humsci.stanford.edu/feature/stanford-physicist-amir-safavi-naeini-named-2022-moore-inventor-fellow" },
    ],
  },
  {
    id: "physics-world-2022",
    date: "2022-05-20",
    tag: "Press",
    title: "Control of mechanical quantum resonators reaches new levels of precision",
    links: [
      { label: "Physics World", url: "https://physicsworld.com/a/control-of-mechanical-quantum-resonators-reaches-new-levels-of-precision/" },
    ],
  },
  {
    id: "stanford-news-mechanical-quantum-2022",
    date: "2022-04-21",
    tag: "Press",
    title: "New hardware created by Stanford team shows a way to develop delicate quantum technologies based on tiny mechanical devices",
    links: [
      { label: "Stanford News", url: "https://news.stanford.edu/2022/04/21/new-hardware-integrates-mechanical-devices-quantum-tech/" },
    ],
  },
  {
    id: "stanford-news-3d-cameras-2022",
    date: "2022-03-28",
    tag: "Press",
    title: "Stanford engineers enable simple cameras to see in 3D",
    links: [
      { label: "Stanford News", url: "https://news.stanford.edu/2022/03/28/smartphone-cameras-see-3d/" },
    ],
  },
  {
    id: "aip-scilight-2021",
    date: "2021-03-26",
    tag: "Press",
    title: "Lithium niobate phononic crystal resonators show promise for quantum acoustic applications",
    links: [
      { label: "AIP Scilight", url: "https://doi.org/10.1063/10.0003943" },
    ],
  },
  {
    id: "nsf-quantum-microphone-2020",
    date: "2020-08-06",
    tag: "Press",
    title: "Physicists count sound particles with quantum microphone",
    links: [
      { label: "NSF", url: "https://www.nsf.gov/discoveries/disc_summ.jsp?cntn_id=301010&org=NSF&from=news" },
    ],
  },
  {
    id: "sloan-fellow-2020",
    date: "2020-02-12",
    tag: "Award",
    title: "Amir Safavi-Naeini named a 2020 Sloan Research Fellow",
    links: [
      { label: "Stanford News", url: "https://news.stanford.edu/thedish/2020/02/12/ten-stanford-faculty-members-named-2020-sloan-research-fellows/" },
    ],
  },
  {
    id: "ntt-research-2019",
    date: "2019-11-13",
    tag: "Press",
    title: "NTT Research to work with Caltech, Cornell, Michigan, MIT, NASA, Stanford, Swinburne, and 1QBit",
    links: [
      { label: "Business Wire", url: "https://www.businesswire.com/news/home/20191113005215/en/NTT-Research-to-Work-with-Caltech-Cornell-Michigan-MIT-NASA-Stanford-Swinburne-and-1QBit" },
    ],
  },
  {
    id: "quantum-microphone-2019",
    date: "2019-07-24",
    tag: "Press",
    title: "Stanford physicists count sound particles with quantum microphone",
    links: [
      { label: "Stanford News", url: "https://news.stanford.edu/2019/07/24/quantum-microphone-counts-particles-sound/" },
    ],
  },
];
