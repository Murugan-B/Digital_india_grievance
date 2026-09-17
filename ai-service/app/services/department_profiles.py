"""
Comprehensive Semantic Knowledge Profiles for Government Departments
Enables rich semantic similarity and contextual routing for citizen grievances.
Includes English, Tamil, Hindi, and transliterated vernacular vocabulary.
"""

from typing import Dict, List, Any

DEPARTMENT_PROFILES: Dict[str, Dict[str, Any]] = {
    "Water Supply": {
        "name": "Water Supply",
        "code": "WATER",
        "purpose": "Public drinking water supply, pipeline infrastructure, municipal water connections, borewells, tanker delivery, and contaminated water resolution.",
        "topics": [
            "drinking water shortage", "pipeline leakage", "broken water pipe", "contaminated muddy water",
            "low water pressure", "water tanker delay", "borewell motor repair", "illegal water tapping",
            "overhead tank overflow", "water meter fault", "irregular water supply schedule"
        ],
        "keywords": [
            "water", "drinking water", "pipeline", "pipe", "tap", "leakage", "water supply",
            "tanker", "borewell", "motor", "chlorination", "muddy water", "foul smell water",
            "drainage mixed water", "water pump", "overhead tank", "sintex", "water connection",
            # Hindi / Transliterated
            "paani", "pani", "peene ka pani", "nal", "pipe line", "pani supply", "pani nahi aa raha",
            # Tamil / Transliterated
            "thanni", "kudithaneer", "kudi thanneer", "thanni varala", "pipe odanjiruchu", "kuzhai",
            "bore motor", "thanni prechanai", "thanni leak aaguthu", "lorry thanni"
        ],
        "representative_complaints": [
            "Drinking water has not been supplied to our street for the past 4 days.",
            "Water pipeline is broken and clean drinking water is getting wasted on the main road.",
            "The tap water supplied today is muddy, discolored, and has a foul odor.",
            "Water pressure is extremely low, unable to pump water to the overhead tank.",
            "Borewell motor in our locality is burnt and needs urgent government repair.",
            "Water tanker did not arrive according to the scheduled distribution time.",
            "Sewage water is mixing into the municipal drinking water pipeline.",
            "Enga area la 3 naala kudithaneer varala, please fix panunga.",
            "Pani ki supply subah se band hai, peene ka pani nahi mil raha hai."
        ]
    },
    "Electricity": {
        "name": "Electricity",
        "code": "ELEC",
        "purpose": "Electrical power grid maintenance, power cuts, voltage fluctuations, electrical transformers, street lighting, faulty meters, and hazardous fallen electric wires.",
        "topics": [
            "power cut", "frequent load shedding", "voltage fluctuation", "transformer burst",
            "street light not working", "hanging high voltage live wire", "meter reading error",
            "sparking electric pole", "electricity bill excessive billing", "new power connection delay"
        ],
        "keywords": [
            "electricity", "power", "power cut", "power outage", "blackout", "load shedding",
            "transformer", "voltage", "low voltage", "high voltage", "street light", "electric pole",
            "live wire", "hanging wire", "electric shock", "meter", "fuse", "substation", "eb bill",
            "tneb", "bescom", "power grid", "electricity board",
            # Hindi / Transliterated
            "bijli", "current", "light", "bijli gul", "batti gul", "bijli nahi hai", "bijli ka bill",
            "khamba", "taar", "transformer kharab",
            # Tamil / Transliterated
            "current illa", "current poiruchu", "vilakku eriyala", "theru vilakku", "min saram",
            "minsaram", "kambam", "min kambam", "voltage kammi", "current cut"
        ],
        "representative_complaints": [
            "Frequent power cuts in our residential area every evening for several hours.",
            "Street light in our street has not been functioning for over two weeks, causing safety issues.",
            "Transformer exploded with sparks and the whole colony is without power.",
            "Dangerous live electrical wire hanging very low near the pedestrian footpath.",
            "Severe voltage fluctuation is damaging household appliances and air conditioners.",
            "Received an abnormally high electricity bill despite normal household consumption.",
            "Electric pole is tilted and could collapse during heavy wind.",
            "Enga theru la street light work aagala, rathiri romba irutta irukku.",
            "Hamare area me sham se bijli nahi hai, transformer se spark aa raha hai."
        ]
    },
    "Roads & Transport": {
        "name": "Roads & Transport",
        "code": "ROAD",
        "purpose": "Public bus transit services, bus routes and schedules, bus stops, road infrastructure, pothole repairs, road paving, traffic signals, speed breakers, and pedestrian footpaths.",
        "topics": [
            "irregular bus service", "missing bus route", "bus frequency low", "bus skip bus stop",
            "potholes on road", "damaged road", "crater on road", "tar road construction",
            "traffic signal not working", "speed breaker required", "broken pavement footpath"
        ],
        "keywords": [
            "bus", "buses", "public transport", "government bus", "city bus", "town bus", "rtc",
            "bus route", "bus frequency", "bus timing", "bus stop", "bus stand", "depot",
            "bus pass", "overcrowded bus", "bus not stopping", "bus cancellation", "transport connectivity",
            "road", "roads", "pothole", "potholes", "tar road", "asphalt", "flyover", "speed breaker",
            "traffic light", "traffic signal", "footpath", "pedestrian crossing", "divider", "highway",
            # Hindi / Transliterated
            "sadak", "gaddha", "sadak kharab", "bus nahi aati", "bus service", "yatayat", "gaadi",
            # Tamil / Transliterated
            "perunthu", "bus varala", "bus regular ah varala", "salai", "salai mosam", "pallam",
            "road la pallam", "theru road", "bus stop la nikkala", "bus frequency kammi"
        ],
        "representative_complaints": [
            "Bus are not regular to our area, public transport frequency is extremely poor.",
            "Government bus route 23M is skipped frequently during peak morning office hours.",
            "The main arterial road is full of dangerous potholes causing two-wheeler accidents.",
            "Bus drivers do not halt at the designated bus stop for school students and senior citizens.",
            "Need a speed breaker near the residential crossroad due to reckless vehicle speeding.",
            "Road laying work was left incomplete 3 months ago and gravel is scattered everywhere.",
            "Traffic signal at the four-road junction is blinking yellow and creating heavy congestion.",
            "Buses are not arriving regularly in our locality, commuters are suffering daily.",
            "Enga area ku bus regular ah varala, college students romba kashtapadraanga.",
            "Sadak par bahut bade gaddhe hain aur bus time par nahi aati."
        ]
    },
    "Sanitation": {
        "name": "Sanitation",
        "code": "SAN",
        "purpose": "Solid waste management, garbage collection, open dumping clearance, drainage overflow, sewage clearing, septic tank overflows, public toilet maintenance, and vector control.",
        "topics": [
            "uncollected garbage", "overflowing dustbin", "open dump yard smell", "clogged drainage",
            "sewage water on street", "mosquito breeding stagnant drain", "public toilet unhygienic",
            "dead animal removal", "sanitation worker absence", "drain desilting"
        ],
        "keywords": [
            "garbage", "waste", "trash", "rubbish", "dustbin", "dump yard", "litter", "cleaning",
            "drainage", "drain", "sewage", "septic tank", "manhole", "gutter", "overflow",
            "mosquitoes", "stagnant water", "foul smell", "public toilet", "urinal", "sweeping",
            "sanitation worker", "dead dog", "animal carcass", "waste segregation",
            # Hindi / Transliterated
            "kachra", "kuda", "kudedan", "safai", "nala", "nali", "ganda pani", "badbu", "badboo",
            "kachra uthane wala", "safai karmachari",
            # Tamil / Transliterated
            "kuppai", "kuppa", "saakadai", "vadinilam", "saakada thanni", "thuppuravu", "naatram",
            "theru kuppai", "kosu thollai", "thoorvaaruthal", "kuppai thotti"
        ],
        "representative_complaints": [
            "Garbage has not been collected from our doorsteps for over five consecutive days.",
            "Community dustbin is overflowing and stray animals are scattering waste onto the street.",
            "Open drainage line is blocked and black sewage water is overflowing in front of houses.",
            "Stagnant drain water has become a major breeding ground for mosquitoes causing dengue risk.",
            "Public toilet near the market is in an extremely filthy condition without running water.",
            "A dead stray animal is lying on the roadside causing an unbearable stench.",
            "Theru la saakadai அடைத்து thanni velila varuthu, kuppai lorry varala.",
            "Gali me char din se kachra pada hai, nali ka ganda pani sadak par beh raha hai."
        ]
    },
    "Municipal Services": {
        "name": "Municipal Services",
        "code": "MUNI",
        "purpose": "Urban local body governance, trade licenses, building plan sanctions, property tax assessments, birth and death certificate issuance, civic park maintenance, and street encroachments.",
        "topics": [
            "property tax assessment", "birth certificate delay", "death certificate correction",
            "trade license renewal", "building plan unauthorized construction", "illegal encroachment on pavement",
            "public park maintenance", "stray cattle menace", "hoardings unauthorized banners"
        ],
        "keywords": [
            "municipality", "municipal corporation", "civic body", "panchayat", "ward office",
            "property tax", "house tax", "assessment", "birth certificate", "death certificate",
            "trade license", "building permit", "plan approval", "unauthorized construction",
            "encroachment", "shop encroachment", "pavement vendor", "public park", "children park",
            "street vendor", "stray cattle", "stray cows", "illegal banners", "hoardings",
            # Hindi / Transliterated
            "nagar nigam", "nagar palika", "janm praman patra", "mrityu praman patra", "makan tax",
            "kabza", "awara pashu", "park ki dekhbhal",
            # Tamil / Transliterated
            "nagaratchi", "managaratchi", "pirappu saandrithazh", "irappu saandrithazh", "veettu vari",
            "sohthu vari", "aakkiramippu", "theru aakkiramippu", "park sariyilla", "maadu thollai"
        ],
        "representative_complaints": [
            "Applied for birth certificate 30 days ago at the municipal ward office, still not issued.",
            "Shopkeeper has illegally encroached the pedestrian sidewalk by putting permanent iron tin sheets.",
            "Property tax assessment calculation shows duplicate tax demand for the financial year.",
            "Public children park equipment and swings are broken and overgrown with weeds.",
            "Stray cattle wandering on the main commercial street causing traffic snarls and danger.",
            "Unauthorized multi-story building construction ongoing without municipal corporation setback approval.",
            "Nagaratchi office la pirappu saandrithazh apply panni innum kidaikkala.",
            "Nagar nigam me birth certificate ki application pending hai, trade license renew nahi hua."
        ]
    },
    "Public Health": {
        "name": "Public Health",
        "code": "HLTH",
        "purpose": "Government public hospitals, Primary Health Centres (PHC), free generic medicine availability, government doctors and nurses attendance, ambulance services, epidemic control, and food safety inspection.",
        "topics": [
            "government hospital service", "PHC doctor absence", "shortage of essential medicines",
            "vaccination drive", "epidemic outbreak dengue malaria", "ambulance 108 delay",
            "food adulteration in hotel", "unhygienic hospital ward", "dog bite anti-rabies injection"
        ],
        "keywords": [
            "health", "public health", "hospital", "government hospital", "gh", "primary health centre",
            "phc", "doctor", "nurse", "medical officer", "dispensary", "clinic", "medicine",
            "tablets", "insulin", "anti-rabies", "vaccine", "immunization", "ambulance", "108",
            "dengue", "malaria", "fever", "epidemic", "food safety", "hotel hygiene", "adulteration",
            # Hindi / Transliterated
            "swasthya", "aspatal", "sarkari aspatal", "dawai", "dawa", "chikitsalay", "chikitsa",
            "dawa nahi mil rahi", "doctor nahi hai", "swasthya kendra",
            # Tamil / Transliterated
            "maruthuvamanai", "maruthuvar", "arasu maruthuvamanai", "mathirai", "marunthu",
            "marunthu illa", "sub-centre", "kattayam marunthu", "aarambha sugathara nilaiyam", "sugatharam"
        ],
        "representative_complaints": [
            "Government Primary Health Centre doctor is not attending morning duty, leaving poor patients waiting.",
            "Essential diabetes and blood pressure medicines are out of stock at the government taluk hospital.",
            "Severe dengue fever outbreak in our ward with multiple cases, urgent fogging and medical camp needed.",
            "Government hospital maternity ward is unhygienic and lacking clean bedsheets and sanitizer.",
            "No anti-rabies injection vaccine available at the community health centre after stray dog bite.",
            "Local sweet shop and restaurant selling unhygienic and stale contaminated food items.",
            "Aarambha sugathara nilaiyathil doctor illai, marunthu mathiraigal kidaikkavillai.",
            "Sarkari aspatal me emergency doctor available nahi tha aur dawaiyan khatam hain."
        ]
    },
    "Revenue": {
        "name": "Revenue",
        "code": "REV",
        "purpose": "Land records, Patta and Chitta transfers, land sub-division surveys, caste and income certificates, encumbrance certificates, legal heir documents, and revenue taluk office administration.",
        "topics": [
            "patta name transfer", "chitta adangal copy", "land boundary survey delay",
            "taluk revenue inspector delay", "income certificate pending", "community caste certificate",
            "legal heir certificate", "land record discrepancy", "encumbrance certificate correction"
        ],
        "keywords": [
            "revenue", "land record", "patta", "chitta", "adangal", "survey", "surveyor",
            "land survey", "boundary dispute", "taluk", "tahsildar", "vro", "vaao", "village administrative officer",
            "caste certificate", "income certificate", "legal heir certificate", "nativity certificate",
            "land registry", "mutation", "khasra", "khata", "khata transfer", "sub-registrar",
            # Hindi / Transliterated
            "rajasva", "jameen", "zameen", "patwari", "khasra khatauni", "dakhil kharij",
            "jativ praman patra", "aay praman patra", "tehsildar", "tehsil",
            # Tamil / Transliterated
            "patta marudhal", "patta peyar maatram", "varuvaai", "varuvaai thurai", "nilam",
            "alavu seiyya", "jaathi saandrithazh", "varumaana saandrithazh", "vaarisurimai saandrithazh",
            "v.a.o", "tahsildar office"
        ],
        "representative_complaints": [
            "Applied for online Patta name transfer 45 days ago, Village Administrative Officer has not processed the file.",
            "Government land surveyor has not turned up for scheduled land sub-division demarcation.",
            "Need urgent issuance of community caste certificate for college admission counseling.",
            "Discrepancy in online Chitta land records where owner name is misspelled compared to original title deed.",
            "Legal heir certificate application pending for approval at the Tahsildar office without reason.",
            "Patta transfer application la VAO sign panna delay pannuraaru, 2 maasam aachu.",
            "Tehsil office me zameen ka dakhil kharij aur khasra nakal 2 mahine se pending hai."
        ]
    },
    "Education": {
        "name": "Education",
        "code": "EDU",
        "purpose": "Government schools, government colleges, teachers and staff appointments, student mid-day meal scheme, classroom infrastructure, desks, school toilets, uniforms, and textbooks distribution.",
        "topics": [
            "government school teacher shortage", "damaged classroom ceiling", "lack of school student toilets",
            "mid day meal quality issue", "textbooks and uniform delay", "drinking water in school",
            "excess private school fee collection", "RTE 25 percent admission refusal", "school playground maintenance"
        ],
        "keywords": [
            "education", "school", "government school", "higher secondary school", "primary school",
            "college", "teacher", "headmaster", "principal", "student", "classroom", "blackboard",
            "desk", "bench", "mid day meal", "lunch scheme", "textbook", "notebook", "uniform",
            "school toilet", "girl student toilet", "rte", "school fees", "scholarship", "exam",
            # Hindi / Transliterated
            "shiksha", "vidyalay", "sarkari school", "adhikari", "shikshak", "master ji", "bache",
            "chhatra", "mid day meal", "kitab", "school ki building",
            # Tamil / Transliterated
            "kalvi", "palli", "arasu palli", "aasiriyar", "manavargal", "sathunavu", "mathiya unavu",
            "palli kattidam", "puthagam", "school la toilet illa", "aasiriyar pathavi"
        ],
        "representative_complaints": [
            "Government high school does not have adequate science and mathematics teachers for Class 10.",
            "School building roof is leaking in rain and desks are broken, posing safety hazards to children.",
            "No separate functional sanitation toilets for girl students in the government primary school.",
            "Mid-day meal served in the village school was stale and unhygienic.",
            "Free government textbooks and uniforms have not been distributed even after 2 months of academic reopening.",
            "Private matriculation school demanding exorbitant unapproved fee in violation of government norms.",
            "Arasu palliyil ariviyal aasiriyar illai, sathunavu unavu tharamaga illai.",
            "Sarkari vidyalay me bacho ke liye peene ka pani aur toilet ki suvidha nahi hai."
        ]
    }
}


def build_department_semantic_document(profile: Dict[str, Any]) -> str:
    """
    Compiles a comprehensive, multi-faceted semantic document representation of a department.
    Captures mandate, core topics, representative keywords, and natural complaints.
    """
    name = profile.get("name", "")
    purpose = profile.get("purpose", "")
    topics_text = ", ".join(profile.get("topics", []))
    keywords_text = ", ".join(profile.get("keywords", []))
    complaints_text = " ".join(profile.get("representative_complaints", []))

    return (
        f"Department: {name}.\n"
        f"Responsibilities & Purpose: {purpose}.\n"
        f"Common citizen grievances and issues: {topics_text}.\n"
        f"Core keywords and vocabulary: {keywords_text}.\n"
        f"Representative citizen complaints: {complaints_text}"
    )
