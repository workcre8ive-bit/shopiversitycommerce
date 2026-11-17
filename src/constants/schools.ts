export const SCHOOL_TYPES = [
  "University",
  "Polytechnic",
  "College of Education",
  "Nursing School",
  "Health Technology",
  "Monotechnic"
];

export interface NigerianSchoolOption {
  name: string;
  type: string;
  ownership: string;
  state: string;
  lga: string;
}

export const NIGERIAN_SCHOOLS: NigerianSchoolOption[] = [
  // Abia
  { name: "Michael Okpara University of Agriculture, Umudike (MOUAU)", type: "University", ownership: "Federal", state: "Abia", lga: "Ikwuano" },
  { name: "Abia State University (ABSU), Uturu", type: "University", ownership: "State", state: "Abia", lga: "Isuikwuato" },
  { name: "Abia State Polytechnic, Aba", type: "Polytechnic", ownership: "State", state: "Abia", lga: "Aba North" },

  // Adamawa
  { name: "Modibbo Adama University (MAU), Yola", type: "University", ownership: "Federal", state: "Adamawa", lga: "Grie" },
  { name: "American University of Nigeria (AUN)", type: "University", ownership: "Private", state: "Adamawa", lga: "Yola South" },
  { name: "Adamawa State University (ADSU), Mubi", type: "University", ownership: "State", state: "Adamawa", lga: "Mubi North" },
  { name: "Federal Polytechnic, Mubi", type: "Polytechnic", ownership: "Federal", state: "Adamawa", lga: "Mubi North" },

  // Akwa Ibom
  { name: "University of Uyo (UNIUYO)", type: "University", ownership: "Federal", state: "Akwa Ibom", lga: "Uyo" },
  { name: "Akwa Ibom State University (AKSU)", type: "University", ownership: "State", state: "Akwa Ibom", lga: "Mkpat-Enin" },
  { name: "Akwa Ibom State Polytechnic, Ikot Osurua", type: "Polytechnic", ownership: "State", state: "Akwa Ibom", lga: "Ikot Ekpene" },

  // Anambra
  { name: "Nnamdi Azikiwe University (UNIZIK)", type: "University", ownership: "Federal", state: "Anambra", lga: "Awka South" },
  { name: "Chukwuemeka Odumegwu Ojukwu University (COOU)", type: "University", ownership: "State", state: "Anambra", lga: "Anambra East" },
  { name: "Federal Polytechnic, Oko", type: "Polytechnic", ownership: "Federal", state: "Anambra", lga: "Orumba North" },

  // Bauchi
  { name: "Abubakar Tafawa Balewa University (ATBU)", type: "University", ownership: "Federal", state: "Bauchi", lga: "Bauchi" },
  { name: "Bauchi State University, Gadau", type: "University", ownership: "State", state: "Bauchi", lga: "Itas/Gadau" },
  { name: "Federal Polytechnic, Bauchi", type: "Polytechnic", ownership: "Federal", state: "Bauchi", lga: "Bauchi" },

  // Bayelsa
  { name: "Niger Delta University (NDU), Wilberforce Island", type: "University", ownership: "State", state: "Bayelsa", lga: "Southern Ijaw" },
  { name: "Federal University Otuoke (FUOTUOKE)", type: "University", ownership: "Federal", state: "Bayelsa", lga: "Ogbia" },
  { name: "Bayelsa Medical University, Yenagoa", type: "University", ownership: "State", state: "Bayelsa", lga: "Yenagoa" },

  // Benue
  { name: "Joseph Sarwuan Tarka University, Makurdi (JOSTUM)", type: "University", ownership: "Federal", state: "Benue", lga: "Makurdi" },
  { name: "Benue State University (BSU), Makurdi", type: "University", ownership: "State", state: "Benue", lga: "Makurdi" },
  { name: "Benue State Polytechnic, Ugbokolo", type: "Polytechnic", ownership: "State", state: "Benue", lga: "Okpokwu" },

  // Borno
  { name: "University of Maiduguri (UNIMAID)", type: "University", ownership: "Federal", state: "Borno", lga: "Maiduguri" },
  { name: "Borno State University (BOSU)", type: "University", ownership: "State", state: "Borno", lga: "Jere" },
  { name: "Ramat Polytechnic, Maiduguri", type: "Polytechnic", ownership: "State", state: "Borno", lga: "Maiduguri" },

  // Cross River
  { name: "University of Calabar (UNICAL)", type: "University", ownership: "Federal", state: "Cross River", lga: "Calabar Municipal" },
  { name: "University of Cross River State (UNICROSS)", type: "University", ownership: "State", state: "Cross River", lga: "Calabar South" },
  { name: "Federal College of Education, Obudu", type: "College of Education", ownership: "Federal", state: "Cross River", lga: "Obudu" },

  // Delta
  { name: "Delta State University (DELSU)", type: "University", ownership: "State", state: "Delta", lga: "Ethiope East" },
  { name: "Federal University of Petroleum Resources (FUPRE)", type: "University", ownership: "Federal", state: "Delta", lga: "Uvwie" },
  { name: "Delta State Polytechnic, Ozoro", type: "Polytechnic", ownership: "State", state: "Delta", lga: "Isoko North" },
  { name: "Delta State Polytechnic, Ogwashi-Uku", type: "Polytechnic", ownership: "State", state: "Delta", lga: "Aniocha South" },

  // Ebonyi
  { name: "Ebonyi State University (EBSU)", type: "University", ownership: "State", state: "Ebonyi", lga: "Abakaliki" },
  { name: "Alex Ekwueme Federal University Ndufu-Alike (AE-FUNAI)", type: "University", ownership: "Federal", state: "Ebonyi", lga: "Ikwo" },
  { name: "Akanu Ibiam Federal Polytechnic, Unwana", type: "Polytechnic", ownership: "Federal", state: "Ebonyi", lga: "Afikpo North" },

  // Edo
  { name: "University of Benin (UNIBEN)", type: "University", ownership: "Federal", state: "Edo", lga: "Ovia North-East" },
  { name: "Ambrose Alli University (AAU)", type: "University", ownership: "State", state: "Edo", lga: "Esan West" },
  { name: "Auchi Polytechnic", type: "Polytechnic", ownership: "Federal", state: "Edo", lga: "Etsako West" },
  { name: "Benson Idahosa University (BIU)", type: "University", ownership: "Private", state: "Edo", lga: "Oredo" },

  // Ekiti
  { name: "Ekiti State University (EKSU)", type: "University", ownership: "State", state: "Ekiti", lga: "Ado Ekiti" },
  { name: "Afe Babalola University (ABUAD)", type: "University", ownership: "Private", state: "Ekiti", lga: "Ado Ekiti" },
  { name: "Federal University Oye-Ekiti (FUOYE)", type: "University", ownership: "Federal", state: "Ekiti", lga: "Oye" },
  { name: "Federal Polytechnic, Ado-Ekiti", type: "Polytechnic", ownership: "Federal", state: "Ekiti", lga: "Ado Ekiti" },

  // Enugu
  { name: "University of Nigeria, Nsukka (UNN)", type: "University", ownership: "Federal", state: "Enugu", lga: "Nsukka" },
  { name: "Enugu State University of Science and Technology (ESUT)", type: "University", ownership: "State", state: "Enugu", lga: "Nkanu West" },
  { name: "Institute of Management and Technology (IMT), Enugu", type: "Polytechnic", ownership: "State", state: "Enugu", lga: "Enugu North" },

  // FCT - Abuja
  { name: "University of Abuja (UNIABUJA)", type: "University", ownership: "Federal", state: "FCT - Abuja", lga: "Gwagwalada" },
  { name: "Nile University of Nigeria", type: "University", ownership: "Private", state: "FCT - Abuja", lga: "Municipal Area Council (AMAC)" },
  { name: "Baze University, Abuja", type: "University", ownership: "Private", state: "FCT - Abuja", lga: "Municipal Area Council (AMAC)" },
  { name: "Veritas University, Abuja", type: "University", ownership: "Private", state: "FCT - Abuja", lga: "Bwari" },

  // Gombe
  { name: "Gombe State University (GSU)", type: "University", ownership: "State", state: "Gombe", lga: "Gombe" },
  { name: "Federal University of Kashere (FUKASHERE)", type: "University", ownership: "Federal", state: "Gombe", lga: "Akko" },

  // Imo
  { name: "Federal University of Technology, Owerri (FUTO)", type: "University", ownership: "Federal", state: "Imo", lga: "Owerri West" },
  { name: "Imo State University (IMSU)", type: "University", ownership: "State", state: "Imo", lga: "Owerri Municipal" },
  { name: "Federal Polytechnic, Nekede", type: "Polytechnic", ownership: "Federal", state: "Imo", lga: "Owerri West" },
  { name: "Alvan Ikoku Federal College of Education", type: "College of Education", ownership: "Federal", state: "Imo", lga: "Owerri Municipal" },

  // Jigawa
  { name: "Federal University Dutse (FUD)", type: "University", ownership: "Federal", state: "Jigawa", lga: "Dutse" },
  { name: "Sule Lamido University (SLU), Kafin Hausa", type: "University", ownership: "State", state: "Jigawa", lga: "Kafin Hausa" },
  { name: "Hussaini Adamu Federal Polytechnic, Kazaure", type: "Polytechnic", ownership: "Federal", state: "Jigawa", lga: "Kazaure" },

  // Kaduna
  { name: "Ahmadu Bello University (ABU)", type: "University", ownership: "Federal", state: "Kaduna", lga: "Sabon Gari" },
  { name: "Kaduna State University (KASU)", type: "University", ownership: "State", state: "Kaduna", lga: "Kaduna North" },
  { name: "Kaduna Polytechnic", type: "Polytechnic", ownership: "Federal", state: "Kaduna", lga: "Kaduna South" },

  // Kano
  { name: "Bayero University Kano (BUK)", type: "University", ownership: "Federal", state: "Kano", lga: "Ungogo" },
  { name: "Aliko Dangote University of Science and Technology, Wudil", type: "University", ownership: "State", state: "Kano", lga: "Wudil" },
  { name: "Kano State Polytechnic", type: "Polytechnic", ownership: "State", state: "Kano", lga: "Kano Municipal" },

  // Katsina
  { name: "Umaru Musa Yar'adua University (UMYU)", type: "University", ownership: "State", state: "Katsina", lga: "Batagarawa" },
  { name: "Federal University Dutsin-Ma (FUDMA)", type: "University", ownership: "Federal", state: "Katsina", lga: "Dutsin Ma" },
  { name: "Hassan Usman Katsina Polytechnic", type: "Polytechnic", ownership: "State", state: "Katsina", lga: "Katsina" },

  // Kebbi
  { name: "Kebbi State University of Science and Technology (KSUSTA)", type: "University", ownership: "State", state: "Kebbi", lga: "Aleiro" },
  { name: "Federal University Birnin Kebbi (FUBK)", type: "University", ownership: "Federal", state: "Kebbi", lga: "Kalgo" },
  { name: "Waziri Umaru Federal Polytechnic, Birnin Kebbi", type: "Polytechnic", ownership: "Federal", state: "Kebbi", lga: "Birnin Kebbi" },

  // Kogi
  { name: "Federal University Lokoja (FULOKOJA)", type: "University", ownership: "Federal", state: "Kogi", lga: "Lokoja" },
  { name: "Prince Abubakar Audu University (PAAU), Anyigba", type: "University", ownership: "State", state: "Kogi", lga: "Dekina" },
  { name: "Kogi State Polytechnic, Lokoja", type: "Polytechnic", ownership: "State", state: "Kogi", lga: "Lokoja" },

  // Kwara
  { name: "University of Ilorin (UNILORIN)", type: "University", ownership: "Federal", state: "Kwara", lga: "Ilorin South" },
  { name: "Kwara State University (KWASU)", type: "University", ownership: "State", state: "Kwara", lga: "Moro" },
  { name: "Landmark University", type: "University", ownership: "Private", state: "Kwara", lga: "Irepodun" },
  { name: "Federal Polytechnic, Offa", type: "Polytechnic", ownership: "Federal", state: "Kwara", lga: "Offa" },

  // Lagos
  { name: "University of Lagos (UNILAG)", type: "University", ownership: "Federal", state: "Lagos", lga: "Lagos Mainland" },
  { name: "Lagos State University (LASU)", type: "University", ownership: "State", state: "Lagos", lga: "Ojo" },
  { name: "Pan-Atlantic University", type: "University", ownership: "Private", state: "Lagos", lga: "Ibeju-Lekki" },
  { name: "Yaba College of Technology (YABATECH)", type: "Polytechnic", ownership: "Federal", state: "Lagos", lga: "Lagos Mainland" },
  { name: "Lagos State Polytechnic (LASPOTECH)", type: "Polytechnic", ownership: "State", state: "Lagos", lga: "Ikorodu" },
  { name: "Federal College of Education (Technical), Akoka", type: "College of Education", ownership: "Federal", state: "Lagos", lga: "Shomolu" },
  { name: "Adeniran Ogunsanya College of Education (AOCOED)", type: "College of Education", ownership: "State", state: "Lagos", lga: "Ojo" },
  { name: "Lagos State College of Nursing (LASCON)", type: "Nursing School", ownership: "State", state: "Lagos", lga: "Alimosho" },
  { name: "School of Nursing, LUTH", type: "Nursing School", ownership: "Federal", state: "Lagos", lga: "Mushin" },

  // Nasarawa
  { name: "Nasarawa State University, Keffi (NSUK)", type: "University", ownership: "State", state: "Nasarawa", lga: "Keffi" },
  { name: "Federal University of Lafia (FULAFIA)", type: "University", ownership: "Federal", state: "Nasarawa", lga: "Lafia" },
  { name: "Isa Mustapha Agwai I Polytechnic, Lafia", type: "Polytechnic", ownership: "State", state: "Nasarawa", lga: "Lafia" },

  // Niger
  { name: "Federal University of Technology, Minna (FUTMINNA)", type: "University", ownership: "Federal", state: "Niger", lga: "Bosso" },
  { name: "Ibrahim Badamasi Babangida University (IBBU), Lapai", type: "University", ownership: "State", state: "Niger", lga: "Lapai" },
  { name: "Federal Polytechnic, Bida", type: "Polytechnic", ownership: "Federal", state: "Niger", lga: "Bida" },

  // Ogun
  { name: "Federal University of Agriculture, Abeokuta (FUNAAB)", type: "University", ownership: "Federal", state: "Ogun", lga: "Odeda" },
  { name: "Olabisi Onabanjo University (OOU)", type: "University", ownership: "State", state: "Ogun", lga: "Ijebu North" },
  { name: "Covenant University", type: "University", ownership: "Private", state: "Ogun", lga: "Ado-Odo/Ota" },
  { name: "Babcock University", type: "University", ownership: "Private", state: "Ogun", lga: "Ikenne" },
  { name: "Bells University of Technology", type: "University", ownership: "Private", state: "Ogun", lga: "Ado-Odo/Ota" },
  { name: "Federal Polytechnic, Ilaro", type: "Polytechnic", ownership: "Federal", state: "Ogun", lga: "Egbado South" },
  { name: "Moshood Abiola Polytechnic (MAPOLY)", type: "Polytechnic", ownership: "State", state: "Ogun", lga: "Obafemi Owode" },

  // Ondo
  { name: "Federal University of Technology, Akure (FUTA)", type: "University", ownership: "Federal", state: "Ondo", lga: "Akure South" },
  { name: "Adekunle Ajasin University (AAUA)", type: "University", ownership: "State", state: "Ondo", lga: "Akoko South-West" },
  { name: "Adeyemi College of Education", type: "College of Education", ownership: "Federal", state: "Ondo", lga: "Ondo West" },
  { name: "Rufus Giwa Polytechnic, Owo", type: "Polytechnic", ownership: "State", state: "Ondo", lga: "Owo" },

  // Osun
  { name: "Obafemi Awolowo University (OAU)", type: "University", ownership: "Federal", state: "Osun", lga: "Ife Central" },
  { name: "Osun State University (UNIOSUN)", type: "University", ownership: "State", state: "Osun", lga: "Osogbo" },
  { name: "Bowen University", type: "University", ownership: "Private", state: "Osun", lga: "Iwo" },
  { name: "Redeemer's University", type: "University", ownership: "Private", state: "Osun", lga: "Ede South" },

  // Oyo
  { name: "University of Ibadan (UI)", type: "University", ownership: "Federal", state: "Oyo", lga: "Ibadan North" },
  { name: "Ladoke Akintola University of Technology (LAUTECH)", type: "University", ownership: "State", state: "Oyo", lga: "Ogbomosho North" },
  { name: "Lead City University", type: "University", ownership: "Private", state: "Oyo", lga: "Oluyole" },
  { name: "The Polytechnic, Ibadan", type: "Polytechnic", ownership: "State", state: "Oyo", lga: "Ibadan North" },
  { name: "School of Nursing, University College Hospital (UCH)", type: "Nursing School", ownership: "Federal", state: "Oyo", lga: "Ibadan North" },

  // Plateau
  { name: "University of Jos (UNIJOS)", type: "University", ownership: "Federal", state: "Plateau", lga: "Jos North" },
  { name: "Plateau State University (PLASU), Bokkos", type: "University", ownership: "State", state: "Plateau", lga: "Bokkos" },
  { name: "Plateau State Polytechnic, Barkin Ladi", type: "Polytechnic", ownership: "State", state: "Plateau", lga: "Barkin Ladi" },

  // Rivers
  { name: "University of Port Harcourt (UNIPORT)", type: "University", ownership: "Federal", state: "Rivers", lga: "Obio/Akpor" },
  { name: "Rivers State University (RSU)", type: "University", ownership: "State", state: "Rivers", lga: "Port Harcourt" },
  { name: "Ignatius Ajuru University of Education (IAUE)", type: "University", ownership: "State", state: "Rivers", lga: "Obio/Akpor" },

  // Sokoto
  { name: "Usmanu Danfodiyo University, Sokoto (UDUSOK)", type: "University", ownership: "Federal", state: "Sokoto", lga: "Wamako" },
  { name: "Sokoto State University (SSU)", type: "University", ownership: "State", state: "Sokoto", lga: "Sokoto South" },
  { name: "Umaru Ali Shinkafi Polytechnic, Sokoto", type: "Polytechnic", ownership: "State", state: "Sokoto", lga: "Sokoto North" },

  // Taraba
  { name: "Federal University Wukari (FUWUKARI)", type: "University", ownership: "Federal", state: "Taraba", lga: "Wukari" },
  { name: "Taraba State University (TSU), Jalingo", type: "University", ownership: "State", state: "Taraba", lga: "Jalingo" },

  // Yobe
  { name: "Federal University Gashua (FUGASHUA)", type: "University", ownership: "Federal", state: "Yobe", lga: "Bade" },
  { name: "Yobe State University (YSU), Damaturu", type: "University", ownership: "State", state: "Yobe", lga: "Damaturu" },
  { name: "Federal Polytechnic, Damaturu", type: "Polytechnic", ownership: "Federal", state: "Yobe", lga: "Damaturu" },

  // Zamfara
  { name: "Federal University Gusau (FUGUS)", type: "University", ownership: "Federal", state: "Zamfara", lga: "Gusau" },
  { name: "Federal Polytechnic, Kaura Namoda", type: "Polytechnic", ownership: "Federal", state: "Zamfara", lga: "Kaura Namoda" }
];

function normalizeStateKey(stateName?: string | null): string {
  const clean = String(stateName || "").trim().toLowerCase();
  if (clean === "fct" || clean === "abuja" || clean === "fct - abuja" || clean === "fct abuja") {
    return "fct - abuja";
  }
  return clean;
}

export function getSchoolsByState(stateName?: string | null): NigerianSchoolOption[] {
  const target = normalizeStateKey(stateName);
  if (!target) return [];
  return NIGERIAN_SCHOOLS.filter((s) => normalizeStateKey(s.state) === target);
}

export function findSchoolByName(schoolName?: string | null): NigerianSchoolOption | undefined {
  const clean = String(schoolName || "").trim().toLowerCase();
  if (!clean) return undefined;
  return NIGERIAN_SCHOOLS.find((s) => s.name.toLowerCase() === clean);
}

